package com.kundliflow.app.work

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import androidx.work.BackoffPolicy
import androidx.work.Constraints
import androidx.work.CoroutineWorker
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.NetworkType
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import com.kundliflow.app.KundliFlowApplication
import com.kundliflow.app.MainActivity
import com.kundliflow.app.R
import com.kundliflow.app.data.mapper.BundleMappers
import com.kundliflow.app.widget.KundliWidgetUpdater
import java.time.Duration
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.LocalTime
import java.util.concurrent.TimeUnit

object KundliWorkScheduler {
    const val PREFETCH_WORK_NAME = "kundliflow_two_day_prefetch"
    const val JOURNAL_SYNC_WORK_NAME = "kundliflow_journal_sync"

    fun computeInitialDelayMinutes(now: LocalDateTime, targetHour: Int, targetMinute: Int): Long {
        var next = now.withHour(targetHour).withMinute(targetMinute).withSecond(0).withNano(0)
        if (!next.isAfter(now)) {
            next = next.plusHours(12)
        }
        return Duration.between(now, next).toMinutes().coerceAtLeast(1L)
    }

    fun parseHourOrDefault(hhmm: String, fallback: Int): Int =
        hhmm.substringBefore(":").toIntOrNull()?.coerceIn(0, 23) ?: fallback

    fun schedulePeriodicWork(context: Context) {
        val constraints = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build()

        // 12-hour cadence aligned to 05:30 AM & 05:30 PM / 08:00 PM prefetch windows (§10.1)
        val initialDelayMins = computeInitialDelayMinutes(LocalDateTime.now(), 5, 30)
        val prefetchReq = PeriodicWorkRequestBuilder<TwoDayPrefetchWorker>(12, TimeUnit.HOURS)
            .setInitialDelay(initialDelayMins, TimeUnit.MINUTES)
            .setConstraints(constraints)
            .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 15, TimeUnit.MINUTES)
            .build()

        val journalSyncReq = PeriodicWorkRequestBuilder<JournalSyncWorker>(6, TimeUnit.HOURS)
            .setConstraints(constraints)
            .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 15, TimeUnit.MINUTES)
            .build()

        val wm = WorkManager.getInstance(context)
        wm.enqueueUniquePeriodicWork(PREFETCH_WORK_NAME, ExistingPeriodicWorkPolicy.KEEP, prefetchReq)
        wm.enqueueUniquePeriodicWork(JOURNAL_SYNC_WORK_NAME, ExistingPeriodicWorkPolicy.KEEP, journalSyncReq)
    }
}

object CalmNotificationHelper {
    const val CHANNEL_ID = "kundliflow_calm_sky"
    private const val NOTIFICATION_ID = 4108

    fun ensureChannel(context: Context) {
        val mgr = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager ?: return
        val channel = NotificationChannel(
            CHANNEL_ID,
            context.getString(R.string.notif_channel_calm_sky),
            NotificationManager.IMPORTANCE_DEFAULT,
        ).apply {
            description = "Opt-in calm daily sky summary respecting your Quiet Hours (max 2/day)."
        }
        mgr.createNotificationChannel(channel)
    }

    fun maybePostCalmMorningSummary(
        context: Context,
        bandLabel: String,
        horaLabel: String,
        bestWindowLabel: String,
        quietStart: String,
        quietEnd: String,
        hourOfDay: Int = LocalTime.now().hour,
    ): Boolean {
        val app = context.applicationContext as? KundliFlowApplication ?: return false
        if (!app.authStore.isMorningNotificationEnabled()) return false

        val todayIso = LocalDate.now().toString()
        val sentToday = app.authStore.getNotificationsSentOnDate(todayIso)
        val startHr = KundliWorkScheduler.parseHourOrDefault(quietStart, 22)
        val endHr = KundliWorkScheduler.parseHourOrDefault(quietEnd, 7)

        // Quiet hours off when start == end
        val allowed = if (startHr == endHr) {
            sentToday < NotificationCapPolicy.DAILY_HARD_CAP
        } else {
            NotificationCapPolicy.canSendNotification(sentToday, hourOfDay, startHr, endHr)
        }
        if (!allowed) return false

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            val granted = ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) ==
                PackageManager.PERMISSION_GRANTED
            if (!granted) return false
        }

        ensureChannel(context)
        val launchIntent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra(KundliWidgetUpdater.EXTRA_LAUNCH_ACTION, KundliWidgetUpdater.ACTION_OPEN_TODAY)
        }
        val pi = PendingIntent.getActivity(
            context,
            201,
            launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )

        val notif = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle("Today opens $bandLabel · $horaLabel")
            .setContentText("Best window: $bestWindowLabel. Tap to check in calmly.")
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setContentIntent(pi)
            .setAutoCancel(true)
            .build()

        runCatching {
            NotificationManagerCompat.from(context).notify(NOTIFICATION_ID, notif)
            app.authStore.recordNotificationSentOnDate(todayIso)
        }.onFailure { return false }
        return true
    }
}

class TwoDayPrefetchWorker(
    appContext: Context,
    params: WorkerParameters,
) : CoroutineWorker(appContext, params) {
    override suspend fun doWork(): Result {
        val app = applicationContext as? KundliFlowApplication ?: return Result.success()
        val prefs = app.repository.getOrInitPreferences()
        val bundles = app.database.chartDao().getAllBundlesOnce()
        if (bundles.isEmpty()) return Result.success()

        val activeBundle = bundles.firstOrNull { it.profileId == prefs.activeProfileId } ?: bundles.first()
        var anyFailed = false
        bundles.forEach { bundle ->
            val meta = BundleMappers.parseProfileMeta(bundle.profileJson) ?: return@forEach
            val (todayRaw, _) = runCatching {
                app.repository.getOrFetchTodayAndTomorrow(meta, forceRefresh = true)
            }.getOrElse {
                anyFailed = true
                null to null
            }
            if (bundle.profileId == activeBundle.profileId && todayRaw != null) {
                val sky = BundleMappers.mapTodaySkyState(todayRaw, null, bundle.level2Json, meta.cityName)
                if (sky != null) {
                    CalmNotificationHelper.maybePostCalmMorningSummary(
                        context = applicationContext,
                        bandLabel = sky.currentBand.label,
                        horaLabel = "${sky.currentHora.ruler.displayName} Hora",
                        bestWindowLabel = sky.bestWindowLabel,
                        quietStart = prefs.quietHoursStart,
                        quietEnd = prefs.quietHoursEnd,
                    )
                }
            }
        }

        KundliWidgetUpdater.updateAllWidgets(applicationContext)
        return if (anyFailed) Result.retry() else Result.success()
    }
}

class JournalSyncWorker(
    appContext: Context,
    params: WorkerParameters,
) : CoroutineWorker(appContext, params) {
    override suspend fun doWork(): Result {
        val app = applicationContext as? KundliFlowApplication ?: return Result.success()
        val ok = app.repository.syncAllPendingJournalChanges()
        return if (ok) Result.success() else Result.retry()
    }
}
