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
import androidx.compose.material.icons.rounded.Shield
import androidx.compose.material.icons.rounded.VerifiedUser
import androidx.compose.material.icons.rounded.WorkspacePremium
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.HorizontalDivider
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
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.style.TextAlign
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
        // Top App Bar
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp)
                .padding(horizontal = 12.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Row(
                modifier = Modifier.weight(1f),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                IconButton(onClick = onBack) {
                    Icon(Icons.AutoMirrored.Rounded.ArrowBack, contentDescription = "Back", tint = KundliColors.Gold)
                }
                Text(
                    text = "STRENGTHS & YOGAS",
                    style = MaterialTheme.typography.titleLarge,
                    color = KundliColors.TextMain,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
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
                    Text("Ask AI", style = MaterialTheme.typography.labelMedium, color = KundliColors.Gold, maxLines = 1)
                }
            }
        }

        val dominantPlanet = remember(chart.shadbalaBars) { chart.shadbalaBars.maxByOrNull { it.ratio } }
        val peakSavHouse = remember(chart.houses) { chart.houses.maxByOrNull { it.savBindus } }
        val bhangaCount = remember(chart.doshaAudits) { chart.doshaAudits.count { it.bhangaCancelled } }

        // Compact Executive Summary Hero (Stitch strengths.png)
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp, vertical = 4.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp),
        ) {
            Text("● VEDIC ASTROLOGICAL AUDIT", style = MaterialTheme.typography.labelSmall, color = KundliColors.Teal)
            Surface(
                color = KundliColors.Surface,
                border = BorderStroke(1.dp, KundliColors.GoldHairline),
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier.fillMaxWidth(),
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 14.dp, vertical = 12.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Surface(
                        color = KundliColors.SurfaceRecessed,
                        border = BorderStroke(1.dp, KundliColors.GoldHairline),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.size(40.dp),
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(Icons.Rounded.WorkspacePremium, contentDescription = null, tint = KundliColors.Gold, modifier = Modifier.size(20.dp))
                        }
                    }
                    Column(
                        modifier = Modifier.weight(1f),
                        verticalArrangement = Arrangement.spacedBy(3.dp),
                    ) {
                        Text(
                            text = buildString {
                                append("${chart.activeYogas.size} Active Yogas")
                                if (dominantPlanet != null) append(" · ${dominantPlanet.planet.displayName} ${String.format(Locale.US, "%.2fx", dominantPlanet.ratio)}")
                                if (peakSavHouse != null) append(" · H${peakSavHouse.number} (${peakSavHouse.savBindus})")
                            },
                            style = MaterialTheme.typography.labelMedium,
                            color = KundliColors.Gold,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                        )
                        Text(
                            text = if (bhangaCount > 0) {
                                "$bhangaCount classical Dosha cancellation(s) verified by Bhanga · 337 Total SAV."
                            } else {
                                "Directional vitality (Shadbala), classical yogas & Ashtakavarga reserves."
                            },
                            style = MaterialTheme.typography.bodySmall,
                            color = KundliColors.TextMuted,
                            maxLines = 2,
                            overflow = TextOverflow.Ellipsis,
                        )
                    }
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
        listOf("All") + chart.activeYogas.map { it.category }.filter { it.isNotBlank() }.distinct() + listOf("Dosha Audit")
    }
    var selectedCat by remember { mutableStateOf("All") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 20.dp, vertical = 14.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        // Stitch Rounded Category Filter Pills
        LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            items(categories) { cat ->
                val active = selectedCat == cat
                Surface(
                    color = if (active) KundliColors.Gold.copy(alpha = 0.16f) else KundliColors.Surface,
                    border = BorderStroke(1.dp, if (active) KundliColors.Gold else KundliColors.SubtleDivider),
                    shape = RoundedCornerShape(999.dp),
                    modifier = Modifier.clickable { selectedCat = cat },
                ) {
                    Text(
                        text = if (active) "● $cat" else cat,
                        style = MaterialTheme.typography.labelMedium,
                        color = if (active) KundliColors.Gold else KundliColors.TextMuted,
                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 7.dp),
                    )
                }
            }
        }

        if (selectedCat != "Dosha Audit") {
            val yogas = if (selectedCat == "All") chart.activeYogas else chart.activeYogas.filter { it.category == selectedCat }
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Column {
                    Text("ACTIVE CLASSICAL YOGAS", style = MaterialTheme.typography.titleLarge, color = KundliColors.TextMain)
                    Text("Nexus of Kendra, Trikona & planetary combinations", style = MaterialTheme.typography.labelSmall, color = KundliColors.TextMuted)
                }
                Surface(
                    color = KundliColors.Gold.copy(alpha = 0.14f),
                    border = BorderStroke(1.dp, KundliColors.GoldHairline),
                    shape = RoundedCornerShape(999.dp),
                ) {
                    Text(
                        text = "${yogas.size} Active",
                        style = MaterialTheme.typography.labelSmall,
                        color = KundliColors.Gold,
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                    )
                }
            }

            if (yogas.isEmpty()) {
                Surface(
                    color = KundliColors.Surface,
                    border = BorderStroke(1.dp, KundliColors.SubtleDivider),
                    shape = RoundedCornerShape(16.dp),
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Text(
                        text = "Your chart strength flows evenly across houses rather than concentrating into a single named yoga. Swipe to Power & SAV for Shadbala and Ashtakavarga reserves.",
                        style = MaterialTheme.typography.bodySmall,
                        color = KundliColors.TextMuted,
                        modifier = Modifier.padding(16.dp),
                    )
                }
            } else {
                yogas.forEach { y ->
                    val isRajaOrDhana = y.category.contains("Raja", true) || y.category.contains("Dhana", true) || y.category.contains("Mahapurusha", true)
                    val badgeColor = if (isRajaOrDhana) KundliColors.Gold else KundliColors.Teal
                    Surface(
                        color = KundliColors.Surface,
                        border = BorderStroke(1.dp, if (isRajaOrDhana) KundliColors.GoldHairline else KundliColors.SubtleDivider),
                        shape = RoundedCornerShape(18.dp),
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Column(
                            modifier = Modifier.padding(16.dp),
                            verticalArrangement = Arrangement.spacedBy(10.dp),
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(12.dp),
                                verticalAlignment = Alignment.Top,
                            ) {
                                Surface(
                                    color = KundliColors.SurfaceRecessed,
                                    border = BorderStroke(1.dp, badgeColor.copy(alpha = 0.35f)),
                                    shape = RoundedCornerShape(12.dp),
                                    modifier = Modifier.size(40.dp),
                                ) {
                                    Box(contentAlignment = Alignment.Center) {
                                        Icon(
                                            imageVector = if (isRajaOrDhana) Icons.Rounded.WorkspacePremium else Icons.Rounded.AutoAwesome,
                                            contentDescription = null,
                                            tint = badgeColor,
                                            modifier = Modifier.size(20.dp),
                                        )
                                    }
                                }
                                Column(
                                    modifier = Modifier.weight(1f),
                                    verticalArrangement = Arrangement.spacedBy(3.dp),
                                ) {
                                    Text(
                                        text = y.name,
                                        style = MaterialTheme.typography.titleMedium,
                                        color = KundliColors.TextMain,
                                        maxLines = 2,
                                        overflow = TextOverflow.Ellipsis,
                                    )
                                    if (y.planets.isNotBlank()) {
                                        Text(
                                            text = y.planets,
                                            style = MaterialTheme.typography.labelSmall,
                                            color = badgeColor,
                                            maxLines = 2,
                                            overflow = TextOverflow.Ellipsis,
                                        )
                                    }
                                }
                                if (y.category.isNotBlank()) {
                                    Surface(
                                        color = badgeColor.copy(alpha = 0.14f),
                                        border = BorderStroke(1.dp, badgeColor.copy(alpha = 0.35f)),
                                        shape = RoundedCornerShape(999.dp),
                                    ) {
                                        Text(
                                            text = y.category,
                                            style = MaterialTheme.typography.labelSmall,
                                            color = badgeColor,
                                            maxLines = 1,
                                            softWrap = false,
                                            modifier = Modifier.padding(horizontal = 9.dp, vertical = 4.dp),
                                        )
                                    }
                                }
                            }
                            Text(
                                text = y.meaning,
                                style = MaterialTheme.typography.bodySmall,
                                color = KundliColors.TextMain.copy(alpha = 0.86f),
                            )
                        }
                    }
                }
            }
        }

        if (selectedCat == "All" || selectedCat == "Dosha Audit") {
            if (selectedCat == "All") HorizontalDivider(color = KundliColors.SubtleDivider)
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Column {
                    Text("DOSHA BHANGA AUDIT", style = MaterialTheme.typography.titleLarge, color = KundliColors.TextMain)
                    Text("Classical cancellations & protective mitigations", style = MaterialTheme.typography.labelSmall, color = KundliColors.TextMuted)
                }
                Surface(
                    color = KundliColors.Teal.copy(alpha = 0.14f),
                    border = BorderStroke(1.dp, KundliColors.Teal.copy(alpha = 0.35f)),
                    shape = RoundedCornerShape(999.dp),
                ) {
                    Text(
                        text = "${chart.doshaAudits.size} Checked",
                        style = MaterialTheme.typography.labelSmall,
                        color = KundliColors.Teal,
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                    )
                }
            }
            chart.doshaAudits.forEach { item ->
                val accent = if (item.bhangaCancelled) KundliColors.Teal else KundliColors.Gold
                Surface(
                    color = KundliColors.Surface,
                    border = BorderStroke(1.dp, accent.copy(alpha = 0.32f)),
                    shape = RoundedCornerShape(18.dp),
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp),
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(12.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Surface(
                                color = accent.copy(alpha = 0.14f),
                                border = BorderStroke(1.dp, accent.copy(alpha = 0.4f)),
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier.size(38.dp),
                            ) {
                                Box(contentAlignment = Alignment.Center) {
                                    Icon(
                                        imageVector = if (item.bhangaCancelled) Icons.Rounded.VerifiedUser else Icons.Rounded.Shield,
                                        contentDescription = null,
                                        tint = accent,
                                        modifier = Modifier.size(19.dp),
                                    )
                                }
                            }
                            Text(
                                text = item.name,
                                style = MaterialTheme.typography.titleMedium,
                                color = KundliColors.TextMain,
                                modifier = Modifier.weight(1f),
                                maxLines = 2,
                                overflow = TextOverflow.Ellipsis,
                            )
                            Surface(
                                color = accent.copy(alpha = 0.16f),
                                border = BorderStroke(1.dp, accent.copy(alpha = 0.4f)),
                                shape = RoundedCornerShape(999.dp),
                            ) {
                                Text(
                                    text = item.status,
                                    style = MaterialTheme.typography.labelSmall,
                                    color = accent,
                                    maxLines = 1,
                                    softWrap = false,
                                    modifier = Modifier.padding(horizontal = 9.dp, vertical = 4.dp),
                                )
                            }
                        }
                        Text(
                            text = item.explanation,
                            style = MaterialTheme.typography.bodySmall,
                            color = KundliColors.TextMuted,
                        )
                    }
                }
            }
        }

        Spacer(Modifier.height(8.dp))
    }
}

