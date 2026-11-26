package com.kundliflow.app.ui.today

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
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
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.AutoAwesome
import androidx.compose.material.icons.rounded.Bedtime
import androidx.compose.material.icons.rounded.EditNote
import androidx.compose.material.icons.rounded.FavoriteBorder
import androidx.compose.material.icons.rounded.Home
import androidx.compose.material.icons.rounded.Lock
import androidx.compose.material.icons.rounded.Savings
import androidx.compose.material.icons.rounded.Schedule
import androidx.compose.material.icons.rounded.Star
import androidx.compose.material.icons.rounded.WarningAmber
import androidx.compose.material.icons.rounded.WorkOutline
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.kundliflow.app.ui.subject.PlanetId
import com.kundliflow.app.ui.theme.KundliColors
import com.kundliflow.app.ui.theme.TelemetryNumberStyle
import com.kundliflow.app.ui.time.SkyMoverItem
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
    skyMovers: List<SkyMoverItem> = emptyList(),
    onJumpToTransits: () -> Unit = {},
    externalOpenWave: Boolean = false,
    onExternalWaveHandled: () -> Unit = {},
) {
    var waveSheetInitialHour by remember { mutableStateOf<Int?>(null) }
    var editingCheckIn by remember { mutableStateOf(false) }

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
                .padding(top = 6.dp, bottom = 116.dp),
            verticalArrangement = Arrangement.spacedBy(20.dp),
        ) {
            // 1. Cosmic Hero Card (Stitch: Centered Glowing Ring + Recessed Callout + Next Shift Pill)
            TodayHeroCard(
                sky = sky,
                personalHookLine = personalHookLine,
                isEveningAfter19 = isEveningAfter19,
                showConstructiveRedirect = showConstructiveRedirect,
                nextDiscoveryTitle = (activeSlot as? TodayDynamicSlot.CuriosityNode)?.title ?: "your chart",
                onTapHeroPeek = onTapHeroPeek,
                onTapRedirect = { onTapSlotAction(activeSlot) },
            )

            // 2. "How does now feel?" Check-In Card (Stitch: 5 Tall Square Tiles + Solid Gold Active)
            CheckInBarStitch(
                sky = sky,
                loggedMood = latestCheckInMoodThisHour,
                isEditing = editingCheckIn,
                onSelectMood = { mood ->
                    if (latestCheckInMoodThisHour != null) onEditCheckInMood(mood) else onQuickCheckIn(mood)
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

            // 3. Single Dynamic Slot / "IN THE SKY TODAY" Card (Stitch today_expansive.png)
            val liveMoonMover = remember(skyMovers) { skyMovers.firstOrNull { it.planet == PlanetId.MOON } }
            DynamicSlotCardStitch(
                slot = activeSlot,
                sky = sky,
                moonMover = liveMoonMover,
                discoveryLitCount = discoveryLitCount,
                discoveryTotalCount = discoveryTotalCount,
                onTap = { onTapSlotAction(activeSlot) },
                onDismiss = { onDismissSlot(activeSlot) },
                onOpenDiscoveryMap = onOpenDiscoveryMap,
            )

            // 4. ALWAYS-OPEN Today's Panchang & Sky 2x2 Matrix + Solar & Rahu Kalam Strip (Stitch)
            TodayPanchangMatrixCard(
                sky = sky,
                onTapCity = onTapCitySwitcher,
            )

            // 5. 24-Hora Ribbon & Day Wave Card + Evening Horizon Hook (Stitch)
            HoraRibbonAndWaveCard(
                sky = sky,
                isEveningAfter19 = isEveningAfter19,
                onSelectHour = { hr -> waveSheetInitialHour = hr },
                onOpenFullWave = { waveSheetInitialHour = LocalTime.now().hour },
            )

            // 6. Live Sky Movers & Transits Vertical Card (Stitch)
            if (skyMovers.isNotEmpty()) {
                TodaySkyMoversCard(
                    movers = skyMovers.take(3),
                    onSeeAll = onJumpToTransits,
                )
            }

            // 7. Personal Archetypes — Explore Your Chart 2x2 Grid (Stitch)
            ExploreYourChartGrid(onTapTopic = onTapExploreTopic)
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
    val bandColor = sky.currentBand.color
    val scoreText = if (sky.currentScore >= 0) "+${sky.currentScore}" else "${sky.currentScore}"
    val nakTag = sky.panchang?.let { p ->
        listOf(p.nakshatra, p.tithi.split(" ").firstOrNull().orEmpty())
            .filter { it.isNotBlank() }
            .joinToString(" · ")
            .uppercase()
    }

    Surface(
        color = KundliColors.Surface,
        border = BorderStroke(1.dp, KundliColors.GoldHairline),
        shape = RoundedCornerShape(24.dp),
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = if (showConstructiveRedirect) onTapRedirect else onTapHeroPeek),
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .drawBehind { drawRect(KundliColors.cosmicHeroRadial(size.width, size.height)) }
                .padding(horizontal = 20.dp, vertical = 22.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            // Centered Nakshatra & Paksha Tag Pill
            if (!nakTag.isNullOrBlank()) {
                Surface(
                    color = KundliColors.SurfaceRecessed.copy(alpha = 0.85f),
                    border = BorderStroke(1.dp, KundliColors.SubtleDivider),
                    shape = RoundedCornerShape(999.dp),
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 5.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                    ) {
                        Box(
                            modifier = Modifier
                                .size(6.dp)
                                .clip(CircleShape)
                                .background(KundliColors.Teal),
                        )
                        Text(
                            text = nakTag,
                            style = MaterialTheme.typography.labelSmall,
                            color = KundliColors.TextMuted,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                        )
                    }
                }
            }

            // Big Centered Cinzel Greeting
            Text(
                text = sky.greeting.uppercase(),
                style = MaterialTheme.typography.displaySmall,
                color = KundliColors.TextMain,
                textAlign = TextAlign.Center,
            )

            if (showConstructiveRedirect) {
                Text(
                    text = "Sky unchanged since ${sky.currentHora.startTime}",
                    style = MaterialTheme.typography.titleMedium,
                    color = KundliColors.Gold,
                    textAlign = TextAlign.Center,
                )
                Text(
                    text = "While waiting for ${sky.nextShiftTime}, explore $nextDiscoveryTitle or reflect in Journal.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = KundliColors.TextMain,
                    textAlign = TextAlign.Center,
                )
            } else {
                // Signature Stitch Centered Glowing Circular Gradient Ring (196dp halo + 172dp ring)
                Box(
                    modifier = Modifier.size(196.dp),
                    contentAlignment = Alignment.Center,
                ) {
                    Canvas(modifier = Modifier.fillMaxSize()) {
                        val outerRadius = size.minDimension / 2f
                        val ringRadius = outerRadius - 14.dp.toPx()
                        // Soft ambient halo glow behind ring
                        drawCircle(
                            brush = Brush.radialGradient(
                                colors = listOf(
                                    bandColor.copy(alpha = 0.22f),
                                    KundliColors.Gold.copy(alpha = 0.08f),
                                    Color.Transparent,
                                ),
                                radius = outerRadius,
                            ),
                            radius = outerRadius,
                        )
                        // Inner recessed orb fill
                        drawCircle(
                            brush = Brush.radialGradient(
                                colors = listOf(
                                    bandColor.copy(alpha = 0.14f),
                                    KundliColors.SurfaceRecessed.copy(alpha = 0.94f),
                                ),
                                radius = ringRadius,
                            ),
                            radius = ringRadius,
                        )
                        // Gold-to-Band sweep gradient stroke
                        drawCircle(
                            brush = Brush.sweepGradient(
                                colors = listOf(
                                    KundliColors.Gold,
                                    bandColor,
                                    bandColor.copy(alpha = 0.45f),
                                    KundliColors.Gold.copy(alpha = 0.85f),
                                    KundliColors.Gold,
                                ),
                            ),
                            radius = ringRadius,
                            style = Stroke(width = 2.5.dp.toPx()),
                        )
                    }
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(2.dp),
                        modifier = Modifier.padding(horizontal = 14.dp),
                    ) {
                        Text(
                            text = "ATMOSPHERE",
                            style = MaterialTheme.typography.labelSmall,
                            color = KundliColors.TextMuted,
                            maxLines = 1,
                        )
                        Text(
                            text = sky.currentBand.label.uppercase(),
                            style = MaterialTheme.typography.headlineSmall,
                            color = bandColor,
                            maxLines = 1,
                            softWrap = false,
                            textAlign = TextAlign.Center,
                        )
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(3.dp),
                        ) {
                            Text(
                                text = scoreText,
                                style = TelemetryNumberStyle,
                                color = KundliColors.Gold,
                            )
                            Text(
                                text = "/7 SCORE",
                                style = MaterialTheme.typography.labelSmall,
                                color = KundliColors.TextMuted,
                            )
                        }
                    }
                }

                // Recessed Dark Hook & Factor Harmony Box (Stitch)
                Surface(
                    color = KundliColors.SurfaceRecessed.copy(alpha = 0.88f),
                    border = BorderStroke(1.dp, KundliColors.SubtleDivider),
                    shape = RoundedCornerShape(16.dp),
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Column(
                        modifier = Modifier.padding(14.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp),
                    ) {
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(10.dp),
                            verticalAlignment = Alignment.Top,
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(22.dp)
                                    .clip(CircleShape)
                                    .background(KundliColors.Gold.copy(alpha = 0.16f)),
                                contentAlignment = Alignment.Center,
                            ) {
                                Icon(
                                    imageVector = Icons.Rounded.Star,
                                    contentDescription = null,
                                    tint = KundliColors.Gold,
                                    modifier = Modifier.size(13.dp),
                                )
                            }
                            Column(
                                modifier = Modifier.weight(1f),
                                verticalArrangement = Arrangement.spacedBy(3.dp),
                            ) {
                                Text(
                                    text = personalHookLine,
                                    style = MaterialTheme.typography.titleSmall,
                                    color = KundliColors.TextMain,
                                    maxLines = 2,
                                    overflow = TextOverflow.Ellipsis,
                                )
                                val subtitleLine = sky.currentChapterSubtitle
                                    ?: "${sky.currentHora.ruler.displayName} Hora active in ${sky.cityName}"
                                Text(
                                    text = subtitleLine,
                                    style = MaterialTheme.typography.bodySmall,
                                    color = KundliColors.TextMuted,
                                    maxLines = 2,
                                    overflow = TextOverflow.Ellipsis,
                                )
                            }
                        }

                        if (sky.activeFactors.isNotEmpty()) {
                            HorizontalDivider(color = KundliColors.SubtleDivider)
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(10.dp),
                                verticalAlignment = Alignment.CenterVertically,
                            ) {
                                val f1 = sky.activeFactors.first()
                                val f2 = sky.activeFactors.getOrNull(1)
                                Text(
                                    text = "${f1.name}: ${if (f1.value >= 0) "+${f1.value}" else "${f1.value}"}",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = if (f1.value >= 0) KundliColors.Teal else KundliColors.Amber,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis,
                                    modifier = Modifier.weight(1f),
                                )
                                if (f2 != null) {
                                    Text(
                                        text = "${f2.name}: ${if (f2.value >= 0) "+${f2.value}" else "${f2.value}"}",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = KundliColors.Gold,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis,
                                        textAlign = TextAlign.End,
                                        modifier = Modifier.weight(1f),
                                    )
                                } else {
                                    Text("Tap math →", style = MaterialTheme.typography.labelSmall, color = KundliColors.Gold)
                                }
                            }
                        }
                    }
                }

                // Bottom Next Shift Indicator Pill
                Surface(
                    color = KundliColors.SurfaceRecessed.copy(alpha = 0.72f),
                    border = BorderStroke(1.dp, KundliColors.SubtleDivider),
                    shape = RoundedCornerShape(999.dp),
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 7.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                    ) {
                        Icon(
                            imageVector = Icons.Rounded.Schedule,
                            contentDescription = null,
                            tint = KundliColors.Gold,
                            modifier = Modifier.size(14.dp),
                        )
                        val shiftText = if (isEveningAfter19 && !sky.tomorrowOpeningSummary.isNullOrBlank()) {
                            sky.tomorrowOpeningSummary
                        } else {
                            "Next: ${sky.nextShiftTime} ${sky.nextShiftHora.displayName} hour · ${sky.nextShiftBand.label}"
                        }
                        Text(
                            text = shiftText,
                            style = MaterialTheme.typography.labelSmall,
                            color = KundliColors.TextMain,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                        )
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun CheckInBarStitch(
    sky: TodaySkyState,
    loggedMood: Int?,
    isEditing: Boolean,
    onSelectMood: (Int) -> Unit,
    onRequestEdit: () -> Unit,
    onUndo: () -> Unit,
    onTapTag: (String) -> Unit,
    onTapAddNote: () -> Unit,
) {
    val haptics = LocalHapticFeedback.current
    val labels = listOf(1 to "LOW", 2 to "HEAVY", 3 to "STEADY", 4 to "FLOW", 5 to "PEAK")
    val quickTags = listOf("work", "focus", "calm", "rest", "clarity")
    val nowTime = remember {
        val lt = LocalTime.now()
        String.format(Locale.US, "%02d:%02d", lt.hour, lt.minute)
    }

    Surface(
        color = KundliColors.Surface,
        border = BorderStroke(1.dp, KundliColors.SubtleDivider),
        shape = RoundedCornerShape(20.dp),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column(
            modifier = Modifier.padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    Icon(
                        imageVector = Icons.Rounded.AutoAwesome,
                        contentDescription = null,
                        tint = KundliColors.Gold,
                        modifier = Modifier.size(18.dp),
                    )
                    Text("How does now feel?", style = MaterialTheme.typography.titleMedium, color = KundliColors.TextMain)
                }
                Text(nowTime, style = TelemetryNumberStyle, color = KundliColors.TextMuted)
            }

            // 5 Tall Rounded Square Mood Tiles (Stitch: Solid Gold Active Tile!)
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                labels.forEach { (moodVal, label) ->
                    val isSelected = loggedMood == moodVal && !isEditing
                    Surface(
                        color = if (isSelected) KundliColors.Gold else KundliColors.SurfaceRecessed,
                        border = BorderStroke(
                            1.dp,
                            if (isSelected) KundliColors.Gold else KundliColors.SubtleDivider,
                        ),
                        shape = RoundedCornerShape(14.dp),
                        modifier = Modifier
                            .weight(1f)
                            .clickable {
                                haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                onSelectMood(moodVal)
                            },
                    ) {
                        Column(
                            modifier = Modifier.padding(vertical = 12.dp),
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(3.dp),
                        ) {
                            Text(
                                text = "$moodVal",
                                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                                color = if (isSelected) KundliColors.OrbInk else KundliColors.TextMain,
                            )
                            Text(
                                text = label,
                                style = MaterialTheme.typography.labelSmall.copy(fontSize = 9.sp, letterSpacing = 0.2.sp),
                                color = if (isSelected) KundliColors.OrbInk.copy(alpha = 0.85f) else KundliColors.TextMuted,
                                maxLines = 1,
                                softWrap = false,
                            )
                        }
                    }
                }
            }

            // Inline Saved Sky Echo Status Box
            if (loggedMood != null) {
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
                        Text(
                            text = "✓ Logged $loggedMood/5 · ${sky.currentHora.ruler.displayName} Hora",
                            style = MaterialTheme.typography.bodySmall,
                            color = KundliColors.Teal,
                            modifier = Modifier.weight(1f),
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                        )
                        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
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
                }
            }

            // Quick Action Tags Wrap Row
            FlowRow(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                quickTags.forEach { tag ->
                    Surface(
                        color = KundliColors.SurfaceRecessed,
                        border = BorderStroke(1.dp, KundliColors.SubtleDivider),
                        shape = RoundedCornerShape(999.dp),
                        modifier = Modifier.clickable { onTapTag(tag) },
                    ) {
                        Text(
                            text = "#$tag",
                            style = MaterialTheme.typography.labelSmall,
                            color = KundliColors.TextMuted,
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                        )
                    }
                }
            }

            // Footer: + Note | Private to journal
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    modifier = Modifier.clickable(onClick = onTapAddNote),
                ) {
                    Icon(Icons.Rounded.EditNote, contentDescription = null, tint = KundliColors.Gold, modifier = Modifier.size(16.dp))
                    Text("+ Note", style = MaterialTheme.typography.labelMedium, color = KundliColors.Gold)
                }
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp),
                ) {
                    Icon(Icons.Rounded.Lock, contentDescription = null, tint = KundliColors.TextMuted, modifier = Modifier.size(13.dp))
                    Text("Private to journal", style = MaterialTheme.typography.labelSmall, color = KundliColors.TextMuted)
                }
            }
        }
    }
}

