package com.kundliflow.app.ui.pages

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.IntrinsicSize
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowBack
import androidx.compose.material.icons.rounded.AutoAwesome
import androidx.compose.material.icons.rounded.FileUpload
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
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
import androidx.compose.ui.text.style.TextOverflow
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
    val tabs = listOf("Bhava Chalit", "KP System", "Varshaphal", "Avakahada", "Bhava Dossier", "Quant")
    val pagerState = rememberPagerState(pageCount = { tabs.size })
    val scope = rememberCoroutineScope()

    var targetYear by remember { mutableIntStateOf(data.initialVarshaphal?.targetYear ?: LocalDate.now().year) }
    var varshaphal by remember(data.initialVarshaphal) { mutableStateOf(data.initialVarshaphal) }
    var sahamQuery by remember { mutableStateOf("") }
    var showYearMenu by remember { mutableStateOf(false) }

    LaunchedEffect(pagerState.currentPage, targetYear) {
        if (pagerState.currentPage == 2) {
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
        // Top App Bar (Stitch tools_studio.png)
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp)
                .padding(horizontal = 12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = onBack) {
                    Icon(Icons.AutoMirrored.Rounded.ArrowBack, contentDescription = "Back", tint = KundliColors.Gold)
                }
                Text("TOOLS & SYSTEMS", style = MaterialTheme.typography.titleLarge, color = KundliColors.TextMain)
            }
            Surface(
                color = KundliColors.Surface,
                border = BorderStroke(1.dp, KundliColors.GoldHairline),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.clickable(onClick = onExportDossier),
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp),
                ) {
                    Icon(Icons.Rounded.FileUpload, contentDescription = "Export Dossier", tint = KundliColors.Gold, modifier = Modifier.size(16.dp))
                    Text(".md", style = MaterialTheme.typography.labelSmall, color = KundliColors.Gold)
                }
            }
        }

        // Editorial Workbench Hero Header (Stitch)
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp, vertical = 6.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp),
        ) {
            Text("● SPECIALIST WORKBENCH · RUNG 3", style = MaterialTheme.typography.labelSmall, color = KundliColors.Teal)
            Text("CLASSICAL SYSTEMS & PRECISION TABLES", style = MaterialTheme.typography.headlineSmall, color = KundliColors.TextMain)
        }

        // Horizontal Pill Track Navigation (Stitch)
        LazyRow(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 8.dp),
            contentPadding = androidx.compose.foundation.layout.PaddingValues(horizontal = 20.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            itemsIndexed(tabs) { idx, label ->
                val active = pagerState.currentPage == idx
                Surface(
                    color = if (active) KundliColors.SurfaceAlt else KundliColors.Surface,
                    border = BorderStroke(1.dp, if (active) KundliColors.Gold else KundliColors.SubtleDivider),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.clickable { scope.launch { pagerState.animateScrollToPage(idx) } },
                ) {
                    Text(
                        text = if (active) "✦ $label" else label,
                        style = MaterialTheme.typography.labelMedium,
                        color = if (active) KundliColors.Gold else KundliColors.TextMuted,
                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp),
                    )
                }
            }
        }

        HorizontalPager(state = pagerState, modifier = Modifier.weight(1f).fillMaxWidth()) { page ->
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
                    .padding(horizontal = 20.dp, vertical = 10.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp),
            ) {
                when (page) {
                    // 0. Bhava Chalit Sripati Midpoints
                    0 -> {
                        Surface(
                            color = KundliColors.Surface,
                            border = BorderStroke(1.dp, KundliColors.GoldHairline),
                            shape = RoundedCornerShape(20.dp),
                            modifier = Modifier.fillMaxWidth(),
                        ) {
                            Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically,
                                ) {
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text("HOUSE BOUNDARIES & SANDHI", style = MaterialTheme.typography.labelSmall, color = KundliColors.TextMuted)
                                        Text("BHAVA CHALIT SRIPATI", style = MaterialTheme.typography.titleLarge, color = KundliColors.TextMain)
                                    }
                                    Surface(
                                        color = KundliColors.Teal.copy(alpha = 0.14f),
                                        shape = RoundedCornerShape(999.dp),
                                    ) {
                                        Text(
                                            text = "${data.chalitShifts.size} Shifted",
                                            style = MaterialTheme.typography.labelSmall,
                                            color = KundliColors.Teal,
                                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                                        )
                                    }
                                }
                                if (data.chalitShifts.isEmpty()) {
                                    Surface(
                                        color = KundliColors.SurfaceRecessed,
                                        shape = RoundedCornerShape(14.dp),
                                        modifier = Modifier.fillMaxWidth(),
                                    ) {
                                        Text(
                                            text = "All 9 planets remain anchored in their D1 Rashi houses under Sripati Bhava boundaries.",
                                            style = MaterialTheme.typography.bodySmall,
                                            color = KundliColors.Teal,
                                            modifier = Modifier.padding(14.dp),
                                        )
                                    }
                                } else {
                                    data.chalitShifts.forEach { shift ->
                                        Surface(
                                            color = KundliColors.SurfaceRecessed,
                                            border = BorderStroke(1.dp, KundliColors.Teal.copy(alpha = 0.35f)),
                                            shape = RoundedCornerShape(14.dp),
                                            modifier = Modifier.fillMaxWidth(),
                                        ) {
                                            Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                                Row(
                                                    modifier = Modifier.fillMaxWidth(),
                                                    horizontalArrangement = Arrangement.SpaceBetween,
                                                    verticalAlignment = Alignment.CenterVertically,
                                                ) {
                                                    Text(shift.planet, style = MaterialTheme.typography.titleSmall, color = KundliColors.Gold)
                                                    Surface(
                                                        color = KundliColors.Teal,
                                                        shape = RoundedCornerShape(999.dp),
                                                    ) {
                                                        Text(
                                                            text = "H${shift.rashiHouse} → H${shift.chalitHouse}",
                                                            style = TelemetryNumberStyle,
                                                            color = KundliColors.OrbInk,
                                                            modifier = Modifier.padding(horizontal = 9.dp, vertical = 2.dp),
                                                        )
                                                    }
                                                }
                                                Text(shift.meaning, style = MaterialTheme.typography.bodySmall, color = KundliColors.TextMuted)
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }

                    // 1. KP System Star-Lord & Sub-Lord Matrices
                    1 -> {
                        Surface(
                            color = KundliColors.Surface,
                            border = BorderStroke(1.dp, KundliColors.SubtleDivider),
                            shape = RoundedCornerShape(20.dp),
                            modifier = Modifier.fillMaxWidth(),
                        ) {
                            Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically,
                                ) {
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text("KRISHNAMURTI PADDHATI 249 SUB-DIVISIONS", style = MaterialTheme.typography.labelSmall, color = KundliColors.TextMuted)
                                        Text("STAR-LORD & SUB-LORD MATRICES", style = MaterialTheme.typography.titleLarge, color = KundliColors.TextMain)
                                    }
                                }
                                if (data.kpCusps.isEmpty()) {
                                    Text("KP cusps require exact birth time.", style = MaterialTheme.typography.bodySmall, color = KundliColors.TextMuted)
                                } else {
                                    data.kpCusps.forEach { cusp ->
                                        Surface(
                                            color = KundliColors.SurfaceRecessed,
                                            border = BorderStroke(1.dp, KundliColors.SubtleDivider),
                                            shape = RoundedCornerShape(14.dp),
                                            modifier = Modifier.fillMaxWidth(),
                                        ) {
                                            Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                                Row(
                                                    modifier = Modifier.fillMaxWidth(),
                                                    horizontalArrangement = Arrangement.SpaceBetween,
                                                    verticalAlignment = Alignment.CenterVertically,
                                                ) {
                                                    Text("House ${cusp.house} Cusp · ${cusp.sign}", style = MaterialTheme.typography.titleSmall, color = KundliColors.TextMain)
                                                    Surface(
                                                        color = KundliColors.SurfaceAlt,
                                                        shape = RoundedCornerShape(8.dp),
                                                    ) {
                                                        Text(
                                                            text = "H${cusp.house}",
                                                            style = MaterialTheme.typography.labelSmall,
                                                            color = KundliColors.Gold,
                                                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp),
                                                        )
                                                    }
                                                }
                                                Row(horizontalArrangement = Arrangement.spacedBy(14.dp)) {
                                                    Text("Star: ${cusp.starLord}", style = MaterialTheme.typography.labelMedium, color = KundliColors.Gold)
                                                    Text("Sub: ${cusp.subLord}", style = TelemetryNumberStyle, color = KundliColors.Teal)
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }

                    // 2. Tajika Varshaphal (Annual Codex)
                    2 -> {
                        val nearbyYears = ((targetYear - 2)..(targetYear + 2)).toList()
                        Surface(
                            color = KundliColors.Surface,
                            border = BorderStroke(1.dp, KundliColors.GoldHairline),
                            shape = RoundedCornerShape(20.dp),
                            modifier = Modifier.fillMaxWidth(),
                        ) {
                            Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically,
                                ) {
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text("SOLAR RETURN DEGREE MATCH", style = MaterialTheme.typography.labelSmall, color = KundliColors.TextMuted)
                                        Text("TAJIKA VARSHAPHAL ($targetYear)", style = MaterialTheme.typography.titleLarge, color = KundliColors.TextMain)
                                    }
                                    Box {
                                        TextButton(onClick = { showYearMenu = true }) {
                                            Text("Jump ▾", color = KundliColors.Teal)
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

                                LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    items(nearbyYears) { yr ->
                                        val sel = targetYear == yr
                                        Surface(
                                            color = if (sel) KundliColors.Gold.copy(alpha = 0.16f) else KundliColors.SurfaceRecessed,
                                            border = BorderStroke(1.dp, if (sel) KundliColors.Gold else KundliColors.SubtleDivider),
                                            shape = RoundedCornerShape(10.dp),
                                            modifier = Modifier.clickable { targetYear = yr },
                                        ) {
                                            Text(
                                                text = if (sel) "● $yr" else "$yr",
                                                style = TelemetryNumberStyle,
                                                color = if (sel) KundliColors.Gold else KundliColors.TextMuted,
                                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 7.dp),
                                            )
                                        }
                                    }
                                }

                                val vp = varshaphal
                                if (vp != null) {
                                    Surface(
                                        color = KundliColors.SurfaceRecessed,
                                        border = BorderStroke(1.dp, KundliColors.SubtleDivider),
                                        shape = RoundedCornerShape(14.dp),
                                        modifier = Modifier.fillMaxWidth(),
                                    ) {
                                        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                            Text("VARSHESHWARA (YEAR LORD)", style = MaterialTheme.typography.labelSmall, color = KundliColors.TextMuted)
                                            Text(vp.varsheshwara.uppercase(), style = MaterialTheme.typography.headlineSmall, color = KundliColors.Gold)
                                            Text("Varsha Lagna: ${vp.varshaLagna}", style = MaterialTheme.typography.bodySmall, color = KundliColors.Teal)
                                        }
                                    }
                                    Surface(
                                        color = KundliColors.SurfaceRecessed,
                                        border = BorderStroke(1.dp, KundliColors.SubtleDivider),
                                        shape = RoundedCornerShape(14.dp),
                                        modifier = Modifier.fillMaxWidth(),
                                    ) {
                                        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                            Text("MUNTHA FOCAL POSITION", style = MaterialTheme.typography.labelSmall, color = KundliColors.TextMuted)
                                            Text("HOUSE ${vp.munthaHouse} · ${vp.munthaSign.uppercase()}", style = MaterialTheme.typography.titleLarge, color = KundliColors.TextMain)
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
                        }
                    }

                    // 3. Avakahada Chakra & Birth Matrix (Stitch 2-Col Recessed Grid)
                    3 -> {
                        Surface(
                            color = KundliColors.Surface,
                            border = BorderStroke(1.dp, KundliColors.SubtleDivider),
                            shape = RoundedCornerShape(20.dp),
                            modifier = Modifier.fillMaxWidth(),
                        ) {
                            Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                                Text("VEDIC ATTUNEMENT & KULA ROOT", style = MaterialTheme.typography.labelSmall, color = KundliColors.TextMuted)
                                Text("AVAKAHADA CHAKRA & BIRTH MATRIX", style = MaterialTheme.typography.titleLarge, color = KundliColors.TextMain)
                                data.avakahadaCells.chunked(2).forEach { pair ->
                                    Row(
                                        modifier = Modifier.fillMaxWidth().height(IntrinsicSize.Min),
                                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                                    ) {
                                        pair.forEachIndexed { idx, (k, v) ->
                                            Surface(
                                                color = KundliColors.SurfaceRecessed,
                                                border = BorderStroke(1.dp, KundliColors.SubtleDivider),
                                                shape = RoundedCornerShape(14.dp),
                                                modifier = Modifier.weight(1f).fillMaxHeight(),
                                            ) {
                                                Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                                                    Text(k.uppercase(), style = MaterialTheme.typography.labelSmall, color = KundliColors.TextMuted, maxLines = 1)
                                                    Text(
                                                        text = v,
                                                        style = MaterialTheme.typography.titleSmall,
                                                        color = if (idx == 0) KundliColors.Gold else KundliColors.Teal,
                                                        maxLines = 2,
                                                        overflow = TextOverflow.Ellipsis,
                                                    )
                                                }
                                            }
                                        }
                                        if (pair.size == 1) Spacer(Modifier.weight(1f))
                                    }
                                }
                                if (data.birthPanchangCells.isNotEmpty()) {
                                    HorizontalDivider(color = KundliColors.SubtleDivider)
                                    Text("BIRTH PANCHANG", style = MaterialTheme.typography.labelSmall, color = KundliColors.Gold)
                                    data.birthPanchangCells.chunked(2).forEach { pair ->
                                        Row(
                                            modifier = Modifier.fillMaxWidth().height(IntrinsicSize.Min),
                                            horizontalArrangement = Arrangement.spacedBy(10.dp),
                                        ) {
                                            pair.forEach { (k, v) ->
                                                Surface(
                                                    color = KundliColors.SurfaceRecessed,
                                                    border = BorderStroke(1.dp, KundliColors.SubtleDivider),
                                                    shape = RoundedCornerShape(14.dp),
                                                    modifier = Modifier.weight(1f).fillMaxHeight(),
                                                ) {
                                                    Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                                                        Text(k.uppercase(), style = MaterialTheme.typography.labelSmall, color = KundliColors.TextMuted, maxLines = 1)
                                                        Text(v, style = MaterialTheme.typography.bodySmall, color = KundliColors.TextMain, maxLines = 2, overflow = TextOverflow.Ellipsis)
                                                    }
                                                }
                                            }
                                            if (pair.size == 1) Spacer(Modifier.weight(1f))
                                        }
                                    }
                                }
                            }
                        }
                    }

                    // 4. Bhava Dossier
                    4 -> {
                        var selectedH by remember { mutableIntStateOf(1) }
                        LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            items(houses, key = { it.number }) { h ->
                                val sel = selectedH == h.number
                                Surface(
                                    color = if (sel) KundliColors.Gold.copy(alpha = 0.16f) else KundliColors.Surface,
                                    border = BorderStroke(1.dp, if (sel) KundliColors.Gold else KundliColors.SubtleDivider),
                                    shape = RoundedCornerShape(999.dp),
                                    modifier = Modifier.clickable { selectedH = h.number },
                                ) {
                                    Text(
                                        text = "H${h.number} ${h.signName.take(3)}",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = if (sel) KundliColors.Gold else KundliColors.TextMuted,
                                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                                    )
                                }
                            }
                        }
                        val hd = houses.firstOrNull { it.number == selectedH }
                        if (hd != null) {
                            Surface(color = KundliColors.Surface, border = BorderStroke(1.dp, KundliColors.GoldHairline), shape = RoundedCornerShape(18.dp), modifier = Modifier.fillMaxWidth()) {
                                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                    Text("HOUSE ${hd.number} · ${hd.signName.uppercase()}", style = MaterialTheme.typography.headlineSmall, color = KundliColors.Gold)
                                    Text("Lord ${hd.lord.displayName} in H${hd.lordHouse} · SAV ${hd.savBindus} / 337", style = TelemetryNumberStyle, color = KundliColors.Teal)
                                    Text(hd.summaryLine, style = MaterialTheme.typography.bodyMedium, color = KundliColors.TextMain)
                                    if (hd.planets.isNotEmpty()) {
                                        Text("Occupants: ${hd.planets.joinToString(", ") { "${it.id.displayName} (${it.degreeFormatted})" }}", style = MaterialTheme.typography.bodySmall, color = KundliColors.TextMuted)
                                    }
                                }
                            }
                            hd.findings.forEach { f ->
                                Surface(color = KundliColors.SurfaceRecessed, border = BorderStroke(1.dp, KundliColors.SubtleDivider), shape = RoundedCornerShape(14.dp), modifier = Modifier.fillMaxWidth()) {
                                    Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                        Text(f.title, style = MaterialTheme.typography.labelMedium, color = KundliColors.Gold)
                                        Text(f.plainMeaning, style = MaterialTheme.typography.bodySmall, color = KundliColors.TextMain)
                                    }
                                }
                            }
                        }
                    }

                    // 5. Quant Telemetry Table
                    else -> {
                        Surface(
                            color = KundliColors.Surface,
                            border = BorderStroke(1.dp, KundliColors.SubtleDivider),
                            shape = RoundedCornerShape(20.dp),
                            modifier = Modifier.fillMaxWidth(),
                        ) {
                            Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                Text("PLANETARY DEGREES & VARGOTTAMA", style = MaterialTheme.typography.titleLarge, color = KundliColors.Gold)
                                data.quantPlanetRows.forEachIndexed { idx, (planet, pos, flags) ->
                                    if (idx > 0) HorizontalDivider(color = KundliColors.SubtleDivider)
                                    Row(
                                        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically,
                                    ) {
                                        Text(planet, style = MaterialTheme.typography.titleSmall, color = KundliColors.TextMain)
                                        Text(pos, style = TelemetryNumberStyle, color = KundliColors.Gold)
                                        Text(flags, style = MaterialTheme.typography.labelSmall, color = KundliColors.Teal)
                                    }
                                }
                            }
                        }
                    }
                }
                Spacer(Modifier.height(12.dp))
            }
        }

        // Bottom Solid Gold Export Dossier CTA (Stitch tools_studio.png)
        Button(
            onClick = onExportDossier,
            shape = RoundedCornerShape(14.dp),
            colors = ButtonDefaults.buttonColors(containerColor = KundliColors.Gold, contentColor = KundliColors.OrbInk),
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp, vertical = 10.dp)
                .height(48.dp),
        ) {
            Icon(Icons.Rounded.AutoAwesome, contentDescription = null, modifier = Modifier.size(16.dp))
            Spacer(Modifier.width(6.dp))
            Text("Export Complete LLM Dossier (.md)", style = MaterialTheme.typography.labelLarge, maxLines = 1)
        }
    }
}
