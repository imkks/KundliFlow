package com.kundliflow.app.ui.time

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
import com.kundliflow.app.ui.journal.MilestoneUi
import com.kundliflow.app.ui.subject.Rung
import com.kundliflow.app.ui.subject.Subject
import com.kundliflow.app.ui.theme.KundliColors
import com.kundliflow.app.ui.theme.TelemetryNumberStyle

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun TimeScreen(
    state: TimeTabState,
    milestones: List<MilestoneUi>,
    onOpenPeriodSubject: (Subject, Rung) -> Unit,
    onAddDateNote: (dayOfMonth: Int) -> Unit,
    onAddMilestone: (title: String, date: String, category: String) -> Unit,
    onExplainYearWithAi: (year: Int) -> Unit,
) {
    var selectedSystem by remember { mutableStateOf(DashaSystem.VIMSHOTTARI) }
    var showNextShiftDelta by remember { mutableStateOf(false) }
    var selectedPurpose by remember { mutableStateOf("All") }
    var selectedDay by remember { mutableStateOf(state.monthDays.firstOrNull()) }
    var showAllSkyMovers by remember { mutableStateOf(false) }
    var showAddMilestoneSheet by remember { mutableStateOf(false) }
    var timeMachineYear by remember { mutableIntStateOf(2024) }

    val activeDasha = state.activeDashas[selectedSystem] ?: state.activeDashas.values.first()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 20.dp)
            .padding(bottom = 108.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        // 1. Now Card (Nested Mahadasha / Antardasha + Dasha system switcher)
        Surface(
            color = KundliColors.Surface,
            border = BorderStroke(1.dp, KundliColors.GoldHairline),
            shape = RoundedCornerShape(18.dp),
            modifier = Modifier
                .fillMaxWidth()
                .clickable { onOpenPeriodSubject(Subject.Period("current"), Rung.Explain) },
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text("NOW · CHAPTER", style = MaterialTheme.typography.labelMedium, color = KundliColors.Gold)
                LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    items(DashaSystem.entries) { sys ->
                        FilterChip(
                            selected = selectedSystem == sys,
                            onClick = { selectedSystem = sys },
                            label = { Text(sys.label) },
                        )
                    }
                }
                Text(
                    text = "${activeDasha.mahadashaLord} Mahadasha · ${activeDasha.antardashaLord} Antardasha",
                    style = MaterialTheme.typography.titleMedium,
                    color = KundliColors.TextMain,
                )
                LinearProgressIndicator(
                    progress = { activeDasha.mahadashaProgress },
                    modifier = Modifier.fillMaxWidth().height(6.dp).clip(RoundedCornerShape(3.dp)),
                    color = KundliColors.Gold,
                    trackColor = KundliColors.SurfaceAlt,
                )
                Text(
                    text = "Sub-period (${activeDasha.antardashaRange}) · Pratyantar: ${activeDasha.pratyantarLord}",
                    style = MaterialTheme.typography.labelMedium,
                    color = KundliColors.TextMuted,
                )
                LinearProgressIndicator(
                    progress = { activeDasha.antardashaProgress },
                    modifier = Modifier.fillMaxWidth().height(5.dp).clip(RoundedCornerShape(3.dp)),
                    color = KundliColors.Teal,
                    trackColor = KundliColors.SurfaceAlt,
                )
                Text(activeDasha.plainMeaning, style = MaterialTheme.typography.bodySmall, color = KundliColors.TextMain)
            }
        }

        // 2. Next shift Card (Diff-Only 3-row preview)
        Surface(
            color = KundliColors.Surface,
            shape = RoundedCornerShape(18.dp),
            modifier = Modifier.fillMaxWidth(),
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Column {
                        Text("NEXT SHIFT", style = MaterialTheme.typography.labelMedium, color = KundliColors.Teal)
                        Text(state.nextShift.shiftDate, style = MaterialTheme.typography.titleMedium, color = KundliColors.TextMain)
                    }
                    TextButton(onClick = { showNextShiftDelta = !showNextShiftDelta }) {
                        Text(if (showNextShiftDelta) "Hide" else "Preview", color = KundliColors.Gold)
                    }
                }
                AnimatedVisibility(visible = showNextShiftDelta) {
                    Surface(
                        color = KundliColors.SurfaceAlt,
                        shape = RoundedCornerShape(14.dp),
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                            DeltaRow("Winds down", state.nextShift.windsDown)
                            DeltaRow("Wakes up", state.nextShift.wakesUp)
                            DeltaRow("House shift", state.nextShift.houseFocusShift)
                        }
                    }
                }
            }
        }

        // 3. Month Calendar Grid + Day Peek Card
        Surface(
            color = KundliColors.Surface,
            shape = RoundedCornerShape(18.dp),
            modifier = Modifier.fillMaxWidth(),
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text(state.monthTitle, style = MaterialTheme.typography.titleMedium, color = KundliColors.TextMain)
                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    contentPadding = PaddingValues(end = 6.dp),
                ) {
                    items(listOf("All", "Career", "Travel", "Finance", "Rest")) { purpose ->
                        FilterChip(
                            selected = selectedPurpose == purpose,
                            onClick = { selectedPurpose = purpose },
                            label = { Text(purpose) },
                        )
                    }
                }

                // 7-column compact grid
                state.monthDays.chunked(7).forEach { week ->
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                    ) {
                        week.forEach { day ->
                            val matches = selectedPurpose == "All" || day.purposes.contains(selectedPurpose)
                            val isSelected = selectedDay?.dayOfMonth == day.dayOfMonth
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .aspectRatio(1f)
                                    .clip(RoundedCornerShape(10.dp))
                                    .background(
                                        if (matches) day.band.color.copy(alpha = if (isSelected) 0.38f else 0.16f)
                                        else KundliColors.BgInk,
                                    )
                                    .clickable { selectedDay = day },
                                contentAlignment = Alignment.Center,
                            ) {
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Text(
                                        text = "${day.dayOfMonth}",
                                        style = TelemetryNumberStyle,
                                        color = if (matches) KundliColors.TextMain else KundliColors.TextMuted,
                                    )
                                    if (day.hasNoteOrMilestone) {
                                        Box(
                                            modifier = Modifier
                                                .size(4.dp)
                                                .clip(CircleShape)
                                                .background(KundliColors.Gold),
                                        )
                                    }
                                }
                            }
                        }
                        repeat(7 - week.size) { Spacer(Modifier.weight(1f)) }
                    }
                }

                selectedDay?.let { day ->
                    Surface(
                        color = KundliColors.SurfaceAlt,
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Row(
                            modifier = Modifier.padding(12.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text("Day ${day.dayOfMonth} · ${day.band.label}", style = MaterialTheme.typography.titleMedium, color = day.band.color)
                                Text(day.summary, style = MaterialTheme.typography.bodySmall, color = KundliColors.TextMuted)
                            }
                            TextButton(onClick = { onAddDateNote(day.dayOfMonth) }) {
                                Text("+ Date Note", color = KundliColors.Gold)
                            }
                        }
                    }
                }
            }
        }

        // 4. Time-Machine Milestones & Empty State
        Surface(
            color = KundliColors.Surface,
            shape = RoundedCornerShape(18.dp),
            modifier = Modifier.fillMaxWidth(),
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text("Time-Machine", style = MaterialTheme.typography.titleMedium, color = KundliColors.TextMain)
                    TextButton(onClick = { showAddMilestoneSheet = true }) {
                        Text("+ Add milestone", color = KundliColors.Gold)
                    }
                }
                if (milestones.isEmpty()) {
                    Text(
                        text = "Add a past milestone (graduation, marriage, move) — the app will show you which Dasha and planetary transits were active.",
                        style = MaterialTheme.typography.bodySmall,
                        color = KundliColors.TextMuted,
                    )
                } else {
                    milestones.take(3).forEach { m ->
                        Text("• ${m.eventDate}: ${m.title}", style = MaterialTheme.typography.bodySmall, color = KundliColors.TextMain)
                    }
                }
                FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    listOf(2020, 2022, 2024, 2026).forEach { yr ->
                        FilterChip(
                            selected = timeMachineYear == yr,
                            onClick = { timeMachineYear = yr },
                            label = { Text("$yr") },
                        )
                    }
                }
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(
                        text = "$timeMachineYear: ${activeDasha.mahadashaLord}–${activeDasha.antardashaLord}",
                        style = MaterialTheme.typography.bodySmall,
                        color = KundliColors.Teal,
                    )
                    OutlinedButton(onClick = { onExplainYearWithAi(timeMachineYear) }) {
                        Text("Explain with AI", color = KundliColors.Gold)
                    }
                }
            }
        }

        // 5. Sky Movers (Top 3 -> See all 9)
        Surface(
            color = KundliColors.Surface,
            shape = RoundedCornerShape(18.dp),
            modifier = Modifier.fillMaxWidth(),
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text("Sky movers", style = MaterialTheme.typography.titleMedium, color = KundliColors.TextMain)
                    TextButton(onClick = { showAllSkyMovers = true }) {
                        Text("See all ${state.skyMovers.size}", color = KundliColors.Teal)
                    }
                }
                Text("Sade Sati: ${state.sadeSatiStatus}", style = MaterialTheme.typography.labelMedium, color = KundliColors.Gold)
                state.skyMovers.take(3).forEach { mover ->
                    Text(
                        text = "${mover.planet.displayName} in ${mover.signName} (H${mover.houseFromLagna} Lagna · H${mover.houseFromMoon} Moon) — ${mover.plainMeaning}",
                        style = MaterialTheme.typography.bodySmall,
                        color = KundliColors.TextMuted,
                    )
                }
            }
        }
    }

    if (showAllSkyMovers) {
        SkyMoversSheet(movers = state.skyMovers, onDismiss = { showAllSkyMovers = false })
    }

    if (showAddMilestoneSheet) {
        AddMilestoneSheet(
            onSave = { title, date, cat ->
                showAddMilestoneSheet = false
                onAddMilestone(title, date, cat)
            },
            onDismiss = { showAddMilestoneSheet = false },
        )
    }
}

