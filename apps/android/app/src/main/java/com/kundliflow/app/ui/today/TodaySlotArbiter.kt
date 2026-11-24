package com.kundliflow.app.ui.today

import com.kundliflow.app.ui.subject.PlanetId

data class TodayArbiterInput(
    val distressTriggered: Boolean = false,
    val hoursSinceLastOpen: Long = 0L,
    val shiftWhileAwaySummary: String? = null,
    val currentBand: SkyBand = SkyBand.Steady,
    val ahaCardState: String = "pending", // pending | shown | dismissed
    val distinctBandSamples: List<CheckInMoodSample> = emptyList(),
    val isSunday: Boolean = false,
    val weeklyReviewViewedThisWeek: Boolean = false,
    val weeklyReviewPatternHeadline: String? = null,
    val entriesThisWeek: Int = 0,
    val liveSkyEvent: TodayDynamicSlot.LiveSkyEvent? = null,
    val daysSinceFirstLaunch: Int = 0,
    val firstWeekNudgeDismissedToday: Boolean = false,
    val yesterdayHoraMoodSample: CheckInMoodSample? = null,
    val todayTargetHoraTime: String? = null,
    val primaryGoalLabel: String = "Career",
    val primaryGoalHouse: Int = 10,
    val rhythmGoal: Int = 4,
    val actTwoEnabled: Boolean = false,
    val nextDiscoveryNode: TodayDynamicSlot.CuriosityNode? = null,
    val nextActTwoCycle: TodayDynamicSlot.ActTwoCycle? = null,
)

/**
 * Pure deterministic Slot Arbiter & Personal Hook resolver (§5.1).
 */
object TodaySlotArbiter {

    /**
     * Sorts unsorted ScoreFactors by band-aligned magnitude and joins active Hora ruler
     * with its natal house (or natural karaka domain when birth time is unknown).
     */
    fun resolvePersonalHook(
        band: SkyBand,
        horaRuler: PlanetId,
        factors: List<ScoreFactorItem>,
        horaRulerNatalHouse: Int?,
        timeCertainty: String,
    ): String {
        val dominant = when (band) {
            SkyBand.Flowing -> factors.maxByOrNull { it.value }
            SkyBand.GoGently -> factors.minByOrNull { it.value }
            SkyBand.Steady -> factors.maxByOrNull { kotlin.math.abs(it.value) }
        }
        val houseClause = if (timeCertainty != "unknown" && horaRulerNatalHouse != null) {
            "highlights your ${ordinal(horaRulerNatalHouse)} house of ${houseDomain(horaRulerNatalHouse)}"
        } else {
            "attunes to ${karakaDomain(horaRuler)}"
        }
        val driverTail = dominant?.let { " · ${it.name}" } ?: ""
        return "${horaRuler.displayName} hour · $houseClause$driverTail"
    }

