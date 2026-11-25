package com.kundliflow.app.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.widget.RemoteViews
import com.kundliflow.app.KundliFlowApplication
import com.kundliflow.app.MainActivity
import com.kundliflow.app.R
import com.kundliflow.app.data.mapper.BundleMappers
import com.kundliflow.app.ui.today.SkyBand
import com.kundliflow.app.work.GlanceWidgetSnapshot
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

object KundliWidgetUpdater {
    const val EXTRA_LAUNCH_ACTION = "com.evertrail.kundliflow.EXTRA_LAUNCH_ACTION"
    const val ACTION_OPEN_TODAY = "today"
    const val ACTION_OPEN_CHECKIN = "checkin"

    fun bandColorInt(band: SkyBand): Int = when (band) {
        SkyBand.Flowing -> Color.parseColor("#5FC2B3")
        SkyBand.Steady -> Color.parseColor("#E3AD46")
        SkyBand.GoGently -> Color.parseColor("#D97736") // Never red for astrological states
    }

    suspend fun loadLatestSnapshot(context: Context): GlanceWidgetSnapshot {
        val app = context.applicationContext as? KundliFlowApplication
            ?: return fallbackSnapshot()
        val prefs = app.database.preferenceDao().getPreferences()
        val bundles = app.database.chartDao().getAllBundlesOnce()
        val activeBundle = bundles.firstOrNull { it.profileId == prefs?.activeProfileId } ?: bundles.firstOrNull()
            ?: return fallbackSnapshot()
        val meta = BundleMappers.parseProfileMeta(activeBundle.profileJson) ?: return fallbackSnapshot()
        val cached = app.database.chartDao().getLatestTodaySkyForProfile(meta.id) ?: return fallbackSnapshot()
        val sky = BundleMappers.mapTodaySkyState(cached.payloadJson, null, activeBundle.level2Json, meta.cityName)
            ?: return fallbackSnapshot()
        return GlanceWidgetSnapshot(
            band = sky.currentBand,
            horaLabel = "${sky.currentHora.ruler.displayName} Hora",
            nextShiftTime = sky.nextShiftTime,
            bestWindowLabel = sky.bestWindowLabel,
            goGentlyLabel = sky.goGentlyLabel,
        )
    }

    private fun fallbackSnapshot(): GlanceWidgetSnapshot = GlanceWidgetSnapshot(
        band = SkyBand.Steady,
        horaLabel = "Open KundliFlow",
        nextShiftTime = "Syncing…",
        bestWindowLabel = "Tap to refresh",
        goGentlyLabel = "—",
    )

    fun updateAllWidgets(context: Context) {
        val mgr = AppWidgetManager.getInstance(context)
        val orbIds = mgr.getAppWidgetIds(ComponentName(context, BandOrbWidgetProvider::class.java))
        val stripIds = mgr.getAppWidgetIds(ComponentName(context, TodayStripWidgetProvider::class.java))
        if (orbIds.isEmpty() && stripIds.isEmpty()) return

        CoroutineScope(Dispatchers.IO).launch {
            val snap = runCatching { loadLatestSnapshot(context) }.getOrDefault(fallbackSnapshot())
            if (orbIds.isNotEmpty()) {
                val views = buildBandOrbViews(context, snap)
                orbIds.forEach { mgr.updateAppWidget(it, views) }
            }
            if (stripIds.isNotEmpty()) {
                val views = buildTodayStripViews(context, snap)
                stripIds.forEach { mgr.updateAppWidget(it, views) }
            }
        }
    }

    fun buildBandOrbViews(context: Context, snap: GlanceWidgetSnapshot): RemoteViews {
        val views = RemoteViews(context.packageName, R.layout.widget_band_orb)
        views.setTextViewText(R.id.widget_orb_band, snap.band.label)
        views.setTextColor(R.id.widget_orb_band, bandColorInt(snap.band))
        views.setTextViewText(R.id.widget_orb_hora, snap.horaLabel)
        views.setTextViewText(R.id.widget_orb_shift, "Next ${snap.nextShiftTime}")
        views.setOnClickPendingIntent(R.id.widget_orb_root, launchPendingIntent(context, ACTION_OPEN_TODAY, 101))
        return views
    }

    fun buildTodayStripViews(context: Context, snap: GlanceWidgetSnapshot): RemoteViews {
        val views = RemoteViews(context.packageName, R.layout.widget_today_strip)
        views.setTextViewText(R.id.widget_strip_band, "${snap.band.label} · ${snap.horaLabel}")
        views.setTextColor(R.id.widget_strip_band, bandColorInt(snap.band))
        views.setTextViewText(R.id.widget_strip_windows, "Best ${snap.bestWindowLabel} · Go gently ${snap.goGentlyLabel}")
        views.setTextViewText(R.id.widget_strip_footer, "Next shift ${snap.nextShiftTime}")
        views.setOnClickPendingIntent(R.id.widget_strip_root, launchPendingIntent(context, ACTION_OPEN_TODAY, 102))
        views.setOnClickPendingIntent(R.id.widget_strip_checkin_btn, launchPendingIntent(context, ACTION_OPEN_CHECKIN, 103))
        return views
    }

    private fun launchPendingIntent(context: Context, action: String, reqCode: Int): PendingIntent {
        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra(EXTRA_LAUNCH_ACTION, action)
        }
        return PendingIntent.getActivity(
            context,
            reqCode,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
    }
}

class BandOrbWidgetProvider : AppWidgetProvider() {
    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        val pending = goAsync()
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val snap = KundliWidgetUpdater.loadLatestSnapshot(context)
                val views = KundliWidgetUpdater.buildBandOrbViews(context, snap)
                appWidgetIds.forEach { id -> appWidgetManager.updateAppWidget(id, views) }
            } finally {
                pending.finish()
            }
        }
    }
}

class TodayStripWidgetProvider : AppWidgetProvider() {
    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        val pending = goAsync()
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val snap = KundliWidgetUpdater.loadLatestSnapshot(context)
                val views = KundliWidgetUpdater.buildTodayStripViews(context, snap)
                appWidgetIds.forEach { id -> appWidgetManager.updateAppWidget(id, views) }
            } finally {
                pending.finish()
            }
        }
    }
}
