package com.kundliflow.app.ui.chart

import androidx.compose.animation.AnimatedVisibility
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
import androidx.compose.material.icons.rounded.Tune
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
import androidx.compose.material3.LinearProgressIndicator
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
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.kundliflow.app.ui.subject.PlanetId
import com.kundliflow.app.ui.subject.Rung
import com.kundliflow.app.ui.subject.Subject
import com.kundliflow.app.ui.subject.VargaType
import com.kundliflow.app.ui.theme.KundliColors
import com.kundliflow.app.ui.theme.TelemetryNumberStyle
import kotlinx.coroutines.launch

enum class ChartViewMode(val label: String) { CHART("Chart"), TABLE("Table") }

private val TOP_VARGAS = listOf(VargaType.D1, VargaType.D9, VargaType.D10, VargaType.D2, VargaType.D4)

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
    onJumpToTimeTab: () -> Unit,
) {
    var style by remember(initialStyle) { mutableStateOf(initialStyle) }
    var reference by remember { mutableStateOf(ChartReference.LAGNA) }
    var selectedVarga by remember { mutableStateOf(VargaType.D1) }
    var selectedTopic by remember { mutableStateOf<String?>(null) }
    var selectedHouse by remember { mutableStateOf<Int?>(1) }
    var viewMode by remember { mutableStateOf(ChartViewMode.CHART) }
    var showAllFindings by remember { mutableStateOf(false) }
    var showAspectsOverlay by remember { mutableStateOf(false) }

    var showMoreVargasMenu by remember { mutableStateOf(false) }
    var showOptionsSheet by remember { mutableStateOf(false) }
    var decoderHouseNumber by remember { mutableStateOf<Int?>(null) }
    var teachMeStep by remember { mutableIntStateOf(0) } // 0=off, 1..3

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
    val topYoga = displayedChart.activeYogas.firstOrNull()
    val bhangaCount = displayedChart.doshaAudits.count { it.bhangaCancelled }
    val strongestPlanet = remember(displayedChart) { displayedChart.shadbalaBars.maxByOrNull { it.ratio } }

    // Spacious vertical scroll root (v5: Chart|Table toggle + Expanded House Card + Bento Previews + Graha Strip)
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 20.dp)
            .padding(bottom = 112.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        // 1. Header + [Chart | Table] Segmented Switch + Chart Options
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 4.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = if (reference == ChartReference.MOON) {
                        "Chandra Kundli · Moon in ${displayedChart.moonSign}"
                    } else {
                        "${displayedChart.ascendantSign} rising · Moon in ${displayedChart.moonSign}"
                    },
                    style = MaterialTheme.typography.titleMedium,
                    color = KundliColors.TextMain,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                Text(
                    text = "${selectedVarga.label} · ${selectedVarga.domain}",
                    style = MaterialTheme.typography.labelMedium,
                    color = KundliColors.TextMuted,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
            }
            IconButton(onClick = { showOptionsSheet = true }) {
                Icon(
                    imageVector = Icons.Rounded.Tune,
                    contentDescription = "Chart options",
                    tint = KundliColors.Gold,
                )
            }
        }

        // CHANI-style [Chart | Table] Segmented Toggle + Aspects quick toggle
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Surface(
                color = KundliColors.Surface,
                border = BorderStroke(1.dp, KundliColors.SubtleDivider),
                shape = RoundedCornerShape(999.dp),
            ) {
                Row(modifier = Modifier.padding(3.dp), horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    ChartViewMode.entries.forEach { mode ->
                        val active = viewMode == mode
                        Surface(
                            color = if (active) KundliColors.SurfaceAlt else KundliColors.Surface,
                            border = if (active) BorderStroke(1.dp, KundliColors.GoldHairline) else null,
                            shape = RoundedCornerShape(999.dp),
                            modifier = Modifier.clickable { viewMode = mode },
                        ) {
                            Text(
                                text = mode.label,
                                style = MaterialTheme.typography.labelMedium,
                                color = if (active) KundliColors.Gold else KundliColors.TextMuted,
                                modifier = Modifier.padding(horizontal = 16.dp, vertical = 7.dp),
                            )
                        }
                    }
                }
            }
            FilterChip(
                selected = showAspectsOverlay,
                onClick = { showAspectsOverlay = !showAspectsOverlay },
                label = { Text(if (showAspectsOverlay) "Aspects ON" else "Aspects") },
                colors = FilterChipDefaults.filterChipColors(
                    selectedContainerColor = KundliColors.SurfaceAlt,
                    selectedLabelColor = KundliColors.Teal,
                ),
            )
        }

        if (teachMeStep in 1..3) {
            TeachMeBanner(
                step = teachMeStep,
                onNext = { teachMeStep = if (teachMeStep >= 3) 0 else teachMeStep + 1 },
                onDismiss = { teachMeStep = 0 },
            )
        }

        // Horizontal Rail 1: Top-5 Vargas + [More v] Dropdown (D3..D60)
        LazyRow(
            horizontalArrangement = Arrangement.spacedBy(6.dp),
            verticalAlignment = Alignment.CenterVertically,
            contentPadding = PaddingValues(end = 6.dp),
        ) {
            items(TOP_VARGAS, key = { it.name }) { varga ->
                FilterChip(
                    selected = selectedVarga == varga,
                    onClick = { selectedVarga = varga },
                    label = { Text(varga.label) },
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = KundliColors.SurfaceAlt,
                        selectedLabelColor = KundliColors.Gold,
                    ),
                )
            }
            item {
                val otherSelected = !TOP_VARGAS.contains(selectedVarga)
                Box {
                    FilterChip(
                        selected = otherSelected,
                        onClick = { showMoreVargasMenu = true },
                        label = { Text(if (otherSelected) "${selectedVarga.label} ▾" else "More ▾") },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = KundliColors.SurfaceAlt,
                            selectedLabelColor = KundliColors.Gold,
                        ),
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

        if (viewMode == ChartViewMode.CHART) {
            // 2. Spacious 1:1 Kundli Canvas
            Box(
                modifier = Modifier.fillMaxWidth(),
                contentAlignment = Alignment.Center,
            ) {
                KundliChartCanvas(
                    chart = displayedChart,
                    style = style,
                    selectedHouse = selectedHouse,
                    highlightedHouses = highlightedHouses,
                    showAspectsForSelectedHouse = showAspectsOverlay,
                    onSelectHouse = {
                        selectedHouse = it
                        showAllFindings = false
                    },
                    modifier = Modifier.size(296.dp),
                )
            }

            // 3. Perspective + Life Focus Lenses Rail
            LazyRow(
                horizontalArrangement = Arrangement.spacedBy(6.dp),
                verticalAlignment = Alignment.CenterVertically,
                contentPadding = PaddingValues(end = 6.dp),
            ) {
                item {
                    FilterChip(
                        selected = reference == ChartReference.LAGNA,
                        onClick = { reference = ChartReference.LAGNA },
                        label = { Text("Lagna") },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = KundliColors.SurfaceAlt,
                            selectedLabelColor = KundliColors.Teal,
                        ),
                    )
                }
                item {
                    FilterChip(
                        selected = reference == ChartReference.MOON,
                        onClick = { reference = ChartReference.MOON },
                        label = { Text("Moon") },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = KundliColors.SurfaceAlt,
                            selectedLabelColor = KundliColors.Teal,
                        ),
                    )
                }
                items(listOf("All", "Career", "Love", "Money", "Home")) { topic ->
                    val isSelected = (topic == "All" && selectedTopic == null) || selectedTopic == topic
                    FilterChip(
                        selected = isSelected,
                        onClick = {
                            selectedTopic = if (topic == "All") null else topic
                            showAllFindings = false
                            selectedHouse = when (topic) {
                                "Career" -> 10
                                "Love" -> 7
                                "Money" -> 2
                                "Home" -> 4
                                else -> selectedHouse ?: 1
                            }
                        },
                        label = { Text(topic) },
                    )
                }
            }

            // 4. Expanded Selected House Card (0 taps to read summary & top findings)
            if (currentHouseData != null) {
                Surface(
                    color = KundliColors.Surface,
                    border = BorderStroke(1.dp, KundliColors.GoldHairline),
                    shape = RoundedCornerShape(20.dp),
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Column(
                        modifier = Modifier.padding(18.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp),
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween,
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = "HOUSE ${currentHouseData.number} · ${currentHouseData.signName.uppercase()}",
                                    style = MaterialTheme.typography.labelMedium,
                                    color = KundliColors.Gold,
                                )
                                Text(
                                    text = "Lord ${currentHouseData.lord.displayName} in House ${currentHouseData.lordHouse}",
                                    style = MaterialTheme.typography.titleMedium,
                                    color = KundliColors.TextMain,
                                )
                            }
                            Row {
                                IconButton(
                                    onClick = {
                                        selectedHouse = if (currentHouseData.number <= 1) 12 else currentHouseData.number - 1
                                        showAllFindings = false
                                    },
                                    modifier = Modifier.size(34.dp),
                                ) {
                                    Icon(Icons.AutoMirrored.Rounded.KeyboardArrowLeft, contentDescription = "Previous house", tint = KundliColors.Gold)
                                }
                                IconButton(
                                    onClick = {
                                        selectedHouse = if (currentHouseData.number >= 12) 1 else currentHouseData.number + 1
                                        showAllFindings = false
                                    },
                                    modifier = Modifier.size(34.dp),
                                ) {
                                    Icon(Icons.AutoMirrored.Rounded.KeyboardArrowRight, contentDescription = "Next house", tint = KundliColors.Gold)
                                }
                            }
                        }

                        Text(
                            text = currentHouseData.summaryLine,
                            style = MaterialTheme.typography.bodyMedium,
                            color = KundliColors.TextMain,
                        )

                        LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            item { FactPillCard("Sign", currentHouseData.signName) }
                            item { FactPillCard("Lord", "${currentHouseData.lord.displayName} (H${currentHouseData.lordHouse})") }
                            item { FactPillCard("SAV Bindus", "${currentHouseData.savBindus} / 337") }
                            if (displayedChart.liveTransitMoonHouse == currentHouseData.number) {
                                item { FactPillCard("Live Moon", "Transiting today") }
                            }
                        }

                        // Balanced progressive disclosure: show top 2 findings inline, 1-tap toggle for more
                        val visibleFindings = if (showAllFindings) currentHouseData.findings else currentHouseData.findings.take(2)
                        visibleFindings.forEach { f ->
                            Surface(
                                color = KundliColors.SurfaceAlt,
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier.fillMaxWidth(),
                            ) {
                                Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                                    Text(f.title, style = MaterialTheme.typography.labelMedium, color = KundliColors.Gold)
                                    Text(f.plainMeaning, style = MaterialTheme.typography.bodySmall, color = KundliColors.TextMain)
                                }
                            }
                        }

                        if (currentHouseData.findings.size > 2) {
                            TextButton(
                                onClick = { showAllFindings = !showAllFindings },
                                contentPadding = PaddingValues(0.dp),
                            ) {
                                Text(
                                    text = if (showAllFindings) "Show fewer findings" else "Show all ${currentHouseData.findings.size} findings",
                                    color = KundliColors.Teal,
                                )
                            }
                        }

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(10.dp),
                        ) {
                            OutlinedButton(
                                onClick = { onOpenSubject(Subject.House(currentHouseData.number), Rung.Explain) },
                                modifier = Modifier.weight(1f),
                            ) {
                                Text("Full reading", color = KundliColors.Teal)
                            }
                            Button(
                                onClick = { decoderHouseNumber = currentHouseData.number },
                                modifier = Modifier.weight(1f),
                                colors = ButtonDefaults.buttonColors(containerColor = KundliColors.Gold, contentColor = KundliColors.OrbInk),
                            ) {
                                Text("Decode 4-step")
                            }
                        }
                    }
                }
            }
        } else {
            // CHANI-style Structured 9-Planet Placement Table
            Surface(
                color = KundliColors.Surface,
                border = BorderStroke(1.dp, KundliColors.GoldHairline),
                shape = RoundedCornerShape(20.dp),
                modifier = Modifier.fillMaxWidth(),
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp),
                ) {
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

        // 5. 2-Up Natal Bento Cards (Glance + 1-Tap Deep Dive)
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Surface(
                color = KundliColors.Surface,
                border = BorderStroke(1.dp, KundliColors.Teal.copy(alpha = 0.25f)),
                shape = RoundedCornerShape(18.dp),
                modifier = Modifier
                    .weight(1f)
                    .clickable(onClick = onOpenStrengthsPage),
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text("YOGAS & DOSHAS", style = MaterialTheme.typography.labelMedium, color = KundliColors.Teal)
                    Text(
                        text = "${displayedChart.activeYogas.size} Active",
                        style = MaterialTheme.typography.titleMedium,
                        color = KundliColors.TextMain,
                    )
                    Text(
                        text = topYoga?.name ?: if (bhangaCount > 0) "$bhangaCount Bhanga cancelled" else "Tap to inspect",
                        style = MaterialTheme.typography.bodySmall,
                        color = KundliColors.TextMuted,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis,
                    )
                    Text("Inspect →", style = MaterialTheme.typography.labelMedium, color = KundliColors.Gold)
                }
            }

            Surface(
                color = KundliColors.Surface,
                border = BorderStroke(1.dp, KundliColors.GoldHairline),
                shape = RoundedCornerShape(18.dp),
                modifier = Modifier
                    .weight(1f)
                    .clickable(onClick = onOpenToolsPage),
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text("SHADBALA PEAK", style = MaterialTheme.typography.labelMedium, color = KundliColors.Gold)
                    Text(
                        text = strongestPlanet?.planet?.displayName ?: "Strengths",
                        style = MaterialTheme.typography.titleMedium,
                        color = KundliColors.TextMain,
                    )
                    if (strongestPlanet != null) {
                        LinearProgressIndicator(
                            progress = { (strongestPlanet.ratio / 1.8f).coerceIn(0.15f, 1f) },
                            modifier = Modifier.fillMaxWidth().height(5.dp).clip(RoundedCornerShape(3.dp)),
                            color = KundliColors.Gold,
                            trackColor = KundliColors.SurfaceAlt,
                        )
                        Text(
                            text = "${String.format(java.util.Locale.US, "%.2f", strongestPlanet.ratio)}× classical min",
                            style = MaterialTheme.typography.bodySmall,
                            color = KundliColors.TextMuted,
                        )
                    } else {
                        Text("KP · Varshaphala", style = MaterialTheme.typography.bodySmall, color = KundliColors.TextMuted)
                    }
                    Text("Tools Studio →", style = MaterialTheme.typography.labelMedium, color = KundliColors.Teal)
                }
            }
        }

        // 6. Swipeable Graha Strip (Horizontal Carousel for quick 1-tap planet readings)
        if (viewMode == ChartViewMode.CHART && allPlanets.isNotEmpty()) {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text("YOUR 9 GRAHAS", style = MaterialTheme.typography.labelMedium, color = KundliColors.TextMuted)
                    Text(
                        text = "Table view →",
                        style = MaterialTheme.typography.labelMedium,
                        color = KundliColors.Gold,
                        modifier = Modifier.clickable { viewMode = ChartViewMode.TABLE },
                    )
                }
                LazyRow(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    items(allPlanets, key = { it.id.name }) { pl ->
                        Surface(
                            color = KundliColors.Surface,
                            border = BorderStroke(1.dp, KundliColors.SubtleDivider),
                            shape = RoundedCornerShape(16.dp),
                            modifier = Modifier
                                .width(136.dp)
                                .clickable { onOpenSubject(Subject.Planet(pl.id), Rung.Explain) },
                        ) {
                            Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                ) {
                                    Text(
                                        text = pl.id.displayName,
                                        style = MaterialTheme.typography.titleSmall,
                                        color = KundliColors.Gold,
                                    )
                                    Text(
                                        text = "H${pl.house}",
                                        style = TelemetryNumberStyle,
                                        color = KundliColors.Teal,
                                    )
                                }
                                Text(
                                    text = "${pl.signName} · ${pl.degreeFormatted}",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = KundliColors.TextMain,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis,
                                )
                                Text(
                                    text = pl.dignity + if (pl.vargottama) " ★" else "",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = KundliColors.TextMuted,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis,
                                )
                            }
                        }
                    }
                }
            }
        }

        // 7. Bridge to Time & Dashas
        Surface(
            color = KundliColors.SurfaceAlt,
            border = BorderStroke(1.dp, KundliColors.SubtleDivider),
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier
                .fillMaxWidth()
                .clickable(onClick = onJumpToTimeTab),
        ) {
            Row(
                modifier = Modifier.padding(16.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text("ACTIVE TIMING", style = MaterialTheme.typography.labelMedium, color = KundliColors.Gold)
                    Text("See which houses your Dashas & Transits activate now", style = MaterialTheme.typography.bodySmall, color = KundliColors.TextMain)
                }
                Text("Time →", style = MaterialTheme.typography.labelLarge, color = KundliColors.Teal)
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
private fun FactPillCard(label: String, value: String) {
    Surface(
        color = KundliColors.SurfaceAlt,
        shape = RoundedCornerShape(12.dp),
    ) {
        Column(modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp)) {
            Text(label, style = MaterialTheme.typography.labelMedium, color = KundliColors.TextMuted)
            Text(value, style = MaterialTheme.typography.bodySmall, color = KundliColors.Gold)
        }
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
                Text(
                    text = "PATTERN DECODER · HOUSE ${house.number}",
                    style = MaterialTheme.typography.labelMedium,
                    color = KundliColors.Gold,
                )
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

            // Swipeable 4-slide HorizontalPager
            HorizontalPager(
                state = pagerState,
                modifier = Modifier.fillMaxWidth(),
            ) { page ->
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
                                Text(
                                    text = "House ${house.number} falls in ${house.signName}, setting the natural temperament of this life domain.",
                                    style = MaterialTheme.typography.bodyMedium,
                                )
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
                                Text(
                                    text = "Ashtakvarga SAV: ${house.savBindus} / 337 bindus (28 = average).",
                                    style = MaterialTheme.typography.bodyMedium,
                                )
                                Text(
                                    text = "Swipe to explore or open Time to see when ${house.lord.displayName} Dashas activate this house.",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = KundliColors.TextMuted,
                                )
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
