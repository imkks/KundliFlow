package com.kundliflow.app.ui.me

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
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
import com.kundliflow.app.ui.today.SkyBand
import java.util.Locale

data class OrbitProfileItem(
    val id: String,
    val name: String,
    val subtitle: String,
    val todayBand: SkyBand?,
    val ayanamsa: String = "Lahiri",
)

data class BlueprintPreviewData(
    val profileName: String,
    val ascendantSign: String,
    val moonSign: String,
    val moonNakshatra: String,
    val rarityLine: String,
    val chapterLine: String,
    val timeCertainty: String,
)

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
fun MeSheet(
    profiles: List<OrbitProfileItem>,
    activeProfile: ProfileMeta?,
    blueprintPreview: BlueprintPreviewData,
    placesService: GooglePlacesService,
    offlineCities: List<OfflineCityItem>,
    detailLevel: String,
    chartStyle: ChartStyle,
    quietHoursStart: String,
    quietHoursEnd: String,
    morningNotificationsEnabled: Boolean,
    signedInUser: StoredAuthUser?,
    lastSyncLabel: String?,
    statusMessage: String?,
    updatingProfile: Boolean = false,
    onSelectProfile: (String) -> Unit,
    onAddProfile: () -> Unit,
    onUpdateActiveProfile: (name: String, birthDate: String, birthTime: String, place: ResolvedPlace, timeCertainty: String, ayanamsa: String) -> Unit,
    onDeleteProfile: (String) -> Unit = {},
    onChangeDetailLevel: (String) -> Unit,
    onChangeChartStyle: (ChartStyle) -> Unit,
    onChangeQuietHours: (start: String, end: String) -> Unit,
    onToggleMorningNotifications: (Boolean) -> Unit,
    onSignInWithEmail: (email: String, name: String) -> Unit,
    onSignOut: () -> Unit,
    onOpenDiscoveryMap: () -> Unit,
    onShareCosmicBlueprint: () -> Unit = {},
    onExportLlmDossier: () -> Unit = {},
    onExportVaultJson: () -> Unit = {},
    onRestoreVaultJson: () -> Unit = {},
    onResetDataVault: () -> Unit = {},
    onDismiss: () -> Unit,
) {
    val activeProfileId = activeProfile?.id ?: ""
    var expandCharts by remember { mutableStateOf(true) }
    var expandPrefs by remember { mutableStateOf(true) }
    var expandData by remember { mutableStateOf(true) }
    var showSharePreview by remember { mutableStateOf(false) }
    var showEditProfile by remember { mutableStateOf(false) }
    var showGlossary by remember { mutableStateOf(false) }
    var showInlineSignIn by remember { mutableStateOf(false) }
    var authEmail by remember { mutableStateOf("") }
    var authName by remember { mutableStateOf(activeProfile?.name ?: "") }
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

            if (!statusMessage.isNullOrBlank()) {
                Surface(
                    color = KundliColors.SurfaceAlt,
                    border = BorderStroke(1.dp, KundliColors.Teal),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Text(
                        text = statusMessage,
                        style = MaterialTheme.typography.bodySmall,
                        color = KundliColors.Teal,
                        modifier = Modifier.padding(12.dp),
                    )
                }
            }

            // Group 1: Your Charts (with real cached Orbit Band Dots + Edit Profile)
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
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    modifier = Modifier.weight(1f),
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(10.dp)
                                            .clip(CircleShape)
                                            .background(profile.todayBand?.color ?: KundliColors.SubtleDivider),
                                    )
                                    Spacer(Modifier.width(10.dp))
                                    Column {
                                        Text(profile.name, style = MaterialTheme.typography.titleMedium)
                                        Text(
                                            text = buildString {
                                                append("${profile.subtitle} · ${profile.ayanamsa}")
                                                profile.todayBand?.let { append(" · ${it.label}") }
                                            },
                                            style = MaterialTheme.typography.labelMedium,
                                            color = KundliColors.TextMuted,
                                        )
                                    }
                                }
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    if (active) {
                                        TextButton(onClick = { showEditProfile = true }) {
                                            Text("Edit", color = KundliColors.Gold)
                                        }
                                    } else {
                                        TextButton(onClick = { onDeleteProfile(profile.id) }) {
                                            Text("Delete", color = KundliColors.AlertCrimson)
                                        }
                                    }
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

            // Group 2: Preferences (Detail, Chart Style, Quiet Hours, Opt-in Notifications, Account Sync)
            CollapsibleGroupHeader("Preferences & Sync", expandPrefs) { expandPrefs = !expandPrefs }
            AnimatedVisibility(visible = expandPrefs) {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
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
                    Text("Quiet Hours (hard cap: max 2 notifications/day)", style = MaterialTheme.typography.labelMedium, color = KundliColors.TextMuted)
                    val currentQuiet = "$quietHoursStart–$quietHoursEnd"
                    FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        listOf(
                            Triple("21:00", "07:00", "21:00–07:00"),
                            Triple("22:00", "07:00", "22:00–07:00"),
                            Triple("23:00", "08:00", "23:00–08:00"),
                            Triple("00:00", "00:00", "Off"),
                        ).forEach { (s, e, label) ->
                            val selected = if (label == "Off") quietHoursStart == quietHoursEnd else currentQuiet == label
                            FilterChip(
                                selected = selected,
                                onClick = { onChangeQuietHours(s, e) },
                                label = { Text(label) },
                            )
                        }
                    }
                    Surface(
                        color = KundliColors.BgInk,
                        shape = RoundedCornerShape(14.dp),
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Column(modifier = Modifier.weight(1f).padding(end = 8.dp)) {
                                Text("Calm Morning Sky Summary", style = MaterialTheme.typography.titleMedium)
                                Text(
                                    text = "Opt-in 1-line morning band note (respects quiet hours, never nags).",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = KundliColors.TextMuted,
                                )
                            }
                            Switch(
                                checked = morningNotificationsEnabled,
                                onCheckedChange = onToggleMorningNotifications,
                                colors = SwitchDefaults.colors(
                                    checkedThumbColor = KundliColors.OrbInk,
                                    checkedTrackColor = KundliColors.Teal,
                                ),
                            )
                        }
                    }

                    // Account & Cloud Sync status row
                    Surface(
                        color = KundliColors.BgInk,
                        border = BorderStroke(1.dp, KundliColors.SubtleDivider),
                        shape = RoundedCornerShape(14.dp),
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically,
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = signedInUser?.let { "Signed in · ${it.name}" } ?: "Local-Only Vault",
                                        style = MaterialTheme.typography.titleMedium,
                                        color = if (signedInUser != null) KundliColors.Teal else KundliColors.TextMain,
                                    )
                                    Text(
                                        text = signedInUser?.email
                                            ?: (lastSyncLabel?.let { "Last sync: ${it.take(16).replace('T', ' ')}" }
                                                ?: "Data stays on this device unless you sign in."),
                                        style = MaterialTheme.typography.bodySmall,
                                        color = KundliColors.TextMuted,
                                    )
                                }
                                if (signedInUser != null) {
                                    TextButton(onClick = onSignOut) {
                                        Text("Sign out", color = KundliColors.AlertCrimson)
                                    }
                                } else {
                                    TextButton(onClick = { showInlineSignIn = !showInlineSignIn }) {
                                        Text(if (showInlineSignIn) "Close" else "Sign in", color = KundliColors.Gold)
                                    }
                                }
                            }
                            if (showInlineSignIn && signedInUser == null) {
                                OutlinedTextField(
                                    value = authName,
                                    onValueChange = { authName = it },
                                    label = { Text("Name") },
                                    singleLine = true,
                                    modifier = Modifier.fillMaxWidth(),
                                )
                                OutlinedTextField(
                                    value = authEmail,
                                    onValueChange = { authEmail = it },
                                    label = { Text("Email") },
                                    singleLine = true,
                                    modifier = Modifier.fillMaxWidth(),
                                )
                                Button(
                                    onClick = {
                                        if (authEmail.isNotBlank()) {
                                            onSignInWithEmail(authEmail, authName.ifBlank { "Native" })
                                            showInlineSignIn = false
                                        }
                                    },
                                    enabled = authEmail.isNotBlank(),
                                    colors = ButtonDefaults.buttonColors(containerColor = KundliColors.Teal, contentColor = KundliColors.OrbInk),
                                    modifier = Modifier.fillMaxWidth(),
                                ) {
                                    Text("Connect Sync Account")
                                }
                            }
                        }
                    }
                }
            }

            HorizontalDivider(color = KundliColors.SubtleDivider)

            // Group 3: Your Data & Deep Lore
            CollapsibleGroupHeader("Your Data & Deep Lore", expandData) { expandData = !expandData }
            AnimatedVisibility(visible = expandData) {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    MeActionRow("Discovery Map (24-Node Constellation)", onOpenDiscoveryMap)
                    MeActionRow("9:16 Share Cosmic Blueprint (PNG)") { showSharePreview = true }
                    MeActionRow("Plain English Glossary (7 categories)") { showGlossary = true }
                    MeActionRow("Export AI LLM Context (.md)", onExportLlmDossier)
                    MeActionRow("Export Data Sovereignty Vault (.json)", onExportVaultJson)
                    MeActionRow("Restore Data Sovereignty Vault (.json)", onRestoreVaultJson)
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
                }
            }
        }
    }

    if (showSharePreview) {
        ShareBlueprintPreviewSheet(
            preview = blueprintPreview,
            onSharePng = {
                showSharePreview = false
                onShareCosmicBlueprint()
            },
            onDismiss = { showSharePreview = false },
        )
    }

    if (showEditProfile && activeProfile != null) {
        EditProfileSheet(
            profile = activeProfile,
            placesService = placesService,
            offlineCities = offlineCities,
            saving = updatingProfile,
            onSave = { n, d, t, pl, cert, ay ->
                onUpdateActiveProfile(n, d, t, pl, cert, ay)
                showEditProfile = false
            },
            onDismiss = { showEditProfile = false },
        )
    }

    if (showGlossary) {
        GlossarySheet(onDismiss = { showGlossary = false })
    }
}

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
private fun EditProfileSheet(
    profile: ProfileMeta,
    placesService: GooglePlacesService,
    offlineCities: List<OfflineCityItem>,
    saving: Boolean,
    onSave: (name: String, birthDate: String, birthTime: String, place: ResolvedPlace, timeCertainty: String, ayanamsa: String) -> Unit,
    onDismiss: () -> Unit,
) {
    var name by remember(profile.id) { mutableStateOf(profile.name) }
    var birthDate by remember(profile.id) { mutableStateOf(profile.birthDate) }
    var birthTime by remember(profile.id) { mutableStateOf(profile.birthTime) }
    var timeCertainty by remember(profile.id) { mutableStateOf(profile.timeCertainty) }
    var ayanamsa by remember(profile.id) { mutableStateOf(profile.ayanamsa) }
    var selectedPlace by remember(profile.id) {
        mutableStateOf(ResolvedPlace(profile.cityName, profile.lat, profile.lon, profile.tzId))
    }
    var showPlacePicker by remember { mutableStateOf(false) }

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
            Text("Edit Birth Details", style = MaterialTheme.typography.headlineSmall)
            Text(
                text = "Saving recalculates your Swiss Ephemeris bundle on the server and clears stale Today sky cache.",
                style = MaterialTheme.typography.bodySmall,
                color = KundliColors.TextMuted,
            )
            OutlinedTextField(
                value = name,
                onValueChange = { name = it },
                label = { Text("Name") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
            )
            Text("Time Certainty", style = MaterialTheme.typography.labelMedium, color = KundliColors.TextMuted)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                listOf("exact" to "Exact", "approx" to "Approx ±15m", "unknown" to "Unknown (Moon)").forEach { (id, label) ->
                    FilterChip(selected = timeCertainty == id, onClick = { timeCertainty = id }, label = { Text(label) })
                }
            }
            BirthDatePickerField(birthDateIso = birthDate, onDateSelected = { birthDate = it })
            if (timeCertainty != "unknown") {
                BirthTimePickerField(
                    birthTimeHms = birthTime,
                    allowSeconds = timeCertainty == "exact",
                    onTimeSelected = { birthTime = it },
                )
            }
            Surface(
                color = KundliColors.BgInk,
                border = BorderStroke(1.dp, KundliColors.GoldHairline),
                shape = RoundedCornerShape(14.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { showPlacePicker = true },
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text("Birth City (Google Places / GPS)", style = MaterialTheme.typography.labelMedium, color = KundliColors.Gold)
                    Text(selectedPlace.name, style = MaterialTheme.typography.titleMedium, color = KundliColors.TextMain)
                    Text(
                        text = String.format(Locale.US, "%.2f°, %.2f° · %s", selectedPlace.lat, selectedPlace.lon, selectedPlace.tzId),
                        style = TelemetryNumberStyle,
                        color = KundliColors.Teal,
                    )
                }
            }
            Text("Ayanamsa", style = MaterialTheme.typography.labelMedium, color = KundliColors.TextMuted)
            FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                listOf("lahiri", "kp_new", "kp_old", "raman", "yukteshwar").forEach { ay ->
                    FilterChip(selected = ayanamsa == ay, onClick = { ayanamsa = ay }, label = { Text(ay.uppercase()) })
                }
            }
            Button(
                onClick = { onSave(name.ifBlank { profile.name }, birthDate, birthTime, selectedPlace, timeCertainty, ayanamsa) },
                enabled = !saving,
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(containerColor = KundliColors.Gold, contentColor = KundliColors.OrbInk),
            ) {
                Text(if (saving) "Recalculating Chart…" else "Save & Recalculate Chart")
            }
            Spacer(Modifier.height(8.dp))
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
private fun ShareBlueprintPreviewSheet(
    preview: BlueprintPreviewData,
    onSharePng: () -> Unit,
    onDismiss: () -> Unit,
) {
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
                modifier = Modifier.fillMaxWidth(0.65f).aspectRatio(9f / 16f),
            ) {
                Column(
                    modifier = Modifier.padding(18.dp),
                    verticalArrangement = Arrangement.SpaceBetween,
                ) {
                    Column {
                        Text("KUNDLIFLOW", style = MaterialTheme.typography.labelMedium, color = KundliColors.Gold)
                        Text(preview.profileName.uppercase(), style = MaterialTheme.typography.labelMedium, color = KundliColors.TextMuted)
                    }
                    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Text(
                            text = if (preview.timeCertainty == "unknown") "${preview.moonSign} Moon" else "${preview.ascendantSign} Rising",
                            style = MaterialTheme.typography.headlineSmall,
                            color = KundliColors.TextMain,
                        )
                        Text(
                            text = "${preview.moonNakshatra} · ${preview.moonSign} Moon",
                            style = MaterialTheme.typography.bodySmall,
                            color = KundliColors.Teal,
                        )
                        Text(
                            text = preview.rarityLine,
                            style = MaterialTheme.typography.labelMedium,
                            color = KundliColors.TextMuted,
                        )
                    }
                    Text(preview.chapterLine, style = MaterialTheme.typography.labelMedium, color = KundliColors.Gold)
                }
            }
            Button(
                onClick = onSharePng,
                colors = ButtonDefaults.buttonColors(containerColor = KundliColors.Gold, contentColor = KundliColors.OrbInk),
            ) {
                Text("Share 9:16 PNG")
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun GlossarySheet(onDismiss: () -> Unit) {
    val grouped = remember { SearchCatalog.glossaryEntries.groupBy { it.category } }
    ModalBottomSheet(onDismissRequest = onDismiss, containerColor = KundliColors.Surface, contentColor = KundliColors.TextMain) {
        Column(
            modifier = Modifier.fillMaxWidth().navigationBarsPadding().verticalScroll(rememberScrollState()).padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Text("Plain English Glossary (${SearchCatalog.glossaryEntries.size} terms)", style = MaterialTheme.typography.headlineSmall)
            grouped.forEach { (category, items) ->
                Text(category.uppercase(), style = MaterialTheme.typography.labelMedium, color = KundliColors.Teal)
                items.forEach { entry ->
                    Surface(color = KundliColors.SurfaceAlt, shape = RoundedCornerShape(12.dp), modifier = Modifier.fillMaxWidth()) {
                        Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            Text(entry.term, style = MaterialTheme.typography.titleMedium, color = KundliColors.Gold)
                            Text(entry.plainSummary, style = MaterialTheme.typography.bodySmall, color = KundliColors.TextMain)
                            Text(entry.deeperNote, style = MaterialTheme.typography.labelMedium, color = KundliColors.TextMuted)
                        }
                    }
                }
            }
            Spacer(Modifier.height(8.dp))
        }
    }
}
