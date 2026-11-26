package com.kundliflow.app.ui.pages

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.IntrinsicSize
import androidx.compose.foundation.layout.PaddingValues
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
import androidx.compose.material.icons.rounded.Search
import androidx.compose.material.icons.rounded.VerifiedUser
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
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
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.kundliflow.app.ui.chart.ChartHouseData
import com.kundliflow.app.ui.chart.ToolsStudioData
import com.kundliflow.app.ui.chart.VarshaphalViewData
import com.kundliflow.app.ui.theme.KundliColors
import com.kundliflow.app.ui.theme.TelemetryNumberStyle
import kotlinx.coroutines.launch
import java.time.LocalDate

@OptIn(ExperimentalLayoutApi::class)
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
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Row(
                modifier = Modifier.weight(1f),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                IconButton(onClick = onBack) {
                    Icon(Icons.AutoMirrored.Rounded.ArrowBack, contentDescription = "Back", tint = KundliColors.Gold)
                }
                Text(
                    text = "TOOLS & SYSTEMS",
                    style = MaterialTheme.typography.titleLarge,
                    color = KundliColors.TextMain,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
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

        // Editorial Workbench Hero Header + Ephemeris Metadata Chips (Stitch tools_studio.png)
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp, vertical = 4.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp),
        ) {
            Text("● SPECIALIST WORKBENCH · RUNG 3", style = MaterialTheme.typography.labelSmall, color = KundliColors.Teal)
            Text("CLASSICAL SYSTEMS & PRECISION TABLES", style = MaterialTheme.typography.headlineSmall, color = KundliColors.TextMain)
            LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                items(
                    listOf(
                        "Lahiri Ayanamsa" to KundliColors.Gold,
                        "Sripati Bhava" to KundliColors.TextMuted,
                        "True Node" to KundliColors.Teal,
                    ),
                ) { (tag, accent) ->
                    Surface(
                        color = KundliColors.SurfaceRecessed,
                        border = BorderStroke(1.dp, KundliColors.SubtleDivider),
                        shape = RoundedCornerShape(999.dp),
                    ) {
                        Text(
                            text = "● $tag",
                            style = MaterialTheme.typography.labelSmall,
                            color = accent,
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                        )
                    }
                }
            }
        }

        // Horizontal Pill Track Navigation (Stitch)
        LazyRow(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 8.dp),
            contentPadding = PaddingValues(horizontal = 20.dp),
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
                    .padding(horizontal = 20.dp, vertical = 8.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp),
            ) {
                when (page) {
                    // 0. Bhava Chalit Sripati Midpoints (12-House Table + Realignment Callout)
                    0 -> {
                        val shiftsByChalitHouse = remember(data.chalitShifts) {
                            data.chalitShifts.groupBy { it.chalitHouse }
                        }
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
                                        color = if (data.chalitShifts.isEmpty()) KundliColors.Teal.copy(alpha = 0.14f) else KundliColors.Amber.copy(alpha = 0.16f),
                                        border = BorderStroke(1.dp, if (data.chalitShifts.isEmpty()) KundliColors.Teal.copy(alpha = 0.4f) else KundliColors.Amber.copy(alpha = 0.45f)),
                                        shape = RoundedCornerShape(999.dp),
                                    ) {
                                        Text(
                                            text = "${data.chalitShifts.size} Shifted",
                                            style = MaterialTheme.typography.labelSmall,
                                            color = if (data.chalitShifts.isEmpty()) KundliColors.Teal else KundliColors.Amber,
                                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                                        )
                                    }
                                }

                                // 12-House Sripati Table (Stitch tools_studio.png)
                                if (houses.isNotEmpty()) {
                                    Surface(
                                        color = KundliColors.SurfaceRecessed,
                                        border = BorderStroke(1.dp, KundliColors.SubtleDivider),
                                        shape = RoundedCornerShape(14.dp),
                                        modifier = Modifier.fillMaxWidth(),
                                    ) {
                                        Column(modifier = Modifier.padding(vertical = 8.dp)) {
                                            Row(
                                                modifier = Modifier
                                                    .fillMaxWidth()
                                                    .padding(horizontal = 12.dp, vertical = 6.dp),
                                                verticalAlignment = Alignment.CenterVertically,
                                            ) {
                                                Text("HOUSE", style = MaterialTheme.typography.labelSmall, color = KundliColors.TextMuted, modifier = Modifier.weight(0.22f))
                                                Text("SIGN", style = MaterialTheme.typography.labelSmall, color = KundliColors.TextMuted, modifier = Modifier.weight(0.32f))
                                                Text("CHALIT SHIFT", style = MaterialTheme.typography.labelSmall, color = KundliColors.TextMuted, textAlign = TextAlign.End, modifier = Modifier.weight(0.46f))
                                            }
                                            HorizontalDivider(color = KundliColors.SubtleDivider)
                                            houses.sortedBy { it.number }.forEachIndexed { idx, h ->
                                                val incoming = shiftsByChalitHouse[h.number].orEmpty()
                                                val isShiftedRow = incoming.isNotEmpty()
                                                if (idx > 0) HorizontalDivider(color = KundliColors.SubtleDivider.copy(alpha = 0.55f))
                                                Row(
                                                    modifier = Modifier
                                                        .fillMaxWidth()
                                                        .background(if (isShiftedRow) KundliColors.Teal.copy(alpha = 0.10f) else Color.Transparent)
                                                        .padding(horizontal = 12.dp, vertical = 9.dp),
                                                    verticalAlignment = Alignment.CenterVertically,
                                                ) {
                                                    Text(
                                                        text = if (h.number == 1) "H1 Asc" else "H${h.number}",
                                                        style = TelemetryNumberStyle,
                                                        color = if (h.number == 1 || isShiftedRow) KundliColors.Gold else KundliColors.TextMain,
                                                        modifier = Modifier.weight(0.22f),
                                                    )
                                                    Text(
                                                        text = h.signName,
                                                        style = MaterialTheme.typography.bodySmall,
                                                        color = KundliColors.TextMain,
                                                        maxLines = 1,
                                                        overflow = TextOverflow.Ellipsis,
                                                        modifier = Modifier.weight(0.32f),
                                                    )
                                                    Box(
                                                        modifier = Modifier.weight(0.46f),
                                                        contentAlignment = Alignment.CenterEnd,
                                                    ) {
                                                        when {
                                                            isShiftedRow -> Surface(
                                                                color = KundliColors.Teal,
                                                                shape = RoundedCornerShape(8.dp),
                                                            ) {
                                                                Text(
                                                                    text = incoming.joinToString(", ") { "${it.planet.take(3)} (H${it.rashiHouse}→H${it.chalitHouse})" },
                                                                    style = MaterialTheme.typography.labelSmall,
                                                                    color = KundliColors.OrbInk,
                                                                    maxLines = 1,
                                                                    overflow = TextOverflow.Ellipsis,
                                                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp),
                                                                )
                                                            }
                                                            h.number == 1 -> Text("Native Anchor", style = MaterialTheme.typography.labelSmall, color = KundliColors.Teal)
                                                            h.planets.isNotEmpty() -> Text(
                                                                text = h.planets.joinToString(", ") { it.id.displayName.take(3) },
                                                                style = MaterialTheme.typography.labelSmall,
                                                                color = KundliColors.Gold,
                                                                maxLines = 1,
                                                                overflow = TextOverflow.Ellipsis,
                                                            )
                                                            else -> Text("Unchanged", style = MaterialTheme.typography.labelSmall, color = KundliColors.TextMuted.copy(alpha = 0.65f))
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }

                                // Shifted Planet Details / Alignment Note
                                if (data.chalitShifts.isEmpty()) {
                                    Surface(
                                        color = KundliColors.SurfaceRecessed,
                                        border = BorderStroke(1.dp, KundliColors.Teal.copy(alpha = 0.35f)),
                                        shape = RoundedCornerShape(14.dp),
                                        modifier = Modifier.fillMaxWidth(),
                                    ) {
                                        Text(
                                            text = "✦ All 9 planets remain anchored in their D1 Rashi houses under Sripati Bhava boundaries.",
                                            style = MaterialTheme.typography.bodySmall,
                                            color = KundliColors.Teal,
                                            modifier = Modifier.padding(14.dp),
                                        )
                                    }
                                } else {
                                    data.chalitShifts.forEach { shift ->
                                        Surface(
                                            color = KundliColors.SurfaceRecessed,
                                            border = BorderStroke(1.dp, KundliColors.GoldHairline),
                                            shape = RoundedCornerShape(14.dp),
                                            modifier = Modifier.fillMaxWidth(),
                                        ) {
                                            Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(5.dp)) {
                                                Row(
                                                    modifier = Modifier.fillMaxWidth(),
                                                    horizontalArrangement = Arrangement.SpaceBetween,
                                                    verticalAlignment = Alignment.CenterVertically,
                                                ) {
                                                    Text("✦ ${shift.planet} Realignment", style = MaterialTheme.typography.titleSmall, color = KundliColors.Gold)
                                                    Surface(color = KundliColors.Teal, shape = RoundedCornerShape(999.dp)) {
                                                        Text(
                                                            text = "H${shift.rashiHouse} → H${shift.chalitHouse}",
                                                            style = TelemetryNumberStyle,
                                                            color = KundliColors.OrbInk,
                                                            modifier = Modifier.padding(horizontal = 9.dp, vertical = 2.dp),
                                                        )
                                                    }
                                                }
                                                Text(shift.meaning, style = MaterialTheme.typography.bodySmall, color = KundliColors.TextMain.copy(alpha = 0.86f))
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
                                    Surface(
                                        color = KundliColors.Teal.copy(alpha = 0.14f),
                                        border = BorderStroke(1.dp, KundliColors.Teal.copy(alpha = 0.35f)),
                                        shape = RoundedCornerShape(999.dp),
                                    ) {
                                        Text(
                                            text = "KP Ayanamsa",
                                            style = MaterialTheme.typography.labelSmall,
                                            color = KundliColors.Teal,
                                            modifier = Modifier.padding(horizontal = 9.dp, vertical = 4.dp),
                                        )
                                    }
                                }
                                if (data.kpCusps.isEmpty()) {
                                    Surface(
                                        color = KundliColors.SurfaceRecessed,
                                        shape = RoundedCornerShape(14.dp),
                                        modifier = Modifier.fillMaxWidth(),
                                    ) {
                                        Text(
                                            text = "KP cusps require an exact birth time to resolve sub-lord boundaries.",
                                            style = MaterialTheme.typography.bodySmall,
                                            color = KundliColors.TextMuted,
                                            modifier = Modifier.padding(14.dp),
                                        )
                                    }
                                } else {
                                    data.kpCusps.forEach { cusp ->
                                        Surface(
                                            color = KundliColors.SurfaceRecessed,
                                            border = BorderStroke(1.dp, KundliColors.SubtleDivider),
                                            shape = RoundedCornerShape(14.dp),
                                            modifier = Modifier.fillMaxWidth(),
                                        ) {
                                            Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                                Row(
                                                    modifier = Modifier.fillMaxWidth(),
                                                    horizontalArrangement = Arrangement.SpaceBetween,
                                                    verticalAlignment = Alignment.CenterVertically,
                                                ) {
                                                    Text(
                                                        text = "House ${cusp.house} Cusp · ${cusp.sign}",
                                                        style = MaterialTheme.typography.titleSmall,
                                                        color = KundliColors.TextMain,
                                                        modifier = Modifier.weight(1f),
                                                    )
                                                    Surface(
                                                        color = KundliColors.SurfaceAlt,
                                                        border = BorderStroke(1.dp, KundliColors.GoldHairline),
                                                        shape = RoundedCornerShape(8.dp),
                                                    ) {
                                                        Text(
                                                            text = "H${cusp.house}",
                                                            style = TelemetryNumberStyle,
                                                            color = KundliColors.Gold,
                                                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp),
                                                        )
                                                    }
                                                }
                                                Row(
                                                    modifier = Modifier.fillMaxWidth(),
                                                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                                                ) {
                                                    Surface(
                                                        color = KundliColors.Gold.copy(alpha = 0.12f),
                                                        shape = RoundedCornerShape(8.dp),
                                                        modifier = Modifier.weight(1f),
                                                    ) {
                                                        Text(
                                                            text = "Star: ${cusp.starLord}",
                                                            style = MaterialTheme.typography.labelMedium,
                                                            color = KundliColors.Gold,
                                                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                                                        )
                                                    }
                                                    Surface(
                                                        color = KundliColors.Teal.copy(alpha = 0.12f),
                                                        shape = RoundedCornerShape(8.dp),
                                                        modifier = Modifier.weight(1f),
                                                    ) {
                                                        Text(
                                                            text = "Sub: ${cusp.subLord}",
                                                            style = TelemetryNumberStyle,
                                                            color = KundliColors.Teal,
                                                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                                                        )
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }

                    // 2. Tajika Varshaphal (Annual Solar Return)
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
                                    Row(
                                        modifier = Modifier.fillMaxWidth().height(IntrinsicSize.Min),
                                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                                    ) {
                                        Surface(
                                            color = KundliColors.SurfaceRecessed,
                                            border = BorderStroke(1.dp, KundliColors.GoldHairline),
                                            shape = RoundedCornerShape(14.dp),
                                            modifier = Modifier.weight(1f).fillMaxHeight(),
                                        ) {
                                            Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                                Text("VARSHESHWARA", style = MaterialTheme.typography.labelSmall, color = KundliColors.TextMuted)
                                                Text(vp.varsheshwara.uppercase(), style = MaterialTheme.typography.titleLarge, color = KundliColors.Gold)
                                                Text("Lagna: ${vp.varshaLagna}", style = MaterialTheme.typography.labelSmall, color = KundliColors.Teal)
                                            }
                                        }
                                        Surface(
                                            color = KundliColors.SurfaceRecessed,
                                            border = BorderStroke(1.dp, KundliColors.SubtleDivider),
                                            shape = RoundedCornerShape(14.dp),
                                            modifier = Modifier.weight(1f).fillMaxHeight(),
                                        ) {
                                            Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                                Text("MUNTHA FOCUS", style = MaterialTheme.typography.labelSmall, color = KundliColors.TextMuted)
                                                Text("HOUSE ${vp.munthaHouse}", style = MaterialTheme.typography.titleLarge, color = KundliColors.TextMain)
                                                Text(vp.munthaSign, style = MaterialTheme.typography.labelSmall, color = KundliColors.Teal)
                                            }
                                        }
                                    }

                                    OutlinedTextField(
                                        value = sahamQuery,
                                        onValueChange = { sahamQuery = it },
                                        placeholder = { Text("Filter 36 Sahams…", color = KundliColors.TextMuted) },
                                        leadingIcon = { Icon(Icons.Rounded.Search, contentDescription = null, tint = KundliColors.Gold, modifier = Modifier.size(18.dp)) },
                                        singleLine = true,
                                        shape = RoundedCornerShape(14.dp),
                                        colors = OutlinedTextFieldDefaults.colors(
                                            focusedContainerColor = KundliColors.SurfaceRecessed,
                                            unfocusedContainerColor = KundliColors.SurfaceRecessed,
                                            focusedBorderColor = KundliColors.Gold,
                                            unfocusedBorderColor = KundliColors.SubtleDivider,
                                            focusedTextColor = KundliColors.TextMain,
                                            unfocusedTextColor = KundliColors.TextMain,
                                        ),
                                        modifier = Modifier.fillMaxWidth(),
                                    )

                                    val filteredSahams = vp.sahams.filter {
                                        sahamQuery.isBlank() || it.name.contains(sahamQuery, ignoreCase = true) || it.meaning.contains(sahamQuery, ignoreCase = true)
                                    }
                                    filteredSahams.forEach { s ->
                                        Surface(
                                            color = KundliColors.SurfaceRecessed,
                                            border = BorderStroke(1.dp, KundliColors.SubtleDivider),
                                            shape = RoundedCornerShape(12.dp),
                                            modifier = Modifier.fillMaxWidth(),
                                        ) {
                                            Row(
                                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 10.dp),
                                                horizontalArrangement = Arrangement.SpaceBetween,
                                                verticalAlignment = Alignment.CenterVertically,
                                            ) {
                                                Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                                                    Text(s.name, style = MaterialTheme.typography.titleSmall, color = KundliColors.Gold)
                                                    if (s.meaning.isNotBlank()) {
                                                        Text(s.meaning, style = MaterialTheme.typography.labelSmall, color = KundliColors.TextMuted, maxLines = 1, overflow = TextOverflow.Ellipsis)
                                                    }
                                                }
                                                Text("${s.sign} · ${s.degree}", style = TelemetryNumberStyle, color = KundliColors.Teal)
                                            }
                                        }
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
                        LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            items(houses, key = { it.number }) { h ->
                                val sel = selectedH == h.number
                                Surface(
                                    color = if (sel) KundliColors.Gold.copy(alpha = 0.16f) else KundliColors.Surface,
                                    border = BorderStroke(1.dp, if (sel) KundliColors.Gold else KundliColors.SubtleDivider),
                                    shape = RoundedCornerShape(999.dp),
                                    modifier = Modifier.clickable { selectedH = h.number },
                                ) {
                                    Text(
                                        text = if (sel) "● H${h.number} ${h.signName.take(3)}" else "H${h.number} ${h.signName.take(3)}",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = if (sel) KundliColors.Gold else KundliColors.TextMuted,
                                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 7.dp),
                                    )
                                }
                            }
                        }
                        val hd = houses.firstOrNull { it.number == selectedH }
                        if (hd != null) {
                            Surface(
                                color = KundliColors.Surface,
                                border = BorderStroke(1.dp, KundliColors.GoldHairline),
                                shape = RoundedCornerShape(20.dp),
                                modifier = Modifier.fillMaxWidth(),
                            ) {
                                Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                                    Text("HOUSE ${hd.number} · ${hd.signName.uppercase()}", style = MaterialTheme.typography.headlineSmall, color = KundliColors.Gold)
                                    Row(
                                        modifier = Modifier.fillMaxWidth().height(IntrinsicSize.Min),
                                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                                    ) {
                                        Surface(
                                            color = KundliColors.SurfaceRecessed,
                                            border = BorderStroke(1.dp, KundliColors.SubtleDivider),
                                            shape = RoundedCornerShape(12.dp),
                                            modifier = Modifier.weight(1f).fillMaxHeight(),
                                        ) {
                                            Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                                                Text("HOUSE LORD", style = MaterialTheme.typography.labelSmall, color = KundliColors.TextMuted)
                                                Text("${hd.lord.displayName} in H${hd.lordHouse}", style = MaterialTheme.typography.titleSmall, color = KundliColors.Teal)
                                            }
                                        }
                                        Surface(
                                            color = KundliColors.SurfaceRecessed,
                                            border = BorderStroke(1.dp, KundliColors.SubtleDivider),
                                            shape = RoundedCornerShape(12.dp),
                                            modifier = Modifier.weight(1f).fillMaxHeight(),
                                        ) {
                                            Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                                                Text("SAV RESERVE", style = MaterialTheme.typography.labelSmall, color = KundliColors.TextMuted)
                                                Text("${hd.savBindus} / 337 Bindus", style = TelemetryNumberStyle, color = KundliColors.Gold)
                                            }
                                        }
                                    }
                                    Text(hd.summaryLine, style = MaterialTheme.typography.bodyMedium, color = KundliColors.TextMain)
                                    if (hd.planets.isNotEmpty()) {
                                        FlowRow(
                                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                                            verticalArrangement = Arrangement.spacedBy(6.dp),
                                        ) {
                                            hd.planets.forEach { pl ->
                                                Surface(
                                                    color = KundliColors.SurfaceRecessed,
                                                    border = BorderStroke(1.dp, KundliColors.GoldHairline),
                                                    shape = RoundedCornerShape(999.dp),
                                                ) {
                                                    Text(
                                                        text = "${pl.id.displayName} · ${pl.degreeFormatted}",
                                                        style = MaterialTheme.typography.labelSmall,
                                                        color = KundliColors.Gold,
                                                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp),
                                                    )
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            hd.findings.forEach { f ->
                                Surface(
                                    color = KundliColors.Surface,
                                    border = BorderStroke(1.dp, KundliColors.SubtleDivider),
                                    shape = RoundedCornerShape(16.dp),
                                    modifier = Modifier.fillMaxWidth(),
                                ) {
                                    Row(modifier = Modifier.fillMaxWidth().height(IntrinsicSize.Min)) {
                                        Box(
                                            modifier = Modifier
                                                .width(3.dp)
                                                .fillMaxHeight()
                                                .background(KundliColors.Gold),
                                        )
                                        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                            Text(f.title, style = MaterialTheme.typography.labelMedium, color = KundliColors.Gold)
                                            Text(f.plainMeaning, style = MaterialTheme.typography.bodySmall, color = KundliColors.TextMain.copy(alpha = 0.88f))
                                        }
                                    }
                                }
                            }
                        }
                    }

                    // 5. Quant Telemetry Table (Aligned Columns + Status Badges)
                    else -> {
                        Surface(
                            color = KundliColors.Surface,
                            border = BorderStroke(1.dp, KundliColors.SubtleDivider),
                            shape = RoundedCornerShape(20.dp),
                            modifier = Modifier.fillMaxWidth(),
                        ) {
                            Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                                Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                                    Text("SIDEREAL LONGITUDE & DIGNITY", style = MaterialTheme.typography.labelSmall, color = KundliColors.TextMuted)
                                    Text("PLANETARY DEGREES & VARGOTTAMA", style = MaterialTheme.typography.titleLarge, color = KundliColors.TextMain)
                                }
                                Surface(
                                    color = KundliColors.SurfaceRecessed,
                                    border = BorderStroke(1.dp, KundliColors.SubtleDivider),
                                    shape = RoundedCornerShape(14.dp),
                                    modifier = Modifier.fillMaxWidth(),
                                ) {
                                    Column(modifier = Modifier.padding(vertical = 8.dp)) {
                                        Row(
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .padding(horizontal = 12.dp, vertical = 6.dp),
                                            verticalAlignment = Alignment.CenterVertically,
                                        ) {
                                            Text("GRAHA", style = MaterialTheme.typography.labelSmall, color = KundliColors.TextMuted, modifier = Modifier.weight(0.26f))
                                            Text("POSITION", style = MaterialTheme.typography.labelSmall, color = KundliColors.TextMuted, modifier = Modifier.weight(0.42f))
                                            Text("STATUS", style = MaterialTheme.typography.labelSmall, color = KundliColors.TextMuted, textAlign = TextAlign.End, modifier = Modifier.weight(0.32f))
                                        }
                                        HorizontalDivider(color = KundliColors.SubtleDivider)
                                        data.quantPlanetRows.forEachIndexed { idx, (planet, pos, flags) ->
                                            if (idx > 0) HorizontalDivider(color = KundliColors.SubtleDivider.copy(alpha = 0.55f))
                                            val highlight = flags.contains("Varg", true) || flags.contains("Exalt", true) || flags.contains("Own", true)
                                            Row(
                                                modifier = Modifier
                                                    .fillMaxWidth()
                                                    .padding(horizontal = 12.dp, vertical = 10.dp),
                                                verticalAlignment = Alignment.CenterVertically,
                                            ) {
                                                Text(
                                                    text = planet,
                                                    style = MaterialTheme.typography.titleSmall,
                                                    color = KundliColors.TextMain,
                                                    maxLines = 1,
                                                    overflow = TextOverflow.Ellipsis,
                                                    modifier = Modifier.weight(0.26f),
                                                )
                                                Text(
                                                    text = pos,
                                                    style = TelemetryNumberStyle,
                                                    color = KundliColors.Gold,
                                                    maxLines = 1,
                                                    overflow = TextOverflow.Ellipsis,
                                                    modifier = Modifier.weight(0.42f),
                                                )
                                                Box(
                                                    modifier = Modifier.weight(0.32f),
                                                    contentAlignment = Alignment.CenterEnd,
                                                ) {
                                                    if (flags.isNotBlank() && flags != "—") {
                                                        Surface(
                                                            color = if (highlight) KundliColors.Teal.copy(alpha = 0.16f) else KundliColors.SurfaceAlt,
                                                            border = BorderStroke(1.dp, if (highlight) KundliColors.Teal.copy(alpha = 0.4f) else KundliColors.SubtleDivider),
                                                            shape = RoundedCornerShape(8.dp),
                                                        ) {
                                                            Text(
                                                                text = flags,
                                                                style = MaterialTheme.typography.labelSmall,
                                                                color = if (highlight) KundliColors.Teal else KundliColors.TextMuted,
                                                                maxLines = 1,
                                                                overflow = TextOverflow.Ellipsis,
                                                                modifier = Modifier.padding(horizontal = 7.dp, vertical = 3.dp),
                                                            )
                                                        }
                                                    } else {
                                                        Text("Direct", style = MaterialTheme.typography.labelSmall, color = KundliColors.TextMuted.copy(alpha = 0.7f))
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                // Verification Footnote (Stitch tools_studio.png)
                Row(
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 4.dp, vertical = 4.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Icon(Icons.Rounded.VerifiedUser, contentDescription = null, tint = KundliColors.TextMuted, modifier = Modifier.size(15.dp))
                    Text(
                        text = "Validated against Swiss Ephemeris & classical BPHS calculations · Offline & encrypted on-device.",
                        style = MaterialTheme.typography.labelSmall,
                        color = KundliColors.TextMuted,
                    )
                }
                Spacer(Modifier.height(10.dp))
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
