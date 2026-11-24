package com.kundliflow.app.ui.subject

import androidx.activity.compose.BackHandler
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowBack
import androidx.compose.material.icons.rounded.AutoAwesome
import androidx.compose.material.icons.rounded.EditNote
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.SheetValue
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
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.unit.dp
import com.kundliflow.app.ui.theme.KundliColors
import com.kundliflow.app.ui.theme.TelemetryNumberStyle

/**
 * Universal Depth-Ladder SubjectSheet (§2).
 * Supports Rung 1 (Peek) -> Rung 2 (Explain) -> Rung 3 (Evidence),
 * Visited-Stack Predictive Back, 44dp Spatial Mini-Kundli Header,
 * Zero-Trap One-Thumb Physics, and uniform [Ask | Reflect] footer.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SubjectSheet(
    subject: Subject,
    reading: SubjectReadingContent,
    rungStack: List<Rung>,
    showAlwaysDetailsPrompt: Boolean = false,
    onPushRung: (Rung) -> Unit,
    onPopRung: () -> Unit,
    onAcceptAlwaysDetails: () -> Unit = {},
    onDismissAlwaysDetails: () -> Unit = {},
    onAskSubject: (Subject) -> Unit,
    onReflectSubject: (Subject) -> Unit,
    onDismiss: () -> Unit,
) {
    val activeRung = rungStack.lastOrNull() ?: Rung.Peek
    val haptics = LocalHapticFeedback.current
    val sheetState = rememberModalBottomSheetState(
        skipPartiallyExpanded = activeRung == Rung.Evidence,
    )

    LaunchedEffect(activeRung) {
        if (activeRung == Rung.Evidence && sheetState.currentValue != SheetValue.Expanded) {
            sheetState.expand()
        }
    }

    // Visited-Stack Predictive Back (§2 Rule 6)
    BackHandler(enabled = true) {
        if (rungStack.size > 1) {
            onPopRung()
        } else {
            onDismiss()
        }
    }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        containerColor = KundliColors.Surface,
        contentColor = KundliColors.TextMain,
    ) {
        // Zero-trap one-thumb physics: inner scroll enabled only at Evidence / Full depth
        val bodyScrollModifier = if (activeRung == Rung.Evidence) {
            Modifier.verticalScroll(rememberScrollState())
        } else {
            Modifier
        }

        Column(
            modifier = Modifier
                .fillMaxWidth()
                .navigationBarsPadding()
                .padding(horizontal = 20.dp)
                .padding(bottom = 16.dp),
        ) {
            // Header with optional Back-within-sheet & 44dp Mini-Kundli
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                if (rungStack.size > 1) {
                    IconButton(onClick = onPopRung) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Rounded.ArrowBack,
                            contentDescription = "Previous depth",
                            tint = KundliColors.Gold,
                        )
                    }
                }
                if (subject is Subject.House || subject is Subject.Planet) {
                    MiniKundliBadge(activeHouse = reading.activeHouseNumber)
                    Spacer(Modifier.width(12.dp))
                }
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = reading.title,
                        style = MaterialTheme.typography.headlineSmall,
                        color = KundliColors.TextMain,
                    )
                    Text(
                        text = "${reading.subtitle} · ${activeRung.name}",
                        style = MaterialTheme.typography.labelMedium,
                        color = KundliColors.TextMuted,
                    )
                }
            }

            Spacer(Modifier.height(14.dp))
            HorizontalDivider(color = KundliColors.SubtleDivider)
            Spacer(Modifier.height(14.dp))

            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f, fill = false)
                    .then(bodyScrollModifier),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                when (activeRung) {
                    Rung.Glance, Rung.Peek -> PeekRungBody(
                        reading = reading,
                        onExplain = {
                            haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                            onPushRung(Rung.Explain)
                        },
                    )
                    Rung.Explain -> ExplainRungBody(
                        reading = reading,
                        onShowMath = {
                            haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                            onPushRung(Rung.Evidence)
                        },
                    )
                    Rung.Evidence -> EvidenceRungBody(
                        reading = reading,
                        showAlwaysDetailsPrompt = showAlwaysDetailsPrompt,
                        onAcceptAlwaysDetails = onAcceptAlwaysDetails,
                        onDismissAlwaysDetails = onDismissAlwaysDetails,
                    )
                }
            }

            Spacer(Modifier.height(16.dp))
            HorizontalDivider(color = KundliColors.SubtleDivider)
            Spacer(Modifier.height(12.dp))

            // Uniform 2-button footer (§2 Rule 2)
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                OutlinedButton(
                    onClick = { onAskSubject(subject) },
                    modifier = Modifier.weight(1f),
                    border = BorderStroke(1.dp, KundliColors.Teal.copy(alpha = 0.6f)),
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = KundliColors.Teal),
                ) {
                    Icon(Icons.Rounded.AutoAwesome, contentDescription = null)
                    Spacer(Modifier.width(6.dp))
                    Text("Ask")
                }
                Button(
                    onClick = { onReflectSubject(subject) },
                    modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = KundliColors.Gold,
                        contentColor = KundliColors.OrbInk,
                    ),
                ) {
                    Icon(Icons.Rounded.EditNote, contentDescription = null)
                    Spacer(Modifier.width(6.dp))
                    Text("Reflect")
                }
            }
        }
    }
}

@Composable
private fun PeekRungBody(
    reading: SubjectReadingContent,
    onExplain: () -> Unit,
) {
    Text(
        text = reading.peekSummary,
        style = MaterialTheme.typography.bodyMedium,
        color = KundliColors.TextMain,
    )
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        reading.peekFacts.take(3).forEach { fact ->
            Surface(
                modifier = Modifier.weight(1f),
                color = KundliColors.SurfaceAlt,
                shape = RoundedCornerShape(12.dp),
            ) {
                Column(modifier = Modifier.padding(10.dp)) {
                    Text(
                        text = fact.label,
                        style = MaterialTheme.typography.labelMedium,
                        color = KundliColors.TextMuted,
                    )
                    Spacer(Modifier.height(2.dp))
                    Text(
                        text = fact.value,
                        style = MaterialTheme.typography.titleMedium,
                        color = KundliColors.TextMain,
                    )
                }
            }
        }
    }
    Text(
        text = reading.disclaimer,
        style = MaterialTheme.typography.bodySmall,
        color = KundliColors.TextMuted,
    )
    TextButton(onClick = onExplain) {
        Text("Why? Explore findings →", color = KundliColors.Gold)
    }
}

@Composable
private fun ExplainRungBody(
    reading: SubjectReadingContent,
    onShowMath: () -> Unit,
) {
    reading.findings.take(3).forEach { item ->
        var whyExpanded by remember(item.id) { mutableStateOf(false) }
        Surface(
            color = KundliColors.SurfaceAlt,
            shape = RoundedCornerShape(14.dp),
            modifier = Modifier
                .fillMaxWidth()
                .clickable { whyExpanded = !whyExpanded },
        ) {
            Column(modifier = Modifier.padding(14.dp)) {
                Text(
                    text = item.title,
                    style = MaterialTheme.typography.titleMedium,
                    color = KundliColors.TextMain,
                )
                Spacer(Modifier.height(4.dp))
                Text(
                    text = item.plainMeaning,
                    style = MaterialTheme.typography.bodySmall,
                    color = KundliColors.TextMuted,
                )
                AnimatedVisibility(visible = whyExpanded) {
                    Column {
                        Spacer(Modifier.height(8.dp))
                        Text(
                            text = item.whyDetail,
                            style = MaterialTheme.typography.bodySmall,
                            color = KundliColors.Gold,
                        )
                    }
                }
                Spacer(Modifier.height(6.dp))
                Text(
                    text = if (whyExpanded) "Hide why" else "Why?",
                    style = MaterialTheme.typography.labelMedium,
                    color = KundliColors.Teal,
                )
            }
        }
    }
    TextButton(onClick = onShowMath) {
        Text("Show the math →", color = KundliColors.Gold)
    }
}

@Composable
private fun EvidenceRungBody(
    reading: SubjectReadingContent,
    showAlwaysDetailsPrompt: Boolean,
    onAcceptAlwaysDetails: () -> Unit,
    onDismissAlwaysDetails: () -> Unit,
) {
    if (showAlwaysDetailsPrompt) {
        Surface(
            color = KundliColors.SurfaceAlt,
            border = BorderStroke(1.dp, KundliColors.GoldHairline),
            shape = RoundedCornerShape(14.dp),
            modifier = Modifier.fillMaxWidth(),
        ) {
            Row(
                modifier = Modifier.padding(12.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    text = "Always show details?",
                    style = MaterialTheme.typography.bodySmall,
                    color = KundliColors.TextMain,
                    modifier = Modifier.weight(1f),
                )
                TextButton(onClick = onDismissAlwaysDetails) {
                    Text("Not now", color = KundliColors.TextMuted)
                }
                TextButton(onClick = onAcceptAlwaysDetails) {
                    Text("Yes", color = KundliColors.Gold)
                }
            }
        }
    }

    reading.telemetryRows.forEach { row ->
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 4.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            Text(
                text = row.label,
                style = MaterialTheme.typography.bodySmall,
                color = KundliColors.TextMuted,
            )
            Text(
                text = row.value,
                style = TelemetryNumberStyle,
                color = KundliColors.TextMain,
            )
        }
        HorizontalDivider(color = KundliColors.SubtleDivider)
    }
}
