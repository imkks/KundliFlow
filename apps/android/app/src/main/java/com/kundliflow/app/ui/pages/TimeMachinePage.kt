package com.kundliflow.app.ui.pages

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
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
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowBack
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
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
import androidx.compose.ui.unit.dp
import com.kundliflow.app.ui.common.BirthDatePickerField
import com.kundliflow.app.ui.journal.MilestoneUi
import com.kundliflow.app.ui.theme.KundliColors
import com.kundliflow.app.ui.theme.TelemetryNumberStyle
import java.time.LocalDate

@Composable
fun TimeMachinePage(
    milestones: List<MilestoneUi>,
    lookupDashaForYear: (Int) -> String,
    onAddMilestone: (title: String, date: String, category: String) -> Unit,
    onExplainYearWithAi: (Int) -> Unit,
    onBack: () -> Unit,
) {
    var selectedYear by remember { mutableIntStateOf(LocalDate.now().year) }
    var showJumpMenu by remember { mutableStateOf(false) }
    var showAddSheet by remember { mutableStateOf(false) }

    val nearbyYears = remember(selectedYear) { ((selectedYear - 4)..(selectedYear + 4)).filter { it in 1950..2060 } }
    val dashaText = remember(selectedYear) { lookupDashaForYear(selectedYear) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(KundliColors.BgInk)
            .statusBarsPadding()
            .navigationBarsPadding(),
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp)
                .padding(horizontal = 8.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = onBack) {
                    Icon(Icons.AutoMirrored.Rounded.ArrowBack, contentDescription = "Back", tint = KundliColors.Gold)
                }
                Text("Time-Machine", style = MaterialTheme.typography.titleMedium, color = KundliColors.TextMain)
            }
            TextButton(onClick = { showAddSheet = true }) {
                Text("+ Milestone", color = KundliColors.Gold)
            }
        }

        Column(
            modifier = Modifier
                .weight(1f)
                .verticalScroll(rememberScrollState())
                .padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            // Nearby Years Horizontal Rail + [Jump Decade v] Dropdown
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Text("SCRUB ANY YEAR (1950–2060)", style = MaterialTheme.typography.labelMedium, color = KundliColors.TextMuted)
                Box {
                    TextButton(onClick = { showJumpMenu = true }) {
                        Text("Jump ▾", color = KundliColors.Teal)
                    }
                    DropdownMenu(expanded = showJumpMenu, onDismissRequest = { showJumpMenu = false }, containerColor = KundliColors.Surface) {
                        (1955..2055 step 10).forEach { yr ->
                            DropdownMenuItem(
                                text = { Text("$yr", color = KundliColors.TextMain) },
                                onClick = {
                                    selectedYear = yr
                                    showJumpMenu = false
                                },
                            )
                        }
                    }
                }
            }

            LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                items(nearbyYears) { yr ->
                    FilterChip(
                        selected = selectedYear == yr,
                        onClick = { selectedYear = yr },
                        label = { Text("$yr", style = TelemetryNumberStyle) },
                    )
                }
            }

            // Active Chapter Match Card
            Surface(
                color = KundliColors.Surface,
                border = BorderStroke(1.dp, KundliColors.GoldHairline),
                shape = RoundedCornerShape(18.dp),
                modifier = Modifier.fillMaxWidth(),
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text("ACTIVE VIMSHOTTARI CHAPTER", style = MaterialTheme.typography.labelMedium, color = KundliColors.Gold)
                    Text(dashaText, style = MaterialTheme.typography.titleMedium, color = KundliColors.Teal)
                    OutlinedButton(
                        onClick = { onExplainYearWithAi(selectedYear) },
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Text("Explain $selectedYear with Ask AI →", color = KundliColors.Gold)
                    }
                }
            }

            Text("Saved Life Milestones (${milestones.size})", style = MaterialTheme.typography.titleMedium, color = KundliColors.TextMain)
            if (milestones.isEmpty()) {
                Surface(color = KundliColors.Surface, shape = RoundedCornerShape(16.dp), modifier = Modifier.fillMaxWidth()) {
                    Text(
                        text = "Add a memorable past event (graduation, move, career shift, marriage) to verify which Dasha was active.",
                        style = MaterialTheme.typography.bodySmall,
                        color = KundliColors.TextMuted,
                        modifier = Modifier.padding(16.dp),
                    )
                }
            } else {
                milestones.forEach { m ->
                    val yr = m.eventDate.take(4).toIntOrNull()
                    Surface(
                        color = KundliColors.SurfaceAlt,
                        shape = RoundedCornerShape(14.dp),
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Text(m.title, style = MaterialTheme.typography.titleMedium, color = KundliColors.TextMain)
                                Text(m.eventDate, style = TelemetryNumberStyle, color = KundliColors.Gold)
                            }
                            Text(m.category.uppercase(), style = MaterialTheme.typography.labelMedium, color = KundliColors.Teal)
                            if (yr != null) {
                                Text(lookupDashaForYear(yr), style = MaterialTheme.typography.bodySmall, color = KundliColors.TextMuted)
                            }
                        }
                    }
                }
            }
        }
    }

    if (showAddSheet) {
        AddMilestoneModal(
            onSave = { title, date, cat ->
                showAddSheet = false
                onAddMilestone(title, date, cat)
            },
            onDismiss = { showAddSheet = false },
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
private fun AddMilestoneModal(
    onSave: (title: String, date: String, category: String) -> Unit,
    onDismiss: () -> Unit,
) {
    var category by remember { mutableStateOf("Career") }
    var title by remember { mutableStateOf("") }
    var date by remember { mutableStateOf(LocalDate.now().toString()) }

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
            OutlinedTextField(value = title, onValueChange = { title = it }, label = { Text("What happened?") }, modifier = Modifier.fillMaxWidth(), singleLine = true)
            BirthDatePickerField(birthDateIso = date, onDateSelected = { date = it })
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
