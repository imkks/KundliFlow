package com.kundliflow.app.ui.pages

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowBack
import androidx.compose.material.icons.rounded.Description
import androidx.compose.material.icons.rounded.FavoriteBorder
import androidx.compose.material.icons.rounded.History
import androidx.compose.material.icons.rounded.Search
import androidx.compose.material.icons.rounded.Shield
import androidx.compose.material.icons.rounded.WbSunny
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.kundliflow.app.data.local.StoredAuthUser
import com.kundliflow.app.data.mapper.ProfileMeta
import com.kundliflow.app.data.remote.GooglePlacesService
import com.kundliflow.app.data.remote.OfflineCityItem
import com.kundliflow.app.data.remote.ResolvedPlace
import com.kundliflow.app.ui.chart.ChartStyle
import com.kundliflow.app.ui.common.BirthDatePickerField
import com.kundliflow.app.ui.common.BirthTimePickerField
import com.kundliflow.app.ui.common.PlacePickerSheet
import com.kundliflow.app.ui.search.SearchCatalog
import com.kundliflow.app.ui.theme.KundliColors
import com.kundliflow.app.ui.theme.TelemetryNumberStyle
import java.util.Locale

@Composable
fun GlossaryPage(onBack: () -> Unit) {
    var query by remember { mutableStateOf("") }
    val categories = remember { listOf("All") + SearchCatalog.glossaryEntries.map { it.category }.distinct() }
    var selectedCategory by remember { mutableStateOf("All") }

    val filtered = remember(query, selectedCategory) {
        SearchCatalog.glossaryEntries.filter { entry ->
            val catOk = selectedCategory == "All" || entry.category == selectedCategory
            val q = query.trim().lowercase()
            val qOk = q.isEmpty() || entry.term.lowercase().contains(q) || entry.plainSummary.lowercase().contains(q)
            catOk && qOk
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(KundliColors.BgInk)
            .statusBarsPadding()
            .navigationBarsPadding(),
    ) {
        // Top App Bar (Stitch glossary.png)
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp)
                .padding(horizontal = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            IconButton(onClick = onBack) {
                Icon(Icons.AutoMirrored.Rounded.ArrowBack, contentDescription = "Back", tint = KundliColors.Gold)
            }
            Text("PLAIN ENGLISH GLOSSARY", style = MaterialTheme.typography.titleLarge, color = KundliColors.TextMain)
        }

        LazyColumn(
            modifier = Modifier
                .weight(1f)
                .padding(horizontal = 20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            // Editorial Hero & Search (Stitch glossary.png)
            item {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.padding(top = 4.dp)) {
                    Text("✦ VEDIC LEXICON · ZERO JARGON", style = MaterialTheme.typography.labelSmall, color = KundliColors.Teal)
                    Text("CLASSICAL TERMS IN PLAIN ENGLISH", style = MaterialTheme.typography.headlineSmall, color = KundliColors.Gold)
                    Text(
                        text = "Clear, grounded translations of classical Jyotish concepts—bridging Sanskrit rigor with calm modern insight.",
                        style = MaterialTheme.typography.bodySmall,
                        color = KundliColors.TextMuted,
                    )
                    OutlinedTextField(
                        value = query,
                        onValueChange = { query = it },
                        placeholder = { Text("Search ${SearchCatalog.glossaryEntries.size} concepts (Nakshatra, Dasha, Bhanga…)") },
                        leadingIcon = { Icon(Icons.Rounded.Search, contentDescription = null, tint = KundliColors.Gold) },
                        singleLine = true,
                        shape = RoundedCornerShape(14.dp),
                        modifier = Modifier.fillMaxWidth(),
                    )
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        items(categories) { cat ->
                            val active = selectedCategory == cat
                            val countLabel = if (cat == "All") "All (${SearchCatalog.glossaryEntries.size})" else cat
                            Surface(
                                color = if (active) KundliColors.Gold.copy(alpha = 0.16f) else KundliColors.Surface,
                                border = BorderStroke(1.dp, if (active) KundliColors.Gold else KundliColors.SubtleDivider),
                                shape = RoundedCornerShape(999.dp),
                                modifier = Modifier.clickable { selectedCategory = cat },
                            ) {
                                Text(
                                    text = if (active) "● $countLabel" else countLabel,
                                    style = MaterialTheme.typography.labelSmall,
                                    color = if (active) KundliColors.Gold else KundliColors.TextMuted,
                                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 7.dp),
                                )
                            }
                        }
                    }
                }
            }

            items(filtered, key = { it.id }) { entry ->
                Surface(
                    color = KundliColors.Surface,
                    border = BorderStroke(1.dp, KundliColors.SubtleDivider),
                    shape = RoundedCornerShape(20.dp),
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Column(
                        modifier = Modifier.padding(18.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp),
                    ) {
                        Surface(
                            color = KundliColors.Teal.copy(alpha = 0.14f),
                            border = BorderStroke(1.dp, KundliColors.Teal.copy(alpha = 0.35f)),
                            shape = RoundedCornerShape(8.dp),
                        ) {
                            Text(
                                text = entry.category.uppercase(),
                                style = MaterialTheme.typography.labelSmall,
                                color = KundliColors.Teal,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp),
                            )
                        }
                        Text(
                            text = entry.term.uppercase(),
                            style = MaterialTheme.typography.titleLarge,
                            color = KundliColors.Gold,
                        )
                        Text(
                            text = entry.plainSummary,
                            style = MaterialTheme.typography.bodyMedium,
                            color = KundliColors.TextMain,
                        )
                        if (entry.deeperNote.isNotBlank()) {
                            Surface(
                                color = KundliColors.SurfaceRecessed,
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier.fillMaxWidth(),
                            ) {
                                Row(modifier = Modifier.fillMaxWidth().height(IntrinsicSize.Min)) {
                                    Box(
                                        modifier = Modifier
                                            .width(3.dp)
                                            .fillMaxHeight()
                                            .background(KundliColors.Gold.copy(alpha = 0.75f)),
                                    )
                                    Text(
                                        text = entry.deeperNote,
                                        style = MaterialTheme.typography.bodySmall,
                                        color = KundliColors.TextMuted,
                                        modifier = Modifier.padding(12.dp),
                                    )
                                }
                            }
                        }
                    }
                }
            }
            item { Spacer(Modifier.height(20.dp)) }
        }
    }
}

