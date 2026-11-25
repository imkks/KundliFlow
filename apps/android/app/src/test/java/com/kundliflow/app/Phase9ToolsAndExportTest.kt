package com.kundliflow.app

import com.kundliflow.app.ui.chart.ToolsDataExtractor
import com.kundliflow.app.ui.me.ShareAndExportHelper
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test

class Phase9ToolsAndExportTest {

    @Test
    fun `ToolsDataExtractor extracts Chalit shifts, KP cusps, Avakahada, and Vargottama flags`() {
        val level1 = """
            {
              "natal": {
                "time": { "julianDayUt": 2451064.2435 },
                "grahas": {
                  "saturn": { "sign": "aquarius", "signIndex": 10, "degInSign": 8.5, "retrograde": true, "houses": { "houseFromLagna": 10 } }
                }
              },
              "vargas": { "D9": { "grahas": { "saturn": 10 } } },
              "avakahada": { "paya": "Silver", "varna": "Brahmin", "yoni": "Elephant", "gana": "Deva", "vasya": "Jalachara", "nadi": "Antya" },
              "panchang": { "tithi": { "name": "Dwitiya" }, "vara": { "name": "Monday" } }
            }
        """.trimIndent()

        val level2 = """
            {
              "standard": {
                "kundliExtras": {
                  "chalitShifts": [
                    { "planet": "mars", "rashiHouse": 3, "chalitHouse": 4, "plainMeaning": "Mars shifts to H4." }
                  ],
                  "kpCusps": [
                    { "house": 10, "sign": "aquarius", "starLord": "rahu", "subLord": "jupiter" }
                  ]
                }
              }
            }
        """.trimIndent()

        val data = ToolsDataExtractor.extract(level1, level2)
        assertEquals(1, data.chalitShifts.size)
        assertEquals("MARS", data.chalitShifts.first().planet)
        assertEquals(1, data.kpCusps.size)
        assertEquals("Jupiter", data.kpCusps.first().subLord)
        assertEquals("Silver", data.avakahadaCells.first { it.first == "Paya" }.second)
        assertTrue(data.quantPlanetRows.first().third.contains("Vargottama"))

        val md = ShareAndExportHelper.buildLlmDossierMarkdown("Priya", "Taurus", "Pisces", "Revati", "Venus–Saturn", data)
        assertTrue(md.contains("# KundliFlow Jyotish Dossier — Priya"))
        assertTrue(md.contains("KP Cusps"))
    }

    @Test
    fun `ToolsDataExtractor parses Varshaphal endpoint payload with Sahams and Arudhas`() {
        val raw = """
            {
              "targetYear": 2026,
              "varshaphal": {
                "varshaLagnaSign": "leo",
                "munthaSign": "scorpio",
                "munthaHouseInVarsha": 4,
                "varsheshwara": "sun",
                "sahamsList": [
                  { "name": "Punya Saham", "sign": "cancer", "degInSign": 14.2, "meaning": "Fortune" }
                ]
              },
              "arudhas": { "al": { "sign": "capricorn" } },
              "upagrahas": { "gulika": { "sign": "virgo" } }
            }
        """.trimIndent()

        val vp = ToolsDataExtractor.parseVarshaphalEndpointJson(raw)
        assertNotNull(vp)
        assertEquals(2026, vp!!.targetYear)
        assertEquals("Leo", vp.varshaLagna)
        assertEquals("Punya Saham", vp.sahams.first().name)
        assertEquals("AL" to "Capricorn", vp.arudhas.first())
        assertEquals("GULIKA" to "Virgo", vp.upagrahas.first())
    }
}