@Composable
private fun DynamicSlotCardStitch(
    slot: TodayDynamicSlot,
    sky: TodaySkyState,
    moonMover: SkyMoverItem?,
    discoveryLitCount: Int,
    discoveryTotalCount: Int,
    onTap: () -> Unit,
    onDismiss: () -> Unit,
    onOpenDiscoveryMap: () -> Unit,
) {
    val liveMoonSub = remember(moonMover, sky.panchang) {
        when {
            moonMover != null -> "(IN HOUSE ${moonMover.houseFromLagna} · ${moonMover.signName.uppercase()})"
            !sky.panchang?.nakshatra.isNullOrBlank() -> "(${sky.panchang!!.nakshatra.uppercase()})"
            else -> null
        }
    }

    val eyebrow: String
    val headline: String
    val goldSubline: String?
    val body: String
    val accent: Color
    when (slot) {
        is TodayDynamicSlot.WelcomeBackDigest -> {
            eyebrow = "✦ WELCOME BACK · ${slot.daysAway} DAYS"
            headline = "WHAT SHIFTED WHILE AWAY"
            goldSubline = liveMoonSub
            body = slot.shiftSummary
            accent = KundliColors.Gold
        }
        is TodayDynamicSlot.AhaMomentComparison -> {
            eyebrow = "✦ SKY SNAPSHOT ANALYSIS"
            headline = slot.headline.uppercase()
            goldSubline = null
            body = slot.detail
            accent = KundliColors.Teal
        }
        is TodayDynamicSlot.SundayWeeklyReview -> {
            eyebrow = "✦ WEEKLY PATTERN REVIEW"
            headline = slot.patternHeadline.uppercase()
            goldSubline = "${slot.entriesCountThisWeek} ENTRIES LOGGED THIS WEEK"
            body = "Tap to review how your rhythm aligned with this week's planetary hours."
            accent = KundliColors.Teal
        }
        is TodayDynamicSlot.LiveSkyEvent -> {
            eyebrow = "✦ IN THE SKY TODAY"
            headline = slot.title.uppercase()
            goldSubline = liveMoonSub
            body = slot.detail
            accent = KundliColors.Gold
        }
        is TodayDynamicSlot.FirstWeekNudge -> {
            eyebrow = "✦ IN THE SKY TODAY · DAY ${slot.dayNumber}"
            headline = slot.title.uppercase()
            goldSubline = liveMoonSub
            body = slot.body
            accent = KundliColors.Gold
        }
        is TodayDynamicSlot.CuriosityNode -> {
            eyebrow = "✦ IN THE SKY TODAY"
            headline = slot.title.uppercase()
            goldSubline = liveMoonSub
            body = slot.hookLine
            accent = KundliColors.Gold
        }
        is TodayDynamicSlot.ActTwoCycle -> {
            eyebrow = "✦ IN THE SKY TODAY · ${slot.cycleKind.uppercase()}"
            headline = slot.title.uppercase()
            goldSubline = liveMoonSub
            body = slot.body
            accent = KundliColors.Gold
        }
        TodayDynamicSlot.DistressOverride -> return
    }

    Surface(
        color = KundliColors.Surface,
        border = BorderStroke(1.dp, accent.copy(alpha = 0.34f)),
        shape = RoundedCornerShape(22.dp),
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onTap),
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .drawBehind {
                    drawRect(
                        Brush.radialGradient(
                            colors = listOf(accent.copy(alpha = 0.09f), Color.Transparent),
                            center = Offset(size.width * 0.88f, size.height * 0.32f),
                            radius = size.width * 0.65f,
                        ),
                    )
                }
                .padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(eyebrow, style = MaterialTheme.typography.labelSmall, color = accent)
                if (slot !is TodayDynamicSlot.CuriosityNode && slot !is TodayDynamicSlot.ActTwoCycle) {
                    Text(
                        text = "Dismiss",
                        style = MaterialTheme.typography.labelSmall,
                        color = KundliColors.TextMuted,
                        modifier = Modifier.clickable(onClick = onDismiss),
                    )
                }
            }
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(14.dp),
                verticalAlignment = Alignment.Top,
            ) {
                Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(5.dp)) {
                    Text(
                        text = headline,
                        style = MaterialTheme.typography.titleLarge,
                        color = KundliColors.TextMain,
                    )
                    if (!goldSubline.isNullOrBlank()) {
                        Text(
                            text = goldSubline,
                            style = MaterialTheme.typography.labelMedium,
                            color = KundliColors.Gold,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                        )
                    }
                    Text(
                        text = body,
                        style = MaterialTheme.typography.bodySmall,
                        color = KundliColors.TextMain.copy(alpha = 0.84f),
                        maxLines = 3,
                        overflow = TextOverflow.Ellipsis,
                    )
                }
                Surface(
                    color = KundliColors.SurfaceRecessed,
                    border = BorderStroke(1.dp, KundliColors.Teal.copy(alpha = 0.45f)),
                    shape = RoundedCornerShape(16.dp),
                    modifier = Modifier.size(54.dp),
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .drawBehind {
                                drawCircle(
                                    brush = Brush.radialGradient(
                                        colors = listOf(KundliColors.Teal.copy(alpha = 0.22f), Color.Transparent),
                                    ),
                                )
                            },
                        contentAlignment = Alignment.Center,
                    ) {
                        Icon(
                            imageVector = Icons.Rounded.Bedtime,
                            contentDescription = null,
                            tint = KundliColors.Teal,
                            modifier = Modifier.size(24.dp),
                        )
                    }
                }
            }
            HorizontalDivider(color = KundliColors.SubtleDivider)
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    text = "Discovered $discoveryLitCount of $discoveryTotalCount nodes",
                    style = MaterialTheme.typography.labelSmall,
                    color = KundliColors.TextMuted,
                )
                Text(
                    text = "Open Constellation Map →",
                    style = MaterialTheme.typography.labelMedium,
                    color = KundliColors.Gold,
                    modifier = Modifier.clickable(onClick = onOpenDiscoveryMap),
                )
            }
        }
    }
}