@Composable
fun SettingsAndVaultPage(
    activeProfile: ProfileMeta?,
    placesService: GooglePlacesService,
    offlineCities: List<OfflineCityItem>,
    detailLevel: String,
    chartStyle: ChartStyle,
    quietHoursStart: String,
    quietHoursEnd: String,
    morningNotificationsEnabled: Boolean,
    signedInUser: StoredAuthUser?,
    authBusy: Boolean = false,
    lastSyncLabel: String?,
    statusMessage: String?,
    updatingProfile: Boolean,
    onUpdateActiveProfile: (name: String, birthDate: String, birthTime: String, place: ResolvedPlace, timeCertainty: String, ayanamsa: String) -> Unit,
    onChangeDetailLevel: (String) -> Unit,
    onChangeChartStyle: (ChartStyle) -> Unit,
    onChangeQuietHours: (String, String) -> Unit,
    onToggleMorningNotifications: (Boolean) -> Unit,
    onSignInWithGoogle: () -> Unit,
    onSignOut: () -> Unit,
    onExportLlmDossier: () -> Unit,
    onExportVaultJson: () -> Unit,
    onRestoreVaultJson: () -> Unit,
    onOpenSupport: () -> Unit,
    onResetDataVault: () -> Unit,
    onBack: () -> Unit,
) {
    var name by remember(activeProfile?.id) { mutableStateOf(activeProfile?.name ?: "") }
    var birthDate by remember(activeProfile?.id) { mutableStateOf(activeProfile?.birthDate ?: "1998-09-07") }
    var birthTime by remember(activeProfile?.id) { mutableStateOf(activeProfile?.birthTime ?: "12:00:00") }
    var timeCertainty by remember(activeProfile?.id) { mutableStateOf(activeProfile?.timeCertainty ?: "exact") }
    var ayanamsa by remember(activeProfile?.id) { mutableStateOf(activeProfile?.ayanamsa ?: "lahiri") }
    var selectedPlace by remember(activeProfile?.id) {
        mutableStateOf(
            activeProfile?.let { ResolvedPlace(it.cityName, it.lat, it.lon, it.tzId) }
                ?: ResolvedPlace("Jamshedpur", 22.8, 86.17, "Asia/Kolkata"),
        )
    }
    var showAyanamsaMenu by remember { mutableStateOf(false) }
    var showPlacePicker by remember { mutableStateOf(false) }
    var confirmReset by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(KundliColors.BgInk)
            .statusBarsPadding()
            .navigationBarsPadding(),
    ) {
        // Top App Bar (Stitch settings_vault.png)
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp)
                .padding(horizontal = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            IconButton(onClick = onBack) {
                Icon(Icons.AutoMirrored.Rounded.ArrowBack, contentDescription = "Back", tint = KundliColors.Gold)
            }
            Text("SETTINGS & DATA VAULT", style = MaterialTheme.typography.titleLarge, color = KundliColors.TextMain)
        }

        Column(
            modifier = Modifier
                .weight(1f)
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 20.dp, vertical = 10.dp),
            verticalArrangement = Arrangement.spacedBy(20.dp),
        ) {
            if (!statusMessage.isNullOrBlank()) {
                Surface(
                    color = KundliColors.Teal.copy(alpha = 0.12f),
                    border = BorderStroke(1.dp, KundliColors.Teal.copy(alpha = 0.55f)),
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Text(statusMessage, style = MaterialTheme.typography.bodySmall, color = KundliColors.Teal, modifier = Modifier.padding(14.dp))
                }
            }

            // 1. CLOUD SYNC & ACCOUNT Card (Stitch settings_vault.png)
            Surface(
                color = KundliColors.Surface,
                border = BorderStroke(1.dp, KundliColors.GoldHairline),
                shape = RoundedCornerShape(20.dp),
                modifier = Modifier.fillMaxWidth(),
            ) {
                Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Text("CREDENTIALS & SYNC", style = MaterialTheme.typography.labelSmall, color = KundliColors.TextMuted)
                        Surface(
                            color = KundliColors.Teal.copy(alpha = 0.14f),
                            shape = RoundedCornerShape(999.dp),
                        ) {
                            Text(
                                text = "● Vault Encrypted",
                                style = MaterialTheme.typography.labelSmall,
                                color = KundliColors.Teal,
                                modifier = Modifier.padding(horizontal = 9.dp, vertical = 3.dp),
                            )
                        }
                    }
                    Text("CLOUD SYNC & ACCOUNT", style = MaterialTheme.typography.titleLarge, color = KundliColors.TextMain)
                    Surface(
                        color = KundliColors.SurfaceRecessed,
                        border = BorderStroke(1.dp, KundliColors.SubtleDivider),
                        shape = RoundedCornerShape(14.dp),
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
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
                                            .size(38.dp)
                                            .clip(CircleShape)
                                            .background(KundliColors.SurfaceAlt)
                                            .border(1.5.dp, if (signedInUser != null) KundliColors.Teal else KundliColors.GoldHairline, CircleShape),
                                        contentAlignment = Alignment.Center,
                                    ) {
                                        Text(
                                            text = (signedInUser?.name ?: activeProfile?.name ?: "K").take(1).uppercase(),
                                            style = MaterialTheme.typography.titleSmall,
                                            color = KundliColors.Gold,
                                        )
                                    }
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(
                                            text = signedInUser?.name ?: "Local-Only Vault",
                                            style = MaterialTheme.typography.titleSmall,
                                            color = KundliColors.TextMain,
                                            maxLines = 1,
                                            overflow = TextOverflow.Ellipsis,
                                        )
                                        Text(
                                            text = signedInUser?.email ?: (lastSyncLabel?.let { "Last sync: ${it.take(16).replace('T', ' ')}" } ?: "All data stays on this device"),
                                            style = MaterialTheme.typography.labelSmall,
                                            color = KundliColors.TextMuted,
                                            maxLines = 1,
                                            overflow = TextOverflow.Ellipsis,
                                        )
                                    }
                                }
                                if (signedInUser != null) {
                                    Surface(
                                        color = KundliColors.SurfaceAlt,
                                        border = BorderStroke(1.dp, KundliColors.SubtleDivider),
                                        shape = RoundedCornerShape(10.dp),
                                        modifier = Modifier.clickable(onClick = onSignOut),
                                    ) {
                                        Text(
                                            text = "Sign out",
                                            style = MaterialTheme.typography.labelSmall,
                                            color = KundliColors.TextMain,
                                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                                        )
                                    }
                                }
                            }
                            if (signedInUser == null) {
                                Button(
                                    onClick = onSignInWithGoogle,
                                    enabled = !authBusy,
                                    shape = RoundedCornerShape(12.dp),
                                    modifier = Modifier.fillMaxWidth().height(44.dp),
                                    colors = ButtonDefaults.buttonColors(containerColor = KundliColors.Teal, contentColor = KundliColors.OrbInk),
                                ) {
                                    Text(if (authBusy) "Connecting to Google…" else "Sign in with Google (Gmail)", style = MaterialTheme.typography.labelLarge)
                                }
                            }
                        }
                    }
                }
            }

            // 2. ACTIVE BIRTH PROFILE Card (Stitch settings_vault.png)
            if (activeProfile != null) {
                Surface(
                    color = KundliColors.Surface,
                    border = BorderStroke(1.dp, KundliColors.SubtleDivider),
                    shape = RoundedCornerShape(20.dp),
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Text("NATAL HORIZON ANCHOR", style = MaterialTheme.typography.labelSmall, color = KundliColors.TextMuted)
                        Text("ACTIVE BIRTH PROFILE", style = MaterialTheme.typography.titleLarge, color = KundliColors.TextMain)
                        OutlinedTextField(value = name, onValueChange = { name = it }, label = { Text("Name") }, singleLine = true, modifier = Modifier.fillMaxWidth())

                        // Unified 3-way Certainty Track
                        Surface(
                            color = KundliColors.SurfaceRecessed,
                            border = BorderStroke(1.dp, KundliColors.SubtleDivider),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.fillMaxWidth(),
                        ) {
                            Row(modifier = Modifier.padding(3.dp)) {
                                listOf("exact" to "Exact", "approx" to "±15m", "unknown" to "Unknown").forEach { (id, label) ->
                                    val active = timeCertainty == id
                                    Surface(
                                        color = if (active) KundliColors.SurfaceAlt else Color.Transparent,
                                        border = if (active) BorderStroke(1.dp, KundliColors.GoldHairline) else null,
                                        shape = RoundedCornerShape(9.dp),
                                        modifier = Modifier.weight(1f).clickable { timeCertainty = id },
                                    ) {
                                        Box(modifier = Modifier.padding(vertical = 8.dp), contentAlignment = Alignment.Center) {
                                            Text(label, style = MaterialTheme.typography.labelSmall, color = if (active) KundliColors.Gold else KundliColors.TextMuted)
                                        }
                                    }
                                }
                            }
                        }

                        BirthDatePickerField(birthDateIso = birthDate, onDateSelected = { birthDate = it })
                        if (timeCertainty != "unknown") {
                            BirthTimePickerField(birthTimeHms = birthTime, allowSeconds = timeCertainty == "exact", onTimeSelected = { birthTime = it })
                        }

                        Surface(
                            color = KundliColors.SurfaceRecessed,
                            border = BorderStroke(1.dp, KundliColors.GoldHairline),
                            shape = RoundedCornerShape(14.dp),
                            modifier = Modifier.fillMaxWidth().clickable { showPlacePicker = true },
                        ) {
                            Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                                Text("BIRTH CITY (GOOGLE PLACES / GPS)", style = MaterialTheme.typography.labelSmall, color = KundliColors.Gold)
                                Text(selectedPlace.name, style = MaterialTheme.typography.titleSmall, color = KundliColors.TextMain)
                                Text(String.format(Locale.US, "%.2f°, %.2f° · %s", selectedPlace.lat, selectedPlace.lon, selectedPlace.tzId), style = MaterialTheme.typography.labelSmall, color = KundliColors.Teal)
                            }
                        }

                        Box {
                            Surface(
                                color = KundliColors.SurfaceRecessed,
                                border = BorderStroke(1.dp, KundliColors.SubtleDivider),
                                shape = RoundedCornerShape(14.dp),
                                modifier = Modifier.fillMaxWidth().clickable { showAyanamsaMenu = true },
                            ) {
                                Row(
                                    modifier = Modifier.padding(14.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically,
                                ) {
                                    Column {
                                        Text("ZODIAC PRECESSION (AYANAMSA)", style = MaterialTheme.typography.labelSmall, color = KundliColors.TextMuted)
                                        Text(ayanamsa.uppercase(), style = MaterialTheme.typography.titleSmall, color = KundliColors.TextMain)
                                    }
                                    Text("SELECTED ▾", style = MaterialTheme.typography.labelSmall, color = KundliColors.Gold)
                                }
                            }
                            DropdownMenu(expanded = showAyanamsaMenu, onDismissRequest = { showAyanamsaMenu = false }, containerColor = KundliColors.Surface) {
                                listOf("lahiri", "kp_new", "kp_old", "raman", "yukteshwar").forEach { ay ->
                                    DropdownMenuItem(
                                        text = { Text(ay.uppercase(), color = if (ay == ayanamsa) KundliColors.Gold else KundliColors.TextMain) },
                                        onClick = {
                                            ayanamsa = ay
                                            showAyanamsaMenu = false
                                        },
                                    )
                                }
                            }
                        }

                        Button(
                            onClick = { onUpdateActiveProfile(name.ifBlank { activeProfile.name }, birthDate, birthTime, selectedPlace, timeCertainty, ayanamsa) },
                            enabled = !updatingProfile,
                            shape = RoundedCornerShape(14.dp),
                            modifier = Modifier.fillMaxWidth().height(48.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = KundliColors.Gold, contentColor = KundliColors.OrbInk),
                        ) {
                            Text(if (updatingProfile) "Recalculating Chart…" else "✦ Save & Recompute Chart →", style = MaterialTheme.typography.labelLarge)
                        }
                    }
                }
            }

            // 3. CALCULATION & CODEX PREFERENCES Card (Stitch)
            Surface(
                color = KundliColors.Surface,
                border = BorderStroke(1.dp, KundliColors.SubtleDivider),
                shape = RoundedCornerShape(20.dp),
                modifier = Modifier.fillMaxWidth(),
            ) {
                Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text("VEDIC ENGINE & PRESENTATION", style = MaterialTheme.typography.labelSmall, color = KundliColors.TextMuted)
                    Text("CALCULATION & CODEX PREFERENCES", style = MaterialTheme.typography.titleLarge, color = KundliColors.TextMain)

                    Text("READING DEPTH", style = MaterialTheme.typography.labelSmall, color = KundliColors.TextMuted)
                    Surface(
                        color = KundliColors.SurfaceRecessed,
                        border = BorderStroke(1.dp, KundliColors.SubtleDivider),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Row(modifier = Modifier.padding(3.dp)) {
                            listOf("simple" to "Simple", "balanced" to "Balanced", "full" to "Full (Quant)").forEach { (id, label) ->
                                val active = detailLevel == id
                                Surface(
                                    color = if (active) KundliColors.SurfaceAlt else Color.Transparent,
                                    border = if (active) BorderStroke(1.dp, KundliColors.GoldHairline) else null,
                                    shape = RoundedCornerShape(9.dp),
                                    modifier = Modifier.weight(1f).clickable { onChangeDetailLevel(id) },
                                ) {
                                    Box(modifier = Modifier.padding(vertical = 8.dp), contentAlignment = Alignment.Center) {
                                        Text(label, style = MaterialTheme.typography.labelSmall, color = if (active) KundliColors.Gold else KundliColors.TextMuted, maxLines = 1)
                                    }
                                }
                            }
                        }
                    }

                    Text("CHART RENDERING SYSTEM", style = MaterialTheme.typography.labelSmall, color = KundliColors.TextMuted)
                    Surface(
                        color = KundliColors.SurfaceRecessed,
                        border = BorderStroke(1.dp, KundliColors.SubtleDivider),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Row(modifier = Modifier.padding(3.dp)) {
                            ChartStyle.entries.forEach { style ->
                                val active = chartStyle == style
                                Surface(
                                    color = if (active) KundliColors.SurfaceAlt else Color.Transparent,
                                    border = if (active) BorderStroke(1.dp, KundliColors.Teal.copy(alpha = 0.45f)) else null,
                                    shape = RoundedCornerShape(9.dp),
                                    modifier = Modifier.weight(1f).clickable { onChangeChartStyle(style) },
                                ) {
                                    Box(modifier = Modifier.padding(vertical = 9.dp), contentAlignment = Alignment.Center) {
                                        Text(style.label, style = MaterialTheme.typography.labelSmall, color = if (active) KundliColors.Teal else KundliColors.TextMuted, maxLines = 1)
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // 4. QUIET HOURS & NOTIFICATIONS Card (Stitch settings_vault.png)
            Surface(
                color = KundliColors.Surface,
                border = BorderStroke(1.dp, KundliColors.SubtleDivider),
                shape = RoundedCornerShape(20.dp),
                modifier = Modifier.fillMaxWidth(),
            ) {
                Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text("MINDFUL CYCLES", style = MaterialTheme.typography.labelSmall, color = KundliColors.TextMuted)
                    Text("QUIET HOURS & NOTIFICATIONS", style = MaterialTheme.typography.titleLarge, color = KundliColors.TextMain)
                    Surface(
                        color = KundliColors.SurfaceRecessed,
                        border = BorderStroke(1.dp, KundliColors.SubtleDivider),
                        shape = RoundedCornerShape(14.dp),
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(10.dp),
                                modifier = Modifier.weight(1f).padding(end = 8.dp),
                            ) {
                                Icon(Icons.Rounded.WbSunny, contentDescription = null, tint = KundliColors.Gold, modifier = Modifier.size(18.dp))
                                Column {
                                    Text("Calm Morning Sky Brief", style = MaterialTheme.typography.titleSmall, color = KundliColors.TextMain)
                                    Text("Opt-in 1-line morning band note", style = MaterialTheme.typography.labelSmall, color = KundliColors.TextMuted)
                                }
                            }
                            Switch(
                                checked = morningNotificationsEnabled,
                                onCheckedChange = onToggleMorningNotifications,
                                colors = SwitchDefaults.colors(checkedThumbColor = KundliColors.OrbInk, checkedTrackColor = KundliColors.Teal),
                            )
                        }
                    }

                    // 2-Up Recessed Quiet Start / Quiet End Display Tiles
                    Row(
                        modifier = Modifier.fillMaxWidth().height(IntrinsicSize.Min),
                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                    ) {
                        Surface(
                            color = KundliColors.SurfaceRecessed,
                            border = BorderStroke(1.dp, KundliColors.SubtleDivider),
                            shape = RoundedCornerShape(14.dp),
                            modifier = Modifier.weight(1f).fillMaxHeight(),
                        ) {
                            Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                                Text("QUIET START", style = MaterialTheme.typography.labelSmall, color = KundliColors.TextMuted)
                                Text(quietHoursStart, style = MaterialTheme.typography.titleMedium, color = KundliColors.TextMain)
                                Text("Night silence", style = MaterialTheme.typography.labelSmall, color = KundliColors.TextMuted)
                            }
                        }
                        Surface(
                            color = KundliColors.SurfaceRecessed,
                            border = BorderStroke(1.dp, KundliColors.SubtleDivider),
                            shape = RoundedCornerShape(14.dp),
                            modifier = Modifier.weight(1f).fillMaxHeight(),
                        ) {
                            Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                                Text("QUIET END", style = MaterialTheme.typography.labelSmall, color = KundliColors.TextMuted)
                                Text(quietHoursEnd, style = MaterialTheme.typography.titleMedium, color = KundliColors.TextMain)
                                Text("Dawn briefing", style = MaterialTheme.typography.labelSmall, color = KundliColors.TextMuted)
                            }
                        }
                    }

                    val currentQuiet = "$quietHoursStart–$quietHoursEnd"
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        items(
                            listOf(
                                Triple("21:00", "07:00", "21:00–07:00"),
                                Triple("22:00", "07:00", "22:00–07:00"),
                                Triple("23:00", "08:00", "23:00–08:00"),
                                Triple("00:00", "00:00", "Off"),
                            ),
                        ) { (s, e, label) ->
                            val sel = if (label == "Off") quietHoursStart == quietHoursEnd else currentQuiet == label
                            Surface(
                                color = if (sel) KundliColors.Gold.copy(alpha = 0.16f) else KundliColors.SurfaceRecessed,
                                border = BorderStroke(1.dp, if (sel) KundliColors.Gold else KundliColors.SubtleDivider),
                                shape = RoundedCornerShape(999.dp),
                                modifier = Modifier.clickable { onChangeQuietHours(s, e) },
                            ) {
                                Text(
                                    text = label,
                                    style = MaterialTheme.typography.labelSmall,
                                    color = if (sel) KundliColors.Gold else KundliColors.TextMuted,
                                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                                )
                            }
                        }
                    }
                }
            }

            // 5. LOCAL-FIRST DATA VAULT Card (Stitch settings_vault.png: 3 icon-tile rows)
            Surface(
                color = KundliColors.Surface,
                border = BorderStroke(1.dp, KundliColors.SubtleDivider),
                shape = RoundedCornerShape(20.dp),
                modifier = Modifier.fillMaxWidth(),
            ) {
                Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text("SOVEREIGNTY & EXPORT", style = MaterialTheme.typography.labelSmall, color = KundliColors.Teal)
                    Text("LOCAL-FIRST DATA VAULT", style = MaterialTheme.typography.titleLarge, color = KundliColors.TextMain)
                    VaultActionRow(Icons.Rounded.Description, KundliColors.Gold, "Export Complete LLM Dossier (.md)", "Synthesized chart & dashas for AI", onExportLlmDossier)
                    VaultActionRow(Icons.Rounded.Shield, KundliColors.Teal, "Backup Encrypted Vault (.json)", "Lossless profiles, milestones & journal", onExportVaultJson)
                    VaultActionRow(Icons.Rounded.History, KundliColors.Teal, "Restore Vault from JSON", "Seamlessly migrate from backup file", onRestoreVaultJson)

                    TextButton(
                        onClick = {
                            if (confirmReset) {
                                confirmReset = false
                                onResetDataVault()
                            } else {
                                confirmReset = true
                            }
                        },
                        modifier = Modifier.align(Alignment.CenterHorizontally),
                    ) {
                        Text(
                            text = if (confirmReset) "Tap again to confirm Data Vault RESET" else "Reset Local Data Vault & Wipe Cache",
                            color = KundliColors.AlertCrimson,
                            style = MaterialTheme.typography.labelMedium,
                        )
                    }
                }
            }

            // 6. Pinned Teal-Bordered Grounding Support Card (Stitch settings_vault.png)
            Surface(
                color = KundliColors.Teal.copy(alpha = 0.08f),
                border = BorderStroke(1.dp, KundliColors.Teal.copy(alpha = 0.4f)),
                shape = RoundedCornerShape(18.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable(onClick = onOpenSupport),
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Surface(
                        color = KundliColors.Teal.copy(alpha = 0.16f),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.size(38.dp),
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(Icons.Rounded.FavoriteBorder, contentDescription = null, tint = KundliColors.Teal, modifier = Modifier.size(20.dp))
                        }
                    }
                    Column(modifier = Modifier.weight(1f)) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Text("NEED GROUNDING SUPPORT?", style = MaterialTheme.typography.titleSmall, color = KundliColors.TextMain)
                            Surface(color = KundliColors.Teal, shape = RoundedCornerShape(6.dp)) {
                                Text("24/7", style = MaterialTheme.typography.labelSmall, color = KundliColors.OrbInk, modifier = Modifier.padding(horizontal = 6.dp, vertical = 1.dp))
                            }
                        }
                        Text("Compassionate emotional support & helplines", style = MaterialTheme.typography.labelSmall, color = KundliColors.Teal)
                    }
                    Text(">", style = MaterialTheme.typography.bodyMedium, color = KundliColors.Teal)
                }
            }

            Spacer(Modifier.height(16.dp))
        }
    }

    if (showPlacePicker) {
        PlacePickerSheet(
            title = "Update Birth City",
            placesService = placesService,
            offlineCities = offlineCities,
            onPlaceSelected = {
                selectedPlace = it
                showPlacePicker = false
            },
            onDismiss = { showPlacePicker = false },
        )
    }
}

@Composable
private fun VaultActionRow(
    icon: ImageVector,
    accent: Color,
    title: String,
    subtitle: String,
    onClick: () -> Unit,
) {
    Surface(
        color = KundliColors.SurfaceRecessed,
        border = BorderStroke(1.dp, KundliColors.SubtleDivider),
        shape = RoundedCornerShape(14.dp),
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Surface(
                color = KundliColors.SurfaceAlt,
                shape = RoundedCornerShape(10.dp),
                modifier = Modifier.size(36.dp),
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(icon, contentDescription = null, tint = accent, modifier = Modifier.size(18.dp))
                }
            }
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(1.dp)) {
                Text(title, style = MaterialTheme.typography.titleSmall, color = KundliColors.TextMain, maxLines = 1, overflow = TextOverflow.Ellipsis)
                Text(subtitle, style = MaterialTheme.typography.labelSmall, color = KundliColors.TextMuted, maxLines = 1, overflow = TextOverflow.Ellipsis)
            }
            Text(">", style = MaterialTheme.typography.bodyMedium, color = KundliColors.TextMuted)
        }
    }
}
