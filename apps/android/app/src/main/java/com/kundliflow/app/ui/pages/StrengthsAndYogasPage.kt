package com.kundliflow.app.ui.pages

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowBack
import androidx.compose.material3.FilterChip
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.TabRowDefaults
import androidx.compose.material3.TabRowDefaults.tabIndicatorOffset
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
import com.kundliflow.app.ui.chart.ChartUiState
import com.kundliflow.app.ui.subject.PlanetId
import com.kundliflow.app.ui.theme.KundliColors
import com.kundliflow.app.ui.theme.TelemetryNumberStyle
import kotlinx.coroutines.launch
import java.util.Locale

@Composable
fun StrengthsAndYogasPage(
    chart: ChartUiState,
    onAskAboutStrengths: () -> Unit,
    onBack: () -> Unit,
) {
    val tabs = listOf("Yogas & Audits", "Planetary Power", "Soul & Maitri")
    val pagerState = rememberPagerState(pageCount = { tabs.size })
    val scope = rememberCoroutineScope()

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
                Text("Strengths & Yogas", style = MaterialTheme.typography.titleMedium, color = KundliColors.TextMain)
            }
            TextButton(onClick = onAskAboutStrengths) {
                Text("Ask AI", color = KundliColors.Teal)
            }
        }

        TabRow(
            selectedTabIndex = pagerState.currentPage,
            containerColor = KundliColors.BgInk,
            contentColor = KundliColors.Gold,
            indicator = { pos ->
                if (pagerState.currentPage < pos.size) {
                    TabRowDefaults.SecondaryIndicator(
                        modifier = Modifier.tabIndicatorOffset(pos[pagerState.currentPage]),
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
                            style = MaterialTheme.typography.labelMedium,
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
            when (page) {
                0 -> YogasAndAuditsTab(chart)
                1 -> PlanetaryPowerTab(chart)
                else -> SoulAndMaitriTab(chart)
            }
        }
    }
}

@Composable
private fun YogasAndAuditsTab(chart: ChartUiState) {
    val categories = remember(chart.activeYogas) {
        listOf("All") + chart.activeYogas.map { it.category }.distinct() + listOf("Dosha Audit")
    }
    var selectedCat by remember { mutableStateOf("All") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            items(categories) { cat ->
                FilterChip(selected = selectedCat == cat, onClick = { selectedCat = cat }, label = { Text(cat) })
            }
        }

        if (selectedCat != "Dosha Audit") {
            val yogas = if (selectedCat == "All") chart.activeYogas else chart.activeYogas.filter { it.category == selectedCat }
            Text("Active Auspicious Yogas (${yogas.size})", style = MaterialTheme.typography.titleMedium, color = KundliColors.Gold)
            if (yogas.isEmpty()) {
                Surface(color = KundliColors.Surface, shape = RoundedCornerShape(14.dp), modifier = Modifier.fillMaxWidth()) {
                    Text(
                        text = "Your chart strength flows evenly across houses rather than concentrating into a single named yoga. Swipe to Planetary Power for Shadbala & SAV.",
                        style = MaterialTheme.typography.bodySmall,
                        color = KundliColors.TextMuted,
                        modifier = Modifier.padding(14.dp),
                    )
                }
            } else {
                yogas.forEach { y ->
                    Surface(
                        color = KundliColors.Surface,
                        border = BorderStroke(1.dp, KundliColors.GoldHairline),
                        shape = RoundedCornerShape(14.dp),
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Text(y.name, style = MaterialTheme.typography.titleMedium, color = KundliColors.Gold)
                                Text(y.category, style = MaterialTheme.typography.labelMedium, color = KundliColors.Teal)
                            }
                            if (y.planets.isNotBlank()) {
                                Text("Planets: ${y.planets}", style = MaterialTheme.typography.labelMedium, color = KundliColors.TextMuted)
                            }
                            Text(y.meaning, style = MaterialTheme.typography.bodySmall, color = KundliColors.TextMain)
                        }
                    }
                }
            }
        }

        if (selectedCat == "All" || selectedCat == "Dosha Audit") {
            HorizontalDivider(color = KundliColors.SubtleDivider)
            Text("Dosha Bhanga Audit (${chart.doshaAudits.size})", style = MaterialTheme.typography.titleMedium, color = KundliColors.Teal)
            chart.doshaAudits.forEach { item ->
                Surface(color = KundliColors.SurfaceAlt, shape = RoundedCornerShape(14.dp), modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text(item.name, style = MaterialTheme.typography.titleMedium, color = KundliColors.TextMain)
                            Text(
                                text = item.status,
                                style = MaterialTheme.typography.labelMedium,
                                color = if (item.bhangaCancelled) KundliColors.Teal else KundliColors.Gold,
                            )
                        }
                        Text(item.explanation, style = MaterialTheme.typography.bodySmall, color = KundliColors.TextMuted)
                    }
                }
            }
        }
    }
}

