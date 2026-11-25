package com.kundliflow.app.ui.time

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
import androidx.compose.foundation.layout.aspectRatio
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
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.KeyboardArrowLeft
import androidx.compose.material.icons.automirrored.rounded.KeyboardArrowRight
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.TabRowDefaults
import androidx.compose.material3.TabRowDefaults.tabIndicatorOffset
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
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
import java.time.LocalDate
import java.time.YearMonth
import java.time.format.TextStyle
import java.util.Locale

@Composable
fun TimeScreen(
    state: TimeTabState,
    milestones: List<MilestoneUi>,
    isCalendarLoading: Boolean = false,
    onOpenPeriodSubject: (Subject, Rung) -> Unit,
    onChangeCalendarMonth: (year: Int, month: Int) -> Unit,
    onAddDateNote: (dayOfMonth: Int) -> Unit,
    onOpenTimeMachinePage: () -> Unit = {},
    initialTabIndex: Int? = null,
    onInitialTabConsumed: () -> Unit = {},
) {
    val tabs = listOf("Chapters", "Almanac", "Transits")
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
                    milestonesCount = milestones.size,
                    onOpenPeriodSubject = onOpenPeriodSubject,
                    onOpenTimeMachinePage = onOpenTimeMachinePage,
                    onJumpToTab = { target -> scope.launch { pagerState.animateScrollToPage(target) } },
                )
                1 -> AlmanacSubPage(
                    state = state,
                    isCalendarLoading = isCalendarLoading,
                    onChangeCalendarMonth = onChangeCalendarMonth,
                    onAddDateNote = onAddDateNote,
                )
                else -> TransitsSubPage(state = state)
            }
        }
    }
}

