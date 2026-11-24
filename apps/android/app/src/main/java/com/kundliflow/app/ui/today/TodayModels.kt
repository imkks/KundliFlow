package com.kundliflow.app.ui.today

import androidx.compose.runtime.Immutable
import androidx.compose.ui.graphics.Color
import com.kundliflow.app.ui.subject.PlanetId
import com.kundliflow.app.ui.theme.KundliColors

enum class SkyBand(val label: String, val color: Color) {
    Flowing("Flowing", KundliColors.Teal),
    Steady("Steady", KundliColors.Gold),
    GoGently("Go gently", KundliColors.Amber);

    companion object {
        fun fromApi(raw: String): SkyBand = when (raw.lowercase()) {
            "flowing" -> Flowing
            "go_gently", "go gently", "caution" -> GoGently
            else -> Steady
        }
    }
}

@Immutable
data class ScoreFactorItem(
    val id: String,
    val name: String,
    val value: Int,
    val summary: String,
)

@Immutable
data class HoraSlot(
    val index: Int,
    val ruler: PlanetId,
    val startTime: String, // "HH:mm"
    val endTime: String,   // "HH:mm"
)

@Immutable
data class HourlyScorePoint(
    val hour: Int,
    val score: Int, // -7..+7
    val band: SkyBand,
    val horaRuler: PlanetId,
    val factors: List<ScoreFactorItem>,
)

@Immutable
data class CheckInMoodSample(
    val mood: Int,
    val band: SkyBand,
    val horaRuler: PlanetId,
)

@Immutable
data class TodaySkyState(
    val greeting: String,
    val cityName: String,
    val currentBand: SkyBand,
    val currentScore: Int,
    val currentHora: HoraSlot,
    val nextShiftTime: String,
    val nextShiftHora: PlanetId,
    val nextShiftBand: SkyBand,
    val tomorrowOpeningSummary: String?, // Shown after 19:00 local time
    val currentChapterSubtitle: String?, // Shown Day 2+
    val activeFactors: List<ScoreFactorItem>,
    val hourlyWave: List<HourlyScorePoint>,
    val rahuKalamLabel: String,
    val bestWindowLabel: String,
    val goGentlyLabel: String,
)

sealed interface TodayDynamicSlot {
    data object DistressOverride : TodayDynamicSlot
    data class WelcomeBackDigest(
        val daysAway: Int,
        val shiftSummary: String,
        val currentBand: SkyBand,
    ) : TodayDynamicSlot

    data class AhaMomentComparison(
        val first: CheckInMoodSample,
        val second: CheckInMoodSample,
        val aligned: Boolean,
        val headline: String,
        val detail: String,
    ) : TodayDynamicSlot

    data class SundayWeeklyReview(
        val patternHeadline: String,
        val entriesCountThisWeek: Int,
    ) : TodayDynamicSlot

    data class LiveSkyEvent(
        val title: String,
        val detail: String,
    ) : TodayDynamicSlot

    data class FirstWeekNudge(
        val dayNumber: Int,
        val title: String,
        val body: String,
        val actionLabel: String,
        val targetTab: String,
    ) : TodayDynamicSlot

    data class CuriosityNode(
        val nodeId: String,
        val title: String,
        val hookLine: String,
    ) : TodayDynamicSlot

    data class ActTwoCycle(
        val cycleKind: String,
        val title: String,
        val body: String,
    ) : TodayDynamicSlot
}
