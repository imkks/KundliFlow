package com.kundliflow.app.work

import com.kundliflow.app.ui.today.SkyBand
import java.time.LocalDate

/**
 * Notification & 2-Day Prefetch Policy (§7.4 & §10.1).
 * Hard cap 2/day, quiet hours 22:00-07:00 default, zero guilt copy.
 */
object NotificationCapPolicy {
    const val DAILY_HARD_CAP = 2

    fun canSendNotification(
        sentTodayCount: Int,
        hourOfDay: Int,
        quietStartHour: Int = 22,
        quietEndHour: Int = 7,
    ): Boolean {
        if (sentTodayCount >= DAILY_HARD_CAP) return false
        val inQuietHours = if (quietStartHour > quietEndHour) {
            hourOfDay >= quietStartHour || hourOfDay < quietEndHour
        } else {
            hourOfDay in quietStartHour until quietEndHour
        }
        return !inQuietHours
    }
}

object TwoDayPrefetchCoordinator {
    fun buildTodayAndTomorrowKeys(
        profileId: String,
        todayIso: String,
        tzId: String,
        latBucket: Double,
        lonBucket: Double,
    ): Pair<String, String> {
        val today = LocalDate.parse(todayIso)
        val tomorrow = today.plusDays(1).toString()
        val k1 = "$profileId|$todayIso|$tzId|$latBucket|$lonBucket"
        val k2 = "$profileId|$tomorrow|$tzId|$latBucket|$lonBucket"
        return k1 to k2
    }
}

data class GlanceWidgetSnapshot(
    val band: SkyBand,
    val horaLabel: String,
    val nextShiftTime: String,
    val bestWindowLabel: String,
    val goGentlyLabel: String,
)