@Composable
private fun ChaptersSubPage(
    state: TimeTabState,
    milestonesCount: Int,
    onOpenPeriodSubject: (Subject, Rung) -> Unit,
    onOpenTimeMachinePage: () -> Unit,
    onJumpToTab: (Int) -> Unit,
) {
    var selectedSystem by remember { mutableStateOf(DashaSystem.VIMSHOTTARI) }
    var showNextShiftDelta by remember { mutableStateOf(false) }
    val activeDasha = state.activeDashas[selectedSystem] ?: state.activeDashas.values.first()
    val todayDay = LocalDate.now().dayOfMonth
    val weekPreviewDays = remember(state.monthDays, todayDay) {
        val upcoming = state.monthDays.filter { it.dayOfMonth >= todayDay }.take(7)
        if (upcoming.isNotEmpty()) upcoming else state.monthDays.take(7)
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 20.dp, vertical = 16.dp)
            .padding(bottom = 112.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        // Horizontal Dasha System Rail
        LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            items(DashaSystem.entries) { sys ->
                FilterChip(
                    selected = selectedSystem == sys,
                    onClick = { selectedSystem = sys },
                    label = { Text(sys.label) },
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = KundliColors.SurfaceAlt,
                        selectedLabelColor = KundliColors.Gold,
                    ),
                )
            }
        }

        // 1. Now Card with Pattern-style Circular Progress Rings
        Surface(
            color = KundliColors.Surface,
            border = BorderStroke(1.dp, KundliColors.GoldHairline),
            shape = RoundedCornerShape(20.dp),
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
                    Text("NOW · ACTIVE CHAPTER", style = MaterialTheme.typography.labelMedium, color = KundliColors.Gold)
                    Text("Read full →", style = MaterialTheme.typography.labelMedium, color = KundliColors.Teal)
                }

                // Dual Circular Countdown Rings (Mahadasha + Antardasha)
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(14.dp),
                ) {
                    ChapterRingStat(
                        title = activeDasha.mahadashaLord,
                        subtitle = "Mahadasha",
                        rangeLabel = activeDasha.mahadashaRange,
                        progress = activeDasha.mahadashaProgress,
                        ringColor = KundliColors.Gold,
                        modifier = Modifier.weight(1f),
                    )
                    ChapterRingStat(
                        title = activeDasha.antardashaLord,
                        subtitle = "Antardasha",
                        rangeLabel = activeDasha.antardashaRange,
                        progress = activeDasha.antardashaProgress,
                        ringColor = KundliColors.Teal,
                        modifier = Modifier.weight(1f),
                    )
                }

                Text(
                    text = "Pratyantar: ${activeDasha.pratyantarLord}",
                    style = MaterialTheme.typography.labelMedium,
                    color = KundliColors.TextMuted,
                )
                Text(
                    text = activeDasha.plainMeaning,
                    style = MaterialTheme.typography.bodyMedium,
                    color = KundliColors.TextMain,
                )
            }
        }

        // 2. Next Shift Interactive Card (1-line teaser visible + 1-tap expand for 3-row diff)
        Surface(
            color = KundliColors.Surface,
            border = BorderStroke(1.dp, KundliColors.SubtleDivider),
            shape = RoundedCornerShape(18.dp),
            modifier = Modifier
                .fillMaxWidth()
                .clickable { showNextShiftDelta = !showNextShiftDelta },
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text("NEXT SHIFT", style = MaterialTheme.typography.labelMedium, color = KundliColors.Teal)
                        Text(state.nextShift.shiftDate, style = MaterialTheme.typography.titleMedium, color = KundliColors.TextMain)
                    }
                    Text(
                        text = if (showNextShiftDelta) "Hide ▲" else "Preview ▾",
                        style = MaterialTheme.typography.labelMedium,
                        color = KundliColors.Gold,
                    )
                }
                if (!showNextShiftDelta) {
                    Text(
                        text = "Wakes up: ${state.nextShift.wakesUp}",
                        style = MaterialTheme.typography.bodySmall,
                        color = KundliColors.TextMuted,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                    )
                }
                AnimatedVisibility(visible = showNextShiftDelta) {
                    Surface(
                        color = KundliColors.SurfaceAlt,
                        shape = RoundedCornerShape(14.dp),
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                            DeltaRow("Winds down", state.nextShift.windsDown)
                            DeltaRow("Wakes up", state.nextShift.wakesUp)
                            DeltaRow("House shift", state.nextShift.houseFocusShift)
                        }
                    }
                }
            }
        }

        // 3. 2-Up Cross-Tab Bento Row (This Week's Rhythm + Sade Sati & Transits)
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Surface(
                color = KundliColors.Surface,
                border = BorderStroke(1.dp, KundliColors.SubtleDivider),
                shape = RoundedCornerShape(18.dp),
                modifier = Modifier
                    .weight(1f)
                    .clickable { onJumpToTab(1) },
            ) {
                Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("THIS WEEK", style = MaterialTheme.typography.labelMedium, color = KundliColors.Gold)
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        weekPreviewDays.forEach { day ->
                            Box(
                                modifier = Modifier
                                    .size(12.dp)
                                    .clip(CircleShape)
                                    .background(day.band.color),
                            )
                        }
                    }
                    Text(
                        text = state.monthTitle,
                        style = MaterialTheme.typography.bodySmall,
                        color = KundliColors.TextMuted,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                    )
                    Text("Almanac →", style = MaterialTheme.typography.labelMedium, color = KundliColors.Teal)
                }
            }

            Surface(
                color = KundliColors.Surface,
                border = BorderStroke(1.dp, KundliColors.SubtleDivider),
                shape = RoundedCornerShape(18.dp),
                modifier = Modifier
                    .weight(1f)
                    .clickable { onJumpToTab(2) },
            ) {
                Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text("SADE SATI", style = MaterialTheme.typography.labelMedium, color = KundliColors.Teal)
                    Text(
                        text = state.sadeSatiStatus,
                        style = MaterialTheme.typography.titleSmall,
                        color = KundliColors.TextMain,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis,
                    )
                    Text("All ${state.skyMovers.size} transits →", style = MaterialTheme.typography.labelMedium, color = KundliColors.Gold)
                }
            }
        }

        // 4. The Pattern-style Horizontal Swipeable Sky Movers Deck
        if (state.skyMovers.isNotEmpty()) {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text("ACTIVE SKY MOVERS", style = MaterialTheme.typography.labelMedium, color = KundliColors.TextMuted)
                    Text(
                        text = "See all →",
                        style = MaterialTheme.typography.labelMedium,
                        color = KundliColors.Gold,
                        modifier = Modifier.clickable { onJumpToTab(2) },
                    )
                }
                LazyRow(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    items(state.skyMovers.take(5), key = { it.planet.name }) { mover ->
                        Surface(
                            color = KundliColors.Surface,
                            border = BorderStroke(1.dp, KundliColors.SubtleDivider),
                            shape = RoundedCornerShape(18.dp),
                            modifier = Modifier
                                .width(224.dp)
                                .clickable { onJumpToTab(2) },
                        ) {
                            Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                ) {
                                    Text(
                                        text = "${mover.planet.displayName} in ${mover.signName}",
                                        style = MaterialTheme.typography.titleSmall,
                                        color = KundliColors.Gold,
                                    )
                                    Text(
                                        text = "H${mover.houseFromLagna}",
                                        style = TelemetryNumberStyle,
                                        color = KundliColors.Teal,
                                    )
                                }
                                Text(
                                    text = "Moon House ${mover.houseFromMoon} · ${mover.kakshyaLabel}",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = KundliColors.TextMuted,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis,
                                )
                                Text(
                                    text = mover.plainMeaning,
                                    style = MaterialTheme.typography.bodySmall,
                                    color = KundliColors.TextMain,
                                    maxLines = 2,
                                    overflow = TextOverflow.Ellipsis,
                                )
                            }
                        }
                    }
                }
            }
        }

        // 5. Dedicated Full-Page Entry Card for Time-Machine & Milestones
        Surface(
            color = KundliColors.SurfaceAlt,
            border = BorderStroke(1.dp, KundliColors.GoldHairline),
            shape = RoundedCornerShape(18.dp),
            modifier = Modifier
                .fillMaxWidth()
                .clickable(onClick = onOpenTimeMachinePage),
        ) {
            Row(
                modifier = Modifier.padding(16.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text("Time-Machine & Milestones", style = MaterialTheme.typography.titleMedium, color = KundliColors.TextMain)
                    Text(
                        text = if (milestonesCount > 0) "$milestonesCount saved milestones · Scrub any year 1950–2060" else "Revisit any past or future year (1950–2060)",
                        style = MaterialTheme.typography.bodySmall,
                        color = KundliColors.TextMuted,
                    )
                }
                Text("Open →", style = MaterialTheme.typography.labelMedium, color = KundliColors.Gold)
            }
        }
    }
}

