package com.kundliflow.app.ui.journal

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
import com.kundliflow.app.ui.theme.KundliColors
import com.kundliflow.app.ui.theme.TelemetryNumberStyle

@Composable
fun JournalScreen(
    entries: List<JournalEntryUi>,
    milestones: List<MilestoneUi>,
    daysLoggedThisWeek: Set<Int>, // 0=Mon .. 6=Sun
    weeklyGoal: Int,
    onTapSkySnapshot: (FrozenSkySnapshot) -> Unit,
    onSubmitCheckIn: (mood: Int, energy: Int, kind: String, tags: List<String>, note: String) -> Unit,
    externalOpenComposer: Boolean = false,
    onExternalComposerHandled: () -> Unit = {},
) {
    var activeFilter by remember { mutableStateOf(JournalFilter.ALL) }
    var selectedTag by remember { mutableStateOf<String?>(null) }
    var showComposer by remember { mutableStateOf(false) }

    if (externalOpenComposer && !showComposer) {
        showComposer = true
        onExternalComposerHandled()
    }

    val patternStage = remember(entries) { JournalPatternsCalculator.computeCalibrationStage(entries) }
    var showPatternMath by remember { mutableStateOf(false) }

    val filteredEntries = remember(entries, activeFilter, selectedTag) {
        if (activeFilter == JournalFilter.MILESTONES) emptyList()
        else entries.filter { selectedTag == null || it.tags.contains(selectedTag) }
    }
    val filteredMilestones = remember(milestones, activeFilter) {
        if (activeFilter == JournalFilter.ENTRIES) emptyList() else milestones
    }

    Box(modifier = Modifier.fillMaxSize()) {
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 20.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            // 1. Your Patterns Card (Progressive 5/10/15/20/30)
            item {
                Surface(
                    color = KundliColors.Surface,
                    shape = RoundedCornerShape(18.dp),
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = patternStage.headline,
                            style = MaterialTheme.typography.titleMedium,
                            color = KundliColors.Gold,
                        )
                        Spacer(Modifier.height(4.dp))
                        Text(
                            text = patternStage.body,
                            style = MaterialTheme.typography.bodySmall,
                            color = KundliColors.TextMuted,
                        )
                        if (patternStage.fullUnlocked && patternStage.mathDetail != null) {
                            Spacer(Modifier.height(6.dp))
                            AnimatedVisibility(visible = showPatternMath) {
                                Text(
                                    text = patternStage.mathDetail,
                                    style = MaterialTheme.typography.labelMedium,
                                    color = KundliColors.Teal,
                                )
                            }
                            TextButton(onClick = { showPatternMath = !showPatternMath }) {
                                Text(
                                    text = if (showPatternMath) "Hide the math" else "Show the math",
                                    color = KundliColors.Gold,
                                )
                            }
                        }
                    }
                }
            }

            // 2. Weekly Rhythm Dots (Monday reset, no streaks)
            item {
                WeeklyRhythmCard(
                    daysLogged = daysLoggedThisWeek,
                    goal = weeklyGoal,
                )
            }

            // 3. Filter Strip
            item {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    JournalFilter.entries.forEach { filter ->
                        FilterChip(
                            selected = activeFilter == filter,
                            onClick = { activeFilter = filter },
                            label = { Text(filter.label) },
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = KundliColors.SurfaceAlt,
                                selectedLabelColor = KundliColors.Gold,
                            ),
                        )
                    }
                    if (selectedTag != null) {
                        FilterChip(
                            selected = true,
                            onClick = { selectedTag = null },
                            label = { Text("#$selectedTag ×") },
                        )
                    }
                }
            }

            // 4. Named Empty State or Unified Timeline
            if (filteredEntries.isEmpty() && filteredMilestones.isEmpty()) {
                item {
                    Surface(
                        color = KundliColors.Surface,
                        border = BorderStroke(1.dp, KundliColors.GoldHairline),
                        shape = RoundedCornerShape(18.dp),
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Column(
                            modifier = Modifier.padding(22.dp),
                            horizontalAlignment = Alignment.CenterHorizontally,
                        ) {
                            Text(
                                text = "Your first entry will capture this exact sky. It never comes back.",
                                style = MaterialTheme.typography.bodyMedium,
                                color = KundliColors.TextMain,
                            )
                            Spacer(Modifier.height(14.dp))
                            Button(
                                onClick = { showComposer = true },
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = KundliColors.Gold,
                                    contentColor = KundliColors.OrbInk,
                                ),
                            ) {
                                Text("Check in now")
                            }
                        }
                    }
                }
            } else {
                items(filteredMilestones, key = { "ms_${it.id}" }) { milestone ->
                    Surface(
                        color = KundliColors.SurfaceAlt,
                        shape = RoundedCornerShape(16.dp),
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Row(
                            modifier = Modifier.padding(14.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Column {
                                Text("MILESTONE · ${milestone.category.uppercase()}", style = MaterialTheme.typography.labelMedium, color = KundliColors.Gold)
                                Text(milestone.title, style = MaterialTheme.typography.titleMedium, color = KundliColors.TextMain)
                            }
                            Text(milestone.eventDate, style = TelemetryNumberStyle, color = KundliColors.TextMuted)
                        }
                    }
                }

                items(filteredEntries, key = { it.id }) { entry ->
                    JournalEntryCard(
                        entry = entry,
                        onTapSky = { onTapSkySnapshot(entry.sky) },
                        onTapTag = { selectedTag = it },
                    )
                }
            }

            item { Spacer(Modifier.height(148.dp)) }
        }

        // Primary Action CTA
        Button(
            onClick = { showComposer = true },
            colors = ButtonDefaults.buttonColors(
                containerColor = KundliColors.Gold,
                contentColor = KundliColors.OrbInk,
            ),
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = 96.dp),
        ) {
            Text("Check in")
        }
    }

    if (showComposer) {
        ProgressiveComposerSheet(
            onSubmit = { mood, energy, kind, tags, note ->
                showComposer = false
                onSubmitCheckIn(mood, energy, kind, tags, note)
            },
            onDismiss = { showComposer = false },
        )
    }
}

