package com.kundliflow.app.ui.today

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
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
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
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
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.kundliflow.app.ui.theme.KundliColors
import com.kundliflow.app.ui.theme.TelemetryNumberStyle
import java.time.LocalTime
import java.util.Locale
import kotlin.math.roundToInt

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TodayScreen(
    sky: TodaySkyState,
    personalHookLine: String,
    activeSlot: TodayDynamicSlot,
    hasLoggedAtLeastOnce: Boolean,
    latestCheckInMoodThisHour: Int? = null,
    discoveryLitCount: Int = 0,
    discoveryTotalCount: Int = 24,
    isEveningAfter19: Boolean,
    showConstructiveRedirect: Boolean,
    isRefreshing: Boolean = false,
    onRefresh: () -> Unit = {},
    onTapHeroPeek: () -> Unit,
    onQuickCheckIn: (mood: Int) -> Unit,
    onEditCheckInMood: (mood: Int) -> Unit = {},
    onUndoCheckIn: () -> Unit = {},
    onAddTagToLastCheckIn: (String) -> Unit,
    onOpenFullComposer: () -> Unit,
    onTapSlotAction: (TodayDynamicSlot) -> Unit,
    onDismissSlot: (TodayDynamicSlot) -> Unit,
    onOpenDiscoveryMap: () -> Unit = {},
    onTapExploreTopic: (String) -> Unit,
    onTapCitySwitcher: () -> Unit,
    externalOpenWave: Boolean = false,
    onExternalWaveHandled: () -> Unit = {},
) {
    var waveSheetInitialHour by remember { mutableStateOf<Int?>(null) }
    var editingCheckIn by remember { mutableStateOf(false) }
    var expandPanchang by remember { mutableStateOf(false) }
    var expandFactors by remember { mutableStateOf(false) }

    LaunchedEffect(externalOpenWave) {
        if (externalOpenWave) {
            waveSheetInitialHour = LocalTime.now().hour
            onExternalWaveHandled()
        }
    }

    PullToRefreshBox(
        isRefreshing = isRefreshing,
        onRefresh = onRefresh,
        modifier = Modifier.fillMaxSize(),
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 20.dp)
                .padding(bottom = 112.dp), // clear floating capsule dock
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            // 1. Hero (Spacious Band Ring, Hora + next shift, personal hook)
            TodayHeroCard(
                sky = sky,
                personalHookLine = personalHookLine,
                isEveningAfter19 = isEveningAfter19,
                showConstructiveRedirect = showConstructiveRedirect,
                nextDiscoveryTitle = (activeSlot as? TodayDynamicSlot.CuriosityNode)?.title ?: "your chart",
                onTapHeroPeek = onTapHeroPeek,
                onTapRedirect = { onTapSlotAction(activeSlot) },
            )

            // 2. Persistent Check-In Row (stays Logged X/5 · Edit · Undo for current hour!)
            CheckInBarPersistent(
                sky = sky,
                loggedMood = latestCheckInMoodThisHour,
                isEditing = editingCheckIn,
                onSelectMood = { mood ->
                    if (latestCheckInMoodThisHour != null) {
                        onEditCheckInMood(mood)
                    } else {
                        onQuickCheckIn(mood)
                    }
                    editingCheckIn = false
                },
                onRequestEdit = { editingCheckIn = true },
                onUndo = {
                    editingCheckIn = false
                    onUndoCheckIn()
                },
                onTapTag = onAddTagToLastCheckIn,
                onTapAddNote = onOpenFullComposer,
            )

            // 3. Co-Star style 2-Column "Lean Into / Go Gently" Action Card
            LeanIntoGoGentlyCard(
                sky = sky,
                onTapWave = { waveSheetInitialHour = LocalTime.now().hour },
            )

            // 4. Always-Visible 24h Rhythm & Windows Strip (1-tap opens scrubbable DayWaveSheet)
            CollapsedDayStrip(
                sky = sky,
                isEveningAfter19 = isEveningAfter19,
                onClick = { waveSheetInitialHour = LocalTime.now().hour },
            )

            // 5. Horizontal 24-Hora Ribbon (auto-scrolled to NOW pill)
            HoraRibbonRail(
                sky = sky,
                onSelectHour = { hr -> waveSheetInitialHour = hr },
            )

            // 6. 2-Up Daily Context Bento Row (Glance + 1-Tap Inline Expand)
            DailyContextBentoSection(
                sky = sky,
                expandPanchang = expandPanchang,
                expandFactors = expandFactors,
                onTogglePanchang = { expandPanchang = !expandPanchang },
                onToggleFactors = { expandFactors = !expandFactors },
                onOpenFullMath = onTapHeroPeek,
            )

            // 7. Single Dynamic Slot (P1-P6) with inline Discovery Map progress
            DynamicSlotCard(
                slot = activeSlot,
                discoveryLitCount = discoveryLitCount,
                discoveryTotalCount = discoveryTotalCount,
                onTap = { onTapSlotAction(activeSlot) },
                onDismiss = { onDismissSlot(activeSlot) },
                onOpenDiscoveryMap = onOpenDiscoveryMap,
            )

            // 8. Explore Horizontal Cards Rail
            ExploreTopicsReel(onTapTopic = onTapExploreTopic)
        }
    }

    val startHour = waveSheetInitialHour
    if (startHour != null) {
        DayWaveSheet(
            sky = sky,
            initialHour = startHour,
            onTapCitySwitcher = onTapCitySwitcher,
            onOpenFullMath = {
                waveSheetInitialHour = null
                onTapHeroPeek()
            },
            onDismiss = { waveSheetInitialHour = null },
        )
    }
}

