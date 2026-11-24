package com.kundliflow.app.ui.chart

import androidx.compose.runtime.Immutable
import com.kundliflow.app.ui.subject.PlanetId
import com.kundliflow.app.ui.subject.SubjectFindingItem
import com.kundliflow.app.ui.subject.VargaType

enum class ChartStyle(val label: String) { NORTH("North Indian"), SOUTH("South Indian") }
enum class ChartReference(val label: String) { LAGNA("Lagna"), MOON("Moon") }

@Immutable
data class ChartPlanetPlacement(
    val id: PlanetId,
    val shortGlyph: String,
    val house: Int,
    val signIndex: Int, // 0=Aries..11=Pisces
    val signName: String,
    val degreeFormatted: String,
    val dignity: String,
    val vargottama: Boolean = false,
)

@Immutable
data class ChartHouseData(
    val number: Int, // 1..12
    val signIndex: Int,
    val signName: String,
    val lord: PlanetId,
    val lordHouse: Int,
    val savBindus: Int,
    val summaryLine: String,
    val planets: List<ChartPlanetPlacement>,
    val findings: List<SubjectFindingItem>,
)

@Immutable
data class ShadbalaBarItem(
    val planet: PlanetId,
    val ratio: Float, // >= 1.0f meets classical threshold
)

@Immutable
data class DoshaAuditItem(
    val name: String,
    val status: String, // "Cancelled by Bhanga" | "Verified Absent" | "Active"
    val bhangaCancelled: Boolean,
    val explanation: String,
)

@Immutable
data class YogaDetailItem(
    val name: String,
    val category: String,
    val meaning: String,
    val planets: String = "",
)

@Immutable
data class ChartUiState(
    val ascendantSign: String,
    val moonSign: String,
    val primaryGoalLabel: String,
    val primaryGoalHouse: Int,
    val liveTransitMoonHouse: Int,
    val houses: List<ChartHouseData>,
    val shadbalaBars: List<ShadbalaBarItem>,
    val doshaAudits: List<DoshaAuditItem>,
    val activeYogaNames: List<String>,
    val activeYogas: List<YogaDetailItem> = emptyList(),
    val reference: ChartReference = ChartReference.LAGNA,
) {
    fun emotionalHeadline(): String {
        val goalHouseData = houses.firstOrNull { it.number == primaryGoalHouse }
        val lordName = goalHouseData?.lord?.displayName ?: "Saturn"
        return "$lordName rules your ${primaryGoalLabel.lowercase()} house"
    }

    fun allPlanets(): List<ChartPlanetPlacement> =
        houses.flatMap { it.planets }.sortedBy { it.id.ordinal }
}

object DrishtiCalculator {
    /**
     * Classical Parashari Graha Drishti target houses (1..12).
     * All planets aspect 7th; Mars +4/8; Jupiter +5/9; Saturn +3/10.
     */
    fun aspectHouses(fromHouse: Int, planetsInHouse: List<PlanetId>): List<Int> {
        val offsets = mutableSetOf(7)
        planetsInHouse.forEach { planet ->
            when (planet) {
                PlanetId.MARS -> { offsets.add(4); offsets.add(8) }
                PlanetId.JUPITER -> { offsets.add(5); offsets.add(9) }
                PlanetId.SATURN -> { offsets.add(3); offsets.add(10) }
                else -> Unit
            }
        }
        return offsets.map { offset -> ((fromHouse - 1 + offset - 1) % 12) + 1 }.sorted()
    }

    /**
     * Finds every planet in the chart casting Parashari Graha Drishti onto targetHouse (1..12).
     * Returns pairs of (planet placement, source house number).
     */
    fun incomingAspectsToHouse(
        targetHouse: Int,
        houses: List<ChartHouseData>,
    ): List<Pair<ChartPlanetPlacement, Int>> {
        val results = mutableListOf<Pair<ChartPlanetPlacement, Int>>()
        houses.forEach { h ->
            h.planets.forEach { planet ->
                val targets = aspectHouses(h.number, listOf(planet.id))
                if (targets.contains(targetHouse)) {
                    results.add(planet to h.number)
                }
            }
        }
        return results
    }

    /**
     * Maps normalized (0f..1f, 0f..1f) tap coordinates inside a North Indian chart square
     * to house 1..12 using diagonal/diamond region math.
     */
    fun hitTestNorthIndianHouse(nx: Float, ny: Float): Int {
        val d1 = nx - ny         // > 0 means upper-right of top-left->bottom-right diag
        val d2 = nx + ny - 1f    // > 0 means lower-right of bottom-left->top-right diag
        val inDiamond = kotlin.math.abs(nx - 0.5f) + kotlin.math.abs(ny - 0.5f) <= 0.5f

        return if (inDiamond) {
            when {
                d1 >= 0f && d2 <= 0f -> 1   // Top diamond
                d1 < 0f && d2 <= 0f -> 4    // Left diamond
                d1 < 0f && d2 > 0f -> 7     // Bottom diamond
                else -> 10                  // Right diamond
            }
        } else {
            when {
                nx < 0.5f && ny < 0.5f -> if (d1 >= 0f) 2 else 3
                nx < 0.5f && ny >= 0.5f -> if (d2 <= 0f) 5 else 6
                nx >= 0.5f && ny >= 0.5f -> if (d1 < 0f) 8 else 9
                else -> if (d2 > 0f) 11 else 12
            }
        }
    }

    /**
     * Maps normalized (0f..1f, 0f..1f) tap coordinates inside a 4x4 South Indian grid
     * to zodiac sign index (0=Aries..11=Pisces), or null if center 2x2 area tapped.
     */
    fun hitTestSouthIndianSign(nx: Float, ny: Float): Int? {
        val col = (nx * 4f).toInt().coerceIn(0, 3)
        val row = (ny * 4f).toInt().coerceIn(0, 3)
        return southCellToSign(row, col)
    }

    fun southCellToSign(row: Int, col: Int): Int? = when (row to col) {
        0 to 0 -> 11 // Pisces
        0 to 1 -> 0  // Aries
        0 to 2 -> 1  // Taurus
        0 to 3 -> 2  // Gemini
        1 to 3 -> 3  // Cancer
        2 to 3 -> 4  // Leo
        3 to 3 -> 5  // Virgo
        3 to 2 -> 6  // Libra
        3 to 1 -> 7  // Scorpio
        3 to 0 -> 8  // Sagittarius
        2 to 0 -> 9  // Capricorn
        1 to 0 -> 10 // Aquarius
        else -> null
    }
}