    /**
     * Strict P0 > P1 > P2 > P3 > P4 > P5 > P6 single-slot priority queue (§5.1).
     */
    fun resolveTodaySlot(input: TodayArbiterInput): TodayDynamicSlot {
        // P0: Distress Safety Flow always preempts all astrology UI
        if (input.distressTriggered) {
            return TodayDynamicSlot.DistressOverride
        }

        // P1: Welcome-Back Digest (> 72h absence)
        if (input.hoursSinceLastOpen >= 72L && input.shiftWhileAwaySummary != null) {
            return TodayDynamicSlot.WelcomeBackDigest(
                daysAway = (input.hoursSinceLastOpen / 24L).toInt(),
                shiftSummary = input.shiftWhileAwaySummary,
                currentBand = input.currentBand,
            )
        }

        // P2: Dual-Branch Aha Moment (Check-in #2 across 2 distinct bands)
        if (input.ahaCardState == "pending" && input.distinctBandSamples.size >= 2) {
            val first = input.distinctBandSamples[0]
            val second = input.distinctBandSamples[1]
            if (first.band != second.band) {
                return buildAhaMomentCard(first, second)
            }
        }

        // P3: Sunday Weekly Review
        if (input.isSunday && !input.weeklyReviewViewedThisWeek && input.weeklyReviewPatternHeadline != null) {
            return TodayDynamicSlot.SundayWeeklyReview(
                patternHeadline = input.weeklyReviewPatternHeadline,
                entriesCountThisWeek = input.entriesThisWeek,
            )
        }

        // P4: Live Sky Event (Antardasha < 48h, Sade Sati shift, major ingress)
        if (input.liveSkyEvent != null) {
            return input.liveSkyEvent
        }

        // P5: First-Week Nudge (Days 4-6, max 1/day)
        if (!input.firstWeekNudgeDismissedToday) {
            when (input.daysSinceFirstLaunch) {
                3 -> {
                    val sample = input.yesterdayHoraMoodSample
                    val nextTime = input.todayTargetHoraTime
                    if (sample != null && nextTime != null) {
                        return TodayDynamicSlot.FirstWeekNudge(
                            dayNumber = 4,
                            title = "Hora rhythm check",
                            body = "Yesterday you felt ${sample.mood}/5 during a ${sample.horaRuler.displayName} hour. Today's ${sample.horaRuler.displayName} hour starts at $nextTime.",
                            actionLabel = "View wave",
                            targetTab = "wave",
                        )
                    }
                }
                4 -> {
                    return TodayDynamicSlot.FirstWeekNudge(
                        dayNumber = 5,
                        title = "Your ${input.primaryGoalLabel} story",
                        body = "Your chart has a story about ${input.primaryGoalLabel}. Tap Chart to explore House ${input.primaryGoalHouse}.",
                        actionLabel = "Open Chart",
                        targetTab = "chart",
                    )
                }
                5 -> {
                    return TodayDynamicSlot.FirstWeekNudge(
                        dayNumber = 6,
                        title = "Weekly review tomorrow",
                        body = "You've checked in ${input.entriesThisWeek} of ${input.rhythmGoal} times this week. Sunday brings your first weekly review.",
                        actionLabel = "View Journal",
                        targetTab = "journal",
                    )
                }
            }
        }

        // P6: Act I Discovery Node or Act II Evergreen Cycle
        if (input.actTwoEnabled && input.nextActTwoCycle != null) {
            return input.nextActTwoCycle
        }
        return input.nextDiscoveryNode ?: TodayDynamicSlot.CuriosityNode(
            nodeId = "core.moon_sign",
            title = "Moon in your chart",
            hookLine = "The Moon shifts signs every 2.25 days. Tap to see what it lights up.",
        )
    }

    fun buildAhaMomentCard(
        first: CheckInMoodSample,
        second: CheckInMoodSample,
    ): TodayDynamicSlot.AhaMomentComparison {
        val aligned = (first.band == SkyBand.GoGently && second.band == SkyBand.Flowing && second.mood > first.mood) ||
            (first.band == SkyBand.Flowing && second.band == SkyBand.GoGently && first.mood > second.mood)

        return if (aligned) {
            TodayDynamicSlot.AhaMomentComparison(
                first = first,
                second = second,
                aligned = true,
                headline = "Notice anything?",
                detail = "Your first two sky snapshots: ${first.mood}/5 in ${first.band.label}, ${second.mood}/5 in ${second.band.label}. Early sign your rhythm tracks the sky.",
            )
        } else {
            TodayDynamicSlot.AhaMomentComparison(
                first = first,
                second = second,
                aligned = false,
                headline = "Your chart has its own rhythm",
                detail = "Interesting—you felt ${second.mood}/5 during ${second.band.label}. That's why we calibrate to YOU, not generic horoscopes. Over time we'll see if Hora or Moon sign matters more for your chart.",
            )
        }
    }

    fun shouldShowConstructiveRedirect(
        openedTodayCount: Int,
        bandChanged: Boolean,
        horaChanged: Boolean,
    ): Boolean = openedTodayCount > 8 && !bandChanged && !horaChanged

    private fun ordinal(n: Int): String = when (n) {
        1 -> "1st"; 2 -> "2nd"; 3 -> "3rd"
        else -> "${n}th"
    }

    private fun houseDomain(house: Int): String = when (house) {
        1 -> "self & presence"
        2 -> "resources & voice"
        3 -> "courage & initiative"
        4 -> "home & peace"
        5 -> "creativity & learning"
        6 -> "craft & routine"
        7 -> "partnerships"
        8 -> "depth & renewal"
        9 -> "purpose & horizon"
        10 -> "work & focus"
        11 -> "gains & allies"
        else -> "rest & reflection"
    }

    private fun karakaDomain(planet: PlanetId): String = when (planet) {
        PlanetId.SUN -> "clarity & vitality"
        PlanetId.MOON -> "inner calm & intuition"
        PlanetId.MARS -> "drive & decisive action"
        PlanetId.MERCURY -> "communication & analysis"
        PlanetId.JUPITER -> "learning & reflection"
        PlanetId.VENUS -> "harmony & creativity"
        PlanetId.SATURN -> "steady patience & craft"
        PlanetId.RAHU -> "curiosity & ambition"
        PlanetId.KETU -> "quiet detachment"
    }
}
