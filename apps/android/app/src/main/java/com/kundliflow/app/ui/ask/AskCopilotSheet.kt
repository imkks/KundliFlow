package com.kundliflow.app.ui.ask

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.Send
import androidx.compose.material.icons.rounded.AutoAwesome
import androidx.compose.material.icons.rounded.CalendarMonth
import androidx.compose.material.icons.rounded.ContentCopy
import androidx.compose.material.icons.rounded.DeleteOutline
import androidx.compose.material.icons.rounded.EditNote
import androidx.compose.material.icons.rounded.ExpandLess
import androidx.compose.material.icons.rounded.ExpandMore
import androidx.compose.material.icons.rounded.History
import androidx.compose.material.icons.rounded.Schedule
import androidx.compose.material.icons.rounded.Tune
import androidx.compose.material.icons.rounded.Verified
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
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import com.kundliflow.app.ui.subject.Subject
import com.kundliflow.app.ui.theme.KundliColors

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
fun AskCopilotSheet(
    profileName: String,
    originContextLabel: String,
    messages: List<AskUiMessage>,
    liveStepTicker: String?,
    liveTraceSteps: List<String> = emptyList(),
    onSendQuestion: (question: String, deep: Boolean) -> Unit,
    onClearHistory: () -> Unit,
    onTapEvidence: (Subject) -> Unit,
    onJumpToTiming: () -> Unit,
    onOpenReflect: (String) -> Unit,
    onExportDossier: () -> Unit,
    onDismiss: () -> Unit,
) {
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    val listState = rememberLazyListState()
    val haptics = LocalHapticFeedback.current

    var inputText by remember { mutableStateOf("") }
    var deepMode by remember { mutableStateOf(false) }
    var showPromptBuilder by remember { mutableStateOf(false) }
    var showEventDateBar by remember { mutableStateOf(false) }
    var selectedEventDate by remember { mutableStateOf<String?>(null) }
    var builderTopic by remember { mutableStateOf("Career") }
    var builderWindow by remember { mutableStateOf("Next 6 months") }
    var expandLiveTrace by remember { mutableStateOf(false) }
    var confirmClear by remember { mutableStateOf(false) }

    val isStreaming = liveStepTicker != null
    val recentSessions = remember(messages) { AskSessionGrouper.groupIntoRecentSessions(messages) }

    // Smooth auto-scroll whenever messages or streaming steps update
    LaunchedEffect(messages.size, liveStepTicker) {
        val lastIndex = (messages.size + if (isStreaming) 1 else 0) - 1
        if (lastIndex >= 0) {
            listState.animateScrollToItem(lastIndex.coerceAtLeast(0))
        }
    }

    fun dispatchQuestion(raw: String) {
        val trimmed = raw.trim()
        if (trimmed.isEmpty() || isStreaming) return
        val fullQ = if (selectedEventDate != null) {
            "[$selectedEventDate] $trimmed"
        } else {
            trimmed
        }
        haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
        inputText = ""
        selectedEventDate = null
        showEventDateBar = false
        showPromptBuilder = false
        onSendQuestion(fullQ, deepMode)
    }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        containerColor = KundliColors.Surface,
        contentColor = KundliColors.TextMain,
        dragHandle = {
            Box(
                modifier = Modifier
                    .padding(top = 10.dp, bottom = 6.dp)
                    .size(width = 38.dp, height = 4.dp)
                    .clip(CircleShape)
                    .background(KundliColors.Gold.copy(alpha = 0.45f)),
            )
        },
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight(0.92f)
                .navigationBarsPadding()
                .imePadding(),
        ) {
            // 1. Calm Luxury Header Bar
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                    modifier = Modifier.weight(1f),
                ) {
                    Box(
                        modifier = Modifier
                            .size(34.dp)
                            .clip(CircleShape)
                            .background(KundliColors.AskOrbBrush),
                        contentAlignment = Alignment.Center,
                    ) {
                        Icon(
                            imageVector = Icons.Rounded.AutoAwesome,
                            contentDescription = null,
                            tint = KundliColors.OrbInk,
                            modifier = Modifier.size(18.dp),
                        )
                    }
                    Column {
                        Text(
                            text = "Ask · $profileName",
                            style = MaterialTheme.typography.titleMedium,
                            color = KundliColors.TextMain,
                        )
                        Text(
                            text = originContextLabel,
                            style = MaterialTheme.typography.labelMedium,
                            color = KundliColors.Teal,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                        )
                    }
                }

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                ) {
                    FastDeepSegmentedPill(
                        deepMode = deepMode,
                        onChange = {
                            haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                            deepMode = it
                        },
                    )
                    if (messages.isNotEmpty()) {
                        if (confirmClear) {
                            TextButton(
                                onClick = {
                                    confirmClear = false
                                    onClearHistory()
                                },
                                contentPadding = PaddingValues(horizontal = 8.dp),
                            ) {
                                Text("Clear?", color = KundliColors.AlertCrimson, style = MaterialTheme.typography.labelMedium)
                            }
                        } else {
                            IconButton(
                                onClick = { confirmClear = true },
                                modifier = Modifier.size(34.dp),
                            ) {
                                Icon(
                                    imageVector = Icons.Rounded.DeleteOutline,
                                    contentDescription = "Clear conversation",
                                    tint = KundliColors.TextMuted,
                                    modifier = Modifier.size(18.dp),
                                )
                            }
                        }
                    }
                }
            }

            HorizontalDivider(color = KundliColors.SubtleDivider)

            // 2. Conversation Stream (LazyColumn with smooth auto-scroll)
            LazyColumn(
                state = listState,
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth(),
                contentPadding = PaddingValues(horizontal = 20.dp, vertical = 16.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp),
            ) {
                if (messages.isEmpty()) {
                    item(key = "zero_state") {
                        AskZeroStateWelcome(
                            profileName = profileName,
                            originContextLabel = originContextLabel,
                            onTapPrompt = { dispatchQuestion(it) },
                            onOpenBuilder = { showPromptBuilder = true },
                            onOpenEventDate = { showEventDateBar = true },
                        )
                    }
                } else {
                    if (recentSessions.size > 1) {
                        item(key = "recent_memory") {
                            RecentMemoryStrip(
                                sessions = recentSessions,
                                onSelectSession = { sess ->
                                    inputText = "Follow up on ${sess.contextTag}: "
                                },
                            )
                        }
                    }

                    items(messages, key = { it.id }) { msg ->
                        if (msg.role == "user") {
                            UserChatBubble(msg = msg)
                        } else {
                            AssistantEditorialCard(
                                msg = msg,
                                onTapEvidence = onTapEvidence,
                                onJumpToTiming = onJumpToTiming,
                                onOpenReflect = { onOpenReflect(msg.content) },
                                onTapFollowUp = { dispatchQuestion(it) },
                                onExportDossier = onExportDossier,
                            )
                        }
                    }
                }

                if (liveStepTicker != null) {
                    item(key = "live_sse_ticker") {
                        LiveReasoningTickerCard(
                            currentStep = liveStepTicker,
                            allSteps = liveTraceSteps,
                            expanded = expandLiveTrace,
                            onToggleExpand = { expandLiveTrace = !expandLiveTrace },
                        )
                    }
                }
            }

            // 3. Optional Inline Event-Date Strip (+ Event Date shortcut from §5.4)
            AnimatedVisibility(visible = showEventDateBar) {
                Surface(
                    color = KundliColors.SurfaceAlt,
                    shape = RoundedCornerShape(topStart = 16.dp, topEnd = 16.dp),
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Column(
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 10.dp),
                        verticalArrangement = Arrangement.spacedBy(6.dp),
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Text("Attach Event Year / Window", style = MaterialTheme.typography.labelMedium, color = KundliColors.Gold)
                            if (selectedEventDate != null) {
                                Text(
                                    text = "Clear",
                                    style = MaterialTheme.typography.labelMedium,
                                    color = KundliColors.TextMuted,
                                    modifier = Modifier.clickable { selectedEventDate = null },
                                )
                            }
                        }
                        FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            listOf("2021", "2023", "2024", "2026", "Next 12 months").forEach { dt ->
                                FilterChip(
                                    selected = selectedEventDate == dt,
                                    onClick = { selectedEventDate = if (selectedEventDate == dt) null else dt },
                                    label = { Text(dt) },
                                )
                            }
                        }
                    }
                }
            }

            // 4. Optional 2-Row Life-Event Prompt Builder
            AnimatedVisibility(visible = showPromptBuilder) {
                Surface(
                    color = KundliColors.SurfaceAlt,
                    shape = RoundedCornerShape(topStart = 16.dp, topEnd = 16.dp),
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Column(
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        Text("Build a Question", style = MaterialTheme.typography.labelMedium, color = KundliColors.Gold)
                        FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            listOf("Career", "Relationships", "Home", "Finance", "Inner growth").forEach { t ->
                                FilterChip(
                                    selected = builderTopic == t,
                                    onClick = { builderTopic = t },
                                    label = { Text(t) },
                                )
                            }
                        }
                        FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            listOf("This week", "Next 6 months", "2027").forEach { w ->
                                FilterChip(
                                    selected = builderWindow == w,
                                    onClick = { builderWindow = w },
                                    label = { Text(w) },
                                )
                            }
                        }
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.End,
                        ) {
                            TextButton(
                                onClick = { dispatchQuestion("How does $builderTopic look for $builderWindow?") },
                            ) {
                                Text("Ask: $builderTopic · $builderWindow →", color = KundliColors.Teal)
                            }
                        }
                    }
                }
            }

            // 5. Floating Pill Composer Dock
            Surface(
                color = KundliColors.Surface,
                modifier = Modifier.fillMaxWidth(),
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 10.dp),
                    verticalArrangement = Arrangement.spacedBy(6.dp),
                ) {
                    if (selectedEventDate != null) {
                        Surface(
                            color = KundliColors.Teal.copy(alpha = 0.14f),
                            shape = RoundedCornerShape(10.dp),
                        ) {
                            Text(
                                text = "Event context: $selectedEventDate ×",
                                style = MaterialTheme.typography.labelMedium,
                                color = KundliColors.Teal,
                                modifier = Modifier
                                    .clickable { selectedEventDate = null }
                                    .padding(horizontal = 10.dp, vertical = 4.dp),
                            )
                        }
                    }

                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(28.dp))
                            .background(KundliColors.BgInk)
                            .border(
                                width = 1.dp,
                                color = if (inputText.isNotBlank()) KundliColors.Gold.copy(alpha = 0.45f) else KundliColors.SubtleDivider,
                                shape = RoundedCornerShape(28.dp),
                            )
                            .padding(horizontal = 8.dp, vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        IconButton(
                            onClick = {
                                showEventDateBar = false
                                showPromptBuilder = !showPromptBuilder
                            },
                            modifier = Modifier.size(36.dp),
                        ) {
                            Icon(
                                imageVector = Icons.Rounded.Tune,
                                contentDescription = "Build a question",
                                tint = if (showPromptBuilder) KundliColors.Gold else KundliColors.TextMuted,
                                modifier = Modifier.size(20.dp),
                            )
                        }

                        IconButton(
                            onClick = {
                                showPromptBuilder = false
                                showEventDateBar = !showEventDateBar
                            },
                            modifier = Modifier.size(36.dp),
                        ) {
                            Icon(
                                imageVector = Icons.Rounded.CalendarMonth,
                                contentDescription = "Attach event date",
                                tint = if (showEventDateBar || selectedEventDate != null) KundliColors.Teal else KundliColors.TextMuted,
                                modifier = Modifier.size(20.dp),
                            )
                        }

                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .padding(horizontal = 6.dp, vertical = 8.dp),
                            contentAlignment = Alignment.CenterStart,
                        ) {
                            if (inputText.isEmpty()) {
                                Text(
                                    text = if (deepMode) "Ask a deep Jyotish question…" else "Ask about your chart or timing…",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = KundliColors.TextMuted.copy(alpha = 0.75f),
                                )
                            }
                            BasicTextField(
                                value = inputText,
                                onValueChange = { inputText = it },
                                textStyle = MaterialTheme.typography.bodyMedium.copy(color = KundliColors.TextMain),
                                cursorBrush = SolidColor(KundliColors.Gold),
                                maxLines = 4,
                                modifier = Modifier.fillMaxWidth(),
                            )
                        }

                        val canSend = inputText.isNotBlank() && !isStreaming
                        Box(
                            modifier = Modifier
                                .size(40.dp)
                                .clip(CircleShape)
                                .background(
                                    if (canSend) KundliColors.AskOrbBrush
                                    else SolidColor(KundliColors.SurfaceAlt),
                                )
                                .clickable(enabled = canSend) { dispatchQuestion(inputText) },
                            contentAlignment = Alignment.Center,
                        ) {
                            Icon(
                                imageVector = Icons.AutoMirrored.Rounded.Send,
                                contentDescription = "Send question",
                                tint = if (canSend) KundliColors.OrbInk else KundliColors.TextMuted,
                                modifier = Modifier.size(18.dp),
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun FastDeepSegmentedPill(
    deepMode: Boolean,
    onChange: (Boolean) -> Unit,
) {
    Row(
        modifier = Modifier
            .clip(RoundedCornerShape(20.dp))
            .background(KundliColors.BgInk)
            .border(1.dp, KundliColors.SubtleDivider, RoundedCornerShape(20.dp))
            .padding(3.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        listOf(false to "Fast", true to "✦ Deep").forEach { (isDeep, label) ->
            val active = deepMode == isDeep
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(16.dp))
                    .background(if (active) KundliColors.SurfaceAlt else KundliColors.BgInk)
                    .clickable { onChange(isDeep) }
                    .padding(horizontal = 10.dp, vertical = 5.dp),
            ) {
                Text(
                    text = label,
                    style = MaterialTheme.typography.labelMedium,
                    color = when {
                        active && isDeep -> KundliColors.Teal
                        active -> KundliColors.Gold
                        else -> KundliColors.TextMuted
                    },
                )
            }
        }
    }
}

@Composable
private fun AskZeroStateWelcome(
    profileName: String,
    originContextLabel: String,
    onTapPrompt: (String) -> Unit,
    onOpenBuilder: () -> Unit,
    onOpenEventDate: () -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 12.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        Box(
            modifier = Modifier
                .size(56.dp)
                .clip(CircleShape)
                .background(KundliColors.AskOrbBrush),
            contentAlignment = Alignment.Center,
        ) {
            Icon(
                imageVector = Icons.Rounded.AutoAwesome,
                contentDescription = null,
                tint = KundliColors.OrbInk,
                modifier = Modifier.size(28.dp),
            )
        }

        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                text = "Grounded in $profileName's chart",
                style = MaterialTheme.typography.headlineSmall,
                color = KundliColors.TextMain,
            )
            Spacer(Modifier.height(4.dp))
            Text(
                text = "Every answer cites your verified houses, Dashas, and classical rules.",
                style = MaterialTheme.typography.bodySmall,
                color = KundliColors.TextMuted,
            )
        }

        val starterPrompts = listOf(
            "What supports me most right now?" to "Active Hora, Moon & Dasha alignment",
            "When does my next shift open?" to "Upcoming Antardasha & transit themes",
        )
        Column(verticalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
            starterPrompts.forEach { (question, subtitle) ->
                Surface(
                    color = KundliColors.BgInk,
                    border = BorderStroke(1.dp, KundliColors.GoldHairline),
                    shape = RoundedCornerShape(16.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { onTapPrompt(question) },
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Text(question, style = MaterialTheme.typography.titleMedium, color = KundliColors.TextMain)
                        Spacer(Modifier.height(2.dp))
                        Text(subtitle, style = MaterialTheme.typography.bodySmall, color = KundliColors.TextMuted)
                    }
                }
            }
        }

        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            Surface(
                color = KundliColors.SurfaceAlt,
                shape = RoundedCornerShape(20.dp),
                modifier = Modifier.clickable(onClick = onOpenBuilder),
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                ) {
                    Icon(Icons.Rounded.Tune, contentDescription = null, tint = KundliColors.Gold, modifier = Modifier.size(16.dp))
                    Text("Build a question", style = MaterialTheme.typography.labelMedium, color = KundliColors.Gold)
                }
            }
            Surface(
                color = KundliColors.SurfaceAlt,
                shape = RoundedCornerShape(20.dp),
                modifier = Modifier.clickable(onClick = onOpenEventDate),
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                ) {
                    Icon(Icons.Rounded.CalendarMonth, contentDescription = null, tint = KundliColors.Teal, modifier = Modifier.size(16.dp))
                    Text("+ Event Date", style = MaterialTheme.typography.labelMedium, color = KundliColors.Teal)
                }
            }
        }
    }
}

