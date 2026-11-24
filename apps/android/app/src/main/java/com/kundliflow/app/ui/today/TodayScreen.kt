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
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
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
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import com.kundliflow.app.ui.theme.KundliColors
import com.kundliflow.app.ui.theme.TelemetryNumberStyle
import kotlinx.coroutines.delay
import kotlin.math.roundToInt

@Composable
fun TodayScreen(
    sky: TodaySkyState,
    personalHookLine: String,
    activeSlot: TodayDynamicSlot,
    hasLoggedAtLeastOnce: Boolean,
    isEveningAfter19: Boolean,
    showConstructiveRedirect: Boolean,
    onTapHeroPeek: () -> Unit,
    onQuickCheckIn: (mood: Int) -> Unit,
    onAddTagToLastCheckIn: (String) -> Unit,
    onOpenFullComposer: () -> Unit,
    onTapSlotAction: (TodayDynamicSlot) -> Unit,
    onDismissSlot: (TodayDynamicSlot) -> Unit,
    onTapExploreTopic: (String) -> Unit,
    onTapCitySwitcher: () -> Unit,
) {
    var showWaveSheet by remember { mutableStateOf(false) }
    var inlineEchoMood by remember { mutableStateOf<Int?>(null) }

    // 1.5s -> 8s Inline Sky Echo reset
    LaunchedEffect(inlineEchoMood) {
        if (inlineEchoMood != null) {
            delay(8000L)
            inlineEchoMood = null
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 20.dp)
            .padding(bottom = 108.dp), // clear floating capsule dock
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        // 1. Hero (1 per screen)
        TodayHeroCard(
            sky = sky,
            personalHookLine = personalHookLine,
            isEveningAfter19 = isEveningAfter19,
            showConstructiveRedirect = showConstructiveRedirect,
            nextDiscoveryTitle = (activeSlot as? TodayDynamicSlot.CuriosityNode)?.title ?: "your chart",
            onTapHeroPeek = onTapHeroPeek,
            onTapRedirect = { onTapSlotAction(activeSlot) },
        )

        // 2. Primary Action: 1-Tap Check-in w/ 1.5s Inline Sky Echo Morph
        CheckInBarWithInlineEcho(
            sky = sky,
            echoMood = inlineEchoMood,
            onSelectMood = { mood ->
                inlineEchoMood = mood
                onQuickCheckIn(mood)
            },
            onTapTag = onAddTagToLastCheckIn,
            onTapAddNote = onOpenFullComposer,
        )

        // 3. Single Dynamic Slot (P1-P6 from resolveTodaySlot)
        DynamicSlotCard(
            slot = activeSlot,
            onTap = { onTapSlotAction(activeSlot) },
            onDismiss = { onDismissSlot(activeSlot) },
        )

        // 4. 40dp Collapsed Day Strip (Earned reveal after 1st check-in)
        AnimatedVisibility(visible = hasLoggedAtLeastOnce) {
            CollapsedDayStrip(
                sky = sky,
                isEveningAfter19 = isEveningAfter19,
                onClick = { showWaveSheet = true },
            )
        }

        // 5. Explore Horizontal Life Topics Reel
        ExploreTopicsReel(onTapTopic = onTapExploreTopic)
    }

    if (showWaveSheet) {
        DayWaveSheet(
            sky = sky,
            onTapCitySwitcher = onTapCitySwitcher,
            onDismiss = { showWaveSheet = false },
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
            modifier = Modifier.padding(20.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Text(
                text = sky.greeting,
                style = MaterialTheme.typography.bodySmall,
                color = KundliColors.TextMuted,
                modifier = Modifier.align(Alignment.Start),
            )
            Spacer(Modifier.height(14.dp))

            if (showConstructiveRedirect) {
                Text(
                    text = "Sky unchanged since ${sky.currentHora.startTime}",
                    style = MaterialTheme.typography.titleMedium,
                    color = KundliColors.Gold,
                )
                Spacer(Modifier.height(8.dp))
                Text(
                    text = "While you wait for ${sky.nextShiftTime}, explore $nextDiscoveryTitle or reflect in your Journal.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = KundliColors.TextMain,
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
                        modifier = Modifier.padding(horizontal = 28.dp, vertical = 10.dp),
                    )
                }
                Spacer(Modifier.height(14.dp))
                Text(
                    text = personalHookLine,
                    style = MaterialTheme.typography.bodyMedium,
                    color = KundliColors.TextMain,
                )
                Spacer(Modifier.height(8.dp))
                val shiftLine = if (isEveningAfter19 && sky.tomorrowOpeningSummary != null) {
                    sky.tomorrowOpeningSummary
                } else {
                    "Next shift ${sky.nextShiftTime}: ${sky.nextShiftHora.displayName} hour, ${sky.nextShiftBand.label}"
                }
                Text(
                    text = shiftLine,
                    style = MaterialTheme.typography.labelMedium,
                    color = KundliColors.TextMuted,
                )
                if (sky.currentChapterSubtitle != null) {
                    Spacer(Modifier.height(6.dp))
                    Text(
                        text = sky.currentChapterSubtitle,
                        style = MaterialTheme.typography.labelMedium,
                        color = KundliColors.Gold,
                    )
                }
            }
        }
    }
}

