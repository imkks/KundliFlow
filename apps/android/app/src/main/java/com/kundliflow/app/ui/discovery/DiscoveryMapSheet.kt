package com.kundliflow.app.ui.discovery

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.unit.dp
import com.kundliflow.app.ui.theme.KundliColors
import com.kundliflow.app.ui.theme.TelemetryNumberStyle
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.sin

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DiscoveryMapSheet(
    orderedNodes: List<DiscoveryNodeSpec>,
    litNodeIds: Set<String>,
    isMoonOnlyMode: Boolean,
    onSelectNode: (DiscoveryNodeSpec) -> Unit,
    onDismiss: () -> Unit,
) {
    val litCount = orderedNodes.count { litNodeIds.contains(it.id) }
    val totalCount = orderedNodes.size.coerceAtLeast(1)

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
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Column {
                    Text("Discovery Constellation", style = MaterialTheme.typography.headlineSmall)
                    Text(
                        text = if (isMoonOnlyMode) "11-Node Moon Path" else "24-Node Chart Journey",
                        style = MaterialTheme.typography.labelMedium,
                        color = KundliColors.TextMuted,
                    )
                }
                Text(
                    text = "$litCount / $totalCount lit",
                    style = TelemetryNumberStyle,
                    color = KundliColors.Gold,
                )
            }

            LinearProgressIndicator(
                progress = { litCount.toFloat() / totalCount.toFloat() },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(6.dp)
                    .clip(RoundedCornerShape(3.dp)),
                color = KundliColors.Gold,
                trackColor = KundliColors.SurfaceAlt,
            )

            // Constellation Canvas
            Canvas(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(190.dp),
            ) {
                val center = Offset(size.width / 2f, size.height / 2f)
                val ringRadii = mapOf(
                    "core" to size.minDimension * 0.16f,
                    "timing" to size.minDimension * 0.28f,
                    "houses" to size.minDimension * 0.39f,
                    "depth" to size.minDimension * 0.46f,
                )
                ringRadii.values.forEach { r ->
                    drawCircle(
                        color = KundliColors.SubtleDivider,
                        radius = r,
                        center = center,
                        style = androidx.compose.ui.graphics.drawscope.Stroke(1.dp.toPx()),
                    )
                }

                val grouped = orderedNodes.groupBy { it.ring }
                grouped.forEach { (ring, ringNodes) ->
                    val r = ringRadii[ring] ?: (size.minDimension * 0.3f)
                    val positions = ringNodes.mapIndexed { idx, node ->
                        val angle = (2.0 * PI * idx / ringNodes.size.coerceAtLeast(1)) - PI / 2.0
                        node to Offset(
                            x = center.x + (r * cos(angle)).toFloat(),
                            y = center.y + (r * sin(angle)).toFloat(),
                        )
                    }
                    // Draw constellation edge between adjacent lit nodes
                    for (i in 0 until positions.size - 1) {
                        val (n1, p1) = positions[i]
                        val (n2, p2) = positions[i + 1]
                        if (litNodeIds.contains(n1.id) && litNodeIds.contains(n2.id)) {
                            drawLine(
                                color = KundliColors.Gold.copy(alpha = 0.7f),
                                start = p1,
                                end = p2,
                                strokeWidth = 1.6.dp.toPx(),
                                cap = StrokeCap.Round,
                            )
                        }
                    }
                    positions.forEach { (node, pos) ->
                        val isLit = litNodeIds.contains(node.id)
                        drawCircle(
                            color = if (isLit) KundliColors.Gold else KundliColors.SurfaceAlt,
                            radius = if (isLit) 6.dp.toPx() else 4.dp.toPx(),
                            center = pos,
                        )
                    }
                }
            }

            val ringLabels = listOf(
                "core" to "Core Identity",
                "timing" to "Timing & Dashas",
                "houses" to "Life Houses",
                "depth" to "Vedic Depth",
            )
            val completedRings = ringLabels.filter { (ringKey, _) ->
                val inRing = orderedNodes.filter { it.ring == ringKey }
                inRing.isNotEmpty() && inRing.all { litNodeIds.contains(it.id) }
            }
            if (completedRings.isNotEmpty()) {
                Surface(
                    color = KundliColors.SurfaceAlt,
                    border = BorderStroke(1.dp, KundliColors.Gold),
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Column(
                        modifier = Modifier.padding(14.dp),
                        verticalArrangement = Arrangement.spacedBy(4.dp),
                    ) {
                        Text(
                            text = "RING COMPLETION RECAP",
                            style = MaterialTheme.typography.labelMedium,
                            color = KundliColors.Gold,
                        )
                        Text(
                            text = "Completed: ${completedRings.joinToString(" · ") { it.second }}",
                            style = MaterialTheme.typography.titleMedium,
                            color = KundliColors.TextMain,
                        )
                        Text(
                            text = if (completedRings.size == ringLabels.size) {
                                "All rings of your natal constellation are lit. Act II evergreen lunar & Dasha cycles are now active on Today."
                            } else {
                                "Every lit star deepens your chart vocabulary without streaks or deadlines."
                            },
                            style = MaterialTheme.typography.bodySmall,
                            color = KundliColors.TextMuted,
                        )
                    }
                }
            }

            orderedNodes.forEach { node ->
                val isLit = litNodeIds.contains(node.id)
                Surface(
                    color = if (isLit) KundliColors.SurfaceAlt else KundliColors.BgInk,
                    border = if (isLit) BorderStroke(1.dp, KundliColors.GoldHairline) else null,
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { onSelectNode(node) },
                ) {
                    Row(
                        modifier = Modifier.padding(14.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = node.title,
                                style = MaterialTheme.typography.titleMedium,
                                color = if (isLit) KundliColors.Gold else KundliColors.TextMain,
                            )
                            Text(
                                text = node.subtitle,
                                style = MaterialTheme.typography.bodySmall,
                                color = KundliColors.TextMuted,
                            )
                        }
                        Text(
                            text = if (isLit) "Lit ★" else "Explore →",
                            style = MaterialTheme.typography.labelMedium,
                            color = if (isLit) KundliColors.Gold else KundliColors.Teal,
                        )
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DiscoveryStorySheet(
    node: DiscoveryNodeSpec,
    personalRevealText: String,
    rarityBadge: String?,
    onOpenSubject: () -> Unit,
    onCompleteReflect: () -> Unit,
    onDismiss: () -> Unit,
) {
    val haptics = LocalHapticFeedback.current
    var cardIndex by remember(node.id) { mutableIntStateOf(0) } // 0=Hook, 1=Reveal, 2=Ownership

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
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            Text(
                text = "CARD ${cardIndex + 1} OF 3 · ${node.title.uppercase()}",
                style = MaterialTheme.typography.labelMedium,
                color = KundliColors.Gold,
            )

            when (cardIndex) {
                0 -> {
                    Text("The Hook", style = MaterialTheme.typography.headlineSmall)
                    Text(
                        text = node.story.hookTemplate,
                        style = MaterialTheme.typography.bodyMedium,
                        color = KundliColors.TextMain,
                    )
                }
                1 -> {
                    Text("What your chart shows", style = MaterialTheme.typography.headlineSmall)
                    Text(
                        text = personalRevealText,
                        style = MaterialTheme.typography.bodyMedium,
                        color = KundliColors.TextMain,
                    )
                    if (rarityBadge != null) {
                        Surface(
                            color = KundliColors.SurfaceAlt,
                            border = BorderStroke(1.dp, KundliColors.GoldHairline),
                            shape = RoundedCornerShape(12.dp),
                        ) {
                            Text(
                                text = rarityBadge,
                                style = MaterialTheme.typography.labelMedium,
                                color = KundliColors.Gold,
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                            )
                        }
                    }
                    TextButton(onClick = onOpenSubject) {
                        Text("Inspect full details (Rung 2) →", color = KundliColors.Teal)
                    }
                }
                else -> {
                    Text("Try it today", style = MaterialTheme.typography.headlineSmall)
                    Text(
                        text = node.story.reflectPrompt,
                        style = MaterialTheme.typography.bodyMedium,
                        color = KundliColors.TextMain,
                    )
                }
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                if (cardIndex > 0) {
                    OutlinedButton(
                        onClick = { cardIndex-- },
                        modifier = Modifier.weight(1f),
                    ) {
                        Text("Back")
                    }
                }
                Button(
                    onClick = {
                        if (cardIndex < 2) {
                            cardIndex++
                        } else {
                            haptics.performHapticFeedback(HapticFeedbackType.LongPress)
                            onCompleteReflect()
                        }
                    },
                    modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = KundliColors.Gold,
                        contentColor = KundliColors.OrbInk,
                    ),
                ) {
                    Text(
                        when (cardIndex) {
                            0 -> "Reveal in my chart →"
                            1 -> "Next →"
                            else -> "Light node & Reflect"
                        },
                    )
                }
            }
            Spacer(Modifier.height(8.dp))
        }
    }
}
