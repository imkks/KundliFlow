package com.kundliflow.app.ui.journal

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
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
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedTextField
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
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.kundliflow.app.ui.theme.KundliColors
import com.kundliflow.app.ui.theme.TelemetryNumberStyle
import com.kundliflow.app.ui.time.TimeTabState
import com.kundliflow.app.ui.today.SkyBand
import kotlinx.coroutines.launch
import java.time.Instant
import java.time.LocalDate
import java.time.YearMonth
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.time.format.TextStyle
import java.util.Locale

private fun humanDateHeader(isoDate: String): String = runCatching {
    val d = LocalDate.parse(isoDate.take(10))
    val today = LocalDate.now()
    when (d) {
        today -> "TODAY"
        today.minusDays(1) -> "YESTERDAY"
        else -> d.format(DateTimeFormatter.ofPattern("EEE d MMM", Locale.getDefault())).uppercase()
    }
}.getOrDefault(isoDate)

private fun format24hTime(createdAtMillis: Long): String = runCatching {
    if (createdAtMillis <= 0L) "" else {
        val lt = Instant.ofEpochMilli(createdAtMillis).atZone(ZoneId.systemDefault()).toLocalTime()
        String.format(Locale.US, "%02d:%02d", lt.hour, lt.minute)
    }
}.getOrDefault("")