@Composable
private fun TodayPanchangMatrixCard(
    sky: TodaySkyState,
    onTapCity: () -> Unit,
) {
    val p = sky.panchang
    Surface(
        color = KundliColors.Surface,
        border = BorderStroke(1.dp, KundliColors.SubtleDivider),
        shape = RoundedCornerShape(20.dp),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column(
            modifier = Modifier.padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text("EPHEMERIS TELEMETRY", style = MaterialTheme.typography.labelSmall, color = KundliColors.TextMuted)
                    Text("TODAY'S PANCHANG & SKY", style = MaterialTheme.typography.titleLarge, color = KundliColors.TextMain)
                }
                Surface(
                    color = KundliColors.Gold.copy(alpha = 0.14f),
                    border = BorderStroke(1.dp, KundliColors.GoldHairline),
                    shape = RoundedCornerShape(999.dp),
                    modifier = Modifier.clickable(onClick = onTapCity),
                ) {
                    Text(
                        text = sky.cityName.take(12).uppercase(),
                        style = MaterialTheme.typography.labelSmall,
                        color = KundliColors.Gold,
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp),
                    )
                }
            }

            // 2x2 Recessed Matrix (Equal-height flush rows with Stitch Cinzel headline + colored subtitle)
            val tithiParts = remember(p?.tithi) {
                val raw = p?.tithi.orEmpty().trim()
                val tokens = raw.split(" ", limit = 2)
                if (tokens.size == 2 && (tokens[0].equals("Shukla", true) || tokens[0].equals("Krishna", true))) {
                    "${tokens[0].uppercase()} PAKSHA" to "${tokens[1]} · ${if (tokens[0].equals("Shukla", true)) "Waxing" else "Waning"}"
                } else {
                    raw.ifBlank { "COMPUTING…" }.uppercase() to "Lunar day"
                }
            }
            val nakParts = remember(p?.nakshatra) {
                val raw = p?.nakshatra.orEmpty().trim()
                val segs = raw.split("·").map { it.trim() }
                if (segs.size >= 2) segs[0].uppercase() to "${segs[1]} · Active"
                else raw.ifBlank { "COMPUTING…" }.uppercase() to "Lunar Mansion"
            }
            Row(
                modifier = Modifier.fillMaxWidth().height(IntrinsicSize.Min),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                PanchangMatrixTile(
                    label = "TITHI",
                    value = tithiParts.first,
                    subtitle = tithiParts.second,
                    accent = KundliColors.Teal,
                    modifier = Modifier.weight(1f).fillMaxHeight(),
                )
                PanchangMatrixTile(
                    label = "NAKSHATRA",
                    value = nakParts.first,
                    subtitle = nakParts.second,
                    accent = KundliColors.Gold,
                    modifier = Modifier.weight(1f).fillMaxHeight(),
                )
            }
            Row(
                modifier = Modifier.fillMaxWidth().height(IntrinsicSize.Min),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                PanchangMatrixTile(
                    label = "YOGA",
                    value = (p?.yoga ?: "—").uppercase(),
                    subtitle = "Luni-solar union",
                    accent = KundliColors.Teal,
                    modifier = Modifier.weight(1f).fillMaxHeight(),
                )
                PanchangMatrixTile(
                    label = "KARANA",
                    value = (p?.karana ?: "—").uppercase(),
                    subtitle = "Half-tithi flow",
                    accent = KundliColors.TextMuted,
                    modifier = Modifier.weight(1f).fillMaxHeight(),
                )
            }

            // 3-Column Bottom Strip: Sunrise | Sunset | Amber Bordered Rahu Kalam (equal height)
            Row(
                modifier = Modifier.fillMaxWidth().height(IntrinsicSize.Min),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                Surface(
                    color = KundliColors.SurfaceRecessed,
                    border = BorderStroke(1.dp, KundliColors.SubtleDivider),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.weight(1f).fillMaxHeight(),
                ) {
                    Column(
                        modifier = Modifier.padding(vertical = 10.dp, horizontal = 6.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center,
                    ) {
                        Text("SUNRISE", style = MaterialTheme.typography.labelSmall, color = KundliColors.TextMuted, maxLines = 1)
                        Spacer(Modifier.height(2.dp))
                        Text(p?.sunrise ?: "—", style = TelemetryNumberStyle.copy(fontSize = 13.sp), color = KundliColors.TextMain, maxLines = 1, softWrap = false)
                    }
                }
                Surface(
                    color = KundliColors.SurfaceRecessed,
                    border = BorderStroke(1.dp, KundliColors.SubtleDivider),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.weight(1f).fillMaxHeight(),
                ) {
                    Column(
                        modifier = Modifier.padding(vertical = 10.dp, horizontal = 6.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center,
                    ) {
                        Text("SUNSET", style = MaterialTheme.typography.labelSmall, color = KundliColors.TextMuted, maxLines = 1)
                        Spacer(Modifier.height(2.dp))
                        Text(p?.sunset ?: "—", style = TelemetryNumberStyle.copy(fontSize = 13.sp), color = KundliColors.TextMain, maxLines = 1, softWrap = false)
                    }
                }
                Surface(
                    color = KundliColors.Amber.copy(alpha = 0.14f),
                    border = BorderStroke(1.dp, KundliColors.Amber.copy(alpha = 0.55f)),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.weight(1.45f).fillMaxHeight(),
                ) {
                    Column(
                        modifier = Modifier.padding(vertical = 10.dp, horizontal = 6.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center,
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(3.dp),
                        ) {
                            Icon(Icons.Rounded.WarningAmber, contentDescription = null, tint = KundliColors.Amber, modifier = Modifier.size(12.dp))
                            Text("RAHU KALAM", style = MaterialTheme.typography.labelSmall, color = KundliColors.Amber, maxLines = 1, softWrap = false)
                        }
                        Spacer(Modifier.height(2.dp))
                        Text(
                            text = sky.rahuKalamLabel.replace("Rahu Kalam", "", ignoreCase = true).replace(" to ", "–").trim().ifBlank { "—" },
                            style = TelemetryNumberStyle.copy(fontSize = 12.sp),
                            color = KundliColors.Amber,
                            maxLines = 1,
                            softWrap = false,
                            overflow = TextOverflow.Ellipsis,
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun PanchangMatrixTile(
    label: String,
    value: String,
    subtitle: String,
    accent: Color,
    modifier: Modifier = Modifier,
) {
    Surface(
        color = KundliColors.SurfaceRecessed,
        border = BorderStroke(1.dp, KundliColors.SubtleDivider),
        shape = RoundedCornerShape(14.dp),
        modifier = modifier,
    ) {
        Column(
            modifier = Modifier.padding(13.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp),
        ) {
            Text(label, style = MaterialTheme.typography.labelSmall, color = KundliColors.TextMuted)
            Text(
                text = value,
                style = MaterialTheme.typography.titleMedium,
                color = KundliColors.TextMain,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
            Text(
                text = subtitle,
                style = MaterialTheme.typography.labelSmall,
                color = accent,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
        }
    }
}

@Composable
private fun HoraRibbonAndWaveCard(
    sky: TodaySkyState,
    isEveningAfter19: Boolean,
    onSelectHour: (Int) -> Unit,
    onOpenFullWave: () -> Unit,
) {
    val currentHour = LocalTime.now().hour
    val listState = rememberLazyListState()
    LaunchedEffect(sky.hourlyWave.size, currentHour) {
        val idx = sky.hourlyWave.indexOfFirst { it.hour == currentHour }.coerceAtLeast(0)
        listState.scrollToItem((idx - 1).coerceAtLeast(0))
    }

    Surface(
        color = KundliColors.Surface,
        border = BorderStroke(1.dp, KundliColors.SubtleDivider),
        shape = RoundedCornerShape(20.dp),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column(
            modifier = Modifier.padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text("TEMPORAL CYCLE", style = MaterialTheme.typography.labelSmall, color = KundliColors.TextMuted)
                    Text("24-HORA RIBBON & WAVE", style = MaterialTheme.typography.titleLarge, color = KundliColors.TextMain)
                }
                Surface(
                    color = KundliColors.Teal.copy(alpha = 0.14f),
                    border = BorderStroke(1.dp, KundliColors.Teal.copy(alpha = 0.4f)),
                    shape = RoundedCornerShape(999.dp),
                    modifier = Modifier.clickable(onClick = onOpenFullWave),
                ) {
                    Text(
                        text = "● Scrub 24h",
                        style = MaterialTheme.typography.labelSmall,
                        color = KundliColors.Teal,
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp),
                    )
                }
            }

            // Inline Mini Day-Wave Sparkline + Horizontal Hora Cards (Active NOW tile gets crisp 2dp Gold Border!)
            if (sky.hourlyWave.isNotEmpty()) {
                Canvas(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(34.dp)
                        .clip(RoundedCornerShape(10.dp))
                        .background(KundliColors.SurfaceRecessed)
                        .clickable(onClick = onOpenFullWave)
                        .padding(horizontal = 8.dp, vertical = 6.dp),
                ) {
                    val pts = sky.hourlyWave
                    if (pts.size >= 2) {
                        val stepX = size.width / (pts.size - 1).coerceAtLeast(1)
                        val midY = size.height / 2f
                        drawLine(
                            color = KundliColors.SubtleDivider,
                            start = Offset(0f, midY),
                            end = Offset(size.width, midY),
                            strokeWidth = 1.dp.toPx(),
                        )
                        val path = Path()
                        pts.forEachIndexed { idx, pt ->
                            val x = idx * stepX
                            val norm = ((pt.score + 7f) / 14f).coerceIn(0f, 1f)
                            val y = size.height * (1f - norm)
                            if (idx == 0) path.moveTo(x, y) else path.lineTo(x, y)
                        }
                        drawPath(
                            path = path,
                            brush = Brush.horizontalGradient(listOf(KundliColors.Amber, KundliColors.Gold, KundliColors.Teal)),
                            style = Stroke(width = 2.dp.toPx(), cap = StrokeCap.Round),
                        )
                        val nowIdx = pts.indexOfFirst { it.hour == currentHour }
                        if (nowIdx >= 0) {
                            val pt = pts[nowIdx]
                            val x = nowIdx * stepX
                            val norm = ((pt.score + 7f) / 14f).coerceIn(0f, 1f)
                            val y = size.height * (1f - norm)
                            drawCircle(color = KundliColors.Gold, radius = 4.dp.toPx(), center = Offset(x, y))
                        }
                    }
                }
                LazyRow(
                    state = listState,
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                ) {
                    itemsIndexed(sky.hourlyWave, key = { _, pt -> pt.hour }) { _, pt ->
                        val isNow = pt.hour == currentHour
                        val scoreSign = if (pt.score >= 0) "+${pt.score}" else "${pt.score}"
                        Surface(
                            color = if (isNow) KundliColors.SurfaceAlt else KundliColors.SurfaceRecessed,
                            border = BorderStroke(
                                if (isNow) 2.dp else 1.dp,
                                if (isNow) KundliColors.Gold else KundliColors.SubtleDivider,
                            ),
                            shape = RoundedCornerShape(14.dp),
                            modifier = Modifier
                                .width(142.dp)
                                .clickable { onSelectHour(pt.hour) },
                        ) {
                            Column(
                                modifier = Modifier.padding(12.dp),
                                verticalArrangement = Arrangement.spacedBy(4.dp),
                            ) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                ) {
                                    Text(
                                        text = if (isNow) "● ${pt.hour.toString().padStart(2, '0')}:00" else "${pt.hour.toString().padStart(2, '0')}:00",
                                        style = TelemetryNumberStyle,
                                        color = if (isNow) KundliColors.Gold else KundliColors.TextMuted,
                                    )
                                    Text(
                                        text = scoreSign,
                                        style = TelemetryNumberStyle,
                                        color = pt.band.color,
                                    )
                                }
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text(
                                        text = "${pt.horaRuler.displayName} · ",
                                        style = MaterialTheme.typography.labelMedium,
                                        color = if (isNow) KundliColors.TextMain else KundliColors.TextMuted,
                                        maxLines = 1,
                                    )
                                    Text(
                                        text = pt.band.label,
                                        style = MaterialTheme.typography.labelMedium,
                                        color = pt.band.color,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis,
                                    )
                                }
                            }
                        }
                    }
                }
            }

            // Embedded Evening Horizon / Best Window Hook Banner (Stitch)
            Surface(
                color = KundliColors.SurfaceRecessed,
                border = BorderStroke(1.dp, KundliColors.SubtleDivider),
                shape = RoundedCornerShape(14.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable(onClick = onOpenFullWave),
            ) {
                Row(
                    modifier = Modifier.padding(12.dp),
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Icon(Icons.Rounded.Bedtime, contentDescription = null, tint = KundliColors.Gold, modifier = Modifier.size(18.dp))
                    Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                        Text(
                            text = if (isEveningAfter19) "EVENING HORIZON HOOK" else "TODAY'S PRIME WINDOWS",
                            style = MaterialTheme.typography.labelSmall,
                            color = KundliColors.TextMuted,
                        )
                        Text(
                            text = if (isEveningAfter19 && !sky.tomorrowOpeningSummary.isNullOrBlank()) {
                                "${sky.tomorrowOpeningSummary} · Best: ${sky.bestWindowLabel}"
                            } else {
                                "Best: ${sky.bestWindowLabel} · Gentle: ${sky.goGentlyLabel}"
                            },
                            style = MaterialTheme.typography.bodySmall,
                            color = KundliColors.TextMain,
                            maxLines = 2,
                            overflow = TextOverflow.Ellipsis,
                        )
                    }
                    Text(">", style = MaterialTheme.typography.bodyMedium, color = KundliColors.Gold)
                }
            }
        }
    }
}

@Composable
private fun TodaySkyMoversCard(
    movers: List<SkyMoverItem>,
    onSeeAll: () -> Unit,
) {
    Surface(
        color = KundliColors.Surface,
        border = BorderStroke(1.dp, KundliColors.SubtleDivider),
        shape = RoundedCornerShape(20.dp),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column(
            modifier = Modifier.padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text("ACTIVE INFLUENCES", style = MaterialTheme.typography.labelSmall, color = KundliColors.TextMuted)
                    Text("LIVE SKY MOVERS & TRANSITS", style = MaterialTheme.typography.titleLarge, color = KundliColors.TextMain)
                }
                Text(
                    text = "Gochar →",
                    style = MaterialTheme.typography.labelMedium,
                    color = KundliColors.Gold,
                    modifier = Modifier.clickable(onClick = onSeeAll),
                )
            }

            movers.forEach { mover ->
                Surface(
                    color = KundliColors.SurfaceRecessed,
                    border = BorderStroke(1.dp, KundliColors.SubtleDivider),
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable(onClick = onSeeAll),
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp),
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                        verticalAlignment = Alignment.Top,
                    ) {
                        Surface(
                            color = KundliColors.SurfaceAlt,
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier.size(36.dp),
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Text(
                                    text = mover.planet.displayName.take(2).uppercase(),
                                    style = MaterialTheme.typography.labelMedium,
                                    color = KundliColors.Teal,
                                )
                            }
                        }
                        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically,
                            ) {
                                Text(
                                    text = "${mover.planet.displayName} in ${mover.signName}",
                                    style = MaterialTheme.typography.titleSmall,
                                    color = KundliColors.TextMain,
                                    modifier = Modifier.weight(1f),
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis,
                                )
                                Surface(
                                    color = KundliColors.Teal.copy(alpha = 0.14f),
                                    shape = RoundedCornerShape(999.dp),
                                ) {
                                    Text(
                                        text = "House ${mover.houseFromLagna}",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = KundliColors.Teal,
                                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp),
                                    )
                                }
                            }
                            Text(
                                text = mover.plainMeaning,
                                style = MaterialTheme.typography.bodySmall,
                                color = KundliColors.TextMuted,
                                maxLines = 2,
                                overflow = TextOverflow.Ellipsis,
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun ExploreYourChartGrid(onTapTopic: (String) -> Unit) {
    data class ArchetypeItem(val topic: String, val label: String, val subtitle: String, val icon: ImageVector, val accent: Color)
    val items = listOf(
        ArchetypeItem("Career", "CAREER H10", "Vocation & public standing", Icons.Rounded.WorkOutline, KundliColors.Gold),
        ArchetypeItem("Love", "LOVE H7", "Partnerships & resonance", Icons.Rounded.FavoriteBorder, KundliColors.Amber),
        ArchetypeItem("Money", "WEALTH H2", "Resources & accumulation", Icons.Rounded.Savings, KundliColors.Teal),
        ArchetypeItem("Home", "HOME H4", "Roots & emotional peace", Icons.Rounded.Home, KundliColors.Gold),
    )

    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column {
                Text("PERSONAL ARCHETYPES", style = MaterialTheme.typography.labelSmall, color = KundliColors.TextMuted)
                Text("EXPLORE YOUR CHART", style = MaterialTheme.typography.titleLarge, color = KundliColors.TextMain)
            }
            Text("Natal D1", style = MaterialTheme.typography.labelMedium, color = KundliColors.Gold)
        }

        items.chunked(2).forEach { pair ->
            Row(
                modifier = Modifier.fillMaxWidth().height(IntrinsicSize.Min),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                pair.forEach { item ->
                    Surface(
                        color = KundliColors.Surface,
                        border = BorderStroke(1.dp, KundliColors.SubtleDivider),
                        shape = RoundedCornerShape(18.dp),
                        modifier = Modifier
                            .weight(1f)
                            .fillMaxHeight()
                            .clickable { onTapTopic(item.topic) },
                    ) {
                        Column(
                            modifier = Modifier.padding(16.dp),
                            verticalArrangement = Arrangement.spacedBy(8.dp),
                        ) {
                            Surface(
                                color = KundliColors.SurfaceRecessed,
                                border = BorderStroke(1.dp, item.accent.copy(alpha = 0.25f)),
                                shape = RoundedCornerShape(10.dp),
                                modifier = Modifier.size(34.dp),
                            ) {
                                Box(contentAlignment = Alignment.Center) {
                                    Icon(item.icon, contentDescription = null, tint = item.accent, modifier = Modifier.size(18.dp))
                                }
                            }
                            Text(item.label, style = MaterialTheme.typography.titleSmall, color = KundliColors.TextMain)
                            Text(
                                text = item.subtitle,
                                style = MaterialTheme.typography.labelSmall,
                                color = item.accent,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis,
                            )
                        }
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