@Composable
private fun RecentMemoryStrip(
    sessions: List<AskSessionSummary>,
    onSelectSession: (AskSessionSummary) -> Unit,
) {
    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            Icon(Icons.Rounded.History, contentDescription = null, tint = KundliColors.TextMuted, modifier = Modifier.size(14.dp))
            Text("RECENT Q&AS", style = MaterialTheme.typography.labelMedium, color = KundliColors.TextMuted)
        }
        sessions.forEach { sess ->
            Surface(
                color = KundliColors.BgInk,
                shape = RoundedCornerShape(12.dp),
                border = BorderStroke(1.dp, KundliColors.SubtleDivider),
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { onSelectSession(sess) },
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 10.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(sess.contextTag, style = MaterialTheme.typography.labelMedium, color = KundliColors.Gold)
                        Text(sess.synopsis, style = MaterialTheme.typography.bodySmall, color = KundliColors.TextMuted, maxLines = 1, overflow = TextOverflow.Ellipsis)
                    }
                    Text("Resume →", style = MaterialTheme.typography.labelMedium, color = KundliColors.Teal)
                }
            }
        }
    }
}

@Composable
private fun UserChatBubble(msg: AskUiMessage) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.End,
    ) {
        Surface(
            color = KundliColors.SurfaceAlt,
            border = BorderStroke(1.dp, KundliColors.GoldHairline),
            shape = RoundedCornerShape(topStart = 18.dp, topEnd = 18.dp, bottomStart = 18.dp, bottomEnd = 4.dp),
            modifier = Modifier.widthIn(max = 290.dp),
        ) {
            Text(
                text = msg.content,
                style = MaterialTheme.typography.bodyMedium,
                color = KundliColors.TextMain,
                modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp),
            )
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun AssistantEditorialCard(
    msg: AskUiMessage,
    onTapEvidence: (Subject) -> Unit,
    onJumpToTiming: () -> Unit,
    onOpenReflect: () -> Unit,
    onTapFollowUp: (String) -> Unit,
    onExportDossier: () -> Unit,
) {
    var showBecause by remember(msg.id) { mutableStateOf(false) }
    var copied by remember(msg.id) { mutableStateOf(false) }
    val clipboard = LocalClipboardManager.current
    val resolvedEvidence = remember(msg.evidenceIds) { msg.evidenceIds.map { AskEvidenceResolver.resolve(it) } }

    Surface(
        color = KundliColors.BgInk,
        border = BorderStroke(1.dp, KundliColors.SubtleDivider),
        shape = RoundedCornerShape(topStart = 4.dp, topEnd = 18.dp, bottomStart = 18.dp, bottomEnd = 18.dp),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            // Card Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                ) {
                    Icon(
                        imageVector = if (resolvedEvidence.isNotEmpty()) Icons.Rounded.Verified else Icons.Rounded.AutoAwesome,
                        contentDescription = null,
                        tint = KundliColors.Teal,
                        modifier = Modifier.size(16.dp),
                    )
                    Text(
                        text = if (msg.responseType == "level2_fallback") "Classical Rule Synthesis" else "Jyotish Copilot",
                        style = MaterialTheme.typography.labelMedium,
                        color = KundliColors.Teal,
                    )
                }
                IconButton(
                    onClick = {
                        clipboard.setText(AnnotatedString(msg.content))
                        copied = true
                    },
                    modifier = Modifier.size(28.dp),
                ) {
                    Icon(
                        imageVector = Icons.Rounded.ContentCopy,
                        contentDescription = "Copy answer",
                        tint = if (copied) KundliColors.Gold else KundliColors.TextMuted,
                        modifier = Modifier.size(15.dp),
                    )
                }
            }

            // Formatted Prose Body (**bold** & clean bullet rendering)
            Text(
                text = formatEditorialProse(msg.content),
                style = MaterialTheme.typography.bodyMedium,
                color = KundliColors.TextMain,
            )

            if (msg.responseType == "level2_fallback") {
                OutlinedButton(
                    onClick = onExportDossier,
                    border = BorderStroke(1.dp, KundliColors.GoldHairline),
                ) {
                    Text("Export AI Dossier (.md)", color = KundliColors.Gold)
                }
            }

            // Action Strip
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(6.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                if (resolvedEvidence.isNotEmpty()) {
                    Surface(
                        color = if (showBecause) KundliColors.Teal.copy(alpha = 0.16f) else KundliColors.Surface,
                        shape = RoundedCornerShape(16.dp),
                        modifier = Modifier.clickable { showBecause = !showBecause },
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(4.dp),
                        ) {
                            Text(
                                text = "Because (${resolvedEvidence.size})",
                                style = MaterialTheme.typography.labelMedium,
                                color = KundliColors.Teal,
                            )
                            Icon(
                                imageVector = if (showBecause) Icons.Rounded.ExpandLess else Icons.Rounded.ExpandMore,
                                contentDescription = null,
                                tint = KundliColors.Teal,
                                modifier = Modifier.size(14.dp),
                            )
                        }
                    }
                }
                Surface(
                    color = KundliColors.Surface,
                    shape = RoundedCornerShape(16.dp),
                    modifier = Modifier.clickable(onClick = onJumpToTiming),
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp),
                    ) {
                        Icon(Icons.Rounded.Schedule, contentDescription = null, tint = KundliColors.Gold, modifier = Modifier.size(14.dp))
                        Text("Timing", style = MaterialTheme.typography.labelMedium, color = KundliColors.Gold)
                    }
                }
                Surface(
                    color = KundliColors.Surface,
                    shape = RoundedCornerShape(16.dp),
                    modifier = Modifier.clickable(onClick = onOpenReflect),
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp),
                    ) {
                        Icon(Icons.Rounded.EditNote, contentDescription = null, tint = KundliColors.Gold, modifier = Modifier.size(14.dp))
                        Text("Reflect", style = MaterialTheme.typography.labelMedium, color = KundliColors.Gold)
                    }
                }
            }

            // Human-Readable Evidence Chips opening exact SubjectSheet Rung 2
            AnimatedVisibility(visible = showBecause) {
                FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    resolvedEvidence.forEach { chip ->
                        FilterChip(
                            selected = false,
                            onClick = { onTapEvidence(chip.subject) },
                            label = { Text(chip.label) },
                            colors = FilterChipDefaults.filterChipColors(
                                containerColor = KundliColors.SurfaceAlt,
                                labelColor = KundliColors.TextMain,
                            ),
                        )
                    }
                }
            }

            // Max 2 Follow-up suggestions
            if (msg.followUps.isNotEmpty()) {
                HorizontalDivider(color = KundliColors.SubtleDivider)
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    msg.followUps.take(2).forEach { fq ->
                        Surface(
                            color = KundliColors.Surface,
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { onTapFollowUp(fq) },
                        ) {
                            Text(
                                text = "↳ $fq",
                                style = MaterialTheme.typography.bodySmall,
                                color = KundliColors.Gold,
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun LiveReasoningTickerCard(
    currentStep: String,
    allSteps: List<String>,
    expanded: Boolean,
    onToggleExpand: () -> Unit,
) {
    val pulse = rememberInfiniteTransition(label = "ask_pulse")
    val alpha by pulse.animateFloat(
        initialValue = 0.4f,
        targetValue = 1.0f,
        animationSpec = infiniteRepeatable(tween(750), RepeatMode.Reverse),
        label = "ask_pulse_alpha",
    )

    Surface(
        color = KundliColors.BgInk,
        border = BorderStroke(1.dp, KundliColors.Teal.copy(alpha = 0.35f)),
        shape = RoundedCornerShape(14.dp),
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onToggleExpand),
    ) {
        Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.weight(1f),
                ) {
                    Box(
                        modifier = Modifier
                            .size(8.dp)
                            .alpha(alpha)
                            .clip(CircleShape)
                            .background(KundliColors.Teal),
                    )
                    AnimatedContent(
                        targetState = currentStep,
                        transitionSpec = { fadeIn(tween(220)) togetherWith fadeOut(tween(180)) },
                        label = "sse_ticker_text",
                    ) { text ->
                        Text(
                            text = text,
                            style = MaterialTheme.typography.labelMedium,
                            color = KundliColors.Teal,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                        )
                    }
                }
                if (allSteps.size > 1) {
                    Text(
                        text = "${allSteps.size} steps ${if (expanded) "▴" else "▾"}",
                        style = MaterialTheme.typography.labelMedium,
                        color = KundliColors.TextMuted,
                    )
                }
            }

            AnimatedVisibility(visible = expanded && allSteps.isNotEmpty()) {
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    HorizontalDivider(color = KundliColors.SubtleDivider)
                    allSteps.forEachIndexed { idx, step ->
                        Text(
                            text = "${idx + 1}. $step",
                            style = MaterialTheme.typography.bodySmall,
                            color = KundliColors.TextMuted,
                        )
                    }
                }
            }
        }
    }
}

/**
 * Lightweight editorial formatter turning **bold** spans into Gold/SemiBold
 * and normalizing markdown dashes into clean bullets.
 */
private fun formatEditorialProse(raw: String): AnnotatedString = buildAnnotatedString {
    val lines = raw.replace("\r\n", "\n").split("\n")
    lines.forEachIndexed { lineIdx, originalLine ->
        val line = if (originalLine.trimStart().startsWith("- ")) {
            "• " + originalLine.trimStart().removePrefix("- ")
        } else {
            originalLine
        }
        val parts = line.split("**")
        parts.forEachIndexed { partIdx, segment ->
            if (partIdx % 2 == 1) {
                withStyle(SpanStyle(fontWeight = FontWeight.SemiBold, color = KundliColors.Gold)) {
                    append(segment)
                }
            } else {
                append(segment)
            }
        }
        if (lineIdx < lines.lastIndex) append("\n")
    }
}
