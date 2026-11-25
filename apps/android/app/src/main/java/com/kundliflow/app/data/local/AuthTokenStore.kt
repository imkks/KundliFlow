package com.kundliflow.app.data.local

import android.content.Context

data class StoredAuthUser(
    val token: String,
    val userId: String,
    val name: String,
    val email: String,
)

class AuthTokenStore(context: Context) {
    private val prefs = context.applicationContext.getSharedPreferences("kundliflow_auth_v1", Context.MODE_PRIVATE)

    fun getToken(): String? = prefs.getString("astro_auth_token_v1", null)

    fun getUser(): StoredAuthUser? {
        val token = getToken() ?: return null
        return StoredAuthUser(
            token = token,
            userId = prefs.getString("user_id", "") ?: "",
            name = prefs.getString("user_name", "") ?: "",
            email = prefs.getString("user_email", "") ?: "",
        )
    }

    fun saveUser(user: StoredAuthUser) {
        prefs.edit()
            .putString("astro_auth_token_v1", user.token)
            .putString("user_id", user.userId)
            .putString("user_name", user.name)
            .putString("user_email", user.email)
            .apply()
    }

    fun getLastSyncIso(): String? = prefs.getString("astro_last_sync_at_v1", null)

    fun setLastSyncIso(iso: String) {
        prefs.edit().putString("astro_last_sync_at_v1", iso).apply()
    }

    fun isMorningNotificationEnabled(): Boolean = prefs.getBoolean("morning_notif_opt_in", false)

    fun setMorningNotificationEnabled(enabled: Boolean) {
        prefs.edit().putBoolean("morning_notif_opt_in", enabled).apply()
    }

    fun getNotificationsSentOnDate(dateIso: String): Int =
        if (prefs.getString("notif_count_date", null) == dateIso) prefs.getInt("notif_count_val", 0) else 0

    fun recordNotificationSentOnDate(dateIso: String) {
        val next = getNotificationsSentOnDate(dateIso) + 1
        prefs.edit()
            .putString("notif_count_date", dateIso)
            .putInt("notif_count_val", next)
            .apply()
    }

    fun clearAuthOnly() {
        prefs.edit()
            .remove("astro_auth_token_v1")
            .remove("user_id")
            .remove("user_name")
            .remove("user_email")
            .apply()
    }

    fun clear() {
        prefs.edit().clear().apply()
    }
}