@Composable
private fun PlanetaryPowerTab(chart: ChartUiState) {
    val sortedBars = remember(chart.shadbalaBars) { chart.shadbalaBars.sortedByDescending { it.ratio } }
    val avgRatio = remember(sortedBars) {
        if (sortedBars.isEmpty()) 0f else sortedBars.map { it.ratio }.average().toFloat()
    }
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 20.dp, vertical = 14.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text("SHADBALA SPOTLIGHT", style = MaterialTheme.typography.titleLarge, color = KundliColors.TextMain)
                Text("Directional, positional & temporal power (1.00× baseline)", style = MaterialTheme.typography.labelSmall, color = KundliColors.TextMuted)
            }
            if (avgRatio > 0f) {
                Surface(
                    color = KundliColors.SurfaceAlt,
                    border = BorderStroke(1.dp, KundliColors.GoldHairline),
                    shape = RoundedCornerShape(10.dp),
                ) {
                    Text(
                        text = "Avg ${String.format(Locale.US, "%.2fx", avgRatio)}",
                        style = TelemetryNumberStyle,
                        color = KundliColors.Gold,
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp),
                    )
                }
            }
        }

        // Wide Shadbala Spotlight Cards (Stitch strengths.png)
        LazyRow(horizontalArrangement = Arrangement.spacedBy(10.dp), contentPadding = PaddingValues(end = 6.dp)) {
            items(sortedBars) { bar ->
                val above = bar.ratio >= 1.0f
                Surface(
                    color = KundliColors.Surface,
                    border = BorderStroke(1.dp, if (above) KundliColors.Teal.copy(alpha = 0.45f) else KundliColors.GoldHairline),
                    shape = RoundedCornerShape(16.dp),
                    modifier = Modifier.width(164.dp),
                ) {
                    Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Text(
                                text = bar.planet.displayName.uppercase(),
                                style = MaterialTheme.typography.titleLarge,
                                color = KundliColors.Gold,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis,
                                modifier = Modifier.weight(1f),
                            )
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
                    Text("Baseline: 1.00×", style = MaterialTheme.typography.labelSmall, color = KundliColors.Gold)
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
        val topHouses = remember(chart.houses) { chart.houses.sortedByDescending { it.savBindus }.take(2) }
        val peakHouseNum = topHouses.firstOrNull()?.number
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            Column {
                Text("SAMUDAYA ASHTAKAVARGA", style = MaterialTheme.typography.titleLarge, color = KundliColors.TextMain)
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
                                overflow = TextOverflow.Ellipsis,
                            )
                        }
                    }
                }
            }
        }

        if (topHouses.isNotEmpty()) {
            Surface(
                color = KundliColors.SurfaceRecessed,
                border = BorderStroke(1.dp, KundliColors.Teal.copy(alpha = 0.3f)),
                shape = RoundedCornerShape(14.dp),
                modifier = Modifier.fillMaxWidth(),
            ) {
                val summary = topHouses.joinToString(" and ") { h ->
                    "H${h.number} (${houseThemes.getOrElse(h.number - 1) { "House ${h.number}" }} · ${h.savBindus} bindus)"
                }
                Text(
                    text = "✦ Strongest Ashtakavarga reserves sit in $summary — areas where sustained effort naturally compounds into tangible outcomes.",
                    style = MaterialTheme.typography.bodySmall,
                    color = KundliColors.TextMain.copy(alpha = 0.86f),
                    modifier = Modifier.padding(14.dp),
                )
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
            .padding(horizontal = 20.dp, vertical = 14.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        Text("SUBTLE HARMONIC DIGNITIES", style = MaterialTheme.typography.titleLarge, color = KundliColors.TextMain)
        if (vargottamaPlanets.isEmpty()) {
            Surface(
                color = KundliColors.Surface,
                border = BorderStroke(1.dp, KundliColors.SubtleDivider),
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text(
                    text = "No planets share the exact same sign in D1 & D9; inspect D9 Navamsha on the Chart tab for inner resilience.",
                    style = MaterialTheme.typography.bodySmall,
                    color = KundliColors.TextMuted,
                    modifier = Modifier.padding(16.dp),
                )
            }
        } else {
            vargottamaPlanets.forEach { pl ->
                Surface(
                    color = KundliColors.Surface,
                    border = BorderStroke(1.dp, KundliColors.Teal.copy(alpha = 0.45f)),
                    shape = RoundedCornerShape(18.dp),
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Surface(
                            color = KundliColors.SurfaceRecessed,
                            border = BorderStroke(1.dp, KundliColors.Teal.copy(alpha = 0.4f)),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.size(40.dp),
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Icon(Icons.Rounded.AutoAwesome, contentDescription = null, tint = KundliColors.Teal, modifier = Modifier.size(20.dp))
                            }
                        }
                        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                            Text(
                                text = "Vargottama ${pl.id.displayName} (${pl.signName})",
                                style = MaterialTheme.typography.titleMedium,
                                color = KundliColors.TextMain,
                            )
                            Text(
                                text = "Same sign in D1 & D9 · House ${pl.house} · ${pl.degreeFormatted}",
                                style = MaterialTheme.typography.labelSmall,
                                color = KundliColors.Gold,
                            )
                        }
                        Surface(
                            color = KundliColors.Teal,
                            shape = RoundedCornerShape(999.dp),
                        ) {
                            Text(
                                text = "1-in-9",
                                style = MaterialTheme.typography.labelSmall,
                                color = KundliColors.OrbInk,
                                modifier = Modifier.padding(horizontal = 9.dp, vertical = 4.dp),
                            )
                        }
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
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text("NATURAL FRIENDSHIP MATRIX", style = MaterialTheme.typography.titleLarge, color = KundliColors.TextMain)
                Text("Naisargika Maitri · Swipe horizontally if needed", style = MaterialTheme.typography.labelSmall, color = KundliColors.TextMuted)
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState()),
                ) {
                    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            Spacer(Modifier.width(46.dp))
                            sevenPlanets.forEach { p ->
                                Text(
                                    text = p.displayName.take(2).uppercase(),
                                    modifier = Modifier.width(38.dp),
                                    style = MaterialTheme.typography.labelSmall,
                                    color = KundliColors.Gold,
                                    textAlign = TextAlign.Center,
                                )
                            }
                        }
                        sevenPlanets.forEach { rowP ->
                            Row(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
                                Text(
                                    text = rowP.displayName.take(3).uppercase(),
                                    modifier = Modifier.width(46.dp),
                                    style = MaterialTheme.typography.labelSmall,
                                    color = KundliColors.TextMain,
                                )
                                sevenPlanets.forEach { colP ->
                                    val rel = naturalFriendshipCode(rowP, colP)
                                    val color = when (rel) {
                                        "F" -> KundliColors.Teal
                                        "E" -> KundliColors.Amber
                                        "—" -> KundliColors.TextMuted
                                        else -> KundliColors.Gold
                                    }
                                    Surface(
                                        color = KundliColors.SurfaceRecessed,
                                        border = BorderStroke(1.dp, KundliColors.SubtleDivider),
                                        shape = RoundedCornerShape(8.dp),
                                        modifier = Modifier.size(width = 38.dp, height = 30.dp),
                                    ) {
                                        Box(contentAlignment = Alignment.Center) {
                                            Text(rel, style = TelemetryNumberStyle, color = color)
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                Text("Legend: F = Friend · N = Neutral · E = Enemy", style = MaterialTheme.typography.labelSmall, color = KundliColors.TextMuted)
            }
        }
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
