package com.kundliflow.app.ui.ask

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.kundliflow.app.ui.subject.Subject
import com.kundliflow.app.ui.subject.SubjectFindingKind
import com.kundliflow.app.ui.theme.KundliColors

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
fun AskCopilotSheet(
    profileName: String,
    originContextLabel: String,
    messages: List<AskUiMessage>,
    liveStepTicker: String?,
    onSendQuestion: (question: String, deep: Boolean) -> Unit,
    onClearHistory: () -> Unit,
    onTapEvidence: (Subject) -> Unit,
    onJumpToTiming: () -> Unit,
    onOpenReflect: (String) -> Unit,
    onExportDossier: () -> Unit,
    onDismiss: () -> Unit,
) {
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    var inputText by remember { mutableStateOf("") }
    var deepMode by remember { mutableStateOf(false) }
    var showPromptBuilder by remember { mutableStateOf(false) }
    var builderTopic by remember { mutableStateOf("Career") }
    var builderWindow by remember { mutableStateOf("Next 6 months") }
    var expandTrace by remember { mutableStateOf(false) }

    val recentSessions = remember(messages) { AskSessionGrouper.groupIntoRecentSessions(messages) }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        containerColor = KundliColors.Surface,
        contentColor = KundliColors.TextMain,
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .navigationBarsPadding()
                .imePadding()
                .padding(horizontal = 20.dp, vertical = 10.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            // Context Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text("Ask · $profileName", style = MaterialTheme.typography.headlineSmall)
                    Text(originContextLabel, style = MaterialTheme.typography.labelMedium, color = KundliColors.Teal)
                }
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
                    FilterChip(
                        selected = deepMode,
                        onClick = { deepMode = !deepMode },
                        label = { Text(if (deepMode) "✦ Deep" else "Fast") },
                    )
                    TextButton(onClick = onClearHistory) {
                        Text("Clear", color = KundliColors.TextMuted)
                    }
                }
            }

            // Recent Q&As Memory Cards (max 2)
            if (recentSessions.isNotEmpty() && messages.size > 2) {
                recentSessions.forEach { sess ->
                    Surface(
                        color = KundliColors.BgInk,
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { inputText = "Follow up on ${sess.contextTag}: " },
                    ) {
                        Row(
                            modifier = Modifier.padding(10.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(sess.contextTag, style = MaterialTheme.typography.labelMedium, color = KundliColors.Gold)
                                Text(sess.synopsis, style = MaterialTheme.typography.bodySmall, color = KundliColors.TextMuted, maxLines = 1)
                            }
                            Text(sess.timestampLabel, style = MaterialTheme.typography.labelMedium, color = KundliColors.TextMuted)
                        }
                    }
                }
            }

            // Conversation Thread + Single-line SSE Ticker
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f, fill = false)
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                if (messages.isEmpty()) {
                    Text(
                        text = "Suggested for $originContextLabel:",
                        style = MaterialTheme.typography.labelMedium,
                        color = KundliColors.TextMuted,
                    )
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        listOf("What supports this right now?", "When is the next shift?").forEach { prompt ->
                            FilterChip(
                                selected = false,
                                onClick = { onSendQuestion(prompt, deepMode) },
                                label = { Text(prompt) },
                            )
                        }
                    }
                } else {
                    messages.forEach { msg ->
                        if (msg.role == "user") {
                            Surface(
                                color = KundliColors.SurfaceAlt,
                                shape = RoundedCornerShape(14.dp),
                                modifier = Modifier.fillMaxWidth(),
                            ) {
                                Text(msg.content, style = MaterialTheme.typography.bodyMedium, modifier = Modifier.padding(12.dp))
                            }
                        } else {
                            AssistantReplyCard(
                                msg = msg,
                                onTapEvidence = onTapEvidence,
                                onJumpToTiming = onJumpToTiming,
                                onOpenReflect = { onOpenReflect(msg.content) },
                                onTapFollowUp = { q -> onSendQuestion(q, deepMode) },
                                onExportDossier = onExportDossier,
                            )
                        }
                    }
                }

                if (liveStepTicker != null) {
                    Surface(
                        color = KundliColors.BgInk,
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { expandTrace = !expandTrace },
                    ) {
                        AnimatedContent(targetState = liveStepTicker, label = "sse_ticker") { stepText ->
                            Text(
                                text = "✦ $stepText",
                                style = MaterialTheme.typography.labelMedium,
                                color = KundliColors.Teal,
                                modifier = Modifier.padding(10.dp),
                            )
                        }
                    }
                }
            }

            // 2-Row Life-Event Prompt Builder
            AnimatedVisibility(visible = showPromptBuilder) {
                Surface(color = KundliColors.SurfaceAlt, shape = RoundedCornerShape(12.dp), modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.padding(10.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            listOf("Career", "Relationships", "Home", "Finance").forEach { t ->
                                FilterChip(selected = builderTopic == t, onClick = { builderTopic = t }, label = { Text(t) })
                            }
                        }
                        FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            listOf("This week", "Next 6 months", "2027").forEach { w ->
                                FilterChip(selected = builderWindow == w, onClick = { builderWindow = w }, label = { Text(w) })
                            }
                        }
                        TextButton(
                            onClick = {
                                showPromptBuilder = false
                                onSendQuestion("How does $builderTopic look for $builderWindow?", deepMode)
                            },
                        ) {
                            Text("Ask: $builderTopic · $builderWindow →", color = KundliColors.Gold)
                        }
                    }
                }
            }

            HorizontalDivider(color = KundliColors.SubtleDivider)
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                TextButton(onClick = { showPromptBuilder = !showPromptBuilder }) {
                    Text("Build", color = KundliColors.Gold)
                }
                OutlinedTextField(
                    value = inputText,
                    onValueChange = { inputText = it },
                    placeholder = { Text("Ask about your chart or timing…") },
                    modifier = Modifier.weight(1f),
                    singleLine = true,
                )
                Button(
                    onClick = {
                        val q = inputText.trim()
                        if (q.isNotEmpty()) {
                            inputText = ""
                            onSendQuestion(q, deepMode)
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = KundliColors.Teal, contentColor = KundliColors.OrbInk),
                ) {
                    Text("Ask")
                }
            }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun AssistantReplyCard(
    msg: AskUiMessage,
    onTapEvidence: (Subject) -> Unit,
    onJumpToTiming: () -> Unit,
    onOpenReflect: () -> Unit,
    onTapFollowUp: (String) -> Unit,
    onExportDossier: () -> Unit,
) {
    var showBecause by remember(msg.id) { mutableStateOf(false) }

    Surface(
        color = KundliColors.BgInk,
        border = BorderStroke(1.dp, KundliColors.GoldHairline),
        shape = RoundedCornerShape(16.dp),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(msg.content, style = MaterialTheme.typography.bodyMedium, color = KundliColors.TextMain)

            if (msg.responseType == "level2_fallback") {
                OutlinedButton(onClick = onExportDossier) {
                    Text("Export AI Dossier", color = KundliColors.Gold)
                }
            }

            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                if (msg.evidenceIds.isNotEmpty()) {
                    TextButton(onClick = { showBecause = !showBecause }) {
                        Text(if (showBecause) "Hide Because" else "Because (${msg.evidenceIds.size})", color = KundliColors.Teal)
                    }
                }
                TextButton(onClick = onJumpToTiming) { Text("Timing", color = KundliColors.Gold) }
                TextButton(onClick = onOpenReflect) { Text("Reflect", color = KundliColors.Gold) }
            }

            AnimatedVisibility(visible = showBecause) {
                FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    msg.evidenceIds.forEach { evId ->
                        FilterChip(
                            selected = false,
                            onClick = { onTapEvidence(Subject.Finding(evId, SubjectFindingKind.RULE)) },
                            label = { Text(evId) },
                        )
                    }
                }
            }

            if (msg.followUps.isNotEmpty()) {
                FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    msg.followUps.take(2).forEach { fq ->
                        FilterChip(selected = false, onClick = { onTapFollowUp(fq) }, label = { Text(fq) })
                    }
                }
            }
        }
    }
}
