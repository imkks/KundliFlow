package com.kundliflow.app.ui.time

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.IntrinsicSize
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
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
import androidx.compose.material3.FilterChip
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.TabRowDefaults
import androidx.compose.material3.TabRowDefaults.tabIndicatorOffset
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.kundliflow.app.ui.journal.MilestoneUi
import com.kundliflow.app.ui.subject.PlanetId
import com.kundliflow.app.ui.subject.Rung
import com.kundliflow.app.ui.subject.Subject
import com.kundliflow.app.ui.theme.KundliColors
import com.kundliflow.app.ui.theme.TelemetryNumberStyle
import kotlinx.coroutines.launch

@Composable
fun TimeScreen(
    state: TimeTabState,
    milestones: List<MilestoneUi>,
    onOpenPeriodSubject: (Subject, Rung) -> Unit,
    onOpenTimeMachinePage: () -> Unit = {},
    initialTabIndex: Int? = null,
    onInitialTabConsumed: () -> Unit = {},
) {
    val tabs = listOf("Chapters", "Transits")
    val pagerState = rememberPagerState(pageCount = { tabs.size })
    val scope = rememberCoroutineScope()

    LaunchedEffect(initialTabIndex) {
        if (initialTabIndex != null && initialTabIndex in tabs.indices) {
            pagerState.animateScrollToPage(initialTabIndex)
            onInitialTabConsumed()
        }
    }

    Column(modifier = Modifier.fillMaxSize()) {
        TabRow(
            selectedTabIndex = pagerState.currentPage,
            containerColor = KundliColors.BgInk,
            contentColor = KundliColors.Gold,
            indicator = { tabPositions ->
                if (pagerState.currentPage < tabPositions.size) {
                    TabRowDefaults.SecondaryIndicator(
                        modifier = Modifier.tabIndicatorOffset(tabPositions[pagerState.currentPage]),
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
                            style = MaterialTheme.typography.titleMedium,
                            color = if (pagerState.currentPage == idx) KundliColors.Gold else KundliColors.TextMuted,
                        )
                    },
                )
            }
        }

        HorizontalPager(
            state = pagerState,
            modifier = Modifier.weight(1f).fillMaxWidth(),
        ) { page ->
            when (page) {
                0 -> ChaptersSubPage(
                    state = state,
                    milestones = milestones,
                    onOpenPeriodSubject = onOpenPeriodSubject,
                    onOpenTimeMachinePage = onOpenTimeMachinePage,
                    onJumpToTab = { target -> scope.launch { pagerState.animateScrollToPage(target) } },
                )
                else -> TransitsSubPage(state = state)
            }
        }
    }
}

