package com.kundliflow.app.ui.pages

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
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
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowBack
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.FilterChip
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.ScrollableTabRow
import androidx.compose.material3.Surface
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRowDefaults
import androidx.compose.material3.TabRowDefaults.tabIndicatorOffset
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.kundliflow.app.ui.chart.ChartHouseData
import com.kundliflow.app.ui.chart.ToolsStudioData
import com.kundliflow.app.ui.chart.VarshaphalViewData
import com.kundliflow.app.ui.theme.KundliColors
import com.kundliflow.app.ui.theme.TelemetryNumberStyle
import kotlinx.coroutines.launch
import java.time.LocalDate

@Composable
fun ToolsStudioPage(
    data: ToolsStudioData,
    houses: List<ChartHouseData>,
    onFetchVarshaphalYear: suspend (Int) -> VarshaphalViewData?,
    onExportDossier: () -> Unit,
    onBack: () -> Unit,
) {
    val tabs = listOf("Bhava Dossier", "Quant", "Chalit", "KP System", "Varshaphal", "Avakahada")
    val pagerState = rememberPagerState(pageCount = { tabs.size })
    val scope = rememberCoroutineScope()

    var targetYear by remember { mutableIntStateOf(data.initialVarshaphal?.targetYear ?: LocalDate.now().year) }
    var varshaphal by remember(data.initialVarshaphal) { mutableStateOf(data.initialVarshaphal) }
    var sahamQuery by remember { mutableStateOf("") }
    var showYearMenu by remember { mutableStateOf(false) }

    LaunchedEffect(pagerState.currentPage, targetYear) {
        if (pagerState.currentPage == 4) {
            onFetchVarshaphalYear(targetYear)?.let { varshaphal = it }
        }
    }

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
                Text("Tools & Systems Studio", style = MaterialTheme.typography.titleMedium, color = KundliColors.TextMain)
            }
            TextButton(onClick = onExportDossier) {
                Text("Dossier .md", color = KundliColors.Gold)
            }
        }

        ScrollableTabRow(
            selectedTabIndex = pagerState.currentPage,
            containerColor = KundliColors.BgInk,
            contentColor = KundliColors.Gold,
            edgePadding = 16.dp,
            indicator = { pos ->
                if (pagerState.currentPage < pos.size) {
                    TabRowDefaults.SecondaryIndicator(
                        modifier = Modifier.tabIndicatorOffset(pos[pagerState.currentPage]),
                        color = KundliColors.Gold,
                    )
                }
            },
        ) {
            tabs.forEachIndexed { idx, label ->
                Tab(
                    selected = pagerState.currentPage == idx,
                    onClick = { scope.launch { pagerState.animateScrollToPage(idx) } },
                    text = {
                        Text(
                            text = label,
                            style = MaterialTheme.typography.labelMedium,
                            color = if (pagerState.currentPage == idx) KundliColors.Gold else KundliColors.TextMuted,
                        )
                    },
                )
            }
        }

        HorizontalPager(state = pagerState, modifier = Modifier.weight(1f).fillMaxWidth()) { page ->
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
                    .padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                when (page) {
                    0 -> {
                        var selectedH by remember { mutableIntStateOf(1) }
                        LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            items(houses, key = { it.number }) { h ->
                                FilterChip(
                                    selected = selectedH == h.number,
                                    onClick = { selectedH = h.number },
                                    label = { Text("H${h.number} ${h.signName.take(3)}") },
                                )
                            }
                        }
                        val hd = houses.firstOrNull { it.number == selectedH }
                        if (hd != null) {
                            Surface(color = KundliColors.Surface, border = BorderStroke(1.dp, KundliColors.GoldHairline), shape = RoundedCornerShape(16.dp), modifier = Modifier.fillMaxWidth()) {
                                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                    Text("House ${hd.number} · ${hd.signName}", style = MaterialTheme.typography.headlineSmall, color = KundliColors.Gold)
                                    Text("Lord ${hd.lord.displayName} placed in House ${hd.lordHouse} · SAV ${hd.savBindus} / 337", style = TelemetryNumberStyle, color = KundliColors.Teal)
                                    Text(hd.summaryLine, style = MaterialTheme.typography.bodyMedium, color = KundliColors.TextMain)
                                    if (hd.planets.isNotEmpty()) {
                                        Text("Occupants: ${hd.planets.joinToString(", ") { "${it.id.displayName} (${it.degreeFormatted})" }}", style = MaterialTheme.typography.bodySmall, color = KundliColors.TextMuted)
                                    }
                                }
                            }
                            hd.findings.forEach { f ->
                                Surface(color = KundliColors.SurfaceAlt, shape = RoundedCornerShape(12.dp), modifier = Modifier.fillMaxWidth()) {
                                    Column(modifier = Modifier.padding(12.dp)) {
                                        Text(f.title, style = MaterialTheme.typography.labelMedium, color = KundliColors.Gold)
                                        Text(f.plainMeaning, style = MaterialTheme.typography.bodySmall, color = KundliColors.TextMain)
                                    }
                                }
                            }
                        }
                    }

                    1 -> {
                        Text("Planetary Degrees & Vargottama", style = MaterialTheme.typography.titleMedium, color = KundliColors.Gold)
                        data.quantPlanetRows.forEach { (planet, pos, flags) ->
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Text(planet, style = MaterialTheme.typography.bodyMedium)
                                Text(pos, style = TelemetryNumberStyle, color = KundliColors.TextMain)
                                Text(flags, style = MaterialTheme.typography.labelMedium, color = KundliColors.Teal)
                            }
                            HorizontalDivider(color = KundliColors.SubtleDivider)
                        }
                    }

                    2 -> {
                        Text("Sripati Bhava Chalit Shifts", style = MaterialTheme.typography.titleMedium, color = KundliColors.Gold)
                        if (data.chalitShifts.isEmpty()) {
                            Text("All planets remain in their D1 Rashi houses in Sripati Chalit.", style = MaterialTheme.typography.bodySmall, color = KundliColors.Teal)
                        } else {
                            data.chalitShifts.forEach { shift ->
                                Surface(color = KundliColors.Surface, shape = RoundedCornerShape(12.dp), modifier = Modifier.fillMaxWidth()) {
                                    Column(modifier = Modifier.padding(12.dp)) {
                                        Text("${shift.planet}: H${shift.rashiHouse} → H${shift.chalitHouse}", style = MaterialTheme.typography.titleMedium, color = KundliColors.Gold)
                                        Text(shift.meaning, style = MaterialTheme.typography.bodySmall, color = KundliColors.TextMuted)
                                    }
                                }
                            }
                        }
                    }

                    3 -> {
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

                    4 -> {
                        // Horizontal nearby-years rail + [Year v] jump dropdown
                        val nearbyYears = ((targetYear - 2)..(targetYear + 2)).toList()
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                            Text("Tajika Varshaphal ($targetYear)", style = MaterialTheme.typography.titleMedium, color = KundliColors.Gold)
                            Box {
                                TextButton(onClick = { showYearMenu = true }) {
                                    Text("Jump Year ▾", color = KundliColors.Teal)
                                }
                                DropdownMenu(expanded = showYearMenu, onDismissRequest = { showYearMenu = false }, containerColor = KundliColors.Surface) {
                                    (1980..2045 step 5).forEach { yr ->
                                        DropdownMenuItem(
                                            text = { Text("$yr", color = if (yr == targetYear) KundliColors.Gold else KundliColors.TextMain) },
                                            onClick = {
                                                targetYear = yr
                                                showYearMenu = false
                                            },
                                        )
                                    }
                                }
                            }
                        }
                        LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            items(nearbyYears) { yr ->
                                FilterChip(selected = targetYear == yr, onClick = { targetYear = yr }, label = { Text("$yr") })
                            }
                        }
                        val vp = varshaphal
                        if (vp != null) {
                            Surface(color = KundliColors.Surface, shape = RoundedCornerShape(14.dp), modifier = Modifier.fillMaxWidth()) {
                                Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                    Text("Varsha Lagna: ${vp.varshaLagna} · Muntha: ${vp.munthaSign} (H${vp.munthaHouse})", style = MaterialTheme.typography.titleMedium, color = KundliColors.TextMain)
                                    Text("Year Lord (Varsheshwara): ${vp.varsheshwara}", style = MaterialTheme.typography.bodySmall, color = KundliColors.Teal)
                                }
                            }
                            OutlinedTextField(
                                value = sahamQuery,
                                onValueChange = { sahamQuery = it },
                                label = { Text("Filter 36 Sahams") },
                                singleLine = true,
                                modifier = Modifier.fillMaxWidth(),
                            )
                            vp.sahams.filter {
                                sahamQuery.isBlank() || it.name.contains(sahamQuery, ignoreCase = true) || it.meaning.contains(sahamQuery, ignoreCase = true)
                            }.forEach { s ->
                                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                    Text(s.name, style = MaterialTheme.typography.bodySmall, color = KundliColors.Gold)
                                    Text("${s.sign} · ${s.degree}", style = TelemetryNumberStyle, color = KundliColors.TextMain)
                                }
                                HorizontalDivider(color = KundliColors.SubtleDivider)
                            }
                        } else {
                            Text("Syncing annual Varshaphal chart for $targetYear…", style = MaterialTheme.typography.bodySmall, color = KundliColors.TextMuted)
                        }
                    }

                    else -> {
                        Text("Avakahada Chakra", style = MaterialTheme.typography.titleMedium, color = KundliColors.Gold)
                        data.avakahadaCells.forEach { (k, v) ->
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Text(k, style = MaterialTheme.typography.bodySmall, color = KundliColors.TextMuted)
                                Text(v, style = TelemetryNumberStyle, color = KundliColors.TextMain)
                            }
                            HorizontalDivider(color = KundliColors.SubtleDivider)
                        }
                        if (data.birthPanchangCells.isNotEmpty()) {
                            Spacer(Modifier.height(6.dp))
                            Text("Birth Panchang", style = MaterialTheme.typography.titleMedium, color = KundliColors.Gold)
                            data.birthPanchangCells.forEach { (k, v) ->
                                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                    Text(k, style = MaterialTheme.typography.bodySmall, color = KundliColors.TextMuted)
                                    Text(v, style = TelemetryNumberStyle, color = KundliColors.Teal)
                                }
                                HorizontalDivider(color = KundliColors.SubtleDivider)
                            }
                        }
                    }
                }
                Spacer(Modifier.height(12.dp))
            }
        }
    }
}