@Composable
private fun TodayHeroCard(
    sky: TodaySkyState,
    personalHookLine: String,
    isEveningAfter19: Boolean,
    showConstructiveRedirect: Boolean,
    nextDiscoveryTitle: String,
    onTapHeroPeek: () -> Unit,
    onTapRedirect: () -> Unit,
) {
    Surface(
        color = KundliColors.Surface,
        border = BorderStroke(1.dp, sky.currentBand.color.copy(alpha = 0.28f)),
        shape = RoundedCornerShape(24.dp),
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = if (showConstructiveRedirect) onTapRedirect else onTapHeroPeek),
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .drawBehind { drawRect(KundliColors.cosmicHeroRadial(size.width, size.height)) }
                .padding(horizontal = 20.dp, vertical = 16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Text(
                text = sky.greeting,
                style = MaterialTheme.typography.bodySmall,
                color = KundliColors.TextMuted,
                modifier = Modifier.align(Alignment.Start),
            )
            Spacer(Modifier.height(10.dp))

            if (showConstructiveRedirect) {
                Text(
                    text = "Sky unchanged since ${sky.currentHora.startTime}",
                    style = MaterialTheme.typography.titleMedium,
                    color = KundliColors.Gold,
                )
                Spacer(Modifier.height(6.dp))
                Text(
                    text = "While waiting for ${sky.nextShiftTime}, explore $nextDiscoveryTitle or reflect in Journal.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = KundliColors.TextMain,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis,
                )
            } else {
                // Soft Band Ring
                Surface(
                    color = sky.currentBand.color.copy(alpha = 0.14f),
                    border = BorderStroke(1.5.dp, sky.currentBand.color),
                    shape = RoundedCornerShape(32.dp),
                ) {
                    Text(
                        text = sky.currentBand.label,
                        style = MaterialTheme.typography.displaySmall,
                        color = sky.currentBand.color,
                        modifier = Modifier.padding(horizontal = 26.dp, vertical = 8.dp),
                    )
                }
                Spacer(Modifier.height(10.dp))
                // Line 1: Hora + next shift (or Tomorrow opening after 19:00)
                val line1 = if (isEveningAfter19 && sky.tomorrowOpeningSummary != null) {
                    sky.tomorrowOpeningSummary
                } else {
                    "${sky.currentHora.ruler.displayName} hour until ${sky.nextShiftTime}, then ${sky.nextShiftHora.displayName}"
                }
                Text(
                    text = line1,
                    style = MaterialTheme.typography.labelMedium,
                    color = KundliColors.TextMuted,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                Spacer(Modifier.height(4.dp))
                // Line 2: Personal Hook (max 2 lines) + explicit "more" affordance
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.Bottom,
                    horizontalArrangement = Arrangement.Center,
                ) {
                    Text(
                        text = personalHookLine,
                        style = MaterialTheme.typography.bodyMedium,
                        color = KundliColors.TextMain,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis,
                        modifier = Modifier.weight(1f, fill = false),
                    )
                    Spacer(Modifier.width(6.dp))
                    Text(
                        text = "more",
                        style = MaterialTheme.typography.labelMedium,
                        color = KundliColors.Gold,
                    )
                }
            }
        }
    }
}

