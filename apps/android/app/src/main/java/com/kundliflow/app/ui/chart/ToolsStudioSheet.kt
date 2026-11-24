package com.kundliflow.app.ui.chart

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.kundliflow.app.ui.theme.KundliColors
import com.kundliflow.app.ui.theme.TelemetryNumberStyle
import java.time.LocalDate

enum class ToolsStudioTab(val label: String) {
    QUANT("Quant"),
    CHALIT("Chalit"),
    KP("KP"),
    VARSHAPHAL("Varshaphal"),
    AVAKAHADA("Avakahada"),
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ToolsStudioSheet(
    data: ToolsStudioData,
    houses: List<ChartHouseData>,
    onFetchVarshaphalYear: suspend (Int) -> VarshaphalViewData?,
    onDismiss: () -> Unit,
) {
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    var activeTab by remember { mutableStateOf(ToolsStudioTab.QUANT) }
    var targetYear by remember { mutableIntStateOf(data.initialVarshaphal?.targetYear ?: LocalDate.now().year) }
    var varshaphal by remember(data.initialVarshaphal) { mutableStateOf(data.initialVarshaphal) }
    var sahamQuery by remember { mutableStateOf("") }

    LaunchedEffect(activeTab, targetYear) {
        if (activeTab == ToolsStudioTab.VARSHAPHAL) {
            onFetchVarshaphalYear(targetYear)?.let { varshaphal = it }
        }
    }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        containerColor = KundliColors.Surface,
        contentColor = KundliColors.TextMain,
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .navigationBarsPadding()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 20.dp, vertical = 12.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Text("Tools Room (Rung 3)", style = MaterialTheme.typography.headlineSmall, color = KundliColors.Gold)
            Text(
                "Specialist workbench: raw calculation matrices, KP cusps, and Tajika Varshaphal.",
                style = MaterialTheme.typography.bodySmall,
                color = KundliColors.TextMuted,
            )

            LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                items(ToolsStudioTab.entries) { tab ->
                    FilterChip(selected = activeTab == tab, onClick = { activeTab = tab }, label = { Text(tab.label) })
                }
            }

            when (activeTab) {
                ToolsStudioTab.QUANT -> {
                    Text("Planetary Degrees & Vargottama", style = MaterialTheme.typography.titleMedium, color = KundliColors.Gold)
                    data.quantPlanetRows.forEach { (planet, pos, flags) ->
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text(planet, style = MaterialTheme.typography.bodyMedium)
                            Text(pos, style = TelemetryNumberStyle, color = KundliColors.TextMain)
                            Text(flags, style = MaterialTheme.typography.labelMedium, color = KundliColors.Teal)
                        }
                        HorizontalDivider(color = KundliColors.SubtleDivider)
                    }
                    Spacer(Modifier.height(4.dp))
                    Text("12-House Ashtakvarga SAV (337 Total)", style = MaterialTheme.typography.titleMedium, color = KundliColors.Gold)
                    houses.chunked(4).forEach { row ->
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            row.forEach { h ->
                                Surface(color = KundliColors.SurfaceAlt, shape = RoundedCornerShape(10.dp), modifier = Modifier.weight(1f)) {
                                    Column(modifier = Modifier.padding(8.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                                        Text("H${h.number}", style = MaterialTheme.typography.labelMedium, color = KundliColors.TextMuted)
                                        Text("${h.savBindus}", style = TelemetryNumberStyle, color = if (h.savBindus >= 30) KundliColors.Teal else KundliColors.TextMain)
                                    }
                                }
                            }
                        }
                    }
                }

                ToolsStudioTab.CHALIT -> {
                    Text("Sripati Bhava Chalit Shifts", style = MaterialTheme.typography.titleMedium, color = KundliColors.Gold)
                    if (data.chalitShifts.isEmpty()) {
                        Text("All planets remain in their D1 Rashi houses in Sripati Chalit.", style = MaterialTheme.typography.bodySmall, color = KundliColors.Teal)
                    } else {
                        data.chalitShifts.forEach { shift ->
                            Surface(color = KundliColors.SurfaceAlt, shape = RoundedCornerShape(12.dp), modifier = Modifier.fillMaxWidth()) {
                                Column(modifier = Modifier.padding(12.dp)) {
                                    Text("${shift.planet}: H${shift.rashiHouse} → H${shift.chalitHouse}", style = MaterialTheme.typography.titleMedium, color = KundliColors.Gold)
                                    Text(shift.meaning, style = MaterialTheme.typography.bodySmall, color = KundliColors.TextMuted)
                                }
                            }
                        }
                    }
                }

