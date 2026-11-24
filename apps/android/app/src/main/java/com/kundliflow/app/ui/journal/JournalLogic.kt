package com.kundliflow.app.ui.journal

import androidx.compose.runtime.Immutable
import com.kundliflow.app.ui.subject.PlanetId
import com.kundliflow.app.ui.today.SkyBand
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.intOrNull
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import java.util.Locale
import kotlin.random.Random

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
    val score: Int = 0,
)

object FrozenSkySnapshotCodec {
    private val json = Json { ignoreUnknownKeys = true }

    fun encode(snap: FrozenSkySnapshot): String {
        fun esc(s: String) = s.replace("\\", "\\\\").replace("\"", "\\\"")
        return """{"band":"${snap.band.name.lowercase()}","moonSign":"${esc(snap.moonSign)}","horaRuler":"${snap.horaRuler.name.lowercase()}","chandraBala":"${esc(snap.chandraBalaSummary)}","taraBala":"${esc(snap.taraBalaSummary)}","savBindus":${snap.savBindus},"score":${snap.score}}"""
    }

    fun decode(rawJson: String?): FrozenSkySnapshot {
        if (rawJson.isNullOrBlank()) {
            return FrozenSkySnapshot(SkyBand.Steady, "—", PlanetId.JUPITER, "—", "—", 28, 0)
        }
        return runCatching {
            val o = json.parseToJsonElement(rawJson).jsonObject
            val band = SkyBand.fromApi(o["band"]?.jsonPrimitive?.content ?: "steady")
            val moonSign = o["moonSign"]?.jsonPrimitive?.content ?: "—"
            val horaRaw = o["horaRuler"]?.jsonPrimitive?.content ?: "jupiter"
            val hora = PlanetId.entries.firstOrNull { it.name.equals(horaRaw, ignoreCase = true) } ?: PlanetId.JUPITER
            val chandra = o["chandraBala"]?.jsonPrimitive?.content ?: "—"
            val tara = o["taraBala"]?.jsonPrimitive?.content ?: "—"
            val sav = o["savBindus"]?.jsonPrimitive?.intOrNull ?: 28
            val score = o["score"]?.jsonPrimitive?.intOrNull ?: 0
            FrozenSkySnapshot(band, moonSign, hora, chandra, tara, sav, score)
        }.getOrElse {
            FrozenSkySnapshot(SkyBand.Steady, "—", PlanetId.JUPITER, "—", "—", 28, 0)
        }
    }
}

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
        val flowingMoods = entries.filter { it.sky.band == SkyBand.Flowing }.map { it.mood.toDouble() }
        val nonFlowingMoods = entries.filter { it.sky.band != SkyBand.Flowing }.map { it.mood.toDouble() }
        val flowingAvg = if (flowingMoods.isNotEmpty()) {
            String.format(Locale.US, "%.1f", flowingMoods.average())
        } else {
            String.format(Locale.US, "%.1f", entries.map { it.mood }.ifEmpty { listOf(0) }.average())
        }

        val topHoraEntry = entries
            .groupBy { it.sky.horaRuler }
            .maxByOrNull { (_, list) -> list.map { it.mood }.average() }
        val topHoraName = topHoraEntry?.key?.displayName ?: "Jupiter"
        val topHoraAvg = topHoraEntry?.value?.map { it.mood }?.average()
            ?.let { String.format(Locale.US, "%.1f", it) } ?: "—"

        val distinctHoras = entries.map { it.sky.horaRuler }.toSet().size

        val topMoonEntry = entries
            .filter { it.sky.moonSign != "—" && it.sky.moonSign.isNotBlank() }
            .groupBy { it.sky.moonSign }
            .maxByOrNull { (_, list) -> list.map { it.mood }.average() }

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
            count < 15 -> PatternCalibrationStage(
                totalEntries = count,
                headline = "Hora signal emerging ($count of 30)",
                body = "You've logged across $distinctHoras Hora rulers. $topHoraName hours average $topHoraAvg / 5.",
                fullUnlocked = false,
            )
            count < 20 -> {
                val moonNote = if (topMoonEntry != null) {
                    val mAvg = String.format(Locale.US, "%.1f", topMoonEntry.value.map { it.mood }.average())
                    "Early signal: Moon in ${topMoonEntry.key} averages $mAvg / 5 across your logs."
                } else {
                    "Early signal: $topHoraName hours ($topHoraAvg / 5) currently stand out in your rhythm."
                }
                PatternCalibrationStage(
                    totalEntries = count,
                    headline = "Early lunar pattern ($count of 30)",
                    body = moonNote,
                    fullUnlocked = false,
                )
            }
            count < 30 -> PatternCalibrationStage(
                totalEntries = count,
                headline = "Patterns emerging ($count of 30)",
                body = "Real patterns are emerging ($topHoraName Hora: $topHoraAvg / 5). ${30 - count} more entries for 95% Bootstrap CI.",
                fullUnlocked = false,
            )
            else -> {
                val (ciLow, ciHigh, delta) = computeBootstrapMeanDiffCi(flowingMoods, nonFlowingMoods)
                val deltaStr = String.format(Locale.US, "%+.2f", delta)
                val ciStr = String.format(Locale.US, "[%+.2f, %+.2f]", ciLow, ciHigh)
                val moonSummary = topMoonEntry?.let { " · Top Moon sign: ${it.key}" } ?: ""
                PatternCalibrationStage(
                    totalEntries = count,
                    headline = "Your Sky Patterns (n=$count)",
                    body = "Flowing hours average $flowingAvg / 5; $topHoraName Hora leads at $topHoraAvg / 5$moonSummary.",
                    fullUnlocked = true,
                    mathDetail = "Flowing vs. other delta $deltaStr · 95% Bootstrap CI $ciStr (B=200, n=$count).",
                )
            }
        }
    }

    /**
     * Deterministic on-device bootstrap 95% CI for mean(groupA) - mean(groupB).
     */
    fun computeBootstrapMeanDiffCi(
        groupA: List<Double>,
        groupB: List<Double>,
        iterations: Int = 200,
    ): Triple<Double, Double, Double> {
        if (groupA.isEmpty() || groupB.isEmpty()) return Triple(0.0, 0.0, 0.0)
        val observed = groupA.average() - groupB.average()
        val rng = Random(42)
        val diffs = DoubleArray(iterations)
        for (i in 0 until iterations) {
            var sumA = 0.0
            for (j in groupA.indices) sumA += groupA[rng.nextInt(groupA.size)]
            var sumB = 0.0
            for (j in groupB.indices) sumB += groupB[rng.nextInt(groupB.size)]
            diffs[i] = (sumA / groupA.size) - (sumB / groupB.size)
        }
        diffs.sort()
        val low = diffs[(iterations * 0.025).toInt().coerceIn(0, iterations - 1)]
        val high = diffs[(iterations * 0.975).toInt().coerceIn(0, iterations - 1)]
        return Triple(low, high, observed)
    }

    fun computeWeeklyReviewHeadline(entries: List<JournalEntryUi>): String? {
        if (entries.isEmpty()) return null
        val avg = String.format(Locale.US, "%.1f", entries.map { it.mood }.average())
        val topHora = entries
            .groupBy { it.sky.horaRuler }
            .maxByOrNull { (_, list) -> list.map { it.mood }.average() }
            ?.key?.displayName
        return if (topHora != null) {
            "This week averaged $avg / 5 across ${entries.size} logs — $topHora hours felt clearest."
        } else {
            "This week averaged $avg / 5 across ${entries.size} reflections."
        }
    }
}