@Composable
private fun ChaptersSubPage(
    state: TimeTabState,
    milestones: List<MilestoneUi>,
    onOpenPeriodSubject: (Subject, Rung) -> Unit,
    onOpenTimeMachinePage: () -> Unit,
    onJumpToTab: (Int) -> Unit,
) {
    var selectedSystem by remember { mutableStateOf(DashaSystem.VIMSHOTTARI) }
    val activeDasha = state.activeDashas[selectedSystem] ?: state.activeDashas.values.first()
    val mahaPct = (activeDasha.mahadashaProgress.coerceIn(0f, 1f) * 100).toInt()
    val antarPct = (activeDasha.antardashaProgress.coerceIn(0f, 1f) * 100).toInt()

    // Compute upcoming Antardashas + next Mahadasha in classical Vimshottari order
    val upcomingLords = remember(activeDasha.mahadashaLord, activeDasha.antardashaLord) {
        val order = VIMSHOTTARI_HORIZON_ORDER.map { it.first }
        val antarIdx = order.indexOfFirst { it.equals(activeDasha.antardashaLord, ignoreCase = true) }.coerceAtLeast(0)
        val mahaIdx = order.indexOfFirst { it.equals(activeDasha.mahadashaLord, ignoreCase = true) }.coerceAtLeast(0)
        listOf(
            Triple(order[(antarIdx + 1) % order.size], "Upcoming Antardasha", false),
            Triple(order[(antarIdx + 2) % order.size], "Following Sub-period", false),
            Triple(order[(mahaIdx + 1) % order.size], "Next Mahadasha Transition", true),
        )
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 20.dp, vertical = 16.dp)
            .padding(bottom = 116.dp),
        verticalArrangement = Arrangement.spacedBy(20.dp),
    ) {
        // 1. Horizontal Dasha System Pill Rail (Stitch)
        LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            items(DashaSystem.entries) { sys ->
                val active = selectedSystem == sys
                Surface(
                    color = if (active) KundliColors.Gold.copy(alpha = 0.14f) else KundliColors.Surface,
                    border = BorderStroke(1.dp, if (active) KundliColors.GoldHairline else KundliColors.SubtleDivider),
                    shape = RoundedCornerShape(999.dp),
                    modifier = Modifier.clickable { selectedSystem = sys },
                ) {
                    Text(
                        text = if (active) "● ${sys.label}" else sys.label,
                        style = MaterialTheme.typography.labelMedium,
                        color = if (active) KundliColors.Gold else KundliColors.TextMuted,
                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 7.dp),
                    )
                }
            }
        }

        // 2. NOW · CHAPTER Hero Card (Stitch time_expansive.png)
        Surface(
            color = KundliColors.Surface,
            border = BorderStroke(1.dp, KundliColors.GoldHairline),
            shape = RoundedCornerShape(22.dp),
            modifier = Modifier
                .fillMaxWidth()
                .clickable { onOpenPeriodSubject(Subject.Period("current"), Rung.Explain) },
        ) {
            Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text("● NOW · CHAPTER", style = MaterialTheme.typography.labelSmall, color = KundliColors.Gold)
                    Surface(
                        color = KundliColors.SurfaceRecessed,
                        border = BorderStroke(1.dp, KundliColors.SubtleDivider),
                        shape = RoundedCornerShape(999.dp),
                    ) {
                        Text(
                            text = activeDasha.mahadashaRange,
                            style = MaterialTheme.typography.labelSmall,
                            color = KundliColors.TextMuted,
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                        )
                    }
                }

                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text(
                        text = "${activeDasha.mahadashaLord.uppercase()} MAHADASHA ·\n${activeDasha.antardashaLord.uppercase()} ANTARDASHA",
                        style = MaterialTheme.typography.headlineMedium,
                        color = KundliColors.TextMain,
                    )
                    Text(
                        text = "Sub-period ${activeDasha.antardashaRange} · Pratyantar: ${activeDasha.pratyantarLord}",
                        style = MaterialTheme.typography.labelMedium,
                        color = KundliColors.Teal,
                    )
                }

                // Dual Sleek Progress Bars (Maha Gold + Antar Teal)
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("Maha: ${activeDasha.mahadashaLord}", style = MaterialTheme.typography.labelMedium, color = KundliColors.Gold)
                            Text("$mahaPct% elapsed", style = TelemetryNumberStyle, color = KundliColors.Gold)
                        }
                        LinearProgressIndicator(
                            progress = { activeDasha.mahadashaProgress.coerceIn(0.04f, 1f) },
                            modifier = Modifier.fillMaxWidth().height(7.dp).clip(RoundedCornerShape(4.dp)),
                            color = KundliColors.Gold,
                            trackColor = KundliColors.SurfaceRecessed,
                        )
                    }
                    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("Antar: ${activeDasha.antardashaLord}", style = MaterialTheme.typography.labelMedium, color = KundliColors.Teal)
                            Text("$antarPct% elapsed", style = TelemetryNumberStyle, color = KundliColors.Teal)
                        }
                        LinearProgressIndicator(
                            progress = { activeDasha.antardashaProgress.coerceIn(0.04f, 1f) },
                            modifier = Modifier.fillMaxWidth().height(7.dp).clip(RoundedCornerShape(4.dp)),
                            color = KundliColors.Teal,
                            trackColor = KundliColors.SurfaceRecessed,
                        )
                    }
                }

                // Recessed Pratyantar Sub-Ruler Pill
                Surface(
                    color = KundliColors.SurfaceRecessed,
                    border = BorderStroke(1.dp, KundliColors.SubtleDivider),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Text(
                        text = "${activeDasha.pratyantarLord} Sub-ruler · Active micro-cycle steering daily emphasis.",
                        style = MaterialTheme.typography.bodySmall,
                        color = KundliColors.Teal,
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 10.dp),
                    )
                }

                // Left Gold-Bordered Editorial Quote Box (Exact height via IntrinsicSize.Min)
                Surface(
                    color = KundliColors.SurfaceRecessed,
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Row(modifier = Modifier.fillMaxWidth().height(IntrinsicSize.Min)) {
                        Box(
                            modifier = Modifier
                                .width(3.dp)
                                .fillMaxHeight()
                                .background(KundliColors.Gold),
                        )
                        Text(
                            text = activeDasha.plainMeaning,
                            style = MaterialTheme.typography.bodyMedium,
                            color = KundliColors.TextMain,
                            modifier = Modifier.padding(14.dp),
                        )
                    }
                }
            }
        }

        // 3. NEXT SHIFT "Diff-Only" Preview Card (Always visible 3-row diff — Stitch time_expansive.png!)
        Surface(
            color = KundliColors.Surface,
            border = BorderStroke(1.dp, KundliColors.SubtleDivider),
            shape = RoundedCornerShape(20.dp),
            modifier = Modifier.fillMaxWidth(),
        ) {
            Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(
                        text = "NEXT SHIFT · ${state.nextShift.shiftDate.uppercase()}",
                        style = MaterialTheme.typography.labelMedium,
                        color = KundliColors.Gold,
                        modifier = Modifier.weight(1f),
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                    )
                    Surface(
                        color = KundliColors.Gold.copy(alpha = 0.14f),
                        border = BorderStroke(1.dp, KundliColors.GoldHairline),
                        shape = RoundedCornerShape(999.dp),
                    ) {
                        Text(
                            text = "Preview Diff",
                            style = MaterialTheme.typography.labelSmall,
                            color = KundliColors.Gold,
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                        )
                    }
                }
                ShiftDiffRow("↘  Winds down", state.nextShift.windsDown, KundliColors.Amber)
                ShiftDiffRow("↗  Wakes up", state.nextShift.wakesUp, KundliColors.Teal)
                ShiftDiffRow("⇄  House shift", state.nextShift.houseFocusShift, KundliColors.Gold)
            }
        }

        // 4. UPCOMING ANTARDASHAS Section (Stitch time_expansive.png)
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text("UPCOMING ANTARDASHAS", style = MaterialTheme.typography.titleLarge, color = KundliColors.TextMain)
                Surface(
                    color = KundliColors.Surface,
                    border = BorderStroke(1.dp, KundliColors.SubtleDivider),
                    shape = RoundedCornerShape(999.dp),
                ) {
                    Text(
                        text = "${activeDasha.mahadashaLord} Maha",
                        style = MaterialTheme.typography.labelSmall,
                        color = KundliColors.Gold,
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                    )
                }
            }
            val renderedUpcoming = if (state.upcomingPeriods.isNotEmpty()) {
                state.upcomingPeriods
            } else {
                upcomingLords.map { (lord, subLabel, isMajor) ->
                    UpcomingDashaItem(
                        title = if (isMajor) "$lord Mahadasha Begins" else "$lord Antardasha",
                        subtitle = subLabel,
                        dateRange = "Explore →",
                        isMajorTransition = isMajor,
                    )
                }
            }
            renderedUpcoming.forEach { item ->
                val isMajor = item.isMajorTransition
                Surface(
                    color = KundliColors.Surface,
                    border = BorderStroke(1.dp, if (isMajor) KundliColors.GoldHairline else KundliColors.SubtleDivider),
                    shape = RoundedCornerShape(16.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable(onClick = onOpenTimeMachinePage),
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth().height(IntrinsicSize.Min),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        if (isMajor) {
                            Box(
                                modifier = Modifier
                                    .width(4.dp)
                                    .fillMaxHeight()
                                    .background(KundliColors.Gold),
                            )
                        }
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 14.dp, vertical = 12.dp),
                            horizontalArrangement = Arrangement.spacedBy(12.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(10.dp)
                                    .clip(CircleShape)
                                    .background(if (isMajor) KundliColors.Gold else KundliColors.Teal),
                            )
                            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                                Text(
                                    text = item.title,
                                    style = MaterialTheme.typography.titleSmall,
                                    color = if (isMajor) KundliColors.Gold else KundliColors.TextMain,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis,
                                )
                                Text(
                                    text = item.subtitle,
                                    style = MaterialTheme.typography.labelSmall,
                                    color = KundliColors.TextMuted,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis,
                                )
                            }
                            Surface(
                                color = KundliColors.SurfaceRecessed,
                                border = BorderStroke(1.dp, KundliColors.SubtleDivider),
                                shape = RoundedCornerShape(999.dp),
                            ) {
                                Text(
                                    text = item.dateRange,
                                    style = MaterialTheme.typography.labelSmall,
                                    color = if (isMajor) KundliColors.Gold else KundliColors.Teal,
                                    maxLines = 1,
                                    softWrap = false,
                                    modifier = Modifier.padding(horizontal = 9.dp, vertical = 4.dp),
                                )
                            }
                        }
                    }
                }
            }
        }

        // 5. 120-YEAR HORIZON RIBBON (Stitch time_expansive.png)
        if (selectedSystem == DashaSystem.VIMSHOTTARI) {
            MahadashaHorizonRibbon(
                activeMahadashaLord = activeDasha.mahadashaLord,
                activeRange = activeDasha.mahadashaRange,
                activeProgress = activeDasha.mahadashaProgress,
                onTapHorizon = onOpenTimeMachinePage,
            )
        }

        // 6. TRANSITS & SKY MOVERS Vertical Cards + Sade Sati Status (Stitch time_expansive.png)
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text("TRANSITS & SKY MOVERS", style = MaterialTheme.typography.titleLarge, color = KundliColors.TextMain)
                Surface(
                    color = KundliColors.Teal.copy(alpha = 0.14f),
                    border = BorderStroke(1.dp, KundliColors.Teal.copy(alpha = 0.4f)),
                    shape = RoundedCornerShape(999.dp),
                    modifier = Modifier.clickable { onJumpToTab(1) },
                ) {
                    Text(
                        text = "LIVE GOCHAR",
                        style = MaterialTheme.typography.labelSmall,
                        color = KundliColors.Teal,
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                    )
                }
            }

            state.skyMovers.take(4).forEach { mover ->
                Surface(
                    color = KundliColors.Surface,
                    border = BorderStroke(1.dp, KundliColors.SubtleDivider),
                    shape = RoundedCornerShape(16.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { onJumpToTab(1) },
                ) {
                    Row(
                        modifier = Modifier.padding(14.dp),
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Surface(
                            color = KundliColors.SurfaceRecessed,
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier.size(38.dp),
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Text(mover.planet.displayName.take(2).uppercase(), style = MaterialTheme.typography.labelMedium, color = KundliColors.Gold)
                            }
                        }
                        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                            Text("${mover.planet.displayName} in ${mover.signName}", style = MaterialTheme.typography.titleSmall, color = KundliColors.TextMain)
                            Text(
                                text = "H${mover.houseFromLagna} natal · Moon H${mover.houseFromMoon} · ${mover.plainMeaning}",
                                style = MaterialTheme.typography.labelSmall,
                                color = KundliColors.TextMuted,
                                maxLines = 2,
                                overflow = TextOverflow.Ellipsis,
                            )
                        }
                        Surface(
                            color = KundliColors.Teal.copy(alpha = 0.14f),
                            shape = RoundedCornerShape(999.dp),
                        ) {
                            Text(
                                text = "H${mover.houseFromLagna}",
                                style = TelemetryNumberStyle,
                                color = KundliColors.Teal,
                                modifier = Modifier.padding(horizontal = 9.dp, vertical = 4.dp),
                            )
                        }
                    }
                }
            }

            // Sade Sati Status Card
            Surface(
                color = KundliColors.Surface,
                border = BorderStroke(1.dp, KundliColors.SubtleDivider),
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { onJumpToTab(1) },
            ) {
                Row(
                    modifier = Modifier.padding(14.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text("Sade Sati Status", style = MaterialTheme.typography.titleSmall, color = KundliColors.TextMain)
                        Text(state.sadeSatiStatus, style = MaterialTheme.typography.bodySmall, color = KundliColors.TextMuted)
                    }
                    Surface(
                        color = KundliColors.Teal.copy(alpha = 0.14f),
                        shape = RoundedCornerShape(999.dp),
                    ) {
                        Text(
                            text = "Transits →",
                            style = MaterialTheme.typography.labelSmall,
                            color = KundliColors.Teal,
                            modifier = Modifier
                                .clickable { onJumpToTab(1) }
                                .padding(horizontal = 10.dp, vertical = 5.dp),
                        )
                    }
                }
            }
        }

        // 7. TIME-MACHINE & MILESTONES Interactive Card (Stitch time_expansive.png)
        Surface(
            color = KundliColors.Surface,
            border = BorderStroke(1.dp, KundliColors.GoldHairline),
            shape = RoundedCornerShape(20.dp),
            modifier = Modifier
                .fillMaxWidth()
                .clickable(onClick = onOpenTimeMachinePage),
        ) {
            Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text("TIME-MACHINE & MILESTONES", style = MaterialTheme.typography.titleLarge, color = KundliColors.TextMain)
                        Text("Test the math on any year (1950–2060)", style = MaterialTheme.typography.bodySmall, color = KundliColors.TextMuted)
                    }
                    Text("Open →", style = MaterialTheme.typography.labelMedium, color = KundliColors.Gold)
                }

                if (milestones.isNotEmpty()) {
                    Text("SAVED MILESTONES", style = MaterialTheme.typography.labelSmall, color = KundliColors.TextMuted)
                    milestones.take(4).chunked(2).forEach { pair ->
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            pair.forEach { ms ->
                                Surface(
                                    color = KundliColors.SurfaceRecessed,
                                    border = BorderStroke(1.dp, KundliColors.SubtleDivider),
                                    shape = RoundedCornerShape(14.dp),
                                    modifier = Modifier
                                        .weight(1f)
                                        .clickable(onClick = onOpenTimeMachinePage),
                                ) {
                                    Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                                        Text(ms.title, style = MaterialTheme.typography.titleSmall, color = KundliColors.TextMain, maxLines = 1, overflow = TextOverflow.Ellipsis)
                                        Text("${ms.eventDate.take(4)} · ${ms.category}", style = MaterialTheme.typography.labelSmall, color = KundliColors.Gold)
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
}

@Composable
private fun ShiftDiffRow(
    label: String,
    value: String,
    accent: Color,
) {
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
            Text(label, style = MaterialTheme.typography.labelMedium, color = accent, modifier = Modifier.weight(0.38f))
            Text(
                text = value,
                style = MaterialTheme.typography.bodySmall,
                color = KundliColors.TextMain,
                modifier = Modifier.weight(0.62f),
            )
        }
    }
}

private val VIMSHOTTARI_HORIZON_ORDER = listOf(
    "Ketu" to 7,
    "Venus" to 20,
    "Sun" to 6,
    "Moon" to 10,
    "Mars" to 7,
    "Rahu" to 18,
    "Jupiter" to 16,
    "Saturn" to 19,
    "Mercury" to 17,
)

@Composable
private fun MahadashaHorizonRibbon(
    activeMahadashaLord: String,
    activeRange: String,
    activeProgress: Float,
    onTapHorizon: () -> Unit,
) {
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text("120-YEAR HORIZON RIBBON", style = MaterialTheme.typography.titleLarge, color = KundliColors.TextMain)
            Text("Scrub cycle", style = MaterialTheme.typography.labelSmall, color = KundliColors.TextMuted)
        }
        Surface(
            color = KundliColors.Surface,
            border = BorderStroke(1.dp, KundliColors.SubtleDivider),
            shape = RoundedCornerShape(18.dp),
            modifier = Modifier
                .fillMaxWidth()
                .clickable(onClick = onTapHorizon),
        ) {
            Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(VIMSHOTTARI_HORIZON_ORDER, key = { it.first }) { (lord, years) ->
                        val isActive = lord.equals(activeMahadashaLord, ignoreCase = true)
                        val cardWidth = (66 + years * 3).dp
                        Surface(
                            color = if (isActive) KundliColors.Gold.copy(alpha = 0.16f) else KundliColors.SurfaceRecessed,
                            border = BorderStroke(
                                if (isActive) 2.dp else 1.dp,
                                if (isActive) KundliColors.Gold else KundliColors.SubtleDivider,
                            ),
                            shape = RoundedCornerShape(14.dp),
                            modifier = Modifier.width(cardWidth).height(80.dp),
                        ) {
                            Column(
                                modifier = Modifier.fillMaxSize().padding(horizontal = 10.dp, vertical = 8.dp),
                                horizontalAlignment = Alignment.CenterHorizontally,
                                verticalArrangement = Arrangement.Center,
                            ) {
                                if (isActive) {
                                    Text("ACTIVE", style = MaterialTheme.typography.labelSmall, color = KundliColors.Gold)
                                }
                                Text(
                                    text = lord,
                                    style = MaterialTheme.typography.titleSmall,
                                    color = if (isActive) KundliColors.Gold else KundliColors.TextMain,
                                    maxLines = 1,
                                )
                                Text(
                                    text = if (isActive) "${years} yrs · ${(activeProgress * 100).toInt()}%" else "$years yrs",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = if (isActive) KundliColors.Teal else KundliColors.TextMuted,
                                    maxLines = 1,
                                )
                            }
                        }
                    }
                }
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                ) {
                    Text("● $activeMahadashaLord ($activeRange)", style = MaterialTheme.typography.labelSmall, color = KundliColors.Gold)
                    Text("Total span: 120 Years", style = MaterialTheme.typography.labelSmall, color = KundliColors.TextMuted)
                }
            }
        }
    }
}

