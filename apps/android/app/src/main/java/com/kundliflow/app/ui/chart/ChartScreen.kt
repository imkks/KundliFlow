package com.kundliflow.app.ui.chart

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.KeyboardArrowLeft
import androidx.compose.material.icons.automirrored.rounded.KeyboardArrowRight
import androidx.compose.material.icons.rounded.AutoAwesome
import androidx.compose.material.icons.rounded.CalendarMonth
import androidx.compose.material.icons.rounded.EditNote
import androidx.compose.material.icons.rounded.GridView
import androidx.compose.material.icons.rounded.Insights
import androidx.compose.material.icons.rounded.Star
import androidx.compose.material.icons.rounded.Tune
import androidx.compose.material.icons.rounded.Verified
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
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
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.kundliflow.app.ui.subject.Rung
import com.kundliflow.app.ui.subject.Subject
import com.kundliflow.app.ui.subject.VargaType
import com.kundliflow.app.ui.theme.KundliColors
import com.kundliflow.app.ui.theme.TelemetryNumberStyle
import kotlinx.coroutines.launch
import java.util.Locale

enum class ChartViewMode(val label: String) { CHART("Chart"), TABLE("Table") }

private val TOP_VARGAS = listOf(VargaType.D1, VargaType.D9, VargaType.D10, VargaType.D2, VargaType.D4)

private fun houseCategoryTag(houseNumber: Int): String = when (houseNumber) {
    1, 4, 7, 10 -> "KENDRA"
    5, 9 -> "TRIKONA"
    3, 6, 11 -> "UPACHAYA"
    else -> "MOKSHA / MARAKA"
}

private fun signElementMeta(signName: String): String = when (signName.lowercase()) {
    "aries" -> "Fire · Movable · Mars"
    "taurus" -> "Earth · Fixed · Venus"
    "gemini" -> "Air · Dual · Mercury"
    "cancer" -> "Water · Movable · Moon"
    "leo" -> "Fire · Fixed · Sun"
    "virgo" -> "Earth · Dual · Mercury"
    "libra" -> "Air · Movable · Venus"
    "scorpio" -> "Water · Fixed · Mars"
    "sagittarius" -> "Fire · Dual · Jupiter"
    "capricorn" -> "Earth · Movable · Saturn"
    "aquarius" -> "Air · Fixed · Saturn"
    "pisces" -> "Water · Dual · Jupiter"
    else -> "Sidereal Rashi"
}