@Composable
fun JournalScreen(
    entries: List<JournalEntryUi>,
    milestones: List<MilestoneUi>,
    daysLoggedThisWeek: Set<Int>, // 0=Mon .. 6=Sun
    weeklyGoal: Int,
    onTapSkySnapshot: (FrozenSkySnapshot) -> Unit,
    onSubmitCheckIn: (mood: Int, energy: Int, kind: String, tags: List<String>, note: String) -> Unit,
    timeState: TimeTabState? = null,
    isCalendarLoading: Boolean = false,
    onChangeCalendarMonth: (year: Int, month: Int) -> Unit = { _, _ -> },
    initialTabIndex: Int? = null,
    onInitialTabConsumed: () -> Unit = {},
    externalOpenComposer: Boolean = false,
    onExternalComposerHandled: () -> Unit = {},
) {
    val tabs = listOf("Reflections", "Almanac")
    val pagerState = rememberPagerState(pageCount = { tabs.size })
    val scope = rememberCoroutineScope()

    var activeFilter by remember { mutableStateOf(JournalFilter.ALL) }
    var selectedTag by remember { mutableStateOf<String?>(null) }
    var showComposer by remember { mutableStateOf(false) }

    LaunchedEffect(initialTabIndex) {
        if (initialTabIndex != null && initialTabIndex in tabs.indices) {
            pagerState.animateScrollToPage(initialTabIndex)
            onInitialTabConsumed()
        }
    }

    if (externalOpenComposer && !showComposer) {
        showComposer = true
        onExternalComposerHandled()
    }

    val patternStage = remember(entries) { JournalPatternsCalculator.computeCalibrationStage(entries) }
    val bandAverages = remember(entries) {
        SkyBand.entries.map { band ->
            val matching = entries.filter { it.sky.band == band }
            val avg = if (matching.isEmpty()) 0f else matching.map { it.mood }.average().toFloat()
            Triple(band, avg, matching.size)
        }
    }
    val dayBandByWeekday = remember(entries) {
        val map = mutableMapOf<Int, SkyBand>()
        val today = LocalDate.now()
        val monday = today.minusDays((today.dayOfWeek.value - 1).toLong())
        entries.forEach { e ->
            val d = runCatching { LocalDate.parse(e.timestampLabel.take(10)) }.getOrNull()
            if (d != null && !d.isBefore(monday) && !d.isAfter(monday.plusDays(6))) {
                val idx = d.dayOfWeek.value - 1
                if (!map.containsKey(idx)) map[idx] = e.sky.band
            }
        }
        map
    }
    var expandPatterns by remember { mutableStateOf(false) }
    var showPatternMath by remember { mutableStateOf(false) }

    val filteredEntries = remember(entries, activeFilter, selectedTag) {
        if (activeFilter == JournalFilter.MILESTONES) emptyList()
        else entries.filter { selectedTag == null || it.tags.contains(selectedTag) }
    }
    val groupedEntries = remember(filteredEntries) {
        filteredEntries.groupBy { humanDateHeader(it.timestampLabel) }
    }
    val filteredMilestones = remember(milestones, activeFilter) {
        if (activeFilter == JournalFilter.ENTRIES) emptyList() else milestones
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
            if (page == 1 && timeState != null) {
                JournalAlmanacSubPage(
                    state = timeState,
                    isCalendarLoading = isCalendarLoading,
                    onChangeCalendarMonth = onChangeCalendarMonth,
                    onAddDateNote = { showComposer = true },
                )
            } else {
                Box(modifier = Modifier.fillMaxSize()) {
                    LazyColumn(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(horizontal = 20.dp),
                        verticalArrangement = Arrangement.spacedBy(16.dp),
                    ) {
            // 1. Your Sky Patterns · Calibration Explorer Card (Stitch journal_expansive.png)
            item {
                val remaining = (30 - entries.size).coerceAtLeast(0)
                Surface(
                    color = KundliColors.Surface,
                    border = BorderStroke(1.dp, KundliColors.GoldHairline),
                    shape = RoundedCornerShape(20.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 6.dp)
                        .clickable { expandPatterns = !expandPatterns },
                ) {
                    Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.Top,
                        ) {
                            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                Text(
                                    text = "Your Sky Patterns · Calibration",
                                    style = MaterialTheme.typography.titleMedium,
                                    color = KundliColors.TextMain,
                                )
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                                ) {
                                    Surface(
                                        color = KundliColors.Gold.copy(alpha = 0.14f),
                                        shape = RoundedCornerShape(999.dp),
                                    ) {
                                        Text(
                                            text = "${entries.size} of 30 entries logged",
                                            style = MaterialTheme.typography.labelSmall,
                                            color = KundliColors.Gold,
                                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp),
                                        )
                                    }
                                    Text("· No deadline", style = MaterialTheme.typography.labelSmall, color = KundliColors.TextMuted)
                                }
                            }
                            Surface(
                                color = KundliColors.SurfaceRecessed,
                                border = BorderStroke(1.dp, KundliColors.GoldHairline),
                                shape = RoundedCornerShape(10.dp),
                                modifier = Modifier.clickable {
                                    expandPatterns = true
                                    showPatternMath = !showPatternMath
                                },
                            ) {
                                Text(
                                    text = if (showPatternMath) "Hide math" else "Show math",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = KundliColors.Gold,
                                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp),
                                )
                            }
                        }

                        Text(
                            text = patternStage.body,
                            style = MaterialTheme.typography.bodySmall,
                            color = KundliColors.TextMain,
                            maxLines = if (expandPatterns) 10 else 3,
                            overflow = TextOverflow.Ellipsis,
                        )

                        // Recessed Dark Band Comparison Bars Box (Stitch)
                        Surface(
                            color = KundliColors.SurfaceRecessed,
                            border = BorderStroke(1.dp, KundliColors.SubtleDivider),
                            shape = RoundedCornerShape(14.dp),
                            modifier = Modifier.fillMaxWidth(),
                        ) {
                            Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                bandAverages.forEach { (band, avg, count) ->
                                    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.SpaceBetween,
                                            verticalAlignment = Alignment.CenterVertically,
                                        ) {
                                            Text("● ${band.label} hours", style = MaterialTheme.typography.labelSmall, color = band.color)
                                            Text(
                                                text = if (count > 0) "${String.format(Locale.US, "%.1f", avg)} / 5" else "—",
                                                style = TelemetryNumberStyle,
                                                color = KundliColors.TextMain,
                                            )
                                        }
                                        LinearProgressIndicator(
                                            progress = { if (count > 0) (avg / 5f).coerceIn(0.06f, 1f) else 0.04f },
                                            modifier = Modifier.fillMaxWidth().height(7.dp).clip(RoundedCornerShape(4.dp)),
                                            color = if (count > 0) band.color else KundliColors.SubtleDivider,
                                            trackColor = KundliColors.Surface,
                                        )
                                    }
                                }
                            }
                        }

                        AnimatedVisibility(visible = showPatternMath && patternStage.mathDetail != null) {
                            Text(
                                text = patternStage.mathDetail.orEmpty(),
                                style = MaterialTheme.typography.labelMedium,
                                color = KundliColors.Teal,
                            )
                        }

                        // Calibration Unlock Progress Banner (Stitch)
                        Surface(
                            color = KundliColors.SurfaceRecessed,
                            border = BorderStroke(1.dp, KundliColors.SubtleDivider),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.fillMaxWidth(),
                        ) {
                            Text(
                                text = if (remaining > 0) {
                                    "✦ $remaining more entries to unlock 95% Bootstrap CI calibration"
                                } else {
                                    "✓ 95% Bootstrap CI personal sky calibration unlocked"
                                },
                                style = MaterialTheme.typography.labelSmall,
                                color = if (remaining > 0) KundliColors.Gold else KundliColors.Teal,
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 9.dp),
                            )
                        }
                    }
                }
            }

            // 2. Weekly Rhythm Dots (Monday reset, color-coded by each day's SkyBand)
            item {
                WeeklyRhythmCard(
                    daysLogged = daysLoggedThisWeek,
                    dayBandByWeekday = dayBandByWeekday,
                    goal = weeklyGoal,
                )
            }

            // 3. Filter Strip
            item {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    JournalFilter.entries.forEach { filter ->
                        FilterChip(
                            selected = activeFilter == filter,
                            onClick = { activeFilter = filter },
                            label = { Text(filter.label) },
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = KundliColors.SurfaceAlt,
                                selectedLabelColor = KundliColors.Gold,
                            ),
                        )
                    }
                    if (selectedTag != null) {
                        FilterChip(
                            selected = true,
                            onClick = { selectedTag = null },
                            label = { Text("#$selectedTag ×") },
                        )
                    }
                }
            }

            // 4. Named Empty State or Unified Timeline
            if (filteredEntries.isEmpty() && filteredMilestones.isEmpty()) {
                item {
                    Surface(
                        color = KundliColors.Surface,
                        border = BorderStroke(1.dp, KundliColors.GoldHairline),
                        shape = RoundedCornerShape(18.dp),
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Column(
                            modifier = Modifier.padding(22.dp),
                            horizontalAlignment = Alignment.CenterHorizontally,
                        ) {
                            Text(
                                text = "Your first entry will capture this exact sky. It never comes back.",
                                style = MaterialTheme.typography.bodyMedium,
                                color = KundliColors.TextMain,
                            )
                            Spacer(Modifier.height(14.dp))
                            Button(
                                onClick = { showComposer = true },
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = KundliColors.Gold,
                                    contentColor = KundliColors.OrbInk,
                                ),
                            ) {
                                Text("Check in now")
                            }
                        }
                    }
                }
            } else {
                items(filteredMilestones, key = { "ms_${it.id}" }) { milestone ->
                    Surface(
                        color = KundliColors.Surface,
                        border = BorderStroke(1.dp, KundliColors.GoldHairline),
                        shape = RoundedCornerShape(18.dp),
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth().height(IntrinsicSize.Min),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Box(
                                modifier = Modifier
                                    .width(4.dp)
                                    .fillMaxHeight()
                                    .background(KundliColors.Gold),
                            )
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(16.dp),
                                verticalArrangement = Arrangement.spacedBy(4.dp),
                            ) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically,
                                ) {
                                    Text("${milestone.eventDate} Milestone", style = MaterialTheme.typography.labelMedium, color = KundliColors.Gold)
                                    Surface(
                                        color = KundliColors.Gold.copy(alpha = 0.14f),
                                        shape = RoundedCornerShape(999.dp),
                                    ) {
                                        Text(
                                            text = milestone.category,
                                            style = MaterialTheme.typography.labelSmall,
                                            color = KundliColors.Gold,
                                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp),
                                        )
                                    }
                                }
                                Text(
                                    text = milestone.title.uppercase(),
                                    style = MaterialTheme.typography.titleLarge,
                                    color = KundliColors.TextMain,
                                )
                            }
                        }
                    }
                }

                groupedEntries.forEach { (dateHeader, dayEntries) ->
                    item(key = "hdr_$dateHeader") {
                        Row(
                            modifier = Modifier.fillMaxWidth().padding(top = 4.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Text("● $dateHeader", style = MaterialTheme.typography.labelMedium, color = KundliColors.Gold)
                            Text("${dayEntries.size} log${if (dayEntries.size == 1) "" else "s"}", style = MaterialTheme.typography.labelSmall, color = KundliColors.TextMuted)
                        }
                    }
                    items(dayEntries, key = { it.id }) { entry ->
                        JournalEntryCard(
                            entry = entry,
                            onTapSky = { onTapSkySnapshot(entry.sky) },
                            onTapTag = { selectedTag = it },
                        )
                    }
                }
            }

            item { Spacer(Modifier.height(148.dp)) }
        }

        // Floating Solid Gold "+ Check in" Pill (Stitch journal_expansive.png)
        Button(
            onClick = { showComposer = true },
            shape = RoundedCornerShape(999.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor = KundliColors.Gold,
                contentColor = KundliColors.OrbInk,
            ),
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(end = 20.dp, bottom = 98.dp),
        ) {
            Text("+ Check in", style = MaterialTheme.typography.labelLarge)
        }
    }
            }
        }
    }

    if (showComposer) {
        ProgressiveComposerSheet(
            onSubmit = { mood, energy, kind, tags, note ->
                showComposer = false
                onSubmitCheckIn(mood, energy, kind, tags, note)
            },
            onDismiss = { showComposer = false },
        )
    }
}

