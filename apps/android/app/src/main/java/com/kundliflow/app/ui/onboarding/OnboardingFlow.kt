package com.kundliflow.app.ui.onboarding

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
import com.kundliflow.app.data.local.StoredAuthUser
import com.kundliflow.app.data.mapper.BundleMappers
import com.kundliflow.app.data.remote.GooglePlacesService
import com.kundliflow.app.data.remote.OfflineCityItem
import com.kundliflow.app.data.remote.ResolvedPlace
import com.kundliflow.app.ui.common.BirthDatePickerField
import com.kundliflow.app.ui.common.BirthTimePickerField
import com.kundliflow.app.ui.common.PlacePickerSheet
import com.kundliflow.app.ui.discovery.DiscoveryPathEngine
import com.kundliflow.app.ui.theme.KundliColors
import com.kundliflow.app.ui.theme.TelemetryNumberStyle
import java.time.LocalDate
import java.util.Locale

data class OnboardingResult(
    val name: String,
    val timeCertainty: String, // exact | approx | unknown
    val birthDate: String,
    val birthTime: String,
    val cityName: String,
    val ayanamsa: String,
    val goals: List<String>,
)

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun OnboardingFlow(
    placesService: GooglePlacesService,
    offlineCities: List<OfflineCityItem>,
    signedInUser: StoredAuthUser? = null,
    authBusy: Boolean = false,
    authMessage: String? = null,
    computing: Boolean = false,
    computeError: String? = null,
    computedLevel1Json: String? = null,
    onSignInWithGoogle: () -> Unit = {},
    onComputeProfile: (OnboardingResult, ResolvedPlace) -> Unit,
    onComplete: () -> Unit,
) {
    var step by remember { mutableIntStateOf(1) } // 1..6
    val selectedGoals = remember { mutableStateListOf<String>() }
    var name by remember { mutableStateOf(signedInUser?.name ?: "") }
    var timeCertainty by remember { mutableStateOf("exact") }
    var birthDate by remember { mutableStateOf("1998-09-07") }
    var birthTime by remember { mutableStateOf("23:20:34") }
    var selectedPlace by remember {
        mutableStateOf(
            offlineCities.firstOrNull()?.let { ResolvedPlace(it.name, it.lat, it.lon, it.tzId) }
                ?: ResolvedPlace("Jamshedpur", 22.8, 86.1667, "Asia/Kolkata"),
        )
    }
    var ayanamsa by remember { mutableStateOf("lahiri") }
    var showAyanamsaPicker by remember { mutableStateOf(false) }
    var showPlacePicker by remember { mutableStateOf(false) }
    var triadTappedCount by remember { mutableIntStateOf(0) }
    var testYear by remember { mutableStateOf<Int?>(null) }

    // Advance from Step 4 (Constellation Compute) to Step 5 once real bundle arrives
    LaunchedEffect(computedLevel1Json, step) {
        if (step == 4 && computedLevel1Json != null) {
            step = 5
        }
    }

    val natalSummary = remember(computedLevel1Json) {
        computedLevel1Json?.let { BundleMappers.extractNatalSummaryFull(it) }
            ?: com.kundliflow.app.data.mapper.NatalSummary("—", "—", "—", "—")
    }
    val lagnaSign = natalSummary.lagnaSign
    val moonSign = natalSummary.moonSign
    val moonNak = natalSummary.moonNakshatra
    val sunSign = natalSummary.sunSign
    val currentChapterSummary = remember(computedLevel1Json) {
        computedLevel1Json?.let { BundleMappers.lookupDashaForYear(it, LocalDate.now().year) }
            ?: "Current Chapter · Vimshottari Active"
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(KundliColors.BgInk)
            .statusBarsPadding()
            .navigationBarsPadding()
            .verticalScroll(rememberScrollState())
            .padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(18.dp),
    ) {
        LinearProgressIndicator(
            progress = { step / 6f },
            modifier = Modifier
                .fillMaxWidth()
                .height(4.dp)
                .clip(RoundedCornerShape(2.dp)),
            color = KundliColors.Gold,
            trackColor = KundliColors.Surface,
        )

        when (step) {
            1 -> {
                Text("KundliFlow", style = MaterialTheme.typography.displaySmall, color = KundliColors.Gold)
                Text(
                    "A calm personal almanac—calculated with classical Vedic precision, revealed one layer at a time.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = KundliColors.TextMain,
                )
                if (signedInUser != null) {
                    Surface(
                        color = KundliColors.SurfaceAlt,
                        border = BorderStroke(1.dp, KundliColors.Teal),
                        shape = RoundedCornerShape(14.dp),
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Text("Signed in for Cloud Sync", style = MaterialTheme.typography.labelMedium, color = KundliColors.Teal)
                            Text("${signedInUser.name} · ${signedInUser.email}", style = MaterialTheme.typography.bodySmall, color = KundliColors.TextMain)
                        }
                    }
                }
                Spacer(Modifier.height(12.dp))
                if (signedInUser == null) {
                    Button(
                        onClick = onSignInWithGoogle,
                        enabled = !authBusy,
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(containerColor = KundliColors.Gold, contentColor = KundliColors.OrbInk),
                    ) {
                        Text(if (authBusy) "Connecting to Google…" else "Continue with Google (Gmail)")
                    }
                    OutlinedButton(
                        onClick = { step = 2 },
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Text("Continue as Guest (Local-First)", color = KundliColors.Teal)
                    }
                } else {
                    Button(
                        onClick = {
                            if (name.isBlank()) name = signedInUser.name
                            step = 2
                        },
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(containerColor = KundliColors.Gold, contentColor = KundliColors.OrbInk),
                    ) {
                        Text("Continue as ${signedInUser.name}")
                    }
                }
                if (!authMessage.isNullOrBlank()) {
                    Text(authMessage, style = MaterialTheme.typography.bodySmall, color = KundliColors.Teal)
                }
            }

            2 -> {
                Text("What brings you here?", style = MaterialTheme.typography.headlineSmall, color = KundliColors.TextMain)
                Text("Pick up to 2 — this shapes your Discovery path.", style = MaterialTheme.typography.bodySmall, color = KundliColors.TextMuted)
                val goals = listOf(
                    "career" to "Career",
                    "relationships" to "Relationships",
                    "home_family" to "Home & family",
                    "money" to "Money",
                    "understanding_myself" to "Understanding myself",
                    "daily_rhythm" to "Daily rhythm",
                )
                FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    goals.forEach { (id, label) ->
                        val active = selectedGoals.contains(id)
                        FilterChip(
                            selected = active,
                            onClick = {
                                if (active) selectedGoals.remove(id)
                                else if (selectedGoals.size < 2) selectedGoals.add(id)
                            },
                            label = { Text(label) },
                        )
                    }
                }
                Button(
                    onClick = { step = 3 },
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = KundliColors.Gold, contentColor = KundliColors.OrbInk),
                ) {
                    Text("Next")
                }
            }

            3 -> {
                Text("Birth Details", style = MaterialTheme.typography.headlineSmall, color = KundliColors.TextMain)
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Name") },
                    placeholder = { Text("Priya") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                )
                Text("Time Certainty", style = MaterialTheme.typography.labelMedium, color = KundliColors.TextMuted)
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    listOf("exact" to "Exact", "approx" to "Approx ±15m", "unknown" to "Unknown (Moon)").forEach { (id, label) ->
                        FilterChip(selected = timeCertainty == id, onClick = { timeCertainty = id }, label = { Text(label) })
                    }
                }
                BirthDatePickerField(
                    birthDateIso = birthDate,
                    onDateSelected = { birthDate = it },
                )
                if (timeCertainty != "unknown") {
                    BirthTimePickerField(
                        birthTimeHms = birthTime,
                        allowSeconds = timeCertainty == "exact",
                        onTimeSelected = { birthTime = it },
                    )
                }

                // Google Places + GPS + Offline City Picker Trigger + Live Lat/Lon/TZ Pill
                Surface(
                    color = KundliColors.Surface,
                    border = BorderStroke(1.dp, KundliColors.GoldHairline),
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { showPlacePicker = true },
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Text("Birth City (Google Places / GPS)", style = MaterialTheme.typography.labelMedium, color = KundliColors.Gold)
                        Spacer(Modifier.height(4.dp))
                        Text(selectedPlace.name, style = MaterialTheme.typography.titleMedium, color = KundliColors.TextMain)
                        Text(
                            text = String.format(Locale.US, "%.2f°, %.2f° · %s", selectedPlace.lat, selectedPlace.lon, selectedPlace.tzId),
                            style = TelemetryNumberStyle,
                            color = KundliColors.Teal,
                        )
                    }
                }

                TextButton(onClick = { showAyanamsaPicker = !showAyanamsaPicker }) {
                    Text("Ayanamsa: ${ayanamsa.uppercase()} ▾", color = KundliColors.TextMuted)
                }
                if (showAyanamsaPicker) {
                    FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        listOf("lahiri", "kp_new", "kp_old", "raman", "yukteshwar").forEach { ay ->
                            FilterChip(selected = ayanamsa == ay, onClick = { ayanamsa = ay }, label = { Text(ay.uppercase()) })
                        }
                    }
                }

                Button(
                    onClick = {
                        step = 4
                        onComputeProfile(
                            OnboardingResult(
                                name = name.ifBlank { "Priya" },
                                timeCertainty = timeCertainty,
                                birthDate = birthDate,
                                birthTime = birthTime,
                                cityName = selectedPlace.name,
                                ayanamsa = ayanamsa,
                                goals = selectedGoals.toList(),
                            ),
                            selectedPlace,
                        )
                    },
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = KundliColors.Gold, contentColor = KundliColors.OrbInk),
                ) {
                    Text("Calculate Chart")
                }
            }

            4 -> {
                Text("Mapping Your Sky", style = MaterialTheme.typography.headlineSmall, color = KundliColors.Gold)
                if (computing) {
                    LinearProgressIndicator(
                        modifier = Modifier.fillMaxWidth().height(4.dp),
                        color = KundliColors.Teal,
                        trackColor = KundliColors.Surface,
                    )
                }
                listOf(
                    "Mapping Ascendant & Sidereal Degrees",
                    "Evaluating 537 Classical Rules",
                    "Aligning Vimshottari Dashas",
                ).forEach { label ->
                    Text(
                        text = if (computedLevel1Json != null) "✓ $label" else "✦ $label",
                        style = MaterialTheme.typography.bodyMedium,
                        color = if (computedLevel1Json != null) KundliColors.Teal else KundliColors.TextMuted,
                    )
                }
                if (computeError != null) {
                    Surface(
                        color = KundliColors.SurfaceAlt,
                        border = BorderStroke(1.dp, KundliColors.AlertCrimson),
                        shape = RoundedCornerShape(14.dp),
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Text(computeError, style = MaterialTheme.typography.bodySmall, color = KundliColors.AlertCrimson)
                            Button(onClick = { step = 3 }) { Text("Edit details & retry") }
                        }
                    }
                }
            }

            5 -> {
                Text("Your Cosmic Triad", style = MaterialTheme.typography.headlineSmall, color = KundliColors.TextMain)
                Text(
                    text = DiscoveryPathEngine.formatCombinatorialRarity(lagnaSign, sunSign, moonNak, timeCertainty),
                    style = MaterialTheme.typography.labelMedium,
                    color = KundliColors.Gold,
                )
                val triad = listOf(
                    if (timeCertainty == "unknown") "Moon Nakshatra · $moonNak" else "Rising · $lagnaSign",
                    "Moon · $moonSign ($moonNak)",
                    currentChapterSummary,
                )
                triad.forEachIndexed { idx, label ->
                    val revealed = triadTappedCount > idx
                    Surface(
                        color = if (revealed) KundliColors.SurfaceAlt else KundliColors.Surface,
                        border = BorderStroke(1.dp, if (revealed) KundliColors.Gold else KundliColors.SubtleDivider),
                        shape = RoundedCornerShape(16.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { if (!revealed) triadTappedCount = idx + 1 },
                    ) {
                        Row(
                            modifier = Modifier.padding(16.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Text(label, style = MaterialTheme.typography.titleMedium, color = KundliColors.TextMain)
                            Text(
                                text = if (revealed) "Lit ★" else "Tap to light",
                                style = MaterialTheme.typography.labelMedium,
                                color = if (revealed) KundliColors.Gold else KundliColors.Teal,
                            )
                        }
                    }
                }
                Button(
                    onClick = { step = 6 },
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = KundliColors.Gold, contentColor = KundliColors.OrbInk),
                ) {
                    Text("Continue (3 nodes lit)")
                }
            }

            else -> {
                Text("Test the math on a year you remember", style = MaterialTheme.typography.headlineSmall, color = KundliColors.TextMain)
                Text(
                    "Pick any past year to see which planetary chapter was active in your verified chart.",
                    style = MaterialTheme.typography.bodySmall,
                    color = KundliColors.TextMuted,
                )
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    listOf(2020, 2021, 2023, 2025).forEach { yr ->
                        FilterChip(selected = testYear == yr, onClick = { testYear = yr }, label = { Text("$yr") })
                    }
                }
                if (testYear != null) {
                    val dashaText = computedLevel1Json?.let { BundleMappers.lookupDashaForYear(it, testYear!!) }
                        ?: "$testYear: Active Vimshottari chapter computed from your birth star."
                    Surface(
                        color = KundliColors.SurfaceAlt,
                        shape = RoundedCornerShape(14.dp),
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Text(
                            text = dashaText,
                            style = MaterialTheme.typography.bodySmall,
                            color = KundliColors.Teal,
                            modifier = Modifier.padding(14.dp),
                        )
                    }
                }
                Button(
                    onClick = onComplete,
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = KundliColors.Gold, contentColor = KundliColors.OrbInk),
                ) {
                    Text("Enter Today")
                }
                TextButton(
                    onClick = onComplete,
                    modifier = Modifier.align(Alignment.CenterHorizontally),
                ) {
                    Text("Skip", color = KundliColors.TextMuted)
                }
            }
        }
    }

    if (showPlacePicker) {
        PlacePickerSheet(
            title = "Select Birth City",
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