@Composable
fun ChartScreen(
    chart: ChartUiState,
    initialStyle: ChartStyle = ChartStyle.NORTH,
    initialTopic: String? = null,
    onInitialTopicConsumed: () -> Unit = {},
    resolveChartVariant: (VargaType, ChartReference) -> ChartUiState? = { _, _ -> null },
    onOpenSubject: (Subject, Rung) -> Unit,
    onOpenStrengthsPage: () -> Unit = {},
    onOpenToolsPage: () -> Unit = {},
    onAskAboutHouse: (Int) -> Unit = {},
    onReflectInJournal: () -> Unit = {},
    onJumpToTimeTab: () -> Unit,
) {
    var style by remember(initialStyle) { mutableStateOf(initialStyle) }
    var reference by remember { mutableStateOf(ChartReference.LAGNA) }
    var selectedVarga by remember { mutableStateOf(VargaType.D1) }
    var selectedTopic by remember { mutableStateOf<String?>(null) }
    var selectedHouse by remember { mutableStateOf<Int?>(1) }
    var viewMode by remember { mutableStateOf(ChartViewMode.CHART) }
    var showAspectsOverlay by remember { mutableStateOf(false) }

    var showMoreVargasMenu by remember { mutableStateOf(false) }
    var showOptionsSheet by remember { mutableStateOf(false) }
    var decoderHouseNumber by remember { mutableStateOf<Int?>(null) }
    var teachMeStep by remember { mutableIntStateOf(0) }

    LaunchedEffect(initialTopic) {
        if (initialTopic != null) {
            selectedTopic = initialTopic
            viewMode = ChartViewMode.CHART
            selectedHouse = when (initialTopic) {
                "Career" -> 10
                "Love" -> 7
                "Money" -> 2
                "Home" -> 4
                else -> 1
            }
            onInitialTopicConsumed()
        }
    }

    val displayedChart = remember(chart, selectedVarga, reference) {
        if (selectedVarga == VargaType.D1 && reference == ChartReference.LAGNA) {
            chart
        } else {
            resolveChartVariant(selectedVarga, reference) ?: chart
        }
    }

    val highlightedHouses = remember(selectedTopic) {
        when (selectedTopic) {
            "Career" -> setOf(10, 6, 2, 11)
            "Love" -> setOf(7, 2, 11, 4)
            "Money" -> setOf(2, 11, 5, 9)
            "Home" -> setOf(4, 2, 12)
            else -> emptySet()
        }
    }

    val currentHouseData = displayedChart.houses.firstOrNull { it.number == (selectedHouse ?: 1) }
    val allPlanets = remember(displayedChart) { displayedChart.allPlanets() }
    val topShadbala = remember(displayedChart) { displayedChart.shadbalaBars.sortedByDescending { it.ratio }.take(3) }
    val peakSavHouse = remember(displayedChart) { displayedChart.houses.maxByOrNull { it.savBindus }?.number }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 20.dp)
            .padding(top = 6.dp, bottom = 116.dp),
        verticalArrangement = Arrangement.spacedBy(20.dp),
    ) {
        // 1. Dynamic Chart Headline Pill Bar + Options Button (Stitch chart_expansive.png)
        Surface(
            color = KundliColors.Surface,
            border = BorderStroke(1.dp, KundliColors.SubtleDivider),
            shape = RoundedCornerShape(14.dp),
            modifier = Modifier.fillMaxWidth(),
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 12.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Row(
                    modifier = Modifier.weight(1f),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    Box(
                        modifier = Modifier
                            .size(7.dp)
                            .clip(CircleShape)
                            .background(KundliColors.Gold),
                    )
                    Text(
                        text = if (reference == ChartReference.MOON) {
                            "Chandra Kundli · Moon in ${displayedChart.moonSign}"
                        } else {
                            "${displayedChart.ascendantSign} rising · Moon in ${displayedChart.moonSign}"
                        },
                        style = MaterialTheme.typography.bodySmall,
                        color = KundliColors.TextMain,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                    )
                }
                Surface(
                    color = KundliColors.SurfaceRecessed,
                    border = BorderStroke(1.dp, KundliColors.GoldHairline),
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier.clickable { showOptionsSheet = true },
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp),
                    ) {
                        Icon(Icons.Rounded.Tune, contentDescription = "Chart options", tint = KundliColors.Gold, modifier = Modifier.size(14.dp))
                        Text("Options", style = MaterialTheme.typography.labelSmall, color = KundliColors.Gold)
                    }
                }
            }
        }

        if (teachMeStep in 1..3) {
            TeachMeBanner(
                step = teachMeStep,
                onNext = { teachMeStep = if (teachMeStep >= 3) 0 else teachMeStep + 1 },
                onDismiss = { teachMeStep = 0 },
            )
        }

        // 2. Framed 1:1 Astrolabe Codex Kundli Canvas (or Structured Table)
        if (viewMode == ChartViewMode.CHART) {
            Surface(
                color = KundliColors.SurfaceRecessed,
                border = BorderStroke(1.dp, KundliColors.GoldHairline),
                shape = RoundedCornerShape(22.dp),
                modifier = Modifier.fillMaxWidth(),
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(14.dp),
                    contentAlignment = Alignment.Center,
                ) {
                    KundliChartCanvas(
                        chart = displayedChart,
                        style = style,
                        selectedHouse = selectedHouse,
                        highlightedHouses = highlightedHouses,
                        showAspectsForSelectedHouse = showAspectsOverlay,
                        onSelectHouse = { selectedHouse = it },
                        modifier = Modifier.size(308.dp),
                    )
                }
            }
        } else {
            // Structured 9-Planet Table Mode
            Surface(
                color = KundliColors.Surface,
                border = BorderStroke(1.dp, KundliColors.GoldHairline),
                shape = RoundedCornerShape(20.dp),
                modifier = Modifier.fillMaxWidth(),
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text("PLANETARY PLACEMENTS (${allPlanets.size})", style = MaterialTheme.typography.labelMedium, color = KundliColors.Gold)
                    allPlanets.forEachIndexed { idx, pl ->
                        if (idx > 0) HorizontalDivider(color = KundliColors.SubtleDivider)
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { onOpenSubject(Subject.Planet(pl.id), Rung.Explain) }
                                .padding(vertical = 6.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = "${pl.id.displayName} (${pl.shortGlyph})" + if (pl.vargottama) " ★" else "",
                                    style = MaterialTheme.typography.titleSmall,
                                    color = KundliColors.TextMain,
                                )
                                Text(
                                    text = "${pl.signName} · House ${pl.house} · ${pl.dignity}",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = KundliColors.Teal,
                                )
                            }
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                Text(pl.degreeFormatted, style = TelemetryNumberStyle, color = KundliColors.Gold)
                                Text("→", style = MaterialTheme.typography.bodyMedium, color = KundliColors.TextMuted)
                            }
                        }
                    }
                }
            }
        }

        // 3. Dual Horizontal Rails (Underlined Vargas Tab Strip + Perspective / Focus / Chart-Table Pills)
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            LazyRow(
                horizontalArrangement = Arrangement.spacedBy(16.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                items(TOP_VARGAS, key = { it.name }) { varga ->
                    val isSel = selectedVarga == varga
                    Column(
                        modifier = Modifier.clickable { selectedVarga = varga },
                        horizontalAlignment = Alignment.CenterHorizontally,
                    ) {
                        Text(
                            text = if (isSel) "● ${varga.label} ${varga.domain.split(" ").first()}" else "${varga.label} ${varga.domain.split(" ").first()}",
                            style = MaterialTheme.typography.labelMedium,
                            color = if (isSel) KundliColors.Gold else KundliColors.TextMuted,
                            modifier = Modifier.padding(bottom = 6.dp),
                        )
                        Box(
                            modifier = Modifier
                                .width(64.dp)
                                .height(2.dp)
                                .background(if (isSel) KundliColors.Gold else Color.Transparent),
                        )
                    }
                }
                item {
                    val otherSelected = !TOP_VARGAS.contains(selectedVarga)
                    Box {
                        Text(
                            text = if (otherSelected) "${selectedVarga.label} ▾" else "More (D3–D60) ▾",
                            style = MaterialTheme.typography.labelMedium,
                            color = if (otherSelected) KundliColors.Gold else KundliColors.TextMuted,
                            modifier = Modifier
                                .clickable { showMoreVargasMenu = true }
                                .padding(bottom = 8.dp),
                        )
                        DropdownMenu(
                            expanded = showMoreVargasMenu,
                            onDismissRequest = { showMoreVargasMenu = false },
                            containerColor = KundliColors.Surface,
                        ) {
                            VargaType.entries.filter { !TOP_VARGAS.contains(it) }.forEach { v ->
                                DropdownMenuItem(
                                    text = {
                                        Text(
                                            text = "${v.label} · ${v.domain}",
                                            color = if (selectedVarga == v) KundliColors.Gold else KundliColors.TextMain,
                                        )
                                    },
                                    onClick = {
                                        selectedVarga = v
                                        showMoreVargasMenu = false
                                    },
                                )
                            }
                        }
                    }
                }
            }
            HorizontalDivider(color = KundliColors.SubtleDivider)

            LazyRow(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                item {
                    PillToggleChip(
                        label = if (reference == ChartReference.LAGNA) "● Lagna" else "Lagna",
                        selected = reference == ChartReference.LAGNA,
                        accent = KundliColors.Teal,
                        onClick = { reference = ChartReference.LAGNA },
                    )
                }
                item {
                    PillToggleChip(
                        label = "Moon",
                        selected = reference == ChartReference.MOON,
                        accent = KundliColors.Teal,
                        onClick = { reference = ChartReference.MOON },
                    )
                }
                item {
                    PillToggleChip(
                        label = if (viewMode == ChartViewMode.TABLE) "● Table" else "Table",
                        selected = viewMode == ChartViewMode.TABLE,
                        accent = KundliColors.Gold,
                        onClick = { viewMode = if (viewMode == ChartViewMode.CHART) ChartViewMode.TABLE else ChartViewMode.CHART },
                    )
                }
                items(listOf("All", "Career", "Love", "Money", "Home")) { topic ->
                    val isSel = (topic == "All" && selectedTopic == null) || selectedTopic == topic
                    PillToggleChip(
                        label = topic,
                        selected = isSel,
                        accent = KundliColors.Gold,
                        onClick = {
                            selectedTopic = if (topic == "All") null else topic
                            viewMode = ChartViewMode.CHART
                            selectedHouse = when (topic) {
                                "Career" -> 10
                                "Love" -> 7
                                "Money" -> 2
                                "Home" -> 4
                                else -> selectedHouse ?: 1
                            }
                        },
                    )
                }
            }
        }

        // 4. INSPECTOR · ACTIVE FOCUS (Stitch: 2x2 Telemetry Grid + Level 2 Synthesized Reading)
        if (currentHouseData != null) {
            val lordPlacement = remember(displayedChart, currentHouseData.lord) {
                allPlanets.firstOrNull { it.id == currentHouseData.lord }
            }
            val incomingAspects = remember(displayedChart, currentHouseData.number) {
                DrishtiCalculator.incomingAspectsToHouse(currentHouseData.number, displayedChart.houses)
            }

            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                        ) {
                            Text("INSPECTOR · ACTIVE FOCUS", style = MaterialTheme.typography.labelSmall, color = KundliColors.Gold)
                            Surface(
                                color = KundliColors.Teal.copy(alpha = 0.16f),
                                shape = RoundedCornerShape(6.dp),
                            ) {
                                Text(
                                    text = houseCategoryTag(currentHouseData.number),
                                    style = MaterialTheme.typography.labelSmall,
                                    color = KundliColors.Teal,
                                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                                )
                            }
                        }
                        Text(
                            text = "HOUSE ${currentHouseData.number} · ${currentHouseData.signName.uppercase()}",
                            style = MaterialTheme.typography.headlineSmall,
                            color = KundliColors.TextMain,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                        )
                    }
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        Surface(
                            color = KundliColors.Surface,
                            border = BorderStroke(1.dp, KundliColors.SubtleDivider),
                            shape = CircleShape,
                            modifier = Modifier.size(34.dp),
                        ) {
                            IconButton(
                                onClick = { selectedHouse = if (currentHouseData.number <= 1) 12 else currentHouseData.number - 1 },
                            ) {
                                Icon(Icons.AutoMirrored.Rounded.KeyboardArrowLeft, contentDescription = "Previous house", tint = KundliColors.TextMain, modifier = Modifier.size(18.dp))
                            }
                        }
                        Surface(
                            color = KundliColors.Surface,
                            border = BorderStroke(1.dp, KundliColors.SubtleDivider),
                            shape = CircleShape,
                            modifier = Modifier.size(34.dp),
                        ) {
                            IconButton(
                                onClick = { selectedHouse = if (currentHouseData.number >= 12) 1 else currentHouseData.number + 1 },
                            ) {
                                Icon(Icons.AutoMirrored.Rounded.KeyboardArrowRight, contentDescription = "Next house", tint = KundliColors.TextMain, modifier = Modifier.size(18.dp))
                            }
                        }
                    }
                }

                // 2x2 Recessed Telemetry Cards Grid (Stitch)
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    TelemetryGridCard(
                        label = "SIGN & ELEMENT",
                        headline = currentHouseData.signName,
                        subline = signElementMeta(currentHouseData.signName),
                        headlineColor = KundliColors.TextMain,
                        modifier = Modifier.weight(1f),
                    )
                    TelemetryGridCard(
                        label = "LORDSHIP",
                        headline = "${currentHouseData.lord.displayName} · H${currentHouseData.lordHouse}",
                        subline = lordPlacement?.let { "In ${it.signName} (${it.dignity})" } ?: "Placed in House ${currentHouseData.lordHouse}",
                        headlineColor = KundliColors.Gold,
                        modifier = Modifier.weight(1f),
                    )
                }
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    TelemetryGridCard(
                        label = "SAV BINDUS",
                        headline = "${currentHouseData.savBindus} / 337",
                        subline = if (currentHouseData.savBindus >= 28) "Above average support" else "Focused effort domain",
                        headlineColor = if (currentHouseData.savBindus >= 28) KundliColors.Teal else KundliColors.Gold,
                        badge = if (currentHouseData.savBindus >= 28) "Strong" else null,
                        modifier = Modifier.weight(1f),
                    )
                    val occHeadline = if (currentHouseData.planets.isEmpty()) "Unoccupied" else currentHouseData.planets.joinToString(" · ") { it.shortGlyph }
                    val occSub = if (incomingAspects.isEmpty()) "No incoming Drishti" else "${incomingAspects.size} Drishti aspect(s)"
                    TelemetryGridCard(
                        label = "OCCUPANTS & DRISHTI",
                        headline = occHeadline,
                        subline = occSub,
                        headlineColor = KundliColors.TextMain,
                        modifier = Modifier.weight(1f),
                    )
                }

                // Level 2 Synthesized Reading Box (Stitch)
                Surface(
                    color = KundliColors.Surface,
                    border = BorderStroke(1.dp, KundliColors.SubtleDivider),
                    shape = RoundedCornerShape(18.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { onOpenSubject(Subject.House(currentHouseData.number), Rung.Explain) },
                ) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp),
                            ) {
                                Icon(Icons.Rounded.Verified, contentDescription = null, tint = KundliColors.Teal, modifier = Modifier.size(16.dp))
                                Text("LEVEL 2 SYNTHESIZED READING", style = MaterialTheme.typography.labelSmall, color = KundliColors.Teal)
                            }
                            Text("Full →", style = MaterialTheme.typography.labelSmall, color = KundliColors.Gold)
                        }
                        Text(
                            text = currentHouseData.summaryLine,
                            style = MaterialTheme.typography.bodyMedium,
                            color = KundliColors.TextMain,
                        )
                        currentHouseData.findings.firstOrNull()?.let { firstFinding ->
                            Text(
                                text = firstFinding.plainMeaning,
                                style = MaterialTheme.typography.bodySmall,
                                color = KundliColors.TextMuted,
                                maxLines = 3,
                                overflow = TextOverflow.Ellipsis,
                            )
                        }
                    }
                }

                // 5. INLINE 4-STEP PATTERN CHAIN (Stitch chart_expansive.png — directly visible on scroll!)
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text("4-STEP PATTERN CHAIN", style = MaterialTheme.typography.titleLarge, color = KundliColors.TextMain)
                    Text(
                        text = "SEQUENTIAL SYNTHESIS",
                        style = MaterialTheme.typography.labelSmall,
                        color = KundliColors.Gold,
                        modifier = Modifier.clickable { decoderHouseNumber = currentHouseData.number },
                    )
                }

                Surface(
                    color = KundliColors.Surface,
                    border = BorderStroke(1.dp, KundliColors.SubtleDivider),
                    shape = RoundedCornerShape(18.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { decoderHouseNumber = currentHouseData.number },
                ) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        PatternStepRow(
                            step = 1,
                            accent = KundliColors.Gold,
                            title = "Sign · ${currentHouseData.signName} (${signElementMeta(currentHouseData.signName)})",
                            body = currentHouseData.summaryLine,
                        )
                        PatternStepRow(
                            step = 2,
                            accent = KundliColors.Gold,
                            title = "Lordship · ${currentHouseData.lord.displayName} placed in H${currentHouseData.lordHouse}",
                            body = lordPlacement?.let {
                                "${it.id.displayName} sits in ${it.signName} (${it.degreeFormatted}, ${it.dignity}), linking H${currentHouseData.number} directly to H${it.house}."
                            } ?: "House ${currentHouseData.number} outcomes route through House ${currentHouseData.lordHouse}.",
                        )
                        PatternStepRow(
                            step = 3,
                            accent = KundliColors.Gold,
                            title = "Occupants & Drishti",
                            body = buildString {
                                if (currentHouseData.planets.isEmpty()) append("Unoccupied house steered cleanly by ${currentHouseData.lord.displayName}. ")
                                else append("Occupied by ${currentHouseData.planets.joinToString(", ") { "${it.id.displayName} (${it.degreeFormatted})" }}. ")
                                if (incomingAspects.isNotEmpty()) {
                                    append("Aspected by ${incomingAspects.joinToString(", ") { (p, src) -> "${p.id.displayName} (H$src)" }}.")
                                }
                            },
                        )
                        PatternStepRow(
                            step = 4,
                            accent = KundliColors.Teal,
                            title = "SAV & Structural Baseline · ${currentHouseData.savBindus} Bindus",
                            body = if (currentHouseData.savBindus >= 28) {
                                "Ample structural cushion (${currentHouseData.savBindus}/337). Strong natural flow when ${currentHouseData.lord.displayName} Dashas activate."
                            } else {
                                "Steady baseline (${currentHouseData.savBindus}/337). Deliberate craft yields enduring results during ${currentHouseData.lord.displayName} periods."
                            },
                        )
                    }
                }
            }
        }

        // 6. KEY YOGAS & STRENGTHS Section (Stitch: 2-Up Yoga Cards + 3-Col Shadbala Spotlight + 6x2 SAV Grid)
        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text("KEY YOGAS & STRENGTHS", style = MaterialTheme.typography.titleLarge, color = KundliColors.TextMain)
                Text(
                    text = "ACTIVE ALIGNMENTS →",
                    style = MaterialTheme.typography.labelSmall,
                    color = KundliColors.Teal,
                    modifier = Modifier.clickable(onClick = onOpenStrengthsPage),
                )
            }

            // 2-Up Yoga Cards
            if (displayedChart.activeYogas.isNotEmpty()) {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    displayedChart.activeYogas.take(2).forEachIndexed { idx, yoga ->
                        val accent = if (idx == 0) KundliColors.Gold else KundliColors.Teal
                        Surface(
                            color = KundliColors.Surface,
                            border = BorderStroke(1.dp, accent.copy(alpha = 0.25f)),
                            shape = RoundedCornerShape(16.dp),
                            modifier = Modifier
                                .weight(1f)
                                .clickable(onClick = onOpenStrengthsPage),
                        ) {
                            Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically,
                                ) {
                                    Text(
                                        text = yoga.name.uppercase(),
                                        style = MaterialTheme.typography.labelSmall,
                                        color = accent,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis,
                                        modifier = Modifier.weight(1f),
                                    )
                                    Icon(Icons.Rounded.Star, contentDescription = null, tint = accent, modifier = Modifier.size(14.dp))
                                }
                                Text(
                                    text = yoga.category,
                                    style = MaterialTheme.typography.titleSmall,
                                    color = KundliColors.TextMain,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis,
                                )
                                Text(
                                    text = yoga.meaning,
                                    style = MaterialTheme.typography.bodySmall,
                                    color = KundliColors.TextMuted,
                                    maxLines = 3,
                                    overflow = TextOverflow.Ellipsis,
                                )
                            }
                        }
                    }
                }
            }

            // Shadbala Spotlight 3-Column Strip (Stitch)
            if (topShadbala.isNotEmpty()) {
                Surface(
                    color = KundliColors.Surface,
                    border = BorderStroke(1.dp, KundliColors.SubtleDivider),
                    shape = RoundedCornerShape(18.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable(onClick = onOpenStrengthsPage),
                ) {
                    Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                        ) {
                            Text("SHADBALA SPOTLIGHT", style = MaterialTheme.typography.labelSmall, color = KundliColors.TextMain)
                            Text("Positional & Directional Ratio", style = MaterialTheme.typography.labelSmall, color = KundliColors.Gold)
                        }
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            topShadbala.forEachIndexed { idx, bar ->
                                val color = if (idx == 0) KundliColors.Teal else KundliColors.Gold
                                Surface(
                                    color = KundliColors.SurfaceRecessed,
                                    border = BorderStroke(1.dp, KundliColors.SubtleDivider),
                                    shape = RoundedCornerShape(12.dp),
                                    modifier = Modifier.weight(1f),
                                ) {
                                    Column(modifier = Modifier.padding(10.dp), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                                        Text(bar.planet.displayName, style = MaterialTheme.typography.labelSmall, color = KundliColors.TextMuted)
                                        Text(
                                            text = String.format(Locale.US, "%.2fx", bar.ratio),
                                            style = TelemetryNumberStyle,
                                            color = color,
                                        )
                                        Text(
                                            text = if (bar.ratio >= 1.0f) "Above baseline" else "Developing",
                                            style = MaterialTheme.typography.labelSmall,
                                            color = KundliColors.TextMuted,
                                            maxLines = 1,
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // Ashtakavarga SAV Bindu Distribution 6x2 Grid (Stitch)
            if (displayedChart.houses.size == 12) {
                Surface(
                    color = KundliColors.Surface,
                    border = BorderStroke(1.dp, KundliColors.SubtleDivider),
                    shape = RoundedCornerShape(18.dp),
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                        ) {
                            Text("ASHTAKAVARGA SAV BINDU DISTRIBUTION", style = MaterialTheme.typography.labelSmall, color = KundliColors.TextMain)
                            Text("Avg: 28", style = MaterialTheme.typography.labelSmall, color = KundliColors.TextMuted)
                        }
                        displayedChart.houses.sortedBy { it.number }.chunked(6).forEach { row6 ->
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                row6.forEach { h ->
                                    val isSel = selectedHouse == h.number
                                    val isPeak = h.number == peakSavHouse
                                    val color = when {
                                        isPeak -> KundliColors.Teal
                                        isSel -> KundliColors.Gold
                                        h.savBindus >= 28 -> KundliColors.TextMain
                                        else -> KundliColors.TextMuted
                                    }
                                    Surface(
                                        color = when {
                                            isSel -> KundliColors.Gold.copy(alpha = 0.14f)
                                            isPeak -> KundliColors.Teal.copy(alpha = 0.14f)
                                            else -> KundliColors.SurfaceRecessed
                                        },
                                        border = BorderStroke(
                                            1.dp,
                                            when {
                                                isSel -> KundliColors.Gold
                                                isPeak -> KundliColors.Teal.copy(alpha = 0.65f)
                                                else -> KundliColors.SubtleDivider
                                            },
                                        ),
                                        shape = RoundedCornerShape(10.dp),
                                        modifier = Modifier
                                            .weight(1f)
                                            .clickable {
                                                selectedHouse = h.number
                                                viewMode = ChartViewMode.CHART
                                            },
                                    ) {
                                        Column(
                                            modifier = Modifier.padding(vertical = 8.dp),
                                            horizontalAlignment = Alignment.CenterHorizontally,
                                        ) {
                                            Text("H${h.number}", style = MaterialTheme.typography.labelSmall, color = color.copy(alpha = 0.8f))
                                            Text("${h.savBindus}", style = TelemetryNumberStyle, color = color)
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // 7. SPECIALIST WORKBENCH (RUNG 3) Card (Stitch chart_expansive.png)
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text("SPECIALIST WORKBENCH (RUNG 3)", style = MaterialTheme.typography.titleLarge, color = KundliColors.TextMain)
                Text("DEEP CALCULATIONS", style = MaterialTheme.typography.labelSmall, color = KundliColors.Gold)
            }
            Surface(
                color = KundliColors.Surface,
                border = BorderStroke(1.dp, KundliColors.SubtleDivider),
                shape = RoundedCornerShape(18.dp),
                modifier = Modifier.fillMaxWidth(),
            ) {
                Column(modifier = Modifier.padding(vertical = 4.dp)) {
                    WorkbenchRow(Icons.Rounded.GridView, KundliColors.Gold, "Bhava Chalit Sripati Midpoints", "True house boundaries & sandhi points", onOpenToolsPage)
                    HorizontalDivider(color = KundliColors.SubtleDivider, modifier = Modifier.padding(horizontal = 16.dp))
                    WorkbenchRow(Icons.Rounded.Star, KundliColors.Teal, "KP System Star & Sub-Lords", "Sub-lord rulers for precision timing", onOpenToolsPage)
                    HorizontalDivider(color = KundliColors.SubtleDivider, modifier = Modifier.padding(horizontal = 16.dp))
                    WorkbenchRow(Icons.Rounded.CalendarMonth, KundliColors.Gold, "Tajika Varshaphal & 36 Sahams", "Annual solar return & sensitive degrees", onOpenToolsPage)
                    HorizontalDivider(color = KundliColors.SubtleDivider, modifier = Modifier.padding(horizontal = 16.dp))
                    WorkbenchRow(Icons.Rounded.Insights, KundliColors.Teal, "Avakahada Chakra", "Paya, Varna, Yoni, Gana, Nadi", onOpenToolsPage)
                }
            }
        }

        // 8. Universal Footer Action Buttons (Stitch: Solid Gold Ask AI + Outlined Reflect in Journal)
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Button(
                onClick = { onAskAboutHouse(selectedHouse ?: 1) },
                modifier = Modifier.weight(1f).height(48.dp),
                shape = RoundedCornerShape(14.dp),
                colors = ButtonDefaults.buttonColors(containerColor = KundliColors.Gold, contentColor = KundliColors.OrbInk),
            ) {
                Icon(Icons.Rounded.AutoAwesome, contentDescription = null, modifier = Modifier.size(16.dp))
                Spacer(Modifier.width(6.dp))
                Text("Ask AI about H${selectedHouse ?: 1}", style = MaterialTheme.typography.labelLarge)
            }
            OutlinedButton(
                onClick = onReflectInJournal,
                modifier = Modifier.weight(1f).height(48.dp),
                shape = RoundedCornerShape(14.dp),
                border = BorderStroke(1.dp, KundliColors.SubtleDivider),
            ) {
                Icon(Icons.Rounded.EditNote, contentDescription = null, tint = KundliColors.TextMain, modifier = Modifier.size(16.dp))
                Spacer(Modifier.width(6.dp))
                Text("Reflect", color = KundliColors.TextMain, style = MaterialTheme.typography.labelLarge)
            }
        }
    }

    if (showOptionsSheet) {
        ChartOptionsSheet(
            style = style,
            reference = reference,
            showAspectsOverlay = showAspectsOverlay,
            onSelectStyle = { style = it },
            onSelectReference = { reference = it },
            onToggleShowAspects = { showAspectsOverlay = it },
            onStartTeachMe = {
                showOptionsSheet = false
                teachMeStep = 1
            },
            onDismiss = { showOptionsSheet = false },
        )
    }

    val decodeNum = decoderHouseNumber
    if (decodeNum != null) {
        val hData = displayedChart.houses.firstOrNull { it.number == decodeNum }
        if (hData != null) {
            PatternDecoderSheet(
                house = hData,
                chart = displayedChart,
                onOpenReading = {
                    decoderHouseNumber = null
                    onOpenSubject(Subject.House(decodeNum), Rung.Explain)
                },
                onJumpToTime = {
                    decoderHouseNumber = null
                    onJumpToTimeTab()
                },
                onDismiss = { decoderHouseNumber = null },
            )
        }
    }
}

@Composable
private fun PillToggleChip(
    label: String,
    selected: Boolean,
    accent: Color,
    onClick: () -> Unit,
) {
    Surface(
        color = if (selected) accent.copy(alpha = 0.14f) else KundliColors.Surface,
        border = BorderStroke(1.dp, if (selected) accent.copy(alpha = 0.55f) else KundliColors.SubtleDivider),
        shape = RoundedCornerShape(999.dp),
        modifier = Modifier.clickable(onClick = onClick),
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.labelMedium,
            color = if (selected) accent else KundliColors.TextMuted,
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
        )
    }
}

@Composable
private fun TelemetryGridCard(
    label: String,
    headline: String,
    subline: String,
    headlineColor: Color,
    badge: String? = null,
    modifier: Modifier = Modifier,
) {
    Surface(
        color = KundliColors.SurfaceRecessed,
        border = BorderStroke(1.dp, KundliColors.SubtleDivider),
        shape = RoundedCornerShape(16.dp),
        modifier = modifier,
    ) {
        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Text(label, style = MaterialTheme.typography.labelSmall, color = KundliColors.TextMuted)
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                Text(
                    text = headline,
                    style = MaterialTheme.typography.titleMedium,
                    color = headlineColor,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.weight(1f, fill = false),
                )
                if (badge != null) {
                    Surface(
                        color = KundliColors.Teal.copy(alpha = 0.16f),
                        shape = RoundedCornerShape(6.dp),
                    ) {
                        Text(
                            text = badge,
                            style = MaterialTheme.typography.labelSmall,
                            color = KundliColors.Teal,
                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                        )
                    }
                }
            }
            Text(
                text = subline,
                style = MaterialTheme.typography.labelSmall,
                color = KundliColors.TextMuted,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
            )
        }
    }
}

@Composable
private fun PatternStepRow(
    step: Int,
    accent: Color,
    title: String,
    body: String,
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
        verticalAlignment = Alignment.Top,
    ) {
        Surface(
            color = accent.copy(alpha = 0.15f),
            border = BorderStroke(1.dp, accent.copy(alpha = 0.55f)),
            shape = CircleShape,
            modifier = Modifier.size(26.dp),
        ) {
            Box(contentAlignment = Alignment.Center) {
                Text("$step", style = TelemetryNumberStyle, color = accent)
            }
        }
        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
            Text(title, style = MaterialTheme.typography.titleSmall, color = KundliColors.TextMain)
            Text(body, style = MaterialTheme.typography.bodySmall, color = KundliColors.TextMuted)
        }
    }
}

@Composable
private fun WorkbenchRow(
    icon: ImageVector,
    accent: Color,
    title: String,
    subtitle: String,
    onClick: () -> Unit,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(horizontal = 16.dp, vertical = 14.dp),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Icon(icon, contentDescription = null, tint = accent, modifier = Modifier.size(20.dp))
        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
            Text(title, style = MaterialTheme.typography.titleSmall, color = KundliColors.TextMain)
            Text(subtitle, style = MaterialTheme.typography.labelSmall, color = KundliColors.TextMuted)
        }
        Text(">", style = MaterialTheme.typography.bodyMedium, color = KundliColors.TextMuted)
    }
}