                ToolsStudioTab.KP -> {
                    Text("KP Cusps (Star & Sub-Lords)", style = MaterialTheme.typography.titleMedium, color = KundliColors.Gold)
                    if (data.kpCusps.isEmpty()) {
                        Text("KP cusps require exact birth time.", style = MaterialTheme.typography.bodySmall, color = KundliColors.TextMuted)
                    } else {
                        data.kpCusps.forEach { cusp ->
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Text("H${cusp.house} (${cusp.sign})", style = MaterialTheme.typography.bodyMedium)
                                Text("Star: ${cusp.starLord}", style = MaterialTheme.typography.bodySmall, color = KundliColors.TextMuted)
                                Text("Sub: ${cusp.subLord}", style = TelemetryNumberStyle, color = KundliColors.Teal)
                            }
                            HorizontalDivider(color = KundliColors.SubtleDivider)
                        }
                    }
                }

                ToolsStudioTab.VARSHAPHAL -> {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Text("Tajika Varshaphal ($targetYear)", style = MaterialTheme.typography.titleMedium, color = KundliColors.Gold)
                        Row {
                            TextButton(onClick = { targetYear-- }) { Text("‹ Prev", color = KundliColors.Teal) }
                            TextButton(onClick = { targetYear++ }) { Text("Next ›", color = KundliColors.Teal) }
                        }
                    }
                    val vp = varshaphal
                    if (vp != null) {
                        Surface(color = KundliColors.SurfaceAlt, shape = RoundedCornerShape(12.dp), modifier = Modifier.fillMaxWidth()) {
                            Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                Text("Varsha Lagna: ${vp.varshaLagna} · Muntha: ${vp.munthaSign} (H${vp.munthaHouse})", style = MaterialTheme.typography.titleMedium)
                                Text("Varsheshwara: ${vp.varsheshwara}", style = MaterialTheme.typography.labelMedium, color = KundliColors.Teal)
                                if (vp.summary.isNotBlank()) Text(vp.summary, style = MaterialTheme.typography.bodySmall, color = KundliColors.TextMuted)
                            }
                        }
                        if (vp.sahams.isNotEmpty()) {
                            OutlinedTextField(
                                value = sahamQuery,
                                onValueChange = { sahamQuery = it },
                                placeholder = { Text("Filter 36 Sahams (e.g. Punya, Karma)…") },
                                modifier = Modifier.fillMaxWidth(),
                                singleLine = true,
                            )
                            val filtered = vp.sahams.filter {
                                sahamQuery.isBlank() || it.name.contains(sahamQuery, ignoreCase = true)
                            }
                            filtered.take(12).forEach { s ->
                                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                    Text(s.name, style = MaterialTheme.typography.bodySmall)
                                    Text("${s.sign} ${s.degree}", style = TelemetryNumberStyle, color = KundliColors.Gold)
                                }
                            }
                        }
                        if (vp.arudhas.isNotEmpty()) {
                            Text("Arudha Padas", style = MaterialTheme.typography.titleMedium, color = KundliColors.Gold)
                            Text(vp.arudhas.joinToString(" · ") { "${it.first}: ${it.second}" }, style = MaterialTheme.typography.bodySmall, color = KundliColors.TextMuted)
                        }
                        if (vp.upagrahas.isNotEmpty()) {
                            Text("Upagrahas", style = MaterialTheme.typography.titleMedium, color = KundliColors.Gold)
                            Text(vp.upagrahas.joinToString(" · ") { "${it.first}: ${it.second}" }, style = MaterialTheme.typography.bodySmall, color = KundliColors.TextMuted)
                        }
                    } else {
                        Text("Loading Varshaphal for $targetYear…", style = MaterialTheme.typography.bodySmall, color = KundliColors.TextMuted)
                    }
                }

                ToolsStudioTab.AVAKAHADA -> {
                    Text("Avakahada Chakra", style = MaterialTheme.typography.titleMedium, color = KundliColors.Gold)
                    data.avakahadaCells.chunked(2).forEach { pair ->
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            pair.forEach { (k, v) ->
                                Surface(color = KundliColors.SurfaceAlt, shape = RoundedCornerShape(10.dp), modifier = Modifier.weight(1f)) {
                                    Column(modifier = Modifier.padding(10.dp)) {
                                        Text(k, style = MaterialTheme.typography.labelMedium, color = KundliColors.TextMuted)
                                        Text(v, style = MaterialTheme.typography.titleMedium)
                                    }
                                }
                            }
                        }
                    }
                    Text("Birth Panchang", style = MaterialTheme.typography.titleMedium, color = KundliColors.Gold)
                    data.birthPanchangCells.forEach { (k, v) ->
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text(k, style = MaterialTheme.typography.bodySmall, color = KundliColors.TextMuted)
                            Text(v, style = TelemetryNumberStyle, color = KundliColors.TextMain)
                        }
                        HorizontalDivider(color = KundliColors.SubtleDivider)
                    }
                }
            }
            Spacer(Modifier.height(8.dp))
        }
    }
}
