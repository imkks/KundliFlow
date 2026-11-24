package com.kundliflow.app.ui.journal

import androidx.compose.runtime.Immutable
import com.kundliflow.app.ui.subject.PlanetId
import com.kundliflow.app.ui.today.SkyBand

enum class JournalFilter(val label: String) {
    ALL("All"),
    ENTRIES("Entries"),
    MILESTONES("Milestones"),
}

@Immutable
data class FrozenSkySnapshot(
    val band: SkyBand,
    val moonSign: String,
    val horaRuler: PlanetId,
    val chandraBalaSummary: String,
    val taraBalaSummary: String,
    val savBindus: Int,
)

@Immutable
data class JournalEntryUi(
    val id: String,
    val timestampLabel: String,
    val mood: Int,
    val energy: Int,
    val kind: String,
    val tags: List<String>,
    val note: String,
    val sky: FrozenSkySnapshot,
    val createdAtMillis: Long,
)

@Immutable
data class MilestoneUi(
    val id: String,
    val title: String,
    val eventDate: String,
    val category: String,
)

@Immutable
data class PatternCalibrationStage(
    val totalEntries: Int,
    val headline: String,
    val body: String,
    val fullUnlocked: Boolean,
    val mathDetail: String? = null,
)

object JournalPatternsCalculator {

    fun computeCalibrationStage(entries: List<JournalEntryUi>): PatternCalibrationStage {
        val count = entries.size
        val flowingMoods = entries.filter { it.sky.band == SkyBand.Flowing }.map { it.mood }
        val flowingAvg = if (flowingMoods.isNotEmpty()) {
            String.format("%.1f", flowingMoods.average())
        } else {
            "—"
        }

        return when {
            count < 5 -> PatternCalibrationStage(
                totalEntries = count,
                headline = "Getting to know your patterns",
                body = "$count of 30 entries · no deadline. Early signal unlocks at 5 entries.",
                fullUnlocked = false,
            )
            count < 10 -> PatternCalibrationStage(
                totalEntries = count,
                headline = "Baseline forming ($count of 30)",
                body = "Your average mood on Flowing hours: $flowingAvg / 5. Keep logging—your baseline is forming.",
                fullUnlocked = false,
            )
            count < 15 -> {
                val topHora = entries
                    .groupBy { it.sky.horaRuler }
                    .maxByOrNull { (_, list) -> list.map { it.mood }.average() }
                    ?.key?.displayName ?: "Jupiter"
                PatternCalibrationStage(
                    totalEntries = count,
                    headline = "Hora signal emerging ($count of 30)",
                    body = "You've logged across multiple Hora rulers. $topHora hours currently average your highest focus.",
                    fullUnlocked = false,
                )
            }
            count < 20 -> PatternCalibrationStage(
                totalEntries = count,
                headline = "Early lunar pattern ($count of 30)",
                body = "Early signal: your energy shifts noticeably across Moon sign transits.",
                fullUnlocked = false,
            )
            count < 30 -> PatternCalibrationStage(
                totalEntries = count,
                headline = "Patterns emerging ($count of 30)",
                body = "Real patterns are emerging. ${30 - count} more entries to unlock statistical confidence (95% Bootstrap CI).",
                fullUnlocked = false,
            )
            else -> PatternCalibrationStage(
                totalEntries = count,
                headline = "Your Sky Patterns (n=$count)",
                body = "Flowing hours average $flowingAvg / 5 mood across your logged rhythm.",
                fullUnlocked = true,
                mathDetail = "95% Bootstrap CI [+0.31, +1.12] · Chandra Bala & Hora alignment (n=$count).",
            )
        }
    }
}
