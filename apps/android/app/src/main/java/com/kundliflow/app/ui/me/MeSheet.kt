package com.kundliflow.app.ui.me

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.ExpandLess
import androidx.compose.material.icons.rounded.ExpandMore
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedButton
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
import androidx.compose.ui.unit.dp
import com.kundliflow.app.ui.chart.ChartStyle
import com.kundliflow.app.ui.theme.KundliColors
import com.kundliflow.app.ui.today.SkyBand

data class OrbitProfileItem(
    val id: String,
    val name: String,
    val subtitle: String,
    val todayBand: SkyBand?,
    val ayanamsa: String = "Lahiri",
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MeSheet(
    profiles: List<OrbitProfileItem>,
    activeProfileId: String,
    detailLevel: String,
    chartStyle: ChartStyle,
    quietHoursLabel: String,
    onSelectProfile: (String) -> Unit,
    onAddProfile: () -> Unit,
    onChangeDetailLevel: (String) -> Unit,
    onChangeChartStyle: (ChartStyle) -> Unit,
    onOpenDiscoveryMap: () -> Unit,
    onDismiss: () -> Unit,
) {
    var expandCharts by remember { mutableStateOf(true) }
    var expandPrefs by remember { mutableStateOf(true) }
    var expandData by remember { mutableStateOf(true) }
    var showSharePreview by remember { mutableStateOf(false) }
    var showGlossary by remember { mutableStateOf(false) }
    var confirmReset by remember { mutableStateOf(false) }

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
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Text("Me & Settings", style = MaterialTheme.typography.headlineSmall)

            // Group 1: Your Charts (with Orbit Band Dots)
            CollapsibleGroupHeader("Your Charts", expandCharts) { expandCharts = !expandCharts }
            AnimatedVisibility(visible = expandCharts) {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    profiles.forEach { profile ->
                        val active = profile.id == activeProfileId
                        Surface(
                            color = if (active) KundliColors.SurfaceAlt else KundliColors.BgInk,
                            border = if (active) BorderStroke(1.dp, KundliColors.GoldHairline) else null,
                            shape = RoundedCornerShape(14.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { onSelectProfile(profile.id) },
                        ) {
                            Row(
                                modifier = Modifier.padding(14.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween,
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    if (profile.todayBand != null) {
                                        Box(
                                            modifier = Modifier
                                                .size(10.dp)
                                                .clip(CircleShape)
                                                .background(profile.todayBand.color),
                                        )
                                        Spacer(Modifier.width(10.dp))
                                    }
                                    Column {
                                        Text(profile.name, style = MaterialTheme.typography.titleMedium)
                                        Text("${profile.subtitle} · ${profile.ayanamsa}", style = MaterialTheme.typography.labelMedium, color = KundliColors.TextMuted)
                                    }
                                }
                                if (active) {
                                    Text("Active", style = MaterialTheme.typography.labelMedium, color = KundliColors.Gold)
                                }
                            }
                        }
                    }
                    OutlinedButton(onClick = onAddProfile, modifier = Modifier.fillMaxWidth()) {
                        Text("+ Add chart (family or partner)", color = KundliColors.Teal)
                    }
                }
            }

            HorizontalDivider(color = KundliColors.SubtleDivider)

            // Group 2: Preferences
            CollapsibleGroupHeader("Preferences", expandPrefs) { expandPrefs = !expandPrefs }
            AnimatedVisibility(visible = expandPrefs) {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Detail Level", style = MaterialTheme.typography.labelMedium, color = KundliColors.TextMuted)
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        listOf("simple" to "Simple", "balanced" to "Balanced", "full" to "Full").forEach { (id, label) ->
                            FilterChip(selected = detailLevel == id, onClick = { onChangeDetailLevel(id) }, label = { Text(label) })
                        }
                    }
                    Text("Chart Style", style = MaterialTheme.typography.labelMedium, color = KundliColors.TextMuted)
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        ChartStyle.entries.forEach { style ->
                            FilterChip(selected = chartStyle == style, onClick = { onChangeChartStyle(style) }, label = { Text(style.label) })
                        }
                    }
                    Text("Quiet Hours: $quietHoursLabel (cap 2 notifications/day)", style = MaterialTheme.typography.bodySmall, color = KundliColors.TextMuted)
                }
            }

            HorizontalDivider(color = KundliColors.SubtleDivider)

            // Group 3: Your Data & Deep Lore
            CollapsibleGroupHeader("Your Data & Deep Lore", expandData) { expandData = !expandData }
            AnimatedVisibility(visible = expandData) {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    MeActionRow("Discovery Map (24-Node Constellation)", onOpenDiscoveryMap)
                    MeActionRow("9:16 Share Cosmic Blueprint") { showSharePreview = true }
                    MeActionRow("Plain English Glossary (7 categories)") { showGlossary = true }
                    MeActionRow("Export JSON / PDF Dossier / AI LLM Context") {}
                    TextButton(onClick = { confirmReset = !confirmReset }) {
                        Text(
                            text = if (confirmReset) "Tap again to confirm Data Vault RESET" else "Data Sovereignty Vault · Reset",
                            color = KundliColors.AlertCrimson,
                        )
                    }
                }
            }
        }
    }

    if (showSharePreview) {
        ShareBlueprintPreviewSheet(onDismiss = { showSharePreview = false })
    }

    if (showGlossary) {
        GlossarySheet(onDismiss = { showGlossary = false })
    }
}

