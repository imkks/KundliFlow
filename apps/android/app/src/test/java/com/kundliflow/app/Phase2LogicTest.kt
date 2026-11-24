package com.kundliflow.app

import com.kundliflow.app.ui.journal.FrozenSkySnapshot
import com.kundliflow.app.ui.journal.JournalEntryUi
import com.kundliflow.app.ui.journal.JournalPatternsCalculator
import com.kundliflow.app.ui.safety.GroundingScreenCopy
import com.kundliflow.app.ui.safety.LowMoodThreshold
import com.kundliflow.app.ui.safety.SafetyCheckResult
import com.kundliflow.app.ui.safety.SafetyEvaluator
import com.kundliflow.app.ui.safety.SafetyPolicy
import com.kundliflow.app.ui.safety.SafetyResources
import com.kundliflow.app.ui.subject.PlanetId
import com.kundliflow.app.ui.today.CheckInMoodSample
import com.kundliflow.app.ui.today.ScoreFactorItem
import com.kundliflow.app.ui.today.SkyBand
import com.kundliflow.app.ui.today.TodayArbiterInput
import com.kundliflow.app.ui.today.TodayDynamicSlot
import com.kundliflow.app.ui.today.TodaySlotArbiter
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class Phase2LogicTest {

    private val testSafetyResources = SafetyResources(
        version = "1.0.0",
        policy = SafetyPolicy(repeatedLowMoodThreshold = LowMoodThreshold(1, 2, 3)),
        keywords = mapOf(
            "en" to listOf("kill myself", "suicide"),
            "hi" to listOf("aatmahatya"),
        ),
        groundingScreen = GroundingScreenCopy("Pause", "You are not alone", emptyList()),
        helplines = emptyList(),
    )

    @Test
    fun `resolvePersonalHook sorts unsorted factors by band-aligned magnitude`() {
        val unsorted = listOf(
            ScoreFactorItem("chandra_bala", "Chandra Bala", -1, "Neutral"),
            ScoreFactorItem("tara_bala", "Sampat Tara", 2, "Benefic"),
        )
        val hook = TodaySlotArbiter.resolvePersonalHook(
            band = SkyBand.Flowing,
            horaRuler = PlanetId.JUPITER,
            factors = unsorted,
            horaRulerNatalHouse = 10,
            timeCertainty = "exact",
        )
        assertTrue(hook.contains("10th house"))
        assertTrue(hook.contains("Sampat Tara"))
    }

    @Test
    fun `resolveTodaySlot enforces Distress P0 preemption over AhaMoment P2`() {
        val samples = listOf(
            CheckInMoodSample(1, SkyBand.GoGently, PlanetId.SATURN),
            CheckInMoodSample(4, SkyBand.Flowing, PlanetId.JUPITER),
        )
        val slot = TodaySlotArbiter.resolveTodaySlot(
            TodayArbiterInput(
                distressTriggered = true,
                ahaCardState = "pending",
                distinctBandSamples = samples,
            ),
        )
        assertEquals(TodayDynamicSlot.DistressOverride, slot)
    }

    @Test
    fun `Aha Moment handles aligned and inverted moods distinctly`() {
        val aligned = TodaySlotArbiter.buildAhaMomentCard(
            CheckInMoodSample(2, SkyBand.GoGently, PlanetId.SATURN),
            CheckInMoodSample(4, SkyBand.Flowing, PlanetId.JUPITER),
        )
        assertTrue(aligned.aligned)

        val inverted = TodaySlotArbiter.buildAhaMomentCard(
            CheckInMoodSample(2, SkyBand.Flowing, PlanetId.JUPITER),
            CheckInMoodSample(4, SkyBand.GoGently, PlanetId.SATURN),
        )
        assertFalse(inverted.aligned)
        assertTrue(inverted.detail.contains("calibrate to YOU"))
    }

    @Test
    fun `SafetyEvaluator catches Hindi keyword and repeated low mood within 3 days`() {
        val now = 1_700_000_000_000L
        val keywordHit = SafetyEvaluator.evaluate(
            noteText = "Thinking about aatmahatya",
            newMood = 3,
            recentMoodTimestamps = emptyList(),
            nowMillis = now,
            resources = testSafetyResources,
        )
        assertTrue(keywordHit is SafetyCheckResult.Triggered)

        val oneDayAgo = now - 24L * 60L * 60L * 1000L
        val repeatedLowHit = SafetyEvaluator.evaluate(
            noteText = "",
            newMood = 1,
            recentMoodTimestamps = listOf(1 to oneDayAgo),
            nowMillis = now,
            resources = testSafetyResources,
        )
        assertTrue(repeatedLowHit is SafetyCheckResult.Triggered)
    }

    @Test
    fun `JournalPatternsCalculator unlocks progressive milestones at 5, 10, 15, 20, and 30`() {
        fun fakeEntries(n: Int) = (1..n).map { i ->
            JournalEntryUi(
                id = "e_$i",
                timestampLabel = "Today",
                mood = 4,
                energy = 3,
                kind = "checkin",
                tags = emptyList(),
                note = "",
                sky = FrozenSkySnapshot(SkyBand.Flowing, "Pisces", PlanetId.JUPITER, "+2", "+2", 31),
                createdAtMillis = i.toLong(),
            )
        }

        assertFalse(JournalPatternsCalculator.computeCalibrationStage(fakeEntries(3)).fullUnlocked)
        assertTrue(JournalPatternsCalculator.computeCalibrationStage(fakeEntries(5)).body.contains("4.0"))
        assertTrue(JournalPatternsCalculator.computeCalibrationStage(fakeEntries(10)).headline.contains("Hora signal"))
        assertTrue(JournalPatternsCalculator.computeCalibrationStage(fakeEntries(20)).body.contains("10 more"))
        assertTrue(JournalPatternsCalculator.computeCalibrationStage(fakeEntries(30)).fullUnlocked)
    }
}
