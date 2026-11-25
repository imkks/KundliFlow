package com.kundliflow.app

import com.kundliflow.app.data.mapper.BundleMappers
import com.kundliflow.app.ui.journal.FrozenSkySnapshot
import com.kundliflow.app.ui.journal.FrozenSkySnapshotCodec
import com.kundliflow.app.ui.journal.JournalEntryUi
import com.kundliflow.app.ui.journal.JournalPatternsCalculator
import com.kundliflow.app.ui.subject.PlanetId
import com.kundliflow.app.ui.today.SkyBand
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test
import java.time.Instant

class SprintADataIntegrityTest {

    @Test
    fun `FrozenSkySnapshotCodec preserves full historical sky round-trip`() {
        val original = FrozenSkySnapshot(
            band = SkyBand.Flowing,
            moonSign = "Pisces",
            horaRuler = PlanetId.VENUS,
            chandraBalaSummary = "9th from natal Moon — supportive",
            taraBalaSummary = "Sadhaka Tara — steady accomplishment",
            savBindus = 33,
            score = 5,
        )
        val encoded = FrozenSkySnapshotCodec.encode(original)
        val decoded = FrozenSkySnapshotCodec.decode(encoded)
        assertEquals(original, decoded)
    }

    @Test
    fun `JournalPatternsCalculator computes real bootstrap 95pct CI without hardcoded numbers`() {
        val flowingEntries = (1..18).map { i ->
            JournalEntryUi(
                id = "f_$i",
                timestampLabel = "2026-10-${String.format("%02d", (i % 28) + 1)}",
                mood = if (i % 3 == 0) 5 else 4,
                energy = 4,
                kind = "checkin",
                tags = listOf("Focus"),
                note = "",
                sky = FrozenSkySnapshot(SkyBand.Flowing, "Taurus", PlanetId.JUPITER, "Good", "Mitra", 32, 4),
                createdAtMillis = i * 1000L,
            )
        }
        val gentleEntries = (1..14).map { i ->
            JournalEntryUi(
                id = "g_$i",
                timestampLabel = "2026-09-${String.format("%02d", (i % 28) + 1)}",
                mood = if (i % 2 == 0) 2 else 3,
                energy = 2,
                kind = "checkin",
                tags = listOf("Rest"),
                note = "",
                sky = FrozenSkySnapshot(SkyBand.GoGently, "Scorpio", PlanetId.SATURN, "Quiet", "Naidhana", 22, -3),
                createdAtMillis = (100 + i) * 1000L,
            )
        }
        val stage = JournalPatternsCalculator.computeCalibrationStage(flowingEntries + gentleEntries)
        assertTrue(stage.fullUnlocked)
        assertNotNull(stage.mathDetail)
        // Must NOT be the old hardcoded "[+0.31, +1.12]"
        assertTrue(!stage.mathDetail!!.contains("[+0.31, +1.12]"))
        val (low, high, observed) = JournalPatternsCalculator.computeBootstrapMeanDiffCi(
            flowingEntries.map { it.mood.toDouble() },
            gentleEntries.map { it.mood.toDouble() },
        )
        assertTrue("Observed diff should be > 1.5, was $observed", observed > 1.5)
        assertTrue("CI bounds should bracket observed ($low <= $observed <= $high)", low <= observed && observed <= high)
    }

    @Test
    fun `computeElapsedProgress calculates exact elapsed ratio`() {
        val start = "2020-01-01T00:00:00Z"
        val end = "2030-01-01T00:00:00Z"
        val mid = Instant.parse("2025-01-01T00:00:00Z").toEpochMilli()
        val progress = BundleMappers.computeElapsedProgress(start, end, mid)
        assertEquals(0.5f, progress, 0.01f)
        assertNotEquals(0.55f, progress)
    }

    @Test
    fun `resolveRealNextShiftDelta and detectLiveSkyEvent read real Antardasha transitions`() {
        val level1Json = """
            {
              "natal": {
                "lagna": {"sign": "Taurus", "signIndex": 1},
                "grahas": {
                  "sun": {"sign": "Leo", "signIndex": 4, "houses": {"houseFromLagna": 4}},
                  "moon": {"sign": "Pisces", "signIndex": 11, "nakshatra": "Revati", "houses": {"houseFromLagna": 11}},
                  "venus": {"sign": "Leo", "signIndex": 4, "houses": {"houseFromLagna": 4}},
                  "saturn": {"sign": "Aries", "signIndex": 0, "houses": {"houseFromLagna": 12}},
                  "mercury": {"sign": "Leo", "signIndex": 4, "houses": {"houseFromLagna": 4}}
                }
              },
              "dashas": {
                "mahadashas": [
                  {
                    "lord": "venus",
                    "startUtc": "2010-01-01T00:00:00Z",
                    "endUtc": "2030-01-01T00:00:00Z",
                    "antardashas": [
                      {"lord": "saturn", "startUtc": "2024-01-01T00:00:00Z", "endUtc": "2026-11-26T00:00:00Z"},
                      {"lord": "mercury", "startUtc": "2026-11-26T00:00:00Z", "endUtc": "2029-09-26T00:00:00Z"}
                    ]
                  }
                ]
              },
              "vargas": { "D9": { "grahas": { "venus": 4 } } },
              "ashtakvarga": { "sarva": [25,28,26,31,34,27,29,24,30,28,33,22] }
            }
        """.trimIndent()

        val nowMs = Instant.parse("2026-11-25T00:00:00Z").toEpochMilli()
        val delta = BundleMappers.resolveRealNextShiftDelta(level1Json, "Saturn", "2026-11-26", nowMs)
        assertTrue(delta.shiftDate.contains("2026-11-26"))
        assertTrue(delta.shiftDate.contains("Venus–Mercury"))
        assertTrue(delta.houseFocusShift.contains("House 12") && delta.houseFocusShift.contains("House 4"))

        val event = BundleMappers.detectLiveSkyEvent(level1Json, null, nowMs)
        assertNotNull(event)
        assertTrue(event!!.title.contains("48h"))

        val summary = BundleMappers.extractNatalSummaryFull(level1Json)
        assertEquals("Taurus", summary.lagnaSign)
        assertEquals("Pisces", summary.moonSign)
        assertEquals("Revati", summary.moonNakshatra)
        assertEquals("Leo", summary.sunSign)

        val vargottamaBadge = BundleMappers.resolveNodeRarityBadge("house.4", level1Json, null, "exact")
        assertNotNull(vargottamaBadge)
        assertTrue(vargottamaBadge!!.contains("Vargottama Venus"))
    }

    @Test
    fun `mapTimeTabState lights real notedDaysOfMonth and preserves requested month`() {
        val level1Json = """{"natal":{"lagna":{"sign":"Taurus","signIndex":1},"grahas":{}}}"""
        val level2Json = """{"standard":{"dashas":[],"transits":{"planets":[]}}}"""
        val state = BundleMappers.mapTimeTabState(
            level1Json = level1Json,
            level2Json = level2Json,
            calendarJson = null,
            todayJson = null,
            notedDaysOfMonth = setOf(4, 15, 22),
            requestedYear = 2026,
            requestedMonth = 10,
        )
        assertEquals(2026, state.calendarYear)
        assertEquals(10, state.calendarMonth)
        assertEquals(31, state.monthDays.size)
        assertTrue(state.monthDays.first { it.dayOfMonth == 4 }.hasNoteOrMilestone)
        assertTrue(state.monthDays.first { it.dayOfMonth == 15 }.hasNoteOrMilestone)
        assertTrue(!state.monthDays.first { it.dayOfMonth == 5 }.hasNoteOrMilestone)
    }
}