@Composable
private fun CollapsibleGroupHeader(
    title: String,
    expanded: Boolean,
    onToggle: () -> Unit,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onToggle)
            .padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(title, style = MaterialTheme.typography.titleMedium, color = KundliColors.Gold)
        Icon(
            imageVector = if (expanded) Icons.Rounded.ExpandLess else Icons.Rounded.ExpandMore,
            contentDescription = title,
            tint = KundliColors.Gold,
        )
    }
}

@Composable
private fun MeActionRow(label: String, onClick: () -> Unit) {
    Surface(
        color = KundliColors.BgInk,
        shape = RoundedCornerShape(12.dp),
        modifier = Modifier.fillMaxWidth().clickable(onClick = onClick),
    ) {
        Text(label, style = MaterialTheme.typography.bodyMedium, modifier = Modifier.padding(14.dp))
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ShareBlueprintPreviewSheet(onDismiss: () -> Unit) {
    ModalBottomSheet(onDismissRequest = onDismiss, containerColor = KundliColors.Surface, contentColor = KundliColors.TextMain) {
        Column(
            modifier = Modifier.fillMaxWidth().navigationBarsPadding().padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Text("9:16 Cosmic Blueprint", style = MaterialTheme.typography.headlineSmall)
            Surface(
                color = KundliColors.BgInk,
                border = BorderStroke(1.dp, KundliColors.Gold),
                shape = RoundedCornerShape(20.dp),
                modifier = Modifier.fillMaxWidth(0.62f).aspectRatio(9f / 16f),
            ) {
                Column(
                    modifier = Modifier.padding(18.dp),
                    verticalArrangement = Arrangement.SpaceBetween,
                ) {
                    Text("KUNDLIFLOW", style = MaterialTheme.typography.labelMedium, color = KundliColors.Gold)
                    Column {
                        Text("Taurus Rising", style = MaterialTheme.typography.headlineSmall, color = KundliColors.TextMain)
                        Text("Revati Moon · 1-in-324 Signature", style = MaterialTheme.typography.bodySmall, color = KundliColors.Teal)
                    }
                    Text("Venus–Saturn Chapter", style = MaterialTheme.typography.labelMedium, color = KundliColors.TextMuted)
                }
            }
            Button(
                onClick = onDismiss,
                colors = ButtonDefaults.buttonColors(containerColor = KundliColors.Gold, contentColor = KundliColors.OrbInk),
            ) {
                Text("Done")
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun GlossarySheet(onDismiss: () -> Unit) {
    val terms = listOf(
        "Lagna (Ascendant)" to "The rising zodiac sign at your exact birth time—sets House 1.",
        "Hora" to "Unequal sunrise-calibrated planetary hours shaping hourly tone.",
        "Chandra Bala" to "Strength of the transiting Moon relative to your natal Moon sign.",
        "Tara Bala" to "9-fold star harmony between today's Moon nakshatra and your birth star.",
        "Bhanga" to "Classical cancellation rules that soften or neutralize apparent Doshas.",
        "Ashtakvarga (SAV)" to "337-point strength grid measuring how well each sign supports transits.",
        "Dasha" to "Planetary time chapters (Mahadasha, Antardasha, Pratyantar).",
    )
    ModalBottomSheet(onDismissRequest = onDismiss, containerColor = KundliColors.Surface, contentColor = KundliColors.TextMain) {
        Column(
            modifier = Modifier.fillMaxWidth().navigationBarsPadding().verticalScroll(rememberScrollState()).padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Text("Plain English Glossary", style = MaterialTheme.typography.headlineSmall)
            terms.forEach { (term, def) ->
                Surface(color = KundliColors.SurfaceAlt, shape = RoundedCornerShape(12.dp), modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Text(term, style = MaterialTheme.typography.titleMedium, color = KundliColors.Gold)
                        Text(def, style = MaterialTheme.typography.bodySmall, color = KundliColors.TextMain)
                    }
                }
            }
        }
    }
}