@Composable
private fun CheckInBarWithInlineEcho(
    sky: TodaySkyState,
    echoMood: Int?,
    onSelectMood: (Int) -> Unit,
    onTapTag: (String) -> Unit,
    onTapAddNote: () -> Unit,
) {
    Surface(
        color = KundliColors.Surface,
        shape = RoundedCornerShape(18.dp),
        modifier = Modifier.fillMaxWidth(),
    ) {
        AnimatedContent(targetState = echoMood, label = "inline_sky_echo") { savedMood ->
            if (savedMood == null) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 14.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween,
                ) {
                    Text(
                        text = "How does now feel?",
                        style = MaterialTheme.typography.titleMedium,
                        color = KundliColors.TextMain,
                    )
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        (1..5).forEach { mood ->
                            Box(
                                modifier = Modifier
                                    .size(34.dp)
                                    .clip(CircleShape)
                                    .background(KundliColors.SurfaceAlt)
                                    .clickable { onSelectMood(mood) },
                                contentAlignment = Alignment.Center,
                            ) {
                                Text(
                                    text = "$mood",
                                    style = TelemetryNumberStyle,
                                    color = KundliColors.Gold,
                                )
                            }
                        }
                    }
                }
            } else {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "Saved ($savedMood/5) · Bottled under ${sky.currentHora.ruler.displayName} Hora · ${sky.currentBand.label}",
                        style = MaterialTheme.typography.bodySmall,
                        color = KundliColors.Teal,
                    )
                    Spacer(Modifier.height(8.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        listOf("Work", "Focus", "Calm").forEach { tag ->
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

@Composable
private fun DynamicSlotCard(
    slot: TodayDynamicSlot,
    onTap: () -> Unit,
    onDismiss: () -> Unit,
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
        Column(modifier = Modifier.padding(16.dp)) {
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
            Spacer(Modifier.height(4.dp))
            Text(
                text = body as String,
                style = MaterialTheme.typography.bodySmall,
                color = KundliColors.TextMuted,
            )
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
                Text("Tap to scrub 24h", style = MaterialTheme.typography.labelMedium, color = KundliColors.Gold)
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
        }
    }
}

@Composable
private fun ExploreTopicsReel(onTapTopic: (String) -> Unit) {
    val topics = listOf("Career", "Home", "Love", "Money", "Year")
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text(
            text = "Explore",
            style = MaterialTheme.typography.labelMedium,
            color = KundliColors.TextMuted,
        )
        LazyRow(
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            contentPadding = PaddingValues(end = 8.dp),
        ) {
            items(topics) { topic ->
                Surface(
                    color = KundliColors.SurfaceAlt,
                    shape = RoundedCornerShape(20.dp),
                    modifier = Modifier.clickable { onTapTopic(topic) },
                ) {
                    Text(
                        text = topic,
                        style = MaterialTheme.typography.labelMedium,
                        color = KundliColors.TextMain,
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 10.dp),
                    )
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun DayWaveSheet(
    sky: TodaySkyState,
    onTapCitySwitcher: () -> Unit,
    onDismiss: () -> Unit,
) {
    val haptics = LocalHapticFeedback.current
    var selectedHour by remember { mutableIntStateOf(12.coerceAtMost((sky.hourlyWave.size - 1).coerceAtLeast(0))) }

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
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text("24-Hour Sky Wave", style = MaterialTheme.typography.headlineSmall)
                TextButton(onClick = onTapCitySwitcher) {
                    Text("${sky.cityName} ▾", color = KundliColors.Gold)
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
                    .height(150.dp)
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
            Spacer(Modifier.height(8.dp))
        }
    }
}
