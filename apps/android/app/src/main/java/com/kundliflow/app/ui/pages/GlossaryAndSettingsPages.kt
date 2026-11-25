package com.kundliflow.app.ui.pages

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowBack
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.FilterChip
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
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
        Row(
            modifier = Modifier.fillMaxWidth().height(56.dp).padding(horizontal = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            IconButton(onClick = onBack) {
                Icon(Icons.AutoMirrored.Rounded.ArrowBack, contentDescription = "Back", tint = KundliColors.Gold)
            }
            Text("Plain English Glossary (${SearchCatalog.glossaryEntries.size})", style = MaterialTheme.typography.titleMedium, color = KundliColors.TextMain)
        }

        Column(
            modifier = Modifier.padding(horizontal = 20.dp, vertical = 6.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            OutlinedTextField(
                value = query,
                onValueChange = { query = it },
                placeholder = { Text("Search Hora, Chandra Bala, SAV, KP…") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
            )
            LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                items(categories) { cat ->
                    FilterChip(selected = selectedCategory == cat, onClick = { selectedCategory = cat }, label = { Text(cat) })
                }
            }
        }

        LazyColumn(
            modifier = Modifier.weight(1f).padding(horizontal = 20.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            items(filtered, key = { it.id }) { entry ->
                Surface(color = KundliColors.Surface, border = BorderStroke(1.dp, KundliColors.SubtleDivider), shape = RoundedCornerShape(14.dp), modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Text(entry.category.uppercase(), style = MaterialTheme.typography.labelMedium, color = KundliColors.Teal)
                        Text(entry.term, style = MaterialTheme.typography.titleMedium, color = KundliColors.Gold)
                        Text(entry.plainSummary, style = MaterialTheme.typography.bodyMedium, color = KundliColors.TextMain)
                        Text(entry.deeperNote, style = MaterialTheme.typography.bodySmall, color = KundliColors.TextMuted)
                    }
                }
            }
            item { Spacer(Modifier.height(16.dp)) }
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
        Row(
            modifier = Modifier.fillMaxWidth().height(56.dp).padding(horizontal = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            IconButton(onClick = onBack) {
                Icon(Icons.AutoMirrored.Rounded.ArrowBack, contentDescription = "Back", tint = KundliColors.Gold)
            }
            Text("Settings, Sync & Data Vault", style = MaterialTheme.typography.titleMedium, color = KundliColors.TextMain)
        }

        Column(
            modifier = Modifier
                .weight(1f)
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 20.dp, vertical = 10.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            if (!statusMessage.isNullOrBlank()) {
                Surface(color = KundliColors.SurfaceAlt, border = BorderStroke(1.dp, KundliColors.Teal), shape = RoundedCornerShape(12.dp), modifier = Modifier.fillMaxWidth()) {
                    Text(statusMessage, style = MaterialTheme.typography.bodySmall, color = KundliColors.Teal, modifier = Modifier.padding(12.dp))
                }
            }

            // 1. Birth Profile Editor
            if (activeProfile != null) {
                Text("BIRTH DETAILS", style = MaterialTheme.typography.labelMedium, color = KundliColors.Gold)
                OutlinedTextField(value = name, onValueChange = { name = it }, label = { Text("Name") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(listOf("exact" to "Exact", "approx" to "Approx ±15m", "unknown" to "Unknown (Moon)")) { (id, label) ->
                        FilterChip(selected = timeCertainty == id, onClick = { timeCertainty = id }, label = { Text(label) })
                    }
                }
                BirthDatePickerField(birthDateIso = birthDate, onDateSelected = { birthDate = it })
                if (timeCertainty != "unknown") {
                    BirthTimePickerField(birthTimeHms = birthTime, allowSeconds = timeCertainty == "exact", onTimeSelected = { birthTime = it })
                }
                Surface(
                    color = KundliColors.Surface,
                    border = BorderStroke(1.dp, KundliColors.GoldHairline),
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier.fillMaxWidth().clickable { showPlacePicker = true },
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Text("Birth City (Google Places / GPS)", style = MaterialTheme.typography.labelMedium, color = KundliColors.Gold)
                        Text(selectedPlace.name, style = MaterialTheme.typography.titleMedium, color = KundliColors.TextMain)
                        Text(String.format(Locale.US, "%.2f°, %.2f° · %s", selectedPlace.lat, selectedPlace.lon, selectedPlace.tzId), style = TelemetryNumberStyle, color = KundliColors.Teal)
                    }
                }

                // Pragmatic Dropdown for rare Ayanamsa setting
                Box {
                    OutlinedButton(onClick = { showAyanamsaMenu = true }, modifier = Modifier.fillMaxWidth()) {
                        Text("Ayanamsa: ${ayanamsa.uppercase()} ▾", color = KundliColors.TextMain)
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
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = KundliColors.Gold, contentColor = KundliColors.OrbInk),
                ) {
                    Text(if (updatingProfile) "Recalculating Chart…" else "Save & Recalculate Chart")
                }
            }

            HorizontalDivider(color = KundliColors.SubtleDivider)

            // 2. Reading & Reminders
            Text("READING & REMINDERS", style = MaterialTheme.typography.labelMedium, color = KundliColors.Gold)
            LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                items(listOf("simple" to "Simple", "balanced" to "Balanced", "full" to "Full")) { (id, label) ->
                    FilterChip(selected = detailLevel == id, onClick = { onChangeDetailLevel(id) }, label = { Text(label) })
                }
            }
            LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                items(ChartStyle.entries) { style ->
                    FilterChip(selected = chartStyle == style, onClick = { onChangeChartStyle(style) }, label = { Text(style.label) })
                }
            }
            Text("Quiet Hours (hard cap: 2 notifications/day)", style = MaterialTheme.typography.labelMedium, color = KundliColors.TextMuted)
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
                    FilterChip(selected = sel, onClick = { onChangeQuietHours(s, e) }, label = { Text(label) })
                }
            }

            Surface(color = KundliColors.Surface, shape = RoundedCornerShape(14.dp), modifier = Modifier.fillMaxWidth()) {
                Row(
                    modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Column(modifier = Modifier.weight(1f).padding(end = 8.dp)) {
                        Text("Calm Morning Sky Summary", style = MaterialTheme.typography.titleMedium)
                        Text("Opt-in 1-line morning band note respecting Quiet Hours.", style = MaterialTheme.typography.bodySmall, color = KundliColors.TextMuted)
                    }
                    Switch(
                        checked = morningNotificationsEnabled,
                        onCheckedChange = onToggleMorningNotifications,
                        colors = SwitchDefaults.colors(checkedThumbColor = KundliColors.OrbInk, checkedTrackColor = KundliColors.Teal),
                    )
                }
            }

            HorizontalDivider(color = KundliColors.SubtleDivider)

            // 3. Cloud Sync & Data Sovereignty Vault
            Text("SYNC & DATA SOVEREIGNTY", style = MaterialTheme.typography.labelMedium, color = KundliColors.Gold)
            Surface(color = KundliColors.Surface, shape = RoundedCornerShape(14.dp), modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(signedInUser?.let { "Signed in · ${it.name}" } ?: "Local-Only Vault", style = MaterialTheme.typography.titleMedium, color = if (signedInUser != null) KundliColors.Teal else KundliColors.TextMain)
                            Text(signedInUser?.email ?: (lastSyncLabel?.let { "Last sync: ${it.take(16).replace('T', ' ')}" } ?: "All data stays on this device."), style = MaterialTheme.typography.bodySmall, color = KundliColors.TextMuted)
                        }
                        if (signedInUser != null) {
                            TextButton(onClick = onSignOut) { Text("Sign out", color = KundliColors.AlertCrimson) }
                        }
                    }
                    if (signedInUser == null) {
                        Button(
                            onClick = onSignInWithGoogle,
                            enabled = !authBusy,
                            modifier = Modifier.fillMaxWidth(),
                            colors = ButtonDefaults.buttonColors(containerColor = KundliColors.Teal, contentColor = KundliColors.OrbInk),
                        ) {
                            Text(if (authBusy) "Connecting to Google…" else "Sign in with Google (Gmail)")
                        }
                    }
                }
            }

            OutlinedButton(onClick = onExportLlmDossier, modifier = Modifier.fillMaxWidth()) {
                Text("Export AI LLM Context (.md)", color = KundliColors.TextMain)
            }
            OutlinedButton(onClick = onExportVaultJson, modifier = Modifier.fillMaxWidth()) {
                Text("Export Data Sovereignty Vault (.json)", color = KundliColors.TextMain)
            }
            OutlinedButton(onClick = onRestoreVaultJson, modifier = Modifier.fillMaxWidth()) {
                Text("Restore Data Sovereignty Vault (.json)", color = KundliColors.Teal)
            }
            OutlinedButton(onClick = onOpenSupport, modifier = Modifier.fillMaxWidth()) {
                Text("Need support? (24/7 Helplines)", color = KundliColors.Teal)
            }
            TextButton(
                onClick = {
                    if (confirmReset) {
                        confirmReset = false
                        onResetDataVault()
                    } else {
                        confirmReset = true
                    }
                },
            ) {
                Text(
                    text = if (confirmReset) "Tap again to confirm Data Vault RESET" else "Data Sovereignty Vault · Reset",
                    color = KundliColors.AlertCrimson,
                )
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
