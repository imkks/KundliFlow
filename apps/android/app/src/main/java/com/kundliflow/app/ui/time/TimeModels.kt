package com.kundliflow.app.ui.time

import androidx.compose.runtime.Immutable
import com.kundliflow.app.ui.subject.PlanetId
import com.kundliflow.app.ui.today.SkyBand

enum class DashaSystem(val label: String) {
    VIMSHOTTARI("Vimshottari 120y"),
    YOGINI("Yogini 36y"),
    CHARA("Chara Jaimini"),
}

@Immutable
data class ActiveDashaState(
    val system: DashaSystem,
    val mahadashaLord: String,
    val mahadashaProgress: Float,
    val mahadashaRange: String,
    val antardashaLord: String,
    val antardashaProgress: Float,
    val antardashaRange: String,
    val pratyantarLord: String,
    val plainMeaning: String,
)

@Immutable
data class NextShiftDelta(
    val shiftDate: String,
    val windsDown: String,
    val wakesUp: String,
    val houseFocusShift: String,
)

@Immutable
data class MonthDayCell(
    val dayOfMonth: Int,
    val band: SkyBand,
    val score: Int,
    val hasNoteOrMilestone: Boolean = false,
    val purposes: Set<String> = setOf("All"),
    val summary: String,
)

@Immutable
data class SkyMoverItem(
    val planet: PlanetId,
    val signName: String,
    val houseFromLagna: Int,
    val houseFromMoon: Int,
    val plainMeaning: String,
    val vedhaNote: String,
    val kakshyaLabel: String,
)

@Immutable
data class TimeTabState(
    val activeDashas: Map<DashaSystem, ActiveDashaState>,
    val nextShift: NextShiftDelta,
    val calendarYear: Int,
    val calendarMonth: Int,
    val monthTitle: String,
    val monthDays: List<MonthDayCell>,
    val skyMovers: List<SkyMoverItem>,
    val sadeSatiStatus: String,
)