@Composable
private fun PlanetaryPowerTab(chart: ChartUiState) {
    val sortedBars = remember(chart.shadbalaBars) { chart.shadbalaBars.sortedByDescending { it.ratio } }
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        Text("Shadbala Ratios (1.00x Classical Threshold)", style = MaterialTheme.typography.titleMedium, color = KundliColors.Gold)

        // Horizontal Spotlight Cards
        LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp), contentPadding = PaddingValues(end = 6.dp)) {
            items(sortedBars) { bar ->
                Surface(
                    color = KundliColors.Surface,
                    border = BorderStroke(1.dp, if (bar.ratio >= 1.0f) KundliColors.Teal.copy(alpha = 0.45f) else KundliColors.GoldHairline),
                    shape = RoundedCornerShape(14.dp),
                ) {
                    Column(modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(bar.planet.displayName, style = MaterialTheme.typography.labelMedium, color = KundliColors.TextMuted)
                        Text(
                            text = String.format(Locale.US, "%.2fx", bar.ratio),
                            style = TelemetryNumberStyle,
                            color = if (bar.ratio >= 1.0f) KundliColors.Teal else KundliColors.Gold,
                        )
                    }
                }
            }
        }

        Surface(color = KundliColors.Surface, shape = RoundedCornerShape(16.dp), modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                sortedBars.forEach { bar ->
                    Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        Text(bar.planet.displayName, modifier = Modifier.width(68.dp), style = MaterialTheme.typography.bodySmall)
                        LinearProgressIndicator(
                            progress = { (bar.ratio / 1.6f).coerceIn(0f, 1f) },
                            modifier = Modifier.weight(1f).height(8.dp).clip(RoundedCornerShape(4.dp)),
                            color = if (bar.ratio >= 1.0f) KundliColors.Teal else KundliColors.Gold,
                            trackColor = KundliColors.SurfaceAlt,
                        )
                        Text(String.format(Locale.US, "%.2fx", bar.ratio), style = TelemetryNumberStyle)
                    }
                }
            }
        }

        // 2D Scrollable Ashtakvarga SAV 12-House Matrix
        Text("Ashtakvarga SAV · 337 Bindus (Swipe Horizontally)", style = MaterialTheme.typography.titleMedium, color = KundliColors.Gold)
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            chart.houses.forEach { h ->
                Surface(
                    color = KundliColors.Surface,
                    border = BorderStroke(1.dp, if (h.savBindus >= 30) KundliColors.Teal.copy(alpha = 0.5f) else KundliColors.SubtleDivider),
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier.width(86.dp),
                ) {
                    Column(modifier = Modifier.padding(10.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("H${h.number}", style = MaterialTheme.typography.labelMedium, color = KundliColors.Gold)
                        Text(h.signName.take(3), style = MaterialTheme.typography.labelMedium, color = KundliColors.TextMuted)
                        Spacer(Modifier.height(4.dp))
                        Text(
                            text = "${h.savBindus}",
                            style = MaterialTheme.typography.titleMedium,
                            color = if (h.savBindus >= 30) KundliColors.Teal else KundliColors.TextMain,
                        )
                        Text(if (h.savBindus >= 30) "Strong" else if (h.savBindus >= 25) "Steady" else "Gentle", style = MaterialTheme.typography.labelMedium, color = KundliColors.TextMuted)
                    }
                }
            }
        }
    }
}