@Composable
private fun TransitsSubPage(state: TimeTabState) {
    var selectedPlanet by remember { mutableStateOf<PlanetId?>(null) }
    val filtered = remember(state.skyMovers, selectedPlanet) {
        if (selectedPlanet == null) state.skyMovers else state.skyMovers.filter { it.planet == selectedPlanet }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 20.dp, vertical = 14.dp)
            .padding(bottom = 100.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Surface(
            color = KundliColors.Surface,
            border = BorderStroke(1.dp, KundliColors.GoldHairline),
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier.fillMaxWidth(),
        ) {
            Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text("SADE SATI", style = MaterialTheme.typography.labelMedium, color = KundliColors.Gold)
                Text(state.sadeSatiStatus, style = MaterialTheme.typography.titleMedium, color = KundliColors.TextMain)
            }
        }

        // Horizontal Planet Filter Rail
        LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            item {
                FilterChip(
                    selected = selectedPlanet == null,
                    onClick = { selectedPlanet = null },
                    label = { Text("All (${state.skyMovers.size})") },
                )
            }
            items(state.skyMovers.map { it.planet }.distinct()) { p ->
                FilterChip(
                    selected = selectedPlanet == p,
                    onClick = { selectedPlanet = if (selectedPlanet == p) null else p },
                    label = { Text(p.displayName) },
                )
            }
        }

        filtered.forEach { mover ->
            Surface(
                color = KundliColors.Surface,
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier.fillMaxWidth(),
            ) {
                Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("${mover.planet.displayName} in ${mover.signName}", style = MaterialTheme.typography.titleMedium, color = KundliColors.TextMain)
                        Text("H${mover.houseFromLagna} Lagna · H${mover.houseFromMoon} Moon", style = TelemetryNumberStyle, color = KundliColors.Gold)
                    }
                    Text(mover.plainMeaning, style = MaterialTheme.typography.bodySmall, color = KundliColors.TextMuted)
                    Text("${mover.vedhaNote} · ${mover.kakshyaLabel}", style = MaterialTheme.typography.labelMedium, color = KundliColors.Teal)
                }
            }
        }
    }
}
