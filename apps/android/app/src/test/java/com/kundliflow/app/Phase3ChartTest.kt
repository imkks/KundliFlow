package com.kundliflow.app

import com.kundliflow.app.ui.chart.ChartHouseData
import com.kundliflow.app.ui.chart.ChartUiState
import com.kundliflow.app.ui.chart.DrishtiCalculator
import com.kundliflow.app.ui.subject.PlanetId
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class Phase3ChartTest {

    @Test
    fun `DrishtiCalculator computes Mars 4-7-8, Jupiter 5-7-9, and Saturn 3-7-10`() {
        assertEquals(listOf(4, 7, 8), DrishtiCalculator.aspectHouses(1, listOf(PlanetId.MARS)))
        assertEquals(listOf(2, 4, 6), DrishtiCalculator.aspectHouses(10, listOf(PlanetId.JUPITER)))
        assertEquals(listOf(1, 5, 8), DrishtiCalculator.aspectHouses(11, listOf(PlanetId.SATURN)))
        assertEquals(listOf(7), DrishtiCalculator.aspectHouses(1, listOf(PlanetId.VENUS)))
    }

    @Test
    fun `hitTestNorthIndianHouse maps key diamond centers accurately`() {
        assertEquals(1, DrishtiCalculator.hitTestNorthIndianHouse(0.5f, 0.25f))
        assertEquals(4, DrishtiCalculator.hitTestNorthIndianHouse(0.25f, 0.5f))
        assertEquals(7, DrishtiCalculator.hitTestNorthIndianHouse(0.5f, 0.75f))
        assertEquals(10, DrishtiCalculator.hitTestNorthIndianHouse(0.75f, 0.5f))
    }

    @Test
    fun `hitTestSouthIndianSign returns Pisces at top-left and null in center`() {
        assertEquals(11, DrishtiCalculator.hitTestSouthIndianSign(0.1f, 0.1f))
        assertEquals(0, DrishtiCalculator.hitTestSouthIndianSign(0.35f, 0.1f))
        assertNull(DrishtiCalculator.hitTestSouthIndianSign(0.5f, 0.5f))
    }

    @Test
    fun `ChartUiState emotionalHeadline pivots to primaryGoalHouse lord`() {
        val houses = listOf(
            ChartHouseData(10, 10, "Aquarius", PlanetId.SATURN, 10, 31, "Strong", emptyList(), emptyList()),
        )
        val state = ChartUiState("Taurus", "Pisces", "Career", 10, 11, houses, emptyList(), emptyList(), emptyList())
        assertEquals("Saturn rules your career house", state.emotionalHeadline())
    }
}