@Composable
private fun ChapterRingStat(
    title: String,
    subtitle: String,
    rangeLabel: String,
    progress: Float,
    ringColor: Color,
    modifier: Modifier = Modifier,
) {
    val pct = (progress.coerceIn(0f, 1f) * 100).toInt()
    Surface(
        color = KundliColors.SurfaceAlt,
        shape = RoundedCornerShape(14.dp),
        modifier = modifier,
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            horizontalArrangement = Arrangement.spacedBy(10.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Box(contentAlignment = Alignment.Center, modifier = Modifier.size(44.dp)) {
                CircularProgressIndicator(
                    progress = { progress.coerceIn(0.05f, 1f) },
                    modifier = Modifier.size(44.dp),
                    color = ringColor,
                    trackColor = KundliColors.BgInk,
                    strokeWidth = 4.dp,
                )
                Text("$pct%", style = MaterialTheme.typography.labelSmall, color = ringColor)
            }
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Text(subtitle.uppercase(), style = MaterialTheme.typography.labelSmall, color = KundliColors.TextMuted)
                Text(title, style = MaterialTheme.typography.titleSmall, color = KundliColors.TextMain, maxLines = 1, overflow = TextOverflow.Ellipsis)
                Text(rangeLabel, style = MaterialTheme.typography.labelSmall, color = KundliColors.TextMuted, maxLines = 1, overflow = TextOverflow.Ellipsis)
            }
        }
    }
}

