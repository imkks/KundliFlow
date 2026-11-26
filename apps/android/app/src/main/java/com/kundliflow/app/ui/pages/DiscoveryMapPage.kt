package com.kundliflow.app.ui.pages

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.IntrinsicSize
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowBack
import androidx.compose.material.icons.rounded.Check
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.kundliflow.app.ui.discovery.DiscoveryNodeSpec
import com.kundliflow.app.ui.theme.KundliColors
import com.kundliflow.app.ui.theme.TelemetryNumberStyle
import java.util.Locale
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.sin

@Composable
fun DiscoveryMapPage(
    orderedNodes: List<DiscoveryNodeSpec>,
    litNodeIds: Set<String>,
    isMoonOnlyMode: Boolean,
    onSelectNode: (DiscoveryNodeSpec) -> Unit,
    onBack: () -> Unit,
) {
    val litCount = orderedNodes.count { litNodeIds.contains(it.id) }
    val totalCount = orderedNodes.size.coerceAtLeast(1)
    val pct = (litCount.toFloat() / totalCount.toFloat()) * 100f
    val quietAhead = (totalCount - litCount).coerceAtLeast(0)

    var listOnlyMode by remember { mutableStateOf(false) }
    var selectedRing by remember { mutableStateOf("all") }

    val nextNode = remember(orderedNodes, litNodeIds) {
        orderedNodes.firstOrNull { !litNodeIds.contains(it.id) } ?: orderedNodes.firstOrNull()
    }
    var focusedNodeId by remember(nextNode?.id) { mutableStateOf(nextNode?.id) }
    val focusedNode = orderedNodes.firstOrNull { it.id == focusedNodeId } ?: nextNode
    val litNodes = remember(orderedNodes, litNodeIds) { orderedNodes.filter { litNodeIds.contains(it.id) } }

    val filteredNodes = remember(orderedNodes, selectedRing) {
        if (selectedRing == "all") orderedNodes else orderedNodes.filter { it.ring == selectedRing }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(KundliColors.BgInk)
            .statusBarsPadding()
            .navigationBarsPadding(),
    ) {
        // Top App Bar with Unified [MAP | LIST] Toggle (Stitch discovery_map.png)
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp)
                .padding(horizontal = 12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.weight(1f),
            ) {
                IconButton(onClick = onBack) {
                    Icon(Icons.AutoMirrored.Rounded.ArrowBack, contentDescription = "Back", tint = KundliColors.Gold)
                }
                Text(
                    text = "DISCOVERY CONSTELLATION",
                    style = MaterialTheme.typography.titleLarge,
                    color = KundliColors.TextMain,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
            }
            Surface(
                color = KundliColors.SurfaceRecessed,
                border = BorderStroke(1.dp, KundliColors.SubtleDivider),
                shape = RoundedCornerShape(999.dp),
            ) {
                Row(modifier = Modifier.padding(3.dp)) {
                    listOf(false to "MAP", true to "LIST").forEach { (isList, label) ->
                        val active = listOnlyMode == isList
                        Surface(
                            color = if (active) KundliColors.Gold else Color.Transparent,
                            shape = RoundedCornerShape(999.dp),
                            modifier = Modifier.clickable { listOnlyMode = isList },
                        ) {
                            Text(
                                text = label,
                                style = MaterialTheme.typography.labelSmall,
                                color = if (active) KundliColors.OrbInk else KundliColors.TextMuted,
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp),
                            )
                        }
                    }
                }
            }
        }

        Column(
            modifier = Modifier
                .weight(1f)
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 20.dp, vertical = 10.dp),
            verticalArrangement = Arrangement.spacedBy(18.dp),
        ) {
            // 1. Hero Progress Strip Card (Stitch discovery_map.png)
            Surface(
                color = KundliColors.Surface,
                border = BorderStroke(1.dp, KundliColors.GoldHairline),
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
                            text = if (isMoonOnlyMode) "✦ YOUR MOON PATH JOURNEY" else "✦ YOUR $totalCount-NODE NATAL JOURNEY",
                            style = MaterialTheme.typography.labelSmall,
                            color = KundliColors.Gold,
                        )
                        Text("CONSTELLATION ACTIVE", style = MaterialTheme.typography.labelSmall, color = KundliColors.Teal)
                    }
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.Bottom,
                    ) {
                        Text(
                            text = "$litCount OF $totalCount STARS\nILLUMINATED",
                            style = MaterialTheme.typography.headlineSmall,
                            color = KundliColors.TextMain,
                            modifier = Modifier.weight(1f),
                        )
                        Text(
                            text = String.format(Locale.US, "%.1f%%", pct),
                            style = TelemetryNumberStyle,
                            color = KundliColors.Gold,
                        )
                    }
                    LinearProgressIndicator(
                        progress = { (litCount.toFloat() / totalCount.toFloat()).coerceIn(0.03f, 1f) },
                        modifier = Modifier.fillMaxWidth().height(7.dp).clip(RoundedCornerShape(4.dp)),
                        color = KundliColors.Teal,
                        trackColor = KundliColors.SurfaceRecessed,
                    )
                    Text(
                        text = "${pct.toInt()}% Revealed  ·  $quietAhead Quiet Stars Ahead",
                        style = MaterialTheme.typography.labelSmall,
                        color = KundliColors.TextMuted,
                    )
                }
            }

            if (!listOnlyMode) {
                // 2. Framed Deep-Space Starfield Constellation Canvas (Stitch discovery_map.png)
                Surface(
                    color = KundliColors.SurfaceRecessed,
                    border = BorderStroke(1.dp, KundliColors.GoldHairline),
                    shape = RoundedCornerShape(22.dp),
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                        ) {
                            Surface(
                                color = KundliColors.Surface,
                                border = BorderStroke(1.dp, KundliColors.SubtleDivider),
                                shape = RoundedCornerShape(999.dp),
                            ) {
                                Text(
                                    text = "● CORE & KENDRA SPHERES",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = KundliColors.Teal,
                                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                                )
                            }
                            Surface(
                                color = KundliColors.Surface,
                                border = BorderStroke(1.dp, KundliColors.SubtleDivider),
                                shape = RoundedCornerShape(999.dp),
                            ) {
                                Text(
                                    text = "△ TRIKONA ORBIT",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = KundliColors.Gold,
                                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                                )
                            }
                        }

                        Canvas(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(276.dp),
                        ) {
                            val center = Offset(size.width / 2f, size.height / 2f)
                            val ringRadii = mapOf(
                                "core" to size.minDimension * 0.16f,
                                "timing" to size.minDimension * 0.28f,
                                "houses" to size.minDimension * 0.39f,
                                "depth" to size.minDimension * 0.47f,
                            )
                            ringRadii.values.forEach { r ->
                                drawCircle(
                                    color = KundliColors.SubtleDivider,
                                    radius = r,
                                    center = center,
                                    style = Stroke(1.dp.toPx()),
                                )
                            }
                            orderedNodes.groupBy { it.ring }.forEach { (ring, ringNodes) ->
                                val r = ringRadii[ring] ?: (size.minDimension * 0.3f)
                                val positions = ringNodes.mapIndexed { idx, node ->
                                    val angle = (2.0 * PI * idx / ringNodes.size.coerceAtLeast(1)) - PI / 2.0
                                    node to Offset(center.x + (r * cos(angle)).toFloat(), center.y + (r * sin(angle)).toFloat())
                                }
                                for (i in 0 until positions.size - 1) {
                                    val (n1, p1) = positions[i]
                                    val (n2, p2) = positions[i + 1]
                                    val bothLit = litNodeIds.contains(n1.id) && litNodeIds.contains(n2.id)
                                    drawLine(
                                        color = if (bothLit) KundliColors.Gold.copy(alpha = 0.65f) else KundliColors.SubtleDivider,
                                        start = p1,
                                        end = p2,
                                        strokeWidth = if (bothLit) 1.6.dp.toPx() else 0.8.dp.toPx(),
                                        cap = StrokeCap.Round,
                                    )
                                }
                                positions.forEach { (node, pos) ->
                                    val isLit = litNodeIds.contains(node.id)
                                    val isFocused = node.id == focusedNode?.id
                                    if (isFocused) {
                                        drawCircle(
                                            color = KundliColors.Teal.copy(alpha = 0.22f),
                                            radius = 15.dp.toPx(),
                                            center = pos,
                                        )
                                        drawCircle(
                                            color = KundliColors.Teal,
                                            radius = 10.dp.toPx(),
                                            center = pos,
                                            style = Stroke(1.5.dp.toPx()),
                                        )
                                    }
                                    drawCircle(
                                        color = when {
                                            isFocused -> KundliColors.Teal
                                            isLit -> KundliColors.Gold
                                            else -> KundliColors.TextMuted.copy(alpha = 0.32f)
                                        },
                                        radius = when {
                                            isFocused -> 5.5.dp.toPx()
                                            isLit -> 5.dp.toPx()
                                            else -> 3.dp.toPx()
                                        },
                                        center = pos,
                                    )
                                }
                            }
                        }
                    }
                }

                // 3. Active Selected Node Preview Card (Left Gold Bar + Solid Gold Story CTA — Stitch!)
                if (focusedNode != null) {
                    val idxNum = (orderedNodes.indexOfFirst { it.id == focusedNode.id } + 1).coerceAtLeast(1)
                    val isLit = litNodeIds.contains(focusedNode.id)
                    Surface(
                        color = KundliColors.Surface,
                        border = BorderStroke(1.dp, KundliColors.GoldHairline),
                        shape = RoundedCornerShape(20.dp),
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Row(modifier = Modifier.fillMaxWidth().height(IntrinsicSize.Min)) {
                            Box(
                                modifier = Modifier
                                    .width(3.5.dp)
                                    .fillMaxHeight()
                                    .background(KundliColors.Gold),
                            )
                            Column(
                                modifier = Modifier
                                    .weight(1f)
                                    .padding(18.dp),
                                verticalArrangement = Arrangement.spacedBy(10.dp),
                            ) {
                                Text(
                                    text = "● NODE ${idxNum.toString().padStart(2, '0')} · " + if (isLit) "ILLUMINATED" else "NEXT TO ILLUMINATE",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = if (isLit) KundliColors.Teal else KundliColors.Gold,
                                )
                                Text(
                                    text = focusedNode.title.uppercase(),
                                    style = MaterialTheme.typography.headlineSmall,
                                    color = KundliColors.TextMain,
                                )
                                Text(
                                    text = focusedNode.subtitle,
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = KundliColors.TextMuted,
                                )
                                Button(
                                    onClick = { onSelectNode(focusedNode) },
                                    shape = RoundedCornerShape(14.dp),
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = KundliColors.Gold,
                                        contentColor = KundliColors.OrbInk,
                                    ),
                                    modifier = Modifier.fillMaxWidth().height(46.dp),
                                ) {
                                    Text("Open 3-Card Story →", style = MaterialTheme.typography.labelLarge)
                                }
                            }
                        }
                    }
                }

                // 4. Recently Illuminated Horizontal Rail (Stitch discovery_map.png)
                if (litNodes.isNotEmpty()) {
                    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Column {
                                Text("RECENTLY ILLUMINATED", style = MaterialTheme.typography.labelSmall, color = KundliColors.TextMuted)
                                Text("${litNodes.size} DISCOVERED COORDINATES", style = MaterialTheme.typography.titleLarge, color = KundliColors.TextMain)
                            }
                            Text(
                                text = "VIEW ALL ($litCount)",
                                style = MaterialTheme.typography.labelSmall,
                                color = KundliColors.Gold,
                                modifier = Modifier.clickable { listOnlyMode = true },
                            )
                        }
                        LazyRow(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                            items(litNodes.take(8), key = { it.id }) { node ->
                                Surface(
                                    color = KundliColors.Surface,
                                    border = BorderStroke(1.dp, KundliColors.SubtleDivider),
                                    shape = RoundedCornerShape(16.dp),
                                    modifier = Modifier
                                        .width(172.dp)
                                        .clickable {
                                            focusedNodeId = node.id
                                            onSelectNode(node)
                                        },
                                ) {
                                    Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.SpaceBetween,
                                            verticalAlignment = Alignment.CenterVertically,
                                        ) {
                                            Text(node.ring.uppercase(), style = MaterialTheme.typography.labelSmall, color = KundliColors.Teal)
                                            Box(
                                                modifier = Modifier
                                                    .size(20.dp)
                                                    .clip(CircleShape)
                                                    .background(KundliColors.Teal.copy(alpha = 0.16f)),
                                                contentAlignment = Alignment.Center,
                                            ) {
                                                Icon(Icons.Rounded.Check, contentDescription = null, tint = KundliColors.Teal, modifier = Modifier.size(13.dp))
                                            }
                                        }
                                        Text(node.title, style = MaterialTheme.typography.titleSmall, color = KundliColors.TextMain, maxLines = 1, overflow = TextOverflow.Ellipsis)
                                        Text(node.subtitle, style = MaterialTheme.typography.labelSmall, color = KundliColors.TextMuted, maxLines = 2, overflow = TextOverflow.Ellipsis)
                                    }
                                }
                            }
                        }
                    }
                }
            } else {
                // List Mode with Ring Filter Pills
                LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(listOf("all" to "All", "core" to "Core", "timing" to "Timing", "houses" to "Houses", "depth" to "Depth")) { (id, label) ->
                        val active = selectedRing == id
                        Surface(
                            color = if (active) KundliColors.Gold.copy(alpha = 0.16f) else KundliColors.Surface,
                            border = BorderStroke(1.dp, if (active) KundliColors.Gold else KundliColors.SubtleDivider),
                            shape = RoundedCornerShape(999.dp),
                            modifier = Modifier.clickable { selectedRing = id },
                        ) {
                            Text(
                                text = label,
                                style = MaterialTheme.typography.labelMedium,
                                color = if (active) KundliColors.Gold else KundliColors.TextMuted,
                                modifier = Modifier.padding(horizontal = 14.dp, vertical = 7.dp),
                            )
                        }
                    }
                }

                filteredNodes.forEach { node ->
                    val isLit = litNodeIds.contains(node.id)
                    Surface(
                        color = if (isLit) KundliColors.SurfaceAlt else KundliColors.Surface,
                        border = BorderStroke(1.dp, if (isLit) KundliColors.GoldHairline else KundliColors.SubtleDivider),
                        shape = RoundedCornerShape(16.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onSelectNode(node) },
                    ) {
                        Row(
                            modifier = Modifier.padding(14.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                                Text(node.title, style = MaterialTheme.typography.titleSmall, color = if (isLit) KundliColors.Gold else KundliColors.TextMain)
                                Text(node.subtitle, style = MaterialTheme.typography.bodySmall, color = KundliColors.TextMuted)
                            }
                            Text(
                                text = if (isLit) "Lit ★" else "Start →",
                                style = TelemetryNumberStyle,
                                color = if (isLit) KundliColors.Gold else KundliColors.Teal,
                            )
                        }
                    }
                }
            }
            Spacer(Modifier.height(16.dp))
        }
    }
}
