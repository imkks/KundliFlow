package com.kundliflow.app

import com.kundliflow.app.data.mapper.BundleMappers
import com.kundliflow.app.ui.chart.ChartReference
import com.kundliflow.app.ui.chart.DrishtiCalculator
import com.kundliflow.app.ui.search.SearchCatalog
import com.kundliflow.app.ui.subject.PlanetId
import com.kundliflow.app.ui.subject.Subject
import com.kundliflow.app.ui.subject.SubjectFindingKind
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test

class SprintBChartAndSearchTest {

    private val sampleLevel1 = """
        {
          "natal": {
            "lagna": {"sign": "Taurus", "signIndex": 1},
            "grahas": {
              "sun": {"sign": "Leo", "signIndex": 4, "degInSign": 21.5, "houses": {"houseFromLagna": 4, "houseFromMoon": 6}},
              "moon": {"sign": "Pisces", "signIndex": 11, "degInSign": 18.2, "nakshatra": "Revati", "houses": {"houseFromLagna": 11, "houseFromMoon": 1}},
              "mars": {"sign": "Cancer", "signIndex": 3, "degInSign": 10.0, "houses": {"houseFromLagna": 3, "houseFromMoon": 5}},
              "jupiter": {"sign": "Pisces", "signIndex": 11, "degInSign": 25.0, "retrograde": true, "houses": {"houseFromLagna": 11, "houseFromMoon": 1}},
              "saturn": {"sign": "Aries", "signIndex": 0, "degInSign": 8.0, "retrograde": true, "houses": {"houseFromLagna": 12, "houseFromMoon": 2}}
            }
          },
          "vargas": { "D9": { "grahas": { "jupiter": 11 } } },
          "ashtakvarga": { "sarva": [25,28,26,31,34,27,29,24,30,28,33,22] }
        }
    """.trimIndent()

    private val sampleLevel2 = """
        {
          "standard": {
            "houses": [],
            "strengths": { "planets": [{"planet": "jupiter", "ratio": 1.32}] },
            "yogas": [
              {"name": "Gajakesari Yoga", "category": "raja", "presence": true, "planets": ["moon", "jupiter"], "meaning": "Jupiter conjunct or kendra from Moon brings wisdom and steadiness."}
            ]
          }
        }
    """.trimIndent()

    @Test
    fun `mapChartUiState rotates cleanly to Chandra Kundli for ChartReference MOON`() {
        val lagnaChart = BundleMappers.mapChartUiState(sampleLevel1, sampleLevel2, null, "Career", 10, reference = ChartReference.LAGNA)
        val moonChart = BundleMappers.mapChartUiState(sampleLevel1, sampleLevel2, null, "Career", 10, reference = ChartReference.MOON)
        assertNotNull(lagnaChart)
        assertNotNull(moonChart)

        // Lagna H1 = Taurus, Moon H1 = Pisces
        assertEquals("Taurus", lagnaChart!!.houses[0].signName)
        assertEquals("Pisces", moonChart!!.houses[0].signName)
        assertEquals(ChartReference.MOON, moonChart.reference)

        // Moon moves from H11 (Lagna) to H1 (Chandra Kundli)
        val moonInLagna = lagnaChart.allPlanets().first { it.id == PlanetId.MOON }
        val moonInChandra = moonChart.allPlanets().first { it.id == PlanetId.MOON }
        assertEquals(11, moonInLagna.house)
        assertEquals(1, moonInChandra.house)

        // Active Yogas carry classical meanings
        assertEquals(1, lagnaChart.activeYogas.size)
        assertEquals("Gajakesari Yoga", lagnaChart.activeYogas[0].name)
        assertTrue(lagnaChart.activeYogas[0].meaning.contains("wisdom"))
    }

    @Test
    fun `incomingAspectsToHouse computes classical Parashari Drishti accurately`() {
        val lagnaChart = BundleMappers.mapChartUiState(sampleLevel1, sampleLevel2, null, "Career", 10)!!
        // Mars in H3 casts 4th aspect on H6, 7th on H9, 8th on H10.
        // Jupiter in H11 casts 5th on H3, 7th on H5, 9th on H7.
        // Saturn in H12 casts 3rd on H2, 7th on H6, 10th on H9.
        val aspectsOnH6 = DrishtiCalculator.incomingAspectsToHouse(6, lagnaChart.houses)
        val planetIdsOnH6 = aspectsOnH6.map { it.first.id }.toSet()
        assertTrue(planetIdsOnH6.contains(PlanetId.MARS))
        assertTrue(planetIdsOnH6.contains(PlanetId.SATURN))
    }

    @Test
    fun `SearchCatalog hydrates chart signs and resolves Glossary terms into SubjectReadingContent`() {
        val lagnaChart = BundleMappers.mapChartUiState(sampleLevel1, sampleLevel2, null, "Career", 10)!!
        val h10Results = SearchCatalog.filter("House 10", lagnaChart)
        assertTrue(h10Results.any { it.title.contains("Aquarius") && it.title.contains("Saturn") })

        val glossaryReading = BundleMappers.mapSubjectReading(
            subject = Subject.Finding("glossary.hora", SubjectFindingKind.RULE),
            level1Json = sampleLevel1,
            level2Json = sampleLevel2,
            todaySky = null,
            detailLevel = "balanced",
        )
        assertEquals("Hora (Planetary Hour)", glossaryReading.title)
        assertTrue(glossaryReading.peekSummary.contains("Sunrise-calibrated"))
    }

    @Test
    fun `mapTodaySkyState extracts all 24 Horas and Panchang into Rung 3 telemetry`() {
        val horasJson = (1..24).joinToString(",") { i ->
            """{"index":$i,"lord":"jupiter","startFormatted":"${String.format("%02d", i - 1)}:00","endFormatted":"${String.format("%02d", i % 24)}:00"}"""
        }
        val todayJson = """
            {
              "dayView": {
                "dayBand": "flowing",
                "hourlyScores": [{"score": 4, "band": "flowing", "horaRuler": "jupiter", "factors": [{"id":"chandra_bala","name":"Chandra Bala","value":2,"summary":"Supportive"}]}],
                "horas": [$horasJson],
                "panchang": {"tithi": "Shukla Dashami", "nakshatra": "Revati", "yoga": "Siddha", "karana": "Taitila", "sunriseFormatted": "06:12", "sunsetFormatted": "17:48"}
              }
            }
        """.trimIndent()
        val sky = BundleMappers.mapTodaySkyState(todayJson, null, sampleLevel2, "Jamshedpur", nowHour = 0)
        assertNotNull(sky)
        assertEquals(24, sky!!.allHoras.size)
        assertEquals("Shukla Dashami", sky.panchang?.tithi)

        val reading = BundleMappers.mapSubjectReading(
            subject = Subject.Finding("today.band", SubjectFindingKind.TRANSIT),
            level1Json = sampleLevel1,
            level2Json = sampleLevel2,
            todaySky = sky,
            detailLevel = "full",
        )
        assertTrue(reading.telemetryRows.any { it.label.contains("Panchang · Tithi") && it.value == "Shukla Dashami" })
        assertTrue(reading.telemetryRows.count { it.label.startsWith("Hora ") } == 24)
    }
}