@Composable
private fun AlmanacSubPage(
    state: TimeTabState,
    isCalendarLoading: Boolean,
    onChangeCalendarMonth: (year: Int, month: Int) -> Unit,
    onAddDateNote: (dayOfMonth: Int) -> Unit,
) {
    var selectedPurpose by remember { mutableStateOf("All") }
    var selectedDay by remember(state.calendarYear, state.calendarMonth, state.monthDays) {
        val today = LocalDate.now()
        val defaultCell = if (today.year == state.calendarYear && today.monthValue == state.calendarMonth) {
            state.monthDays.firstOrNull { it.dayOfMonth == today.dayOfMonth }
        } else null
        mutableStateOf(defaultCell ?: state.monthDays.firstOrNull())
    }
    val currentYm = YearMonth.of(state.calendarYear, state.calendarMonth)
    val nearbyMonths = remember(state.calendarYear, state.calendarMonth) {
        (-2L..3L).map { currentYm.plusMonths(it) }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 20.dp, vertical = 14.dp)
            .padding(bottom = 100.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        // Horizontal Nearby-Months Rail
        LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            items(nearbyMonths) { ym ->
                val active = ym.year == state.calendarYear && ym.monthValue == state.calendarMonth
                FilterChip(
                    selected = active,
                    onClick = { onChangeCalendarMonth(ym.year, ym.monthValue) },
                    label = {
                        Text("${ym.month.getDisplayName(TextStyle.SHORT, Locale.getDefault())} ${ym.year}")
                    },
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = KundliColors.SurfaceAlt,
                        selectedLabelColor = KundliColors.Gold,
                    ),
                )
            }
        }

        // Purpose Filter Rail
        LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp), contentPadding = PaddingValues(end = 6.dp)) {
            items(listOf("All", "Career", "Travel", "Finance", "Rest")) { purpose ->
                FilterChip(
                    selected = selectedPurpose == purpose,
                    onClick = { selectedPurpose = purpose },
                    label = { Text(purpose) },
                )
            }
        }

        // Month Calendar Surface
        Surface(
            color = KundliColors.Surface,
            shape = RoundedCornerShape(18.dp),
            modifier = Modifier.fillMaxWidth(),
        ) {
            Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    IconButton(onClick = {
                        val prev = currentYm.minusMonths(1)
                        onChangeCalendarMonth(prev.year, prev.monthValue)
                    }) {
                        Icon(Icons.AutoMirrored.Rounded.KeyboardArrowLeft, contentDescription = "Previous month", tint = KundliColors.Gold)
                    }
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text(state.monthTitle, style = MaterialTheme.typography.titleMedium, color = KundliColors.TextMain)
                        if (isCalendarLoading) {
                            CircularProgressIndicator(modifier = Modifier.size(14.dp), strokeWidth = 2.dp, color = KundliColors.Gold)
                        }
                    }
                    IconButton(onClick = {
                        val next = currentYm.plusMonths(1)
                        onChangeCalendarMonth(next.year, next.monthValue)
                    }) {
                        Icon(Icons.AutoMirrored.Rounded.KeyboardArrowRight, contentDescription = "Next month", tint = KundliColors.Gold)
                    }
                }

                state.monthDays.chunked(7).forEach { week ->
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        week.forEach { day ->
                            val matches = selectedPurpose == "All" || day.purposes.contains(selectedPurpose)
                            val isSelected = selectedDay?.dayOfMonth == day.dayOfMonth
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .aspectRatio(1f)
                                    .clip(RoundedCornerShape(10.dp))
                                    .background(
                                        if (matches) day.band.color.copy(alpha = if (isSelected) 0.38f else 0.16f)
                                        else KundliColors.BgInk,
                                    )
                                    .clickable { selectedDay = day },
                                contentAlignment = Alignment.Center,
                            ) {
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Text(
                                        text = "${day.dayOfMonth}",
                                        style = TelemetryNumberStyle,
                                        color = if (matches) KundliColors.TextMain else KundliColors.TextMuted,
                                    )
                                    if (day.hasNoteOrMilestone) {
                                        Box(
                                            modifier = Modifier.size(4.dp).clip(CircleShape).background(KundliColors.Gold),
                                        )
                                    }
                                }
                            }
                        }
                        repeat(7 - week.size) { Spacer(Modifier.weight(1f)) }
                    }
                }

                selectedDay?.let { day ->
                    Surface(
                        color = KundliColors.SurfaceAlt,
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Row(
                            modifier = Modifier.padding(12.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text("Day ${day.dayOfMonth} · ${day.band.label}", style = MaterialTheme.typography.titleMedium, color = day.band.color)
                                Text(day.summary, style = MaterialTheme.typography.bodySmall, color = KundliColors.TextMuted)
                            }
                            TextButton(onClick = { onAddDateNote(day.dayOfMonth) }) {
                                Text("+ Date Note", color = KundliColors.Gold)
                            }
                        }
                    }
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

@Composable
private fun DeltaRow(label: String, value: String) {
    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(label, style = MaterialTheme.typography.labelMedium, color = KundliColors.TextMuted)
        Text(value, style = MaterialTheme.typography.bodySmall, color = KundliColors.TextMain)
    }
}