@Composable
private fun TeachMeBanner(
    step: Int,
    onNext: () -> Unit,
    onDismiss: () -> Unit,
) {
    val (title, body) = when (step) {
        1 -> "1. Houses (Fields of Life)" to "Each of the 12 shapes represents a life area—from Self (H1) to Career (H10)."
        2 -> "2. Lords (Who Steers It)" to "Tapping a house draws a gold dashed line to where its ruling planet sits."
        else -> "3. Aspects & Timing" to "Long-press any house or enable Show Aspects in Options to see Parashari Drishti."
    }
    Surface(
        color = KundliColors.SurfaceAlt,
        border = BorderStroke(1.dp, KundliColors.Gold),
        shape = RoundedCornerShape(14.dp),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Text(title, style = MaterialTheme.typography.titleMedium, color = KundliColors.Gold)
            Text(body, style = MaterialTheme.typography.bodySmall, color = KundliColors.TextMain)
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                TextButton(onClick = onDismiss) { Text("Close", color = KundliColors.TextMuted) }
                TextButton(onClick = onNext) { Text(if (step < 3) "Next →" else "Got it", color = KundliColors.Teal) }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun PatternDecoderSheet(
    house: ChartHouseData,
    chart: ChartUiState,
    onOpenReading: () -> Unit,
    onJumpToTime: () -> Unit,
    onDismiss: () -> Unit,
) {
    val pagerState = rememberPagerState(pageCount = { 4 })
    val scope = rememberCoroutineScope()
    val lordPlacement = remember(chart, house.lord) { chart.allPlanets().firstOrNull { it.id == house.lord } }
    val incomingAspects = remember(chart, house.number) { DrishtiCalculator.incomingAspectsToHouse(house.number, chart.houses) }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = KundliColors.Surface,
        contentColor = KundliColors.TextMain,
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .navigationBarsPadding()
                .padding(horizontal = 20.dp, vertical = 14.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text("PATTERN DECODER · HOUSE ${house.number}", style = MaterialTheme.typography.labelMedium, color = KundliColors.Gold)
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    repeat(4) { idx ->
                        Box(
                            modifier = Modifier
                                .size(if (pagerState.currentPage == idx) 10.dp else 7.dp)
                                .clip(CircleShape)
                                .background(if (pagerState.currentPage == idx) KundliColors.Gold else KundliColors.SurfaceAlt),
                        )
                    }
                }
            }

            HorizontalPager(state = pagerState, modifier = Modifier.fillMaxWidth()) { page ->
                Surface(
                    color = KundliColors.SurfaceAlt,
                    border = BorderStroke(1.dp, KundliColors.GoldHairline),
                    shape = RoundedCornerShape(16.dp),
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        when (page) {
                            0 -> {
                                Text("1. Sign & Atmosphere", style = MaterialTheme.typography.titleMedium)
                                Text("House ${house.number} falls in ${house.signName}, setting the natural temperament of this life domain.", style = MaterialTheme.typography.bodyMedium)
                                Text(house.summaryLine, style = MaterialTheme.typography.bodySmall, color = KundliColors.Teal)
                            }
                            1 -> {
                                Text("2. Lordship (Who Steers H${house.number})", style = MaterialTheme.typography.titleMedium)
                                val detail = if (lordPlacement != null) {
                                    "${house.lord.displayName} rules ${house.signName} and sits in House ${lordPlacement.house} (${lordPlacement.signName} · ${lordPlacement.degreeFormatted}, ${lordPlacement.dignity})."
                                } else {
                                    "${house.lord.displayName} rules ${house.signName} and links House ${house.number} to House ${house.lordHouse}."
                                }
                                Text(detail, style = MaterialTheme.typography.bodyMedium)
                            }
                            2 -> {
                                Text("3. Occupants & Parashari Drishti", style = MaterialTheme.typography.titleMedium)
                                Text(
                                    text = if (house.planets.isEmpty()) "Occupants: Empty house (steered cleanly by Lord ${house.lord.displayName})."
                                    else "Occupants: ${house.planets.joinToString(", ") { "${it.id.displayName} (${it.degreeFormatted})" }}.",
                                    style = MaterialTheme.typography.bodyMedium,
                                )
                                Text(
                                    text = if (incomingAspects.isEmpty()) "Incoming aspects: None."
                                    else "Incoming Drishti: ${incomingAspects.joinToString(", ") { (p, src) -> "${p.id.displayName} from H$src" }}.",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = KundliColors.Teal,
                                )
                            }
                            else -> {
                                Text("4. Structural Support & Timing", style = MaterialTheme.typography.titleMedium)
                                Text("Ashtakvarga SAV: ${house.savBindus} / 337 bindus (28 = average).", style = MaterialTheme.typography.bodyMedium)
                                Text("Open Time to see when ${house.lord.displayName} Dashas activate this house.", style = MaterialTheme.typography.bodySmall, color = KundliColors.TextMuted)
                            }
                        }
                    }
                }
            }

            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                if (pagerState.currentPage < 3) {
                    Button(
                        onClick = { scope.launch { pagerState.animateScrollToPage(pagerState.currentPage + 1) } },
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(containerColor = KundliColors.Gold, contentColor = KundliColors.OrbInk),
                    ) {
                        Text("Swipe or Next →")
                    }
                } else {
                    OutlinedButton(onClick = onJumpToTime, modifier = Modifier.weight(1f)) {
                        Text("Dashas", color = KundliColors.Teal)
                    }
                    Button(
                        onClick = onOpenReading,
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(containerColor = KundliColors.Gold, contentColor = KundliColors.OrbInk),
                    ) {
                        Text("Full Reading")
                    }
                }
            }
            Spacer(Modifier.height(8.dp))
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ChartOptionsSheet(
    style: ChartStyle,
    reference: ChartReference,
    showAspectsOverlay: Boolean,
    onSelectStyle: (ChartStyle) -> Unit,
    onSelectReference: (ChartReference) -> Unit,
    onToggleShowAspects: (Boolean) -> Unit,
    onStartTeachMe: () -> Unit,
    onDismiss: () -> Unit,
) {
    ModalBottomSheet(onDismissRequest = onDismiss, containerColor = KundliColors.Surface, contentColor = KundliColors.TextMain) {
        Column(
            modifier = Modifier.fillMaxWidth().navigationBarsPadding().padding(horizontal = 20.dp, vertical = 12.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Text("Chart Options", style = MaterialTheme.typography.headlineSmall)
            Text("Chart Style", style = MaterialTheme.typography.labelMedium, color = KundliColors.TextMuted)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                ChartStyle.entries.forEach { s ->
                    FilterChip(selected = style == s, onClick = { onSelectStyle(s) }, label = { Text(s.label) })
                }
            }
            Text("Reference (Lagna vs Chandra Kundli)", style = MaterialTheme.typography.labelMedium, color = KundliColors.TextMuted)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                ChartReference.entries.forEach { r ->
                    FilterChip(selected = reference == r, onClick = { onSelectReference(r) }, label = { Text(r.label) })
                }
            }
            Surface(color = KundliColors.SurfaceAlt, shape = RoundedCornerShape(14.dp), modifier = Modifier.fillMaxWidth()) {
                Row(
                    modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Column(modifier = Modifier.weight(1f).padding(end = 8.dp)) {
                        Text("Show Drishti aspects", style = MaterialTheme.typography.titleMedium)
                        Text("Display Parashari aspects from selected house without long-press.", style = MaterialTheme.typography.bodySmall, color = KundliColors.TextMuted)
                    }
                    Switch(
                        checked = showAspectsOverlay,
                        onCheckedChange = onToggleShowAspects,
                        colors = SwitchDefaults.colors(checkedThumbColor = KundliColors.OrbInk, checkedTrackColor = KundliColors.Teal),
                    )
                }
            }
            Button(
                onClick = onStartTeachMe,
                colors = ButtonDefaults.buttonColors(containerColor = KundliColors.SurfaceAlt, contentColor = KundliColors.Gold),
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text("Run 3-Step 'Teach Me' Guide")
            }
        }
    }
}
