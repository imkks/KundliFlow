package com.kundliflow.app

import com.kundliflow.app.data.mapper.BundleMappers
import com.kundliflow.app.data.remote.GooglePlacesService
import com.kundliflow.app.ui.subject.PlanetId
import com.kundliflow.app.ui.subject.Subject
import com.kundliflow.app.ui.subject.VargaType
import com.kundliflow.app.ui.today.SkyBand
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test

class Phase7MappersAndPlacesTest {

    private val sampleLevel1 = """
        {
          "natal": {
            "lagna": { "sign": "taurus", "signIndex": 1, "lon": 42.5, "nakshatra": "Rohini", "pada": 1 },
            "grahas": {
              "moon": { "id": "moon", "sign": "pisces", "signIndex": 11, "lon": 348.2, "degInSign": 18.2, "nakshatra": "Revati", "pada": 1, "retrograde": false, "houses": { "houseFromLagna": 11, "houseFromMoon": 1 } },
              "saturn": { "id": "saturn", "sign": "aquarius", "signIndex": 10, "lon": 308.5, "degInSign": 8.5, "nakshatra": "Shatabhisha", "pada": 1, "retrograde": false, "houses": { "houseFromLagna": 10, "houseFromMoon": 12 } }
            }
          },
          "vargas": {
            "D1": { "lagnaSignIndex": 1, "grahas": { "moon": 11, "saturn": 10 } },
            "D9": { "lagnaSignIndex": 4, "grahas": { "moon": 11, "saturn": 10 } }
          },
          "ashtakvarga": { "sarva": [28,31,26,29,27,25,28,24,29,30,32,31] },
          "dashas": {
            "mahadashas": [
              {
                "lord": "venus",
                "startUtc": "2014-01-01T00:00:00Z",
                "endUtc": "2034-01-01T00:00:00Z",
                "antardashas": [
                  { "lord": "saturn", "startUtc": "2023-01-01T00:00:00Z", "endUtc": "2026-12-31T00:00:00Z" }
                ]
              }
            ]
          }
        }
    """.trimIndent()

    private val sampleLevel2 = """
        {
          "simple": { "houses": [], "planets": [], "dashas": [] },
          "standard": {
            "houses": [
              { "house": 1, "lifeArea": "Self", "sign": "taurus", "lord": "venus", "lordPlacedHouse": 1, "tone": "strong", "bottomLine": "Grounded rising.", "findings": [] }
            ],
            "planets": [
              { "planet": "moon", "sign": "pisces", "house": 11, "dignity": "friendly", "nakshatra": "Revati", "bottomLine": "Empathetic gains.", "findings": [] }
            ],
            "dashas": [
              { "lord": "venus", "startUtc": "2014-01-01", "endUtc": "2034-01-01", "bottomLine": "Creative growth." },
              { "lord": "saturn", "startUtc": "2023-01-01", "endUtc": "2026-12-31", "bottomLine": "Structured work." }
            ],
            "yogas": [
              { "name": "Shasha Yoga", "presence": true, "category": "yoga", "meaning": "Durable authority" },
              { "name": "Mangal Dosha", "presence": true, "category": "dosha", "cancelled": true, "meaning": "Neutralized by Jupiter" }
            ],
            "strengths": { "planets": [{ "planet": "saturn", "ratio": 1.24 }] }
          }
        }
    """.trimIndent()

    private val sampleToday = """
        {
          "date": "2026-11-24",
          "tzId": "Asia/Kolkata",
          "dayView": {
            "dayBand": "flowing",
            "hourlyScores": [
              { "score": 5, "band": "flowing", "horaRuler": "jupiter", "factors": [{ "id": "tara_bala", "name": "Sampat Tara", "value": 2, "summary": "+2" }] }
            ],
            "horas": [
              { "index": 1, "lord": "jupiter", "startFormatted": "06:15", "endFormatted": "07:12" },
              { "index": 2, "lord": "mars", "startFormatted": "07:12", "endFormatted": "08:09" }
            ],
            "flowingWindows": [{ "startHour": "16:00", "endHour": "18:00" }],
            "goGentlyWindows": [{ "startHour": "10:30", "endHour": "12:00" }],
            "rahuKalam": { "start": "10:30", "end": "12:00" }
          }
        }
    """.trimIndent()

    @Test
    fun `BundleMappers maps live Today, Chart D1 & D9 Vargottama, and local Dasha lookup`() {
        val today = BundleMappers.mapTodaySkyState(sampleToday, null, sampleLevel2, "Jamshedpur", nowHour = 0)
        assertNotNull(today)
        assertEquals(SkyBand.Flowing, today!!.currentBand)
        assertEquals(PlanetId.JUPITER, today.currentHora.ruler)
        assertEquals("07:12", today.nextShiftTime)
        assertEquals("16:00 to 18:00", today.bestWindowLabel)

        val chartD1 = BundleMappers.mapChartUiState(sampleLevel1, sampleLevel2, sampleToday, "Career", 10, VargaType.D1)
        assertNotNull(chartD1)
        assertEquals("Taurus", chartD1!!.ascendantSign)
        val saturn = chartD1.houses.first { it.number == 10 }.planets.first { it.id == PlanetId.SATURN }
        assertTrue(saturn.vargottama)
        assertEquals(listOf("Shasha Yoga"), chartD1.activeYogaNames)
        assertTrue(chartD1.doshaAudits.first().bhangaCancelled)

        val moonReading = BundleMappers.mapSubjectReading(Subject.Planet(PlanetId.MOON), sampleLevel1, sampleLevel2, today, "balanced")
        assertTrue(moonReading.title.contains("Moon"))
        assertEquals(11, moonReading.activeHouseNumber)

        val dasha2024 = BundleMappers.lookupDashaForYear(sampleLevel1, 2024)
        assertEquals("2024: Venus Mahadasha · Saturn Antardasha", dasha2024)
    }

    @Test
    fun `GooglePlacesService parses Google Places v1 autocomplete and filters offline cities`() {
        val svc = GooglePlacesService(apiKey = "")
        val googleJson = """
            {
              "suggestions": [
                {
                  "placePrediction": {
                    "placeId": "ChIJbU60yXAWrjsR4E9-UejD3_g",
                    "structuredFormat": {
                      "mainText": { "text": "Bengaluru" },
                      "secondaryText": { "text": "Karnataka, India" }
                    }
                  }
                }
              ]
            }
        """.trimIndent()
        val parsed = svc.parseGoogleAutocompleteResponse(googleJson)
        assertEquals(1, parsed.size)
        assertEquals("Bengaluru", parsed.first().primaryText)
        assertEquals("google_places", parsed.first().source)

        val offline = svc.parseOfflineCities(
            """[{"id":"jsr","name":"Jamshedpur","admin":"Jharkhand","country":"IN","lat":22.8,"lon":86.17,"tzId":"Asia/Kolkata"}]""",
        )
        assertEquals(1, svc.filterOfflineCities(offline, "jamshed").size)
    }
}