@Composable
private fun SoulAndMaitriTab(chart: ChartUiState) {
    val allPlanets = remember(chart) { chart.allPlanets() }
    val vargottamaPlanets = remember(allPlanets) { allPlanets.filter { it.vargottama } }
    val sevenPlanets = listOf(PlanetId.SUN, PlanetId.MOON, PlanetId.MARS, PlanetId.MERCURY, PlanetId.JUPITER, PlanetId.VENUS, PlanetId.SATURN)

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        Text("Vargottama & Dignity Spotlight", style = MaterialTheme.typography.titleMedium, color = KundliColors.Gold)
        if (vargottamaPlanets.isEmpty()) {
            Surface(color = KundliColors.Surface, shape = RoundedCornerShape(14.dp), modifier = Modifier.fillMaxWidth()) {
                Text(
                    text = "No planets share the exact same sign in D1 & D9; inspect D9 Navamsha on the Chart tab for inner resilience.",
                    style = MaterialTheme.typography.bodySmall,
                    color = KundliColors.TextMuted,
                    modifier = Modifier.padding(14.dp),
                )
            }
        } else {
            vargottamaPlanets.forEach { pl ->
                Surface(color = KundliColors.SurfaceAlt, border = BorderStroke(1.dp, KundliColors.Teal), shape = RoundedCornerShape(14.dp), modifier = Modifier.fillMaxWidth()) {
                    Row(modifier = Modifier.padding(14.dp), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("★ ${pl.id.displayName} in ${pl.signName} (H${pl.house})", style = MaterialTheme.typography.titleMedium, color = KundliColors.Teal)
                        Text(pl.degreeFormatted, style = TelemetryNumberStyle, color = KundliColors.Gold)
                    }
                }
            }
        }

        Text("Natural Friendship Matrix (Naisargika Maitri · Swipe Horizontally)", style = MaterialTheme.typography.titleMedium, color = KundliColors.Gold)
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState()),
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text("", modifier = Modifier.width(52.dp))
                    sevenPlanets.forEach { p ->
                        Text(p.displayName.take(2), modifier = Modifier.width(44.dp), style = MaterialTheme.typography.labelMedium, color = KundliColors.Gold)
                    }
                }
                sevenPlanets.forEach { rowP ->
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
                        Text(rowP.displayName.take(3), modifier = Modifier.width(52.dp), style = MaterialTheme.typography.labelMedium, color = KundliColors.TextMain)
                        sevenPlanets.forEach { colP ->
                            val rel = naturalFriendshipCode(rowP, colP)
                            val color = when (rel) {
                                "F" -> KundliColors.Teal
                                "E" -> KundliColors.Amber
                                "—" -> KundliColors.TextMuted
                                else -> KundliColors.Gold
                            }
                            Surface(color = KundliColors.Surface, shape = RoundedCornerShape(6.dp), modifier = Modifier.width(44.dp)) {
                                Text(rel, style = TelemetryNumberStyle, color = color, modifier = Modifier.padding(vertical = 6.dp, horizontal = 14.dp))
                            }
                        }
                    }
                }
            }
        }
        Text("Legend: F = Friend · N = Neutral · E = Enemy", style = MaterialTheme.typography.labelMedium, color = KundliColors.TextMuted)
    }
}

private fun naturalFriendshipCode(a: PlanetId, b: PlanetId): String {
    if (a == b) return "—"
    val friends = mapOf(
        PlanetId.SUN to setOf(PlanetId.MOON, PlanetId.MARS, PlanetId.JUPITER),
        PlanetId.MOON to setOf(PlanetId.SUN, PlanetId.MERCURY),
        PlanetId.MARS to setOf(PlanetId.SUN, PlanetId.MOON, PlanetId.JUPITER),
        PlanetId.MERCURY to setOf(PlanetId.SUN, PlanetId.VENUS),
        PlanetId.JUPITER to setOf(PlanetId.SUN, PlanetId.MOON, PlanetId.MARS),
        PlanetId.VENUS to setOf(PlanetId.MERCURY, PlanetId.SATURN),
        PlanetId.SATURN to setOf(PlanetId.MERCURY, PlanetId.VENUS),
    )
    val enemies = mapOf(
        PlanetId.SUN to setOf(PlanetId.VENUS, PlanetId.SATURN),
        PlanetId.MOON to emptySet(),
        PlanetId.MARS to setOf(PlanetId.MERCURY),
        PlanetId.MERCURY to setOf(PlanetId.MOON),
        PlanetId.JUPITER to setOf(PlanetId.MERCURY, PlanetId.VENUS),
        PlanetId.VENUS to setOf(PlanetId.SUN, PlanetId.MOON),
        PlanetId.SATURN to setOf(PlanetId.SUN, PlanetId.MOON, PlanetId.MARS),
    )
    return when {
        friends[a]?.contains(b) == true -> "F"
        enemies[a]?.contains(b) == true -> "E"
        else -> "N"
    }
}
