package com.kundliflow.app.ui.pages

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
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
import androidx.compose.material.icons.rounded.AutoAwesome
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.ui.graphics.Color
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.style.TextOverflow
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
    val tabs = listOf("Yogas & Audits", "Power & SAV", "Soul & Maitri")
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
                .padding(horizontal = 12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = onBack) {
                    Icon(Icons.AutoMirrored.Rounded.ArrowBack, contentDescription = "Back", tint = KundliColors.Gold)
                }
                Text("STRENGTHS & YOGAS", style = MaterialTheme.typography.titleLarge, color = KundliColors.TextMain)
            }
            Surface(
                color = KundliColors.Surface,
                border = BorderStroke(1.dp, KundliColors.GoldHairline),
                shape = RoundedCornerShape(999.dp),
                modifier = Modifier.clickable(onClick = onAskAboutStrengths),
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp),
                ) {
                    Icon(Icons.Rounded.AutoAwesome, contentDescription = null, tint = KundliColors.Gold, modifier = Modifier.size(14.dp))
                    Text("Ask AI", style = MaterialTheme.typography.labelMedium, color = KundliColors.Gold)
                }
            }
        }

        val dominantPlanet = remember(chart.shadbalaBars) { chart.shadbalaBars.maxByOrNull { it.ratio } }
        val peakSavHouse = remember(chart.houses) { chart.houses.maxByOrNull { it.savBindus } }
        val bhangaCount = remember(chart.doshaAudits) { chart.doshaAudits.count { it.bhangaCancelled } }

        // Executive Summary Hero (Stitch strengths.png)
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp, vertical = 6.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Text("● VEDIC ASTROLOGICAL AUDIT", style = MaterialTheme.typography.labelSmall, color = KundliColors.Teal)
            Text(
                text = "ASTROLOGICAL POTENCY & CLASSICAL YOGAS",
                style = MaterialTheme.typography.headlineSmall,
                color = KundliColors.TextMain,
            )
            Surface(
                color = KundliColors.Surface,
                border = BorderStroke(1.dp, KundliColors.GoldHairline),
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier.fillMaxWidth(),
            ) {
                Column(
                    modifier = Modifier.padding(horizontal = 14.dp, vertical = 12.dp),
                    verticalArrangement = Arrangement.spacedBy(3.dp),
                ) {
                    Text(
                        text = buildString {
                            append("${chart.activeYogas.size} Major Auspicious Yogas")
                            if (dominantPlanet != null) append(" · ${dominantPlanet.planet.displayName} ${String.format(Locale.US, "%.2fx", dominantPlanet.ratio)}")
                            if (peakSavHouse != null) append(" · H${peakSavHouse.number} Peak (${peakSavHouse.savBindus})")
                        },
                        style = MaterialTheme.typography.labelMedium,
                        color = KundliColors.Gold,
                    )
                    Text(
                        text = if (bhangaCount > 0) {
                            "$bhangaCount classical Dosha cancellation(s) verified by Bhanga · 337 Total SAV."
                        } else {
                            "Directional vitality (Shadbala), benefic conjunctions, and Ashtakavarga reserve capacity."
                        },
                        style = MaterialTheme.typography.bodySmall,
                        color = KundliColors.TextMuted,
                    )
                }
            }
        }

        // Unified 3-Segment Pill Tab Bar (Stitch strengths.png)
        Surface(
            color = KundliColors.SurfaceRecessed,
            border = BorderStroke(1.dp, KundliColors.SubtleDivider),
            shape = RoundedCornerShape(14.dp),
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp, vertical = 6.dp),
        ) {
            Row(modifier = Modifier.padding(4.dp)) {
                tabs.forEachIndexed { idx, label ->
                    val active = pagerState.currentPage == idx
                    Surface(
                        color = if (active) KundliColors.SurfaceAlt else Color.Transparent,
                        border = if (active) BorderStroke(1.dp, KundliColors.GoldHairline) else null,
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier
                            .weight(1f)
                            .clickable { scope.launch { pagerState.animateScrollToPage(idx) } },
                    ) {
                        Box(
                            modifier = Modifier.padding(horizontal = 4.dp, vertical = 8.dp),
                            contentAlignment = Alignment.Center,
                        ) {
                            Text(
                                text = label,
                                style = MaterialTheme.typography.labelSmall,
                                color = if (active) KundliColors.Gold else KundliColors.TextMuted,
                                maxLines = 1,
                                softWrap = false,
                                overflow = TextOverflow.Ellipsis,
                            )
                        }
                    }
                }
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

        // Bottom Solid Gold Ask AI CTA (Stitch strengths.png)
        Button(
            onClick = onAskAboutStrengths,
            shape = RoundedCornerShape(14.dp),
            colors = ButtonDefaults.buttonColors(containerColor = KundliColors.Gold, contentColor = KundliColors.OrbInk),
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp, vertical = 10.dp)
                .height(48.dp),
        ) {
            Icon(Icons.Rounded.AutoAwesome, contentDescription = null, modifier = Modifier.size(16.dp))
            Spacer(Modifier.width(6.dp))
            Text("Ask AI about My Strengths", style = MaterialTheme.typography.labelLarge)
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

        // Wide Shadbala Spotlight Cards (Stitch strengths.png)
        LazyRow(horizontalArrangement = Arrangement.spacedBy(10.dp), contentPadding = PaddingValues(end = 6.dp)) {
            items(sortedBars) { bar ->
                val above = bar.ratio >= 1.0f
                Surface(
                    color = KundliColors.Surface,
                    border = BorderStroke(1.dp, if (above) KundliColors.Teal.copy(alpha = 0.45f) else KundliColors.GoldHairline),
                    shape = RoundedCornerShape(16.dp),
                    modifier = Modifier.width(156.dp),
                ) {
                    Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Text(bar.planet.displayName.uppercase(), style = MaterialTheme.typography.titleLarge, color = KundliColors.Gold)
                            Surface(
                                color = if (above) KundliColors.Teal else KundliColors.Gold,
                                shape = RoundedCornerShape(999.dp),
                            ) {
                                Text(
                                    text = String.format(Locale.US, "%.2fx", bar.ratio),
                                    style = TelemetryNumberStyle,
                                    color = KundliColors.OrbInk,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp),
                                )
                            }
                        }
                        Text(
                            text = bar.rupas?.let { r ->
                                "${String.format(Locale.US, "%.1f", r)} Rupa" + if (bar.baladi.isNotBlank()) " · ${bar.baladi}" else ""
                            } ?: if (above) "Above 1.00× threshold" else "Developing vitality",
                            style = MaterialTheme.typography.labelSmall,
                            color = if (above) KundliColors.Teal else KundliColors.TextMuted,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                        )
                    }
                }
            }
        }

        Surface(
            color = KundliColors.Surface,
            border = BorderStroke(1.dp, KundliColors.SubtleDivider),
            shape = RoundedCornerShape(18.dp),
            modifier = Modifier.fillMaxWidth(),
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("Graha & Rupa Strength", style = MaterialTheme.typography.titleSmall, color = KundliColors.TextMain)
                    Text("Baseline: 1.00x", style = MaterialTheme.typography.labelSmall, color = KundliColors.Gold)
                }
                sortedBars.forEach { bar ->
                    val barColor = when {
                        bar.ratio >= 1.2f -> KundliColors.Teal
                        bar.ratio >= 1.0f -> KundliColors.Gold
                        else -> KundliColors.Amber
                    }
                    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text(
                                text = bar.planet.displayName + (bar.rupas?.let { " · ${String.format(Locale.US, "%.1f", it)} Rupa" } ?: ""),
                                style = MaterialTheme.typography.bodySmall,
                                color = if (bar.ratio >= 1.2f) KundliColors.Teal else KundliColors.TextMain,
                            )
                            Text(String.format(Locale.US, "%.2fx", bar.ratio), style = TelemetryNumberStyle, color = barColor)
                        }
                        LinearProgressIndicator(
                            progress = { (bar.ratio / 1.6f).coerceIn(0.05f, 1f) },
                            modifier = Modifier.fillMaxWidth().height(7.dp).clip(RoundedCornerShape(4.dp)),
                            color = barColor,
                            trackColor = KundliColors.SurfaceRecessed,
                        )
                    }
                }
            }
        }

        // 4x3 Samudaya Ashtakavarga Grid with House Life Themes (Stitch strengths.png)
        val houseThemes = listOf("Self", "Wealth", "Valor", "Home", "Intellect", "Overcoming", "Alliance", "Depth", "Dharma", "Career", "Gains", "Release")
        val peakHouseNum = remember(chart.houses) { chart.houses.maxByOrNull { it.savBindus }?.number }
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            Column {
                Text("Samudaya Ashtakavarga", style = MaterialTheme.typography.titleLarge, color = KundliColors.TextMain)
                Text("337 Total Bindus · 28 Threshold Average", style = MaterialTheme.typography.labelSmall, color = KundliColors.TextMuted)
            }
        }
        chart.houses.sortedBy { it.number }.chunked(4).forEach { row4 ->
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                row4.forEach { h ->
                    val isPeak = h.number == peakHouseNum
                    val isStrong = h.savBindus >= 30
                    val accent = when {
                        isPeak -> KundliColors.Teal
                        isStrong -> KundliColors.Gold
                        else -> KundliColors.TextMain
                    }
                    Surface(
                        color = if (isPeak) KundliColors.Teal.copy(alpha = 0.14f) else KundliColors.Surface,
                        border = BorderStroke(1.dp, if (isPeak) KundliColors.Teal else if (isStrong) KundliColors.GoldHairline else KundliColors.SubtleDivider),
                        shape = RoundedCornerShape(14.dp),
                        modifier = Modifier.weight(1f),
                    ) {
                        Column(
                            modifier = Modifier.padding(vertical = 10.dp, horizontal = 6.dp),
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(2.dp),
                        ) {
                            Text(
                                text = "H${h.number}" + if (isPeak) " ✦" else if (isStrong) " ★" else "",
                                style = MaterialTheme.typography.labelSmall,
                                color = accent.copy(alpha = 0.85f),
                            )
                            Text("${h.savBindus}", style = MaterialTheme.typography.titleMedium, color = accent)
                            Text(
                                text = houseThemes.getOrElse(h.number - 1) { "" },
                                style = MaterialTheme.typography.labelSmall,
                                color = KundliColors.TextMuted,
                                maxLines = 1,
                            )
                        }
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
