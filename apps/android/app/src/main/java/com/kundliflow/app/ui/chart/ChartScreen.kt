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
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
import com.kundliflow.app.ui.subject.PlanetId
import com.kundliflow.app.ui.subject.Rung
import com.kundliflow.app.ui.subject.Subject
import com.kundliflow.app.ui.subject.VargaType
import com.kundliflow.app.ui.theme.KundliColors
import com.kundliflow.app.ui.theme.TelemetryNumberStyle
import java.util.Locale

@Composable
fun ChartScreen(
    chart: ChartUiState,
    initialStyle: ChartStyle = ChartStyle.NORTH,
    initialTopic: String? = null,
    onInitialTopicConsumed: () -> Unit = {},
    toolsData: ToolsStudioData = ToolsStudioData(emptyList(), emptyList(), emptyList(), emptyList(), emptyList(), null),
    resolveChartVariant: (VargaType, ChartReference) -> ChartUiState? = { _, _ -> null },
    onFetchVarshaphalYear: suspend (Int) -> VarshaphalViewData? = { null },
    onOpenSubject: (Subject, Rung) -> Unit,
    onJumpToTimeTab: () -> Unit,
) {
    var style by remember(initialStyle) { mutableStateOf(initialStyle) }
    var reference by remember { mutableStateOf(ChartReference.LAGNA) }
    var selectedVarga by remember { mutableStateOf(VargaType.D1) }
    var selectedTopic by remember { mutableStateOf<String?>(null) }
    var selectedHouse by remember { mutableStateOf<Int?>(null) }
    var inspectorMode by remember { mutableIntStateOf(0) } // 0 = Houses (12), 1 = Planets (9)
    var selectedPlanet by remember { mutableStateOf(PlanetId.MOON) }

    LaunchedEffect(initialTopic) {
        if (initialTopic != null) {
            selectedTopic = initialTopic
            inspectorMode = 0
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

    var showOptionsSheet by remember { mutableStateOf(false) }
    var showToolsRoom by remember { mutableStateOf(false) }
    var showStrengthsSheet by remember { mutableStateOf(false) }
    var showDoshasSheet by remember { mutableStateOf(false) }
    var showYogasSheet by remember { mutableStateOf(false) }
    var showVargasSheet by remember { mutableStateOf(false) }
    var decoderHouseNumber by remember { mutableStateOf<Int?>(null) }
    var teachMeStep by remember { mutableIntStateOf(0) } // 0=off, 1..3=steps

    val highlightedHouses = remember(selectedTopic) {
        when (selectedTopic) {
            "Career" -> setOf(10, 6, 2, 11)
            "Love" -> setOf(7, 2, 11, 4)
            "Money" -> setOf(2, 11, 5, 9)
            "Home" -> setOf(4, 2, 12)
            else -> emptySet()
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 20.dp)
            .padding(bottom = 108.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        // 1. Emotional Entry Point + [Chart opts]
        Row(
            modifier = Modifier.fillMaxWidth(),
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
                )
                Text(
                    text = displayedChart.emotionalHeadline(),
                    style = MaterialTheme.typography.bodySmall,
                    color = KundliColors.Gold,
                )
                Text(
                    text = "● Moon transiting House ${displayedChart.liveTransitMoonHouse} today · Hold any house for Drishti",
                    style = MaterialTheme.typography.labelMedium,
                    color = KundliColors.Teal,
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

        // 2. Teach Me 3-Step Card (re-triggerable from Chart options)
        if (teachMeStep in 1..3) {
            TeachMeBanner(
                step = teachMeStep,
                onNext = { teachMeStep = if (teachMeStep >= 3) 0 else teachMeStep + 1 },
                onDismiss = { teachMeStep = 0 },
            )
        }

        // 3. Full-Width 1:1 Kundli Canvas
        KundliChartCanvas(
            chart = displayedChart,
            style = style,
            selectedHouse = selectedHouse,
            highlightedHouses = highlightedHouses,
            onSelectHouse = {
                selectedHouse = it
                inspectorMode = 0
            },
        )

        // 4. Varga Chip + Reference Chip (when rotated) + Life Topic Pills
        LazyRow(
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            contentPadding = PaddingValues(end = 8.dp),
        ) {
            item {
                FilterChip(
                    selected = true,
                    onClick = { showVargasSheet = true },
                    label = { Text("${selectedVarga.label} ▾") },
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = KundliColors.SurfaceAlt,
                        selectedLabelColor = KundliColors.Gold,
                    ),
                )
            }
            item {
                FilterChip(
                    selected = reference == ChartReference.MOON,
                    onClick = {
                        reference = if (reference == ChartReference.LAGNA) ChartReference.MOON else ChartReference.LAGNA
                    },
                    label = { Text(if (reference == ChartReference.MOON) "Moon Ref ★" else "Lagna Ref") },
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = KundliColors.SurfaceAlt,
                        selectedLabelColor = KundliColors.Teal,
                    ),
                )
            }
            items(listOf("Career", "Love", "Money", "Home")) { topic ->
                val isSelected = selectedTopic == topic
                FilterChip(
                    selected = isSelected,
                    onClick = {
                        selectedTopic = if (isSelected) null else topic
                        inspectorMode = 0
                        selectedHouse = when (topic) {
                            "Career" -> 10
                            "Love" -> 7
                            "Money" -> 2
                            "Home" -> 4
                            else -> selectedHouse
                        }
                    },
                    label = { Text(topic) },
                )
            }
        }

        // 5. Dual Inspector Card: [ Houses (12) | Planets (9) ]
        val currentHouseData = displayedChart.houses.firstOrNull { it.number == selectedHouse }
        val allPlanets = remember(displayedChart) { displayedChart.allPlanets() }
        val currentPlanet = allPlanets.firstOrNull { it.id == selectedPlanet } ?: allPlanets.firstOrNull()

        Surface(
            color = KundliColors.Surface,
            border = BorderStroke(1.dp, KundliColors.GoldHairline),
            shape = RoundedCornerShape(18.dp),
            modifier = Modifier.fillMaxWidth(),
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    FilterChip(
                        selected = inspectorMode == 0,
                        onClick = { inspectorMode = 0 },
                        label = { Text("Houses (12)") },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = KundliColors.SurfaceAlt,
                            selectedLabelColor = KundliColors.Gold,
                        ),
                    )
                    FilterChip(
                        selected = inspectorMode == 1,
                        onClick = { inspectorMode = 1 },
                        label = { Text("Planets (${allPlanets.size.coerceAtLeast(9)})") },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = KundliColors.SurfaceAlt,
                            selectedLabelColor = KundliColors.Teal,
                        ),
                    )
                }

                if (inspectorMode == 0) {
                    if (currentHouseData == null) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { selectedHouse = 1 },
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Text(
                                text = "Tap any house to see what it holds for you.",
                                style = MaterialTheme.typography.bodyMedium,
                                color = KundliColors.TextMuted,
                                modifier = Modifier.weight(1f),
                            )
                            Text("Start H1 →", style = MaterialTheme.typography.labelMedium, color = KundliColors.Gold)
                        }
                    } else {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween,
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = "House ${currentHouseData.number}, ${currentHouseData.signName} · Lord ${currentHouseData.lord.displayName}",
                                    style = MaterialTheme.typography.titleMedium,
                                    color = KundliColors.TextMain,
                                )
                                Text(
                                    text = currentHouseData.summaryLine,
                                    style = MaterialTheme.typography.bodySmall,
                                    color = KundliColors.TextMuted,
                                )
                            }
                            Row {
                                IconButton(
                                    onClick = {
                                        val prev = if (currentHouseData.number <= 1) 12 else currentHouseData.number - 1
                                        selectedHouse = prev
                                    },
                                ) {
                                    Icon(Icons.AutoMirrored.Rounded.KeyboardArrowLeft, contentDescription = "Previous house", tint = KundliColors.Gold)
                                }
                                IconButton(
                                    onClick = {
                                        val next = if (currentHouseData.number >= 12) 1 else currentHouseData.number + 1
                                        selectedHouse = next
                                    },
                                ) {
                                    Icon(Icons.AutoMirrored.Rounded.KeyboardArrowRight, contentDescription = "Next house", tint = KundliColors.Gold)
                                }
                            }
                        }
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            TextButton(
                                onClick = { onOpenSubject(Subject.House(currentHouseData.number), Rung.Explain) },
                                contentPadding = PaddingValues(0.dp),
                            ) {
                                Text("Open reading (Explain) →", color = KundliColors.Teal)
                            }
                            TextButton(
                                onClick = { decoderHouseNumber = currentHouseData.number },
                                contentPadding = PaddingValues(0.dp),
                            ) {
                                Text("Decode 4-step chain", color = KundliColors.Gold)
                            }
                        }
                    }
                } else {
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        items(allPlanets, key = { it.id.name }) { pl ->
                            FilterChip(
                                selected = currentPlanet?.id == pl.id,
                                onClick = {
                                    selectedPlanet = pl.id
                                    selectedHouse = pl.house
                                },
                                label = { Text("${pl.shortGlyph} H${pl.house}") },
                            )
                        }
                    }
                    if (currentPlanet != null) {
                        Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically,
                            ) {
                                Text(
                                    text = "${currentPlanet.id.displayName} in ${currentPlanet.signName} · H${currentPlanet.house}",
                                    style = MaterialTheme.typography.titleMedium,
                                    color = KundliColors.TextMain,
                                )
                                Text(
                                    text = currentPlanet.degreeFormatted,
                                    style = TelemetryNumberStyle,
                                    color = KundliColors.Gold,
                                )
                            }
                            Text(
                                text = buildString {
                                    append(currentPlanet.dignity)
                                    if (currentPlanet.vargottama) append(" · ★ Vargottama (same sign in D1 & D9)")
                                },
                                style = MaterialTheme.typography.bodySmall,
                                color = if (currentPlanet.vargottama) KundliColors.Teal else KundliColors.TextMuted,
                            )
                            TextButton(
                                onClick = { onOpenSubject(Subject.Planet(currentPlanet.id), Rung.Explain) },
                                contentPadding = PaddingValues(0.dp),
                            ) {
                                Text("Open ${currentPlanet.id.displayName} reading →", color = KundliColors.Teal)
                            }
                        }
                    }
                }
            }
        }

        // 6. Explore Shelf (Below First Fold)
        Text(
            text = "Explore",
            style = MaterialTheme.typography.labelMedium,
            color = KundliColors.TextMuted,
        )
        LazyRow(
            horizontalArrangement = Arrangement.spacedBy(10.dp),
            contentPadding = PaddingValues(end = 8.dp),
        ) {
            item {
                ExploreShelfCard("Yogas", "${displayedChart.activeYogas.size} active", KundliColors.Teal) {
                    showYogasSheet = true
                }
            }
            item {
                ExploreShelfCard("Doshas", "Bhanga audit", KundliColors.Gold) { showDoshasSheet = true }
            }
            item {
                ExploreShelfCard("Strengths", "Shadbala & SAV", KundliColors.Teal) { showStrengthsSheet = true }
            }
            item {
                ExploreShelfCard("Divisional charts", "D1–D60", KundliColors.Gold) { showVargasSheet = true }
            }
            item {
                ExploreShelfCard("Chapters", "Dashas & Time", KundliColors.Gold) { onJumpToTimeTab() }
            }
            item {
                ExploreShelfCard("Tools", "Rung 3 Studio", KundliColors.TextMuted) { showToolsRoom = true }
            }
        }
    }

    if (showOptionsSheet) {
        ChartOptionsSheet(
            style = style,
            reference = reference,
            onSelectStyle = { style = it },
            onSelectReference = { reference = it },
            onStartTeachMe = {
                showOptionsSheet = false
                teachMeStep = 1
            },
            onDismiss = { showOptionsSheet = false },
        )
    }

    if (showYogasSheet) {
        YogasSheet(yogas = displayedChart.activeYogas, onDismiss = { showYogasSheet = false })
    }

    if (showDoshasSheet) {
        DoshaAuditSheet(audits = displayedChart.doshaAudits, onDismiss = { showDoshasSheet = false })
    }

    if (showStrengthsSheet) {
        StrengthsSheet(bars = displayedChart.shadbalaBars, houses = displayedChart.houses, onDismiss = { showStrengthsSheet = false })
    }

    if (showVargasSheet) {
        DivisionalChartsSheet(
            selected = selectedVarga,
            onSelectVarga = {
                selectedVarga = it
                showVargasSheet = false
            },
            onDismiss = { showVargasSheet = false },
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

    if (showToolsRoom) {
        ToolsStudioSheet(
            data = toolsData,
            houses = displayedChart.houses,
            onFetchVarshaphalYear = onFetchVarshaphalYear,
            onDismiss = { showToolsRoom = false },
        )
    }
}

@Composable
private fun ExploreShelfCard(
    title: String,
    subtitle: String,
    accent: androidx.compose.ui.graphics.Color,
    onClick: () -> Unit,
) {
    Surface(
        color = KundliColors.Surface,
        shape = RoundedCornerShape(16.dp),
        border = BorderStroke(1.dp, KundliColors.SubtleDivider),
        modifier = Modifier
            .width(136.dp)
            .clickable(onClick = onClick),
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Box(
                modifier = Modifier
                    .size(8.dp)
                    .clip(CircleShape)
                    .background(accent),
            )
            Spacer(Modifier.height(8.dp))
            Text(title, style = MaterialTheme.typography.titleMedium, color = KundliColors.TextMain)
            Text(subtitle, style = MaterialTheme.typography.labelMedium, color = KundliColors.TextMuted)
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
        else -> "3. Timing (When It Wakes)" to "Hold any house to preview Drishti aspects, or check Time for active Dashas."
    }
    Surface(
        color = KundliColors.SurfaceAlt,
        border = BorderStroke(1.dp, KundliColors.Gold),
        shape = RoundedCornerShape(16.dp),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Text(title, style = MaterialTheme.typography.titleMedium, color = KundliColors.Gold)
            Spacer(Modifier.height(4.dp))
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
private fun YogasSheet(yogas: List<YogaDetailItem>, onDismiss: () -> Unit) {
    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = KundliColors.Surface,
        contentColor = KundliColors.TextMain,
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .navigationBarsPadding()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 20.dp, vertical = 12.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Text("Active Yogas (${yogas.size})", style = MaterialTheme.typography.headlineSmall)
            Text(
                text = "Classical Parashari planetary combinations verified in your birth chart.",
                style = MaterialTheme.typography.bodySmall,
                color = KundliColors.TextMuted,
            )
            if (yogas.isEmpty()) {
                Surface(
                    color = KundliColors.SurfaceAlt,
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Text(
                        text = "No headline classical Yogas triggered under strict rule thresholds — individual house lords and Shadbala still reveal clear strengths.",
                        style = MaterialTheme.typography.bodySmall,
                        color = KundliColors.TextMuted,
                        modifier = Modifier.padding(14.dp),
                    )
                }
            } else {
                yogas.forEach { yoga ->
                    Surface(
                        color = KundliColors.SurfaceAlt,
                        border = BorderStroke(1.dp, KundliColors.GoldHairline),
                        shape = RoundedCornerShape(14.dp),
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Column(
                            modifier = Modifier.padding(14.dp),
                            verticalArrangement = Arrangement.spacedBy(4.dp),
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically,
                            ) {
                                Text(yoga.name, style = MaterialTheme.typography.titleMedium, color = KundliColors.Gold)
                                Text(yoga.category, style = MaterialTheme.typography.labelMedium, color = KundliColors.Teal)
                            }
                            if (yoga.planets.isNotBlank()) {
                                Text("Planets: ${yoga.planets}", style = MaterialTheme.typography.labelMedium, color = KundliColors.TextMuted)
                            }
                            Text(yoga.meaning, style = MaterialTheme.typography.bodySmall, color = KundliColors.TextMain)
                        }
                    }
                }
            }
            Spacer(Modifier.height(8.dp))
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
    var step by remember(house.number) { mutableIntStateOf(0) } // 0..3
    val lordPlacement = remember(chart, house.lord) {
        chart.allPlanets().firstOrNull { it.id == house.lord }
    }
    val incomingAspects = remember(chart, house.number) {
        DrishtiCalculator.incomingAspectsToHouse(house.number, chart.houses)
    }

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
            Text(
                text = "PATTERN DECODER · STEP ${step + 1} OF 4 · HOUSE ${house.number}",
                style = MaterialTheme.typography.labelMedium,
                color = KundliColors.Gold,
            )
            LinearProgressIndicator(
                progress = { (step + 1) / 4f },
                modifier = Modifier.fillMaxWidth().height(5.dp).clip(RoundedCornerShape(3.dp)),
                color = KundliColors.Teal,
                trackColor = KundliColors.SurfaceAlt,
            )

            Surface(
                color = KundliColors.SurfaceAlt,
                border = BorderStroke(1.dp, KundliColors.GoldHairline),
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier.fillMaxWidth(),
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    when (step) {
                        0 -> {
                            Text("1. Sign & Atmosphere", style = MaterialTheme.typography.titleMedium, color = KundliColors.TextMain)
                            Text(
                                text = "House ${house.number} falls in ${house.signName}. In Jyotish, the zodiac sign sets the natural style and temperament through which this area of life expresses itself.",
                                style = MaterialTheme.typography.bodyMedium,
                                color = KundliColors.TextMain,
                            )
                            Text(house.summaryLine, style = MaterialTheme.typography.bodySmall, color = KundliColors.Teal)
                        }
                        1 -> {
                            Text("2. Lordship (Who Steers House ${house.number})", style = MaterialTheme.typography.titleMedium, color = KundliColors.TextMain)
                            val lordDetail = if (lordPlacement != null) {
                                "${house.lord.displayName} rules ${house.signName} and sits in House ${lordPlacement.house} (${lordPlacement.signName} · ${lordPlacement.degreeFormatted}, ${lordPlacement.dignity})."
                            } else {
                                "${house.lord.displayName} rules ${house.signName} and links House ${house.number} to House ${house.lordHouse}."
                            }
                            Text(lordDetail, style = MaterialTheme.typography.bodyMedium, color = KundliColors.TextMain)
                            Text(
                                text = "Where the house lord sits shows where this life area draws its practical outcomes.",
                                style = MaterialTheme.typography.bodySmall,
                                color = KundliColors.TextMuted,
                            )
                        }
                        2 -> {
                            Text("3. Occupants & Parashari Drishti", style = MaterialTheme.typography.titleMedium, color = KundliColors.TextMain)
                            val occLine = if (house.planets.isEmpty()) {
                                "Occupants: Empty house (steered cleanly by Lord ${house.lord.displayName})."
                            } else {
                                "Occupants: ${house.planets.joinToString(", ") { "${it.id.displayName} (${it.degreeFormatted})" }}."
                            }
                            val aspLine = if (incomingAspects.isEmpty()) {
                                "Incoming aspects: None."
                            } else {
                                "Incoming Drishti: ${incomingAspects.joinToString(", ") { (p, src) -> "${p.id.displayName} from H$src" }}."
                            }
                            Text(occLine, style = MaterialTheme.typography.bodyMedium, color = KundliColors.TextMain)
                            Text(aspLine, style = MaterialTheme.typography.bodySmall, color = KundliColors.Teal)
                        }
                        else -> {
                            Text("4. Structural Support & Timing", style = MaterialTheme.typography.titleMedium, color = KundliColors.TextMain)
                            val savNote = when {
                                house.savBindus >= 30 -> "Strong structural buffer (${house.savBindus} / 337 SAV bindus — above the 28-point average)."
                                house.savBindus >= 25 -> "Balanced structural support (${house.savBindus} / 337 SAV bindus)."
                                else -> "Deliberate pacing rewarded (${house.savBindus} / 337 SAV bindus — thrives on focused preparation)."
                            }
                            Text(savNote, style = MaterialTheme.typography.bodyMedium, color = KundliColors.TextMain)
                            if (chart.liveTransitMoonHouse == house.number) {
                                Text(
                                    text = "● Today's transiting Moon is lighting up House ${house.number} right now.",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = KundliColors.Teal,
                                )
                            } else {
                                Text(
                                    text = "Check Time to see when ${house.lord.displayName} Mahadasha or Antardasha activates this chain.",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = KundliColors.TextMuted,
                                )
                            }
                        }
                    }
                }
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                if (step > 0) {
                    OutlinedButton(onClick = { step-- }, modifier = Modifier.weight(1f)) {
                        Text("Back")
                    }
                }
                if (step < 3) {
                    Button(
                        onClick = { step++ },
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(containerColor = KundliColors.Gold, contentColor = KundliColors.OrbInk),
                    ) {
                        Text("Next step →")
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
    onSelectStyle: (ChartStyle) -> Unit,
    onSelectReference: (ChartReference) -> Unit,
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

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun DoshaAuditSheet(audits: List<DoshaAuditItem>, onDismiss: () -> Unit) {
    ModalBottomSheet(onDismissRequest = onDismiss, containerColor = KundliColors.Surface, contentColor = KundliColors.TextMain) {
        Column(
            modifier = Modifier.fillMaxWidth().navigationBarsPadding().verticalScroll(rememberScrollState()).padding(horizontal = 20.dp, vertical = 12.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Text("Dosha Audit", style = MaterialTheme.typography.headlineSmall)
            audits.forEach { item ->
                Surface(color = KundliColors.SurfaceAlt, shape = RoundedCornerShape(14.dp), modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text(item.name, style = MaterialTheme.typography.titleMedium)
                            Text(
                                item.status,
                                style = MaterialTheme.typography.labelMedium,
                                color = if (item.bhangaCancelled) KundliColors.Teal else KundliColors.Gold,
                            )
                        }
                        Spacer(Modifier.height(4.dp))
                        Text(item.explanation, style = MaterialTheme.typography.bodySmall, color = KundliColors.TextMuted)
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun StrengthsSheet(bars: List<ShadbalaBarItem>, houses: List<ChartHouseData>, onDismiss: () -> Unit) {
    ModalBottomSheet(onDismissRequest = onDismiss, containerColor = KundliColors.Surface, contentColor = KundliColors.TextMain) {
        Column(
            modifier = Modifier.fillMaxWidth().navigationBarsPadding().verticalScroll(rememberScrollState()).padding(horizontal = 20.dp, vertical = 12.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Text("Strengths (Shadbala & SAV)", style = MaterialTheme.typography.headlineSmall)
            bars.sortedByDescending { it.ratio }.forEach { bar ->
                Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text(bar.planet.displayName, modifier = Modifier.width(70.dp), style = MaterialTheme.typography.bodySmall)
                    LinearProgressIndicator(
                        progress = { (bar.ratio / 1.6f).coerceIn(0f, 1f) },
                        modifier = Modifier.weight(1f).height(8.dp).clip(RoundedCornerShape(4.dp)),
                        color = if (bar.ratio >= 1.0f) KundliColors.Teal else KundliColors.Gold,
                        trackColor = KundliColors.SurfaceAlt,
                    )
                    Text(String.format(Locale.US, "%.2fx", bar.ratio), style = TelemetryNumberStyle)
                }
            }
            HorizontalDivider(color = KundliColors.SubtleDivider)
            Text("Ashtakvarga SAV (337 Bindus Total)", style = MaterialTheme.typography.titleMedium, color = KundliColors.Gold)
            Text(
                houses.joinToString(" · ") { "H${it.number}: ${it.savBindus}" },
                style = TelemetryNumberStyle,
                color = KundliColors.TextMuted,
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun DivisionalChartsSheet(selected: VargaType, onSelectVarga: (VargaType) -> Unit, onDismiss: () -> Unit) {
    ModalBottomSheet(onDismissRequest = onDismiss, containerColor = KundliColors.Surface, contentColor = KundliColors.TextMain) {
        Column(
            modifier = Modifier.fillMaxWidth().navigationBarsPadding().verticalScroll(rememberScrollState()).padding(horizontal = 20.dp, vertical = 12.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Text("Divisional Charts (D1–D60)", style = MaterialTheme.typography.headlineSmall)
            VargaType.entries.forEach { varga ->
                Surface(
                    color = if (varga == selected) KundliColors.SurfaceAlt else KundliColors.BgInk,
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth().clickable { onSelectVarga(varga) },
                ) {
                    Row(modifier = Modifier.padding(12.dp), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text(varga.label, style = TelemetryNumberStyle, color = KundliColors.Gold)
                        Text(varga.domain, style = MaterialTheme.typography.bodySmall, color = KundliColors.TextMain)
                    }
                }
            }
        }
    }
}
