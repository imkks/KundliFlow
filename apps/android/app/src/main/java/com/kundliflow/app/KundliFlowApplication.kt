package com.kundliflow.app

import android.app.Application
import com.kundliflow.app.data.KundliRepository
import com.kundliflow.app.data.local.AuthTokenStore
import com.kundliflow.app.data.local.KundliFlowDatabase
import com.kundliflow.app.data.remote.GooglePlacesService
import com.kundliflow.app.data.remote.KundliApiClient
import com.kundliflow.app.work.CalmNotificationHelper
import com.kundliflow.app.work.KundliWorkScheduler

class KundliFlowApplication : Application() {
    val database: KundliFlowDatabase by lazy {
        KundliFlowDatabase.getInstance(this)
    }

    val authStore: AuthTokenStore by lazy {
        AuthTokenStore(this)
    }

    val apiClient: KundliApiClient by lazy {
        KundliApiClient(authTokenProvider = { authStore.getToken() })
    }

    val placesService: GooglePlacesService by lazy {
        GooglePlacesService()
    }

    val repository: KundliRepository by lazy {
        KundliRepository(
            db = database,
            authStore = authStore,
            api = apiClient,
        )
    }

    override fun onCreate() {
        super.onCreate()
        CalmNotificationHelper.ensureChannel(this)
        KundliWorkScheduler.schedulePeriodicWork(this)
    }
}