@Composable
private fun CheckInBarPersistent(
    sky: TodaySkyState,
    loggedMood: Int?,
    isEditing: Boolean,
    onSelectMood: (Int) -> Unit,
    onRequestEdit: () -> Unit,
    onUndo: () -> Unit,
    onTapTag: (String) -> Unit,
    onTapAddNote: () -> Unit,
) {
    val showPicker = loggedMood == null || isEditing
    Surface(
        color = KundliColors.Surface,
        shape = RoundedCornerShape(18.dp),
        modifier = Modifier.fillMaxWidth(),
    ) {
        AnimatedContent(targetState = showPicker, label = "persistent_checkin") { picker ->
            if (picker) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 14.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween,
                ) {
                    Text(
                        text = if (isEditing) "Update mood" else "How does now feel?",
                        style = MaterialTheme.typography.titleMedium,
                        color = KundliColors.TextMain,
                    )
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        (1..5).forEach { mood ->
                            val isCurrent = loggedMood == mood
                            Box(
                                modifier = Modifier
                                    .size(34.dp)
                                    .clip(CircleShape)
                                    .background(if (isCurrent) KundliColors.Gold else KundliColors.SurfaceAlt)
                                    .clickable { onSelectMood(mood) },
                                contentAlignment = Alignment.Center,
                            ) {
                                Text(
                                    text = "$mood",
                                    style = TelemetryNumberStyle,
                                    color = if (isCurrent) KundliColors.OrbInk else KundliColors.Gold,
                                )
                            }
                        }
                    }
                }
            } else {
                Column(modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Text(
                            text = "Logged $loggedMood/5 · ${sky.currentHora.ruler.displayName} Hora",
                            style = MaterialTheme.typography.bodySmall,
                            color = KundliColors.Teal,
                        )
                        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            Text(
                                text = "Edit",
                                style = MaterialTheme.typography.labelMedium,
                                color = KundliColors.Gold,
                                modifier = Modifier.clickable(onClick = onRequestEdit),
                            )
                            Text(
                                text = "Undo",
                                style = MaterialTheme.typography.labelMedium,
                                color = KundliColors.TextMuted,
                                modifier = Modifier.clickable(onClick = onUndo),
                            )
                        }
                    }
                    Spacer(Modifier.height(6.dp))
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        itemsIndexed(listOf("Work", "Focus", "Calm", "Creative", "Rest")) { _, tag ->
                            FilterChip(
                                selected = false,
                                onClick = { onTapTag(tag.lowercase()) },
                                label = { Text(tag) },
                                colors = FilterChipDefaults.filterChipColors(
                                    containerColor = KundliColors.SurfaceAlt,
                                    labelColor = KundliColors.TextMain,
                                ),
                            )
                        }
                        item {
                            FilterChip(
                                selected = false,
                                onClick = onTapAddNote,
                                label = { Text("+ Note") },
                                colors = FilterChipDefaults.filterChipColors(
                                    containerColor = KundliColors.SurfaceAlt,
                                    labelColor = KundliColors.Gold,
                                ),
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun HoraRibbonRail(
    sky: TodaySkyState,
    onSelectHour: (Int) -> Unit,
) {
    if (sky.hourlyWave.isEmpty()) return
    val nowHour = LocalTime.now().hour.coerceIn(0, sky.hourlyWave.lastIndex)
    val listState = rememberLazyListState()

    LaunchedEffect(sky.hourlyWave.size) {
        listState.scrollToItem((nowHour - 1).coerceAtLeast(0))
    }

    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Text(
            text = "HORA RIBBON · SWIPE 24H",
            style = MaterialTheme.typography.labelMedium,
            color = KundliColors.TextMuted,
        )
        LazyRow(
            state = listState,
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            contentPadding = PaddingValues(end = 8.dp),
        ) {
            itemsIndexed(sky.hourlyWave) { idx, pt ->
                val isNow = idx == nowHour
                Surface(
                    color = if (isNow) KundliColors.SurfaceAlt else KundliColors.Surface,
                    border = BorderStroke(
                        width = if (isNow) 1.5.dp else 1.dp,
                        color = if (isNow) pt.band.color else KundliColors.SubtleDivider,
                    ),
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier.clickable { onSelectHour(idx) },
                ) {
                    Column(
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                    ) {
                        Text(
                            text = if (isNow) "NOW" else String.format(Locale.US, "%02d:00", pt.hour),
                            style = TelemetryNumberStyle,
                            color = if (isNow) pt.band.color else KundliColors.TextMuted,
                        )
                        Text(
                            text = pt.horaRuler.displayName,
                            style = MaterialTheme.typography.labelMedium,
                            color = KundliColors.TextMain,
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun DynamicSlotCard(
    slot: TodayDynamicSlot,
    discoveryLitCount: Int,
    discoveryTotalCount: Int,
    onTap: () -> Unit,
    onDismiss: () -> Unit,
    onOpenDiscoveryMap: () -> Unit,
) {
    if (slot is TodayDynamicSlot.DistressOverride) return

    val (eyebrow, title, body, accent) = when (slot) {
        is TodayDynamicSlot.WelcomeBackDigest -> listOf(
            "WELCOME BACK",
            "What shifted in ${slot.daysAway} days",
            slot.shiftSummary,
            KundliColors.Teal,
        )
        is TodayDynamicSlot.AhaMomentComparison -> listOf(
            "YOUR FIRST TWO MOODS",
            slot.headline,
            slot.detail,
            KundliColors.Gold,
        )
        is TodayDynamicSlot.SundayWeeklyReview -> listOf(
            "YOUR WEEK IN THE SKY",
            "${slot.entriesCountThisWeek} check-ins this week",
            slot.patternHeadline,
            KundliColors.Teal,
        )
        is TodayDynamicSlot.LiveSkyEvent -> listOf(
            "SKY MOVERS",
            slot.title,
            slot.detail,
            KundliColors.Gold,
        )
        is TodayDynamicSlot.FirstWeekNudge -> listOf(
            "DAY ${slot.dayNumber}",
            slot.title,
            slot.body,
            KundliColors.Gold,
        )
        is TodayDynamicSlot.CuriosityNode -> listOf(
            "IN THE SKY TODAY",
            slot.title,
            slot.hookLine,
            KundliColors.Gold,
        )
        is TodayDynamicSlot.ActTwoCycle -> listOf(
            slot.cycleKind.uppercase(),
            slot.title,
            slot.body,
            KundliColors.Teal,
        )
        TodayDynamicSlot.DistressOverride -> return
    }

    val accentColor = accent as androidx.compose.ui.graphics.Color
    Surface(
        color = KundliColors.Surface,
        border = BorderStroke(1.dp, accentColor.copy(alpha = 0.25f)),
        shape = RoundedCornerShape(18.dp),
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onTap),
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    text = eyebrow as String,
                    style = MaterialTheme.typography.labelMedium,
                    color = accentColor,
                )
                if (slot !is TodayDynamicSlot.CuriosityNode && slot !is TodayDynamicSlot.ActTwoCycle) {
                    Text(
                        text = "Dismiss",
                        style = MaterialTheme.typography.labelMedium,
                        color = KundliColors.TextMuted,
                        modifier = Modifier.clickable(onClick = onDismiss),
                    )
                }
            }
            Spacer(Modifier.height(4.dp))
            Text(
                text = title as String,
                style = MaterialTheme.typography.titleMedium,
                color = KundliColors.TextMain,
            )
            Spacer(Modifier.height(3.dp))
            Text(
                text = body as String,
                style = MaterialTheme.typography.bodySmall,
                color = KundliColors.TextMuted,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
            )
            Spacer(Modifier.height(8.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    text = "Discovered $discoveryLitCount of $discoveryTotalCount",
                    style = MaterialTheme.typography.labelMedium,
                    color = KundliColors.TextMuted,
                )
                Text(
                    text = "Open map →",
                    style = MaterialTheme.typography.labelMedium,
                    color = KundliColors.Teal,
                    modifier = Modifier.clickable(onClick = onOpenDiscoveryMap),
                )
            }
        }
    }
}

@Composable
private fun CollapsedDayStrip(
    sky: TodaySkyState,
    isEveningAfter19: Boolean,
    onClick: () -> Unit,
) {
    Surface(
        color = KundliColors.Surface,
        shape = RoundedCornerShape(16.dp),
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
    ) {
        Column(modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text("Your day", style = MaterialTheme.typography.titleMedium, color = KundliColors.TextMain)
                Text("Scrub 24h", style = MaterialTheme.typography.labelMedium, color = KundliColors.Gold)
            }
            Spacer(Modifier.height(8.dp))
            Canvas(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(22.dp),
            ) {
                val points = sky.hourlyWave
                if (points.size >= 2) {
                    val stepX = size.width / (points.size - 1)
                    val path = Path()
                    points.forEachIndexed { idx, pt ->
                        val x = idx * stepX
                        val normY = 1f - ((pt.score + 7f) / 14f).coerceIn(0f, 1f)
                        val y = 4f + normY * (size.height - 8f)
                        if (idx == 0) path.moveTo(x, y) else path.lineTo(x, y)
                    }
                    drawPath(
                        path = path,
                        color = KundliColors.Teal,
                        style = Stroke(width = 2.dp.toPx(), cap = StrokeCap.Round),
                    )
                }
            }
            Spacer(Modifier.height(6.dp))
            Text(
                text = if (isEveningAfter19 && sky.tomorrowOpeningSummary != null) {
                    sky.tomorrowOpeningSummary
                } else {
                    "Go gently ${sky.goGentlyLabel} · Best ${sky.bestWindowLabel}"
                },
                style = MaterialTheme.typography.labelMedium,
                color = KundliColors.TextMuted,
            )
            if (!sky.currentChapterSubtitle.isNullOrBlank()) {
                Spacer(Modifier.height(4.dp))
                Text(
                    text = sky.currentChapterSubtitle,
                    style = MaterialTheme.typography.labelMedium,
                    color = KundliColors.Gold,
                )
            }
        }
    }
}

@Composable
private fun ExploreTopicsReel(onTapTopic: (String) -> Unit) {
    val topics = listOf(
        "Career" to "House 10",
        "Love" to "House 7",
        "Money" to "House 2",
        "Home" to "House 4",
        "Strengths" to "Yogas & SAV",
        "Year" to "Dashas & Time",
    )
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text(
            text = "EXPLORE YOUR CHART",
            style = MaterialTheme.typography.labelMedium,
            color = KundliColors.TextMuted,
        )
        LazyRow(
            horizontalArrangement = Arrangement.spacedBy(10.dp),
            contentPadding = PaddingValues(end = 8.dp),
        ) {
            itemsIndexed(topics) { _, (topic, sub) ->
                Surface(
                    color = KundliColors.SurfaceAlt,
                    border = BorderStroke(1.dp, KundliColors.SubtleDivider),
                    shape = RoundedCornerShape(16.dp),
                    modifier = Modifier.clickable { onTapTopic(topic) },
                ) {
                    Column(modifier = Modifier.padding(horizontal = 16.dp, vertical = 10.dp)) {
                        Text(topic, style = MaterialTheme.typography.titleMedium, color = KundliColors.TextMain)
                        Text(sub, style = MaterialTheme.typography.labelMedium, color = KundliColors.Gold)
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun DayWaveSheet(
    sky: TodaySkyState,
    initialHour: Int,
    onTapCitySwitcher: () -> Unit,
    onOpenFullMath: () -> Unit,
    onDismiss: () -> Unit,
) {
    val haptics = LocalHapticFeedback.current
    val maxIdx = (sky.hourlyWave.size - 1).coerceAtLeast(0)
    var selectedHour by remember(initialHour) { mutableIntStateOf(initialHour.coerceIn(0, maxIdx)) }

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
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text("24-Hour Sky Wave", style = MaterialTheme.typography.headlineSmall)
                OutlinedButton(onClick = onTapCitySwitcher, contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp)) {
                    Text(sky.cityName, color = KundliColors.Gold, style = MaterialTheme.typography.labelMedium)
                }
            }

            val selected = sky.hourlyWave.getOrNull(selectedHour)
            if (selected != null) {
                Surface(
                    color = KundliColors.SurfaceAlt,
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Row(
                        modifier = Modifier.padding(14.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Column {
                            Text(
                                text = "${selected.hour.toString().padStart(2, '0')}:00 · ${selected.horaRuler.displayName} Hora",
                                style = MaterialTheme.typography.titleMedium,
                                color = KundliColors.TextMain,
                            )
                            Text(
                                text = "Rahu Kalam: ${sky.rahuKalamLabel}",
                                style = MaterialTheme.typography.labelMedium,
                                color = KundliColors.TextMuted,
                            )
                        }
                        Text(
                            text = "${selected.band.label} (${if (selected.score > 0) "+${selected.score}" else "${selected.score}"})",
                            style = TelemetryNumberStyle,
                            color = selected.band.color,
                        )
                    }
                }
            }

            Canvas(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(140.dp)
                    .semantics { contentDescription = "Scrubbable 24-hour energy wave" }
                    .pointerInput(sky.hourlyWave.size) {
                        detectHorizontalDragGestures { change, _ ->
                            change.consume()
                            val count = sky.hourlyWave.size.coerceAtLeast(1)
                            val frac = (change.position.x / size.width).coerceIn(0f, 1f)
                            val nextHour = (frac * (count - 1)).roundToInt().coerceIn(0, count - 1)
                            if (nextHour != selectedHour) {
                                selectedHour = nextHour
                                haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                            }
                        }
                    },
            ) {
                val points = sky.hourlyWave
                if (points.size >= 2) {
                    val stepX = size.width / (points.size - 1)
                    val path = Path()
                    points.forEachIndexed { idx, pt ->
                        val x = idx * stepX
                        val normY = 1f - ((pt.score + 7f) / 14f).coerceIn(0f, 1f)
                        val y = 16f + normY * (size.height - 32f)
                        if (idx == 0) path.moveTo(x, y) else path.lineTo(x, y)
                    }
                    drawPath(
                        path = path,
                        color = KundliColors.Gold,
                        style = Stroke(width = 3.dp.toPx(), cap = StrokeCap.Round),
                    )
                    val sel = points[selectedHour]
                    val sx = selectedHour * stepX
                    val sy = 16f + (1f - ((sel.score + 7f) / 14f).coerceIn(0f, 1f)) * (size.height - 32f)
                    drawLine(
                        color = sel.band.color.copy(alpha = 0.45f),
                        start = Offset(sx, 0f),
                        end = Offset(sx, size.height),
                        strokeWidth = 1.5.dp.toPx(),
                    )
                    drawCircle(
                        color = sel.band.color,
                        radius = 7.dp.toPx(),
                        center = Offset(sx, sy),
                    )
                }
            }

            // TalkBack-friendly hour steppers (v3 §7)
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                TextButton(onClick = { if (selectedHour > 0) selectedHour-- }) {
                    Text("← Prev hour", color = KundliColors.TextMuted)
                }
                TextButton(onClick = { if (selectedHour < maxIdx) selectedHour++ }) {
                    Text("Next hour →", color = KundliColors.TextMuted)
                }
            }

            sky.panchang?.let { p ->
                Surface(
                    color = KundliColors.SurfaceAlt,
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Column(
                        modifier = Modifier.padding(12.dp),
                        verticalArrangement = Arrangement.spacedBy(4.dp),
                    ) {
                        Text("TODAY'S PANCHANG", style = MaterialTheme.typography.labelMedium, color = KundliColors.Gold)
                        Text(
                            text = "Tithi: ${p.tithi} · Nakshatra: ${p.nakshatra}",
                            style = MaterialTheme.typography.bodySmall,
                            color = KundliColors.TextMain,
                        )
                        Text(
                            text = "Yoga: ${p.yoga} · Sunrise ${p.sunrise} / Sunset ${p.sunset}",
                            style = MaterialTheme.typography.labelMedium,
                            color = KundliColors.TextMuted,
                        )
                    }
                }
            }
            TextButton(
                onClick = onOpenFullMath,
                modifier = Modifier.align(Alignment.End),
            ) {
                Text("Inspect all ${sky.allHoras.size.coerceAtLeast(24)} Horas & scoring math →", color = KundliColors.Teal)
            }
            Spacer(Modifier.height(8.dp))
        }
    }
}

@Composable
private fun LeanIntoGoGentlyCard(
    sky: TodaySkyState,
    onTapWave: () -> Unit,
) {
    val positiveCue = sky.activeFactors.firstOrNull { it.value > 0 }?.summary
        ?: "${sky.currentHora.ruler.displayName} Hora supports steady focus"
    val gentleCue = sky.activeFactors.firstOrNull { it.value < 0 }?.summary
        ?: "Avoid rushing major commitments during Rahu Kalam"

    Surface(
        color = KundliColors.Surface,
        border = BorderStroke(1.dp, KundliColors.SubtleDivider),
        shape = RoundedCornerShape(18.dp),
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onTapWave),
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(6.dp),
            ) {
                Text("LEAN INTO", style = MaterialTheme.typography.labelMedium, color = KundliColors.Teal)
                Text(
                    text = sky.bestWindowLabel,
                    style = MaterialTheme.typography.titleSmall,
                    color = KundliColors.TextMain,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                Text(
                    text = positiveCue,
                    style = MaterialTheme.typography.bodySmall,
                    color = KundliColors.TextMuted,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis,
                )
            }
            Box(
                modifier = Modifier
                    .width(1.dp)
                    .height(64.dp)
                    .background(KundliColors.SubtleDivider)
                    .align(Alignment.CenterVertically),
            )
            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(6.dp),
            ) {
                Text("GO GENTLY", style = MaterialTheme.typography.labelMedium, color = KundliColors.Amber)
                Text(
                    text = sky.rahuKalamLabel.ifBlank { sky.goGentlyLabel },
                    style = MaterialTheme.typography.titleSmall,
                    color = KundliColors.TextMain,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                Text(
                    text = gentleCue,
                    style = MaterialTheme.typography.bodySmall,
                    color = KundliColors.TextMuted,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis,
                )
            }
        }
    }
}

@Composable
private fun DailyContextBentoSection(
    sky: TodaySkyState,
    expandPanchang: Boolean,
    expandFactors: Boolean,
    onTogglePanchang: () -> Unit,
    onToggleFactors: () -> Unit,
    onOpenFullMath: () -> Unit,
) {
    val topFactor = sky.activeFactors.maxByOrNull { kotlin.math.abs(it.value) }
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            // Left Bento Card: Today's Panchang
            Surface(
                color = KundliColors.Surface,
                border = BorderStroke(1.dp, if (expandPanchang) KundliColors.GoldHairline else KundliColors.SubtleDivider),
                shape = RoundedCornerShape(18.dp),
                modifier = Modifier
                    .weight(1f)
                    .clickable(onClick = onTogglePanchang),
            ) {
                Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text("PANCHANG", style = MaterialTheme.typography.labelMedium, color = KundliColors.Gold)
                    Text(
                        text = sky.panchang?.tithi ?: "Daily Almanac",
                        style = MaterialTheme.typography.titleSmall,
                        color = KundliColors.TextMain,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                    )
                    Text(
                        text = sky.panchang?.nakshatra ?: sky.cityName,
                        style = MaterialTheme.typography.bodySmall,
                        color = KundliColors.TextMuted,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                    )
                    Text(
                        text = if (expandPanchang) "Hide details ▲" else "Sun & Yoga ▾",
                        style = MaterialTheme.typography.labelSmall,
                        color = KundliColors.Teal,
                    )
                }
            }

            // Right Bento Card: Why Today Feels This Way
            Surface(
                color = KundliColors.Surface,
                border = BorderStroke(1.dp, if (expandFactors) KundliColors.Teal.copy(alpha = 0.4f) else KundliColors.SubtleDivider),
                shape = RoundedCornerShape(18.dp),
                modifier = Modifier
                    .weight(1f)
                    .clickable(onClick = onToggleFactors),
            ) {
                Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text("WHY TODAY", style = MaterialTheme.typography.labelMedium, color = KundliColors.Teal)
                    Text(
                        text = topFactor?.name ?: "${sky.activeFactors.size} Factors",
                        style = MaterialTheme.typography.titleSmall,
                        color = KundliColors.TextMain,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                    )
                    Text(
                        text = if (topFactor != null) {
                            val sign = if (topFactor.value >= 0) "+" else ""
                            "$sign${topFactor.value} · ${topFactor.summary}"
                        } else {
                            "Tap to see sky signals"
                        },
                        style = MaterialTheme.typography.bodySmall,
                        color = KundliColors.TextMuted,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                    )
                    Text(
                        text = if (expandFactors) "Hide factors ▲" else "All ${sky.activeFactors.size} factors ▾",
                        style = MaterialTheme.typography.labelSmall,
                        color = KundliColors.Gold,
                    )
                }
            }
        }

        // Inline 1-tap disclosure for Panchang
        AnimatedVisibility(visible = expandPanchang && sky.panchang != null) {
            sky.panchang?.let { p ->
                Surface(
                    color = KundliColors.SurfaceAlt,
                    border = BorderStroke(1.dp, KundliColors.GoldHairline),
                    shape = RoundedCornerShape(16.dp),
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Text("TODAY'S PANCHANG · ${sky.cityName.uppercase()}", style = MaterialTheme.typography.labelMedium, color = KundliColors.Gold)
                        Text("Tithi: ${p.tithi} · Nakshatra: ${p.nakshatra}", style = MaterialTheme.typography.bodySmall, color = KundliColors.TextMain)
                        Text("Yoga: ${p.yoga} · Karana: ${p.karana}", style = MaterialTheme.typography.bodySmall, color = KundliColors.TextMuted)
                        Text("Sunrise ${p.sunrise}  ·  Sunset ${p.sunset}", style = MaterialTheme.typography.labelMedium, color = KundliColors.Teal)
                    }
                }
            }
        }

        // Inline 1-tap disclosure for Active Scoring Factors
        AnimatedVisibility(visible = expandFactors && sky.activeFactors.isNotEmpty()) {
            Surface(
                color = KundliColors.SurfaceAlt,
                border = BorderStroke(1.dp, KundliColors.Teal.copy(alpha = 0.3f)),
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier.fillMaxWidth(),
            ) {
                Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Text("ACTIVE SKY FACTORS", style = MaterialTheme.typography.labelMedium, color = KundliColors.Teal)
                        Text(
                            text = "Full math →",
                            style = MaterialTheme.typography.labelMedium,
                            color = KundliColors.Gold,
                            modifier = Modifier.clickable(onClick = onOpenFullMath),
                        )
                    }
                    sky.activeFactors.take(4).forEach { factor ->
                        val sign = if (factor.value >= 0) "+" else ""
                        val pillColor = when {
                            factor.value > 0 -> KundliColors.Teal
                            factor.value < 0 -> KundliColors.Amber
                            else -> KundliColors.Gold
                        }
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(factor.name, style = MaterialTheme.typography.labelMedium, color = KundliColors.TextMain)
                                Text(factor.summary, style = MaterialTheme.typography.bodySmall, color = KundliColors.TextMuted)
                            }
                            Text(
                                text = "$sign${factor.value}",
                                style = TelemetryNumberStyle,
                                color = pillColor,
                                modifier = Modifier.padding(start = 10.dp),
                            )
                        }
                    }
                }
            }
        }
    }
}