@Composable
private fun DeltaRow(label: String, value: String) {
    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(label, style = MaterialTheme.typography.labelMedium, color = KundliColors.TextMuted)
        Text(value, style = MaterialTheme.typography.bodySmall, color = KundliColors.TextMain)
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun SkyMoversSheet(movers: List<SkyMoverItem>, onDismiss: () -> Unit) {
    ModalBottomSheet(onDismissRequest = onDismiss, containerColor = KundliColors.Surface, contentColor = KundliColors.TextMain) {
        Column(
            modifier = Modifier.fillMaxWidth().navigationBarsPadding().verticalScroll(rememberScrollState()).padding(horizontal = 20.dp, vertical = 12.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Text("All Transits (Rung 2–3)", style = MaterialTheme.typography.headlineSmall)
            movers.forEach { mover ->
                Surface(color = KundliColors.SurfaceAlt, shape = RoundedCornerShape(12.dp), modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Text("${mover.planet.displayName} · ${mover.signName} (H${mover.houseFromLagna})", style = MaterialTheme.typography.titleMedium)
                        Text(mover.plainMeaning, style = MaterialTheme.typography.bodySmall, color = KundliColors.TextMain)
                        Text("${mover.vedhaNote} · ${mover.kakshyaLabel}", style = TelemetryNumberStyle, color = KundliColors.Teal)
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
private fun AddMilestoneSheet(
    onSave: (title: String, date: String, category: String) -> Unit,
    onDismiss: () -> Unit,
) {
    var category by remember { mutableStateOf("Career") }
    var title by remember { mutableStateOf("") }
    var date by remember { mutableStateOf("2024-06-15") }

    ModalBottomSheet(onDismissRequest = onDismiss, containerColor = KundliColors.Surface, contentColor = KundliColors.TextMain) {
        Column(
            modifier = Modifier.fillMaxWidth().navigationBarsPadding().padding(horizontal = 20.dp, vertical = 12.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Text("Add Milestone", style = MaterialTheme.typography.headlineSmall)
            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                listOf("Career", "Move", "Relationship", "Health", "Breakthrough").forEach { cat ->
                    FilterChip(selected = category == cat, onClick = { category = cat }, label = { Text(cat) })
                }
            }
            OutlinedTextField(value = title, onValueChange = { title = it }, label = { Text("What happened?") }, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(value = date, onValueChange = { date = it }, label = { Text("Date (YYYY-MM-DD)") }, modifier = Modifier.fillMaxWidth())
            Button(
                onClick = { onSave(title.ifBlank { category }, date, category.lowercase()) },
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(containerColor = KundliColors.Gold, contentColor = KundliColors.OrbInk),
            ) {
                Text("Save Milestone")
            }
            Spacer(Modifier.height(8.dp))
        }
    }
}
