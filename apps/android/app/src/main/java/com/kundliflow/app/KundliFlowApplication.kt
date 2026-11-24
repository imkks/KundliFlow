package com.kundliflow.app

import android.app.Application
import com.kundliflow.app.data.local.KundliFlowDatabase

class KundliFlowApplication : Application() {
    val database: KundliFlowDatabase by lazy {
        KundliFlowDatabase.getInstance(this)
    }
}
