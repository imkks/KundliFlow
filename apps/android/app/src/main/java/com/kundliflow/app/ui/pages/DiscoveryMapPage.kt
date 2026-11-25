package com.kundliflow.app.ui.pages

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowBack
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.unit.dp
import com.kundliflow.app.ui.discovery.DiscoveryNodeSpec
import com.kundliflow.app.ui.theme.KundliColors
import com.kundliflow.app.ui.theme.TelemetryNumberStyle
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
    var listOnlyMode by remember { mutableStateOf(false) }
    var selectedRing by remember { mutableStateOf("all") }

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
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp)
                .padding(horizontal = 8.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = onBack) {
                    Icon(Icons.AutoMirrored.Rounded.ArrowBack, contentDescription = "Back", tint = KundliColors.Gold)
                }
                Column {
                    Text("Your Chart Map", style = MaterialTheme.typography.titleMedium, color = KundliColors.TextMain)
                    Text(
                        text = "$litCount of $totalCount lit · " + if (isMoonOnlyMode) "Moon Path" else "Constellation",
                        style = MaterialTheme.typography.labelMedium,
                        color = KundliColors.Gold,
                    )
                }
            }
            TextButton(onClick = { listOnlyMode = !listOnlyMode }) {
                Text(if (listOnlyMode) "Map view" else "List view", color = KundliColors.Teal)
            }
        }

        Column(
            modifier = Modifier
                .weight(1f)
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 20.dp, vertical = 10.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            LinearProgressIndicator(
                progress = { litCount.toFloat() / totalCount.toFloat() },
                modifier = Modifier.fillMaxWidth().height(6.dp).clip(RoundedCornerShape(3.dp)),
                color = KundliColors.Gold,
                trackColor = KundliColors.SurfaceAlt,
            )

            // Horizontal Ring Rail
            LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                items(listOf("all" to "All", "core" to "Core", "timing" to "Timing", "houses" to "Houses", "depth" to "Depth")) { (id, label) ->
                    FilterChip(selected = selectedRing == id, onClick = { selectedRing = id }, label = { Text(label) })
                }
            }

            if (!listOnlyMode) {
                Canvas(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(210.dp),
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
                    orderedNodes.groupBy { it.ring }.forEach { (ring, ringNodes) ->
                        val r = ringRadii[ring] ?: (size.minDimension * 0.3f)
                        val positions = ringNodes.mapIndexed { idx, node ->
                            val angle = (2.0 * PI * idx / ringNodes.size.coerceAtLeast(1)) - PI / 2.0
                            node to Offset(center.x + (r * cos(angle)).toFloat(), center.y + (r * sin(angle)).toFloat())
                        }
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
            }

            // Ring Completion Recap
            val ringLabels = listOf("core" to "Core Identity", "timing" to "Timing & Dashas", "houses" to "Life Houses", "depth" to "Vedic Depth")
            val completedRings = ringLabels.filter { (ringKey, _) ->
                val inRing = orderedNodes.filter { it.ring == ringKey }
                inRing.isNotEmpty() && inRing.all { litNodeIds.contains(it.id) }
            }
            if (completedRings.isNotEmpty()) {
                Surface(color = KundliColors.SurfaceAlt, border = BorderStroke(1.dp, KundliColors.Gold), shape = RoundedCornerShape(14.dp), modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Text("RING COMPLETION RECAP", style = MaterialTheme.typography.labelMedium, color = KundliColors.Gold)
                        Text("Completed: ${completedRings.joinToString(" · ") { it.second }}", style = MaterialTheme.typography.titleMedium)
                    }
                }
            }

            filteredNodes.forEach { node ->
                val isLit = litNodeIds.contains(node.id)
                Surface(
                    color = if (isLit) KundliColors.SurfaceAlt else KundliColors.Surface,
                    border = if (isLit) BorderStroke(1.dp, KundliColors.GoldHairline) else null,
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier.fillMaxWidth().clickable { onSelectNode(node) },
                ) {
                    Row(modifier = Modifier.padding(14.dp), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(node.title, style = MaterialTheme.typography.titleMedium, color = if (isLit) KundliColors.Gold else KundliColors.TextMain)
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
            Spacer(Modifier.height(16.dp))
        }
    }
}