@Composable
private fun JournalAlmanacSubPage(
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
            .padding(bottom = 116.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        // Horizontal Nearby-Months Pill Rail
        LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            items(nearbyMonths) { ym ->
                val active = ym.year == state.calendarYear && ym.monthValue == state.calendarMonth
                Surface(
                    color = if (active) KundliColors.Gold.copy(alpha = 0.16f) else KundliColors.Surface,
                    border = BorderStroke(1.dp, if (active) KundliColors.Gold else KundliColors.SubtleDivider),
                    shape = RoundedCornerShape(999.dp),
                    modifier = Modifier.clickable { onChangeCalendarMonth(ym.year, ym.monthValue) },
                ) {
                    Text(
                        text = "${if (active) "● " else ""}${ym.month.getDisplayName(TextStyle.SHORT, Locale.getDefault())} ${ym.year}",
                        style = MaterialTheme.typography.labelMedium,
                        color = if (active) KundliColors.Gold else KundliColors.TextMuted,
                        modifier = Modifier.padding(horizontal = 13.dp, vertical = 7.dp),
                    )
                }
            }
        }

        // Purpose Filter Pill Rail
        LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp), contentPadding = PaddingValues(end = 6.dp)) {
            items(listOf("All", "Career", "Travel", "Finance", "Rest")) { purpose ->
                val active = selectedPurpose == purpose
                Surface(
                    color = if (active) KundliColors.Teal.copy(alpha = 0.16f) else KundliColors.SurfaceRecessed,
                    border = BorderStroke(1.dp, if (active) KundliColors.Teal.copy(alpha = 0.55f) else KundliColors.SubtleDivider),
                    shape = RoundedCornerShape(999.dp),
                    modifier = Modifier.clickable { selectedPurpose = purpose },
                ) {
                    Text(
                        text = purpose,
                        style = MaterialTheme.typography.labelSmall,
                        color = if (active) KundliColors.Teal else KundliColors.TextMuted,
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                    )
                }
            }
        }

        // Month Calendar Surface
        Surface(
            color = KundliColors.Surface,
            border = BorderStroke(1.dp, KundliColors.GoldHairline),
            shape = RoundedCornerShape(20.dp),
            modifier = Modifier.fillMaxWidth(),
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
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
                        Text(state.monthTitle.uppercase(), style = MaterialTheme.typography.titleLarge, color = KundliColors.TextMain)
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

                // Day Grid
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
                                        if (matches) day.band.color.copy(alpha = if (isSelected) 0.34f else 0.14f)
                                        else KundliColors.SurfaceRecessed,
                                    )
                                    .border(
                                        width = if (isSelected) 1.5.dp else 1.dp,
                                        color = if (isSelected) KundliColors.Gold else if (matches) day.band.color.copy(alpha = 0.35f) else KundliColors.SubtleDivider,
                                        shape = RoundedCornerShape(10.dp),
                                    )
                                    .clickable { selectedDay = day },
                                contentAlignment = Alignment.Center,
                            ) {
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Text(
                                        text = "${day.dayOfMonth}",
                                        style = TelemetryNumberStyle,
                                        color = if (matches) KundliColors.TextMain else KundliColors.TextMuted.copy(alpha = 0.5f),
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
                        color = KundliColors.SurfaceRecessed,
                        border = BorderStroke(1.dp, KundliColors.GoldHairline),
                        shape = RoundedCornerShape(14.dp),
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Row(
                            modifier = Modifier.padding(14.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                                Text("Day ${day.dayOfMonth} · ${day.band.label}", style = MaterialTheme.typography.titleSmall, color = day.band.color)
                                Text(day.summary, style = MaterialTheme.typography.bodySmall, color = KundliColors.TextMuted)
                            }
                            Surface(
                                color = KundliColors.Gold.copy(alpha = 0.14f),
                                border = BorderStroke(1.dp, KundliColors.GoldHairline),
                                shape = RoundedCornerShape(10.dp),
                                modifier = Modifier.clickable { onAddDateNote(day.dayOfMonth) },
                            ) {
                                Text(
                                    text = "+ Note",
                                    style = MaterialTheme.typography.labelMedium,
                                    color = KundliColors.Gold,
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

@Composable
private fun WeeklyRhythmCard(
    daysLogged: Set<Int>,
    dayBandByWeekday: Map<Int, SkyBand> = emptyMap(),
    goal: Int,
) {
    val labels = listOf("M", "T", "W", "T", "F", "S", "S")
    Surface(
        color = KundliColors.Surface,
        border = BorderStroke(1.dp, KundliColors.SubtleDivider),
        shape = RoundedCornerShape(18.dp),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text("This week", style = MaterialTheme.typography.titleMedium, color = KundliColors.TextMain)
                Text(
                    text = "${daysLogged.size} of 7 days logged (Mon reset)",
                    style = MaterialTheme.typography.labelSmall,
                    color = KundliColors.Teal,
                )
            }
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
            ) {
                labels.forEachIndexed { idx, letter ->
                    val filled = daysLogged.contains(idx)
                    val band = dayBandByWeekday[idx]
                    val dotColor = band?.color ?: KundliColors.Teal
                    val shortBand = when (band) {
                        SkyBand.Flowing -> "Flow"
                        SkyBand.Steady -> "Steady"
                        SkyBand.GoGently -> "Gently"
                        null -> if (filled) "Logged" else "--"
                    }
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(5.dp),
                    ) {
                        Text(letter, style = MaterialTheme.typography.labelSmall, color = KundliColors.TextMuted)
                        Box(
                            modifier = Modifier
                                .size(34.dp)
                                .clip(CircleShape)
                                .background(if (filled) dotColor.copy(alpha = 0.16f) else KundliColors.SurfaceRecessed)
                                .border(
                                    width = if (filled) 1.5.dp else 1.dp,
                                    color = if (filled) dotColor else KundliColors.SubtleDivider,
                                    shape = CircleShape,
                                ),
                            contentAlignment = Alignment.Center,
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(if (filled) 10.dp else 4.dp)
                                    .clip(CircleShape)
                                    .background(if (filled) dotColor else KundliColors.TextMuted.copy(alpha = 0.35f)),
                            )
                        }
                        Text(
                            text = shortBand,
                            style = MaterialTheme.typography.labelSmall,
                            color = if (filled) dotColor else KundliColors.TextMuted,
                            maxLines = 1,
                            softWrap = false,
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun JournalEntryCard(
    entry: JournalEntryUi,
    onTapSky: () -> Unit,
    onTapTag: (String) -> Unit,
) {
    Surface(
        color = KundliColors.Surface,
        border = BorderStroke(1.dp, KundliColors.SubtleDivider),
        shape = RoundedCornerShape(18.dp),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                val timeLabel = format24hTime(entry.createdAtMillis).ifBlank { entry.timestampLabel }
                Text(timeLabel, style = TelemetryNumberStyle, color = KundliColors.TextMain)
                Text("·", color = KundliColors.TextMuted)
                Surface(
                    color = KundliColors.SurfaceRecessed,
                    border = BorderStroke(1.dp, KundliColors.GoldHairline),
                    shape = RoundedCornerShape(999.dp),
                ) {
                    Text(
                        text = "${entry.mood}/5",
                        style = TelemetryNumberStyle,
                        color = KundliColors.Gold,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp),
                    )
                }
            }
            // Signature Stitch Solid Colored Frozen Sky Pill!
            Surface(
                color = entry.sky.band.color,
                shape = RoundedCornerShape(999.dp),
                modifier = Modifier.clickable(onClick = onTapSky),
            ) {
                Text(
                    text = "● ${entry.sky.band.label} · ${entry.sky.moonSign} · ${entry.sky.horaRuler.displayName} Hora",
                    style = MaterialTheme.typography.labelMedium,
                    color = KundliColors.OrbInk,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 5.dp),
                )
            }
            if (entry.note.isNotBlank()) {
                Spacer(Modifier.height(6.dp))
                Text(entry.note, style = MaterialTheme.typography.bodyMedium, color = KundliColors.TextMain)
            }
            if (entry.tags.isNotEmpty()) {
                Spacer(Modifier.height(8.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    entry.tags.forEach { tag ->
                        Text(
                            text = "#$tag",
                            style = MaterialTheme.typography.labelMedium,
                            color = KundliColors.Teal,
                            modifier = Modifier.clickable { onTapTag(tag) },
                        )
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
private fun ProgressiveComposerSheet(
    onSubmit: (mood: Int, energy: Int, kind: String, tags: List<String>, note: String) -> Unit,
    onDismiss: () -> Unit,
) {
    var mood by remember { mutableIntStateOf(3) }
    var energy by remember { mutableIntStateOf(3) }
    var kind by remember { mutableStateOf("checkin") }
    val selectedTags = remember { mutableStateListOf<String>() }
    var note by remember { mutableStateOf("") }

    val availableTags = listOf("work", "focus", "creative", "meditation", "family", "health", "travel", "study")

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = KundliColors.Surface,
        contentColor = KundliColors.TextMain,
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .navigationBarsPadding()
                .padding(horizontal = 20.dp, vertical = 12.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Text("Check in", style = MaterialTheme.typography.headlineSmall)
            Text("Mood (1–5)", style = MaterialTheme.typography.labelMedium, color = KundliColors.TextMuted)
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                (1..5).forEach { value ->
                    FilterChip(
                        selected = mood == value,
                        onClick = { mood = value },
                        label = { Text("$value") },
                    )
                }
            }

            Text("Tags (optional)", style = MaterialTheme.typography.labelMedium, color = KundliColors.TextMuted)
            FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                availableTags.forEach { tag ->
                    val active = selectedTags.contains(tag)
                    FilterChip(
                        selected = active,
                        onClick = {
                            if (active) selectedTags.remove(tag) else selectedTags.add(tag)
                        },
                        label = { Text(tag) },
                    )
                }
            }

            OutlinedTextField(
                value = note,
                onValueChange = { note = it },
                label = { Text("Note (optional)") },
                modifier = Modifier.fillMaxWidth(),
                minLines = 2,
            )

            Button(
                onClick = { onSubmit(mood, energy, kind, selectedTags.toList(), note) },
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(
                    containerColor = KundliColors.Gold,
                    contentColor = KundliColors.OrbInk,
                ),
            ) {
                Text("Save check-in")
            }
            Spacer(Modifier.height(8.dp))
        }
    }
}