@Composable
private fun WeeklyRhythmCard(
    daysLogged: Set<Int>,
    goal: Int,
) {
    val labels = listOf("M", "T", "W", "T", "F", "S", "S")
    Surface(
        color = KundliColors.Surface,
        shape = RoundedCornerShape(16.dp),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            Text("This week", style = MaterialTheme.typography.titleMedium, color = KundliColors.TextMain)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                labels.forEachIndexed { idx, letter ->
                    val filled = daysLogged.contains(idx)
                    Box(
                        modifier = Modifier
                            .size(22.dp)
                            .clip(CircleShape)
                            .background(if (filled) KundliColors.Teal else KundliColors.SurfaceAlt),
                        contentAlignment = Alignment.Center,
                    ) {
                        Text(
                            text = letter,
                            style = MaterialTheme.typography.labelMedium,
                            color = if (filled) KundliColors.OrbInk else KundliColors.TextMuted,
                        )
                    }
                }
            }
            Text(
                text = "${daysLogged.size} of $goal days",
                style = TelemetryNumberStyle,
                color = KundliColors.TextMuted,
            )
        }
    }
}

@Composable
private fun JournalEntryCard(
    entry: JournalEntryUi,
    onTapSky: () -> Unit,
    onTapTag: (String) -> Unit,
) {
    Surface(
        color = KundliColors.Surface,
        shape = RoundedCornerShape(16.dp),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(entry.timestampLabel, style = MaterialTheme.typography.labelMedium, color = KundliColors.TextMuted)
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                    Text("${entry.mood}/5", style = TelemetryNumberStyle, color = KundliColors.Gold)
                    Surface(
                        color = entry.sky.band.color.copy(alpha = 0.16f),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.clickable(onClick = onTapSky),
                    ) {
                        Text(
                            text = "${entry.sky.band.label} · ${entry.sky.moonSign}",
                            style = MaterialTheme.typography.labelMedium,
                            color = entry.sky.band.color,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                        )
                    }
                }
            }
            if (entry.note.isNotBlank()) {
                Spacer(Modifier.height(6.dp))
                Text(entry.note, style = MaterialTheme.typography.bodyMedium, color = KundliColors.TextMain)
            }
            if (entry.tags.isNotEmpty()) {
                Spacer(Modifier.height(8.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    entry.tags.forEach { tag ->
                        Text(
                            text = "#$tag",
                            style = MaterialTheme.typography.labelMedium,
                            color = KundliColors.Teal,
                            modifier = Modifier.clickable { onTapTag(tag) },
                        )
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
private fun ProgressiveComposerSheet(
    onSubmit: (mood: Int, energy: Int, kind: String, tags: List<String>, note: String) -> Unit,
    onDismiss: () -> Unit,
) {
    var mood by remember { mutableIntStateOf(3) }
    var energy by remember { mutableIntStateOf(3) }
    var kind by remember { mutableStateOf("checkin") }
    val selectedTags = remember { mutableStateListOf<String>() }
    var note by remember { mutableStateOf("") }

    val availableTags = listOf("work", "focus", "creative", "meditation", "family", "health", "travel", "study")

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = KundliColors.Surface,
        contentColor = KundliColors.TextMain,
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .navigationBarsPadding()
                .padding(horizontal = 20.dp, vertical = 12.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Text("Check in", style = MaterialTheme.typography.headlineSmall)
            Text("Mood (1–5)", style = MaterialTheme.typography.labelMedium, color = KundliColors.TextMuted)
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                (1..5).forEach { value ->
                    FilterChip(
                        selected = mood == value,
                        onClick = { mood = value },
                        label = { Text("$value") },
                    )
                }
            }

            Text("Tags (optional)", style = MaterialTheme.typography.labelMedium, color = KundliColors.TextMuted)
            FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                availableTags.forEach { tag ->
                    val active = selectedTags.contains(tag)
                    FilterChip(
                        selected = active,
                        onClick = {
                            if (active) selectedTags.remove(tag) else selectedTags.add(tag)
                        },
                        label = { Text(tag) },
                    )
                }
            }

            OutlinedTextField(
                value = note,
                onValueChange = { note = it },
                label = { Text("Note (optional)") },
                modifier = Modifier.fillMaxWidth(),
                minLines = 2,
            )

            Button(
                onClick = { onSubmit(mood, energy, kind, selectedTags.toList(), note) },
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(
                    containerColor = KundliColors.Gold,
                    contentColor = KundliColors.OrbInk,
                ),
            ) {
                Text("Save check-in")
            }
            Spacer(Modifier.height(8.dp))
        }
    }
}
