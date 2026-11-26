package com.kundliflow.app.ui.onboarding

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
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
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Lock
import androidx.compose.material.icons.rounded.VerifiedUser
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.style.TextAlign
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
        // Serene Brand Header & Celestial Progress Track (Stitch onboarding.png)
        Column(
            modifier = Modifier.fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Box(
                modifier = Modifier
                    .size(56.dp)
                    .clip(CircleShape)
                    .background(KundliColors.SurfaceRecessed)
                    .border(1.5.dp, KundliColors.Gold, CircleShape),
                contentAlignment = Alignment.Center,
            ) {
                Text("✦", style = MaterialTheme.typography.headlineSmall, color = KundliColors.Gold)
            }
            Text("KUNDLIFLOW", style = MaterialTheme.typography.headlineMedium, color = KundliColors.TextMain)
            Text(
                text = "A quiet Vedic almanac grounded in your exact sky",
                style = MaterialTheme.typography.bodySmall,
                color = KundliColors.TextMuted,
                textAlign = TextAlign.Center,
            )
            Spacer(Modifier.height(4.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
            ) {
                Text("STEP $step OF 6", style = MaterialTheme.typography.labelSmall, color = KundliColors.Gold)
                Text("Natal Horizon", style = MaterialTheme.typography.labelSmall, color = KundliColors.TextMuted)
            }
            LinearProgressIndicator(
                progress = { step / 6f },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(5.dp)
                    .clip(RoundedCornerShape(3.dp)),
                color = KundliColors.Gold,
                trackColor = KundliColors.Surface,
            )
        }

        when (step) {
            1 -> {
                Surface(
                    color = KundliColors.Surface,
                    border = BorderStroke(1.dp, KundliColors.GoldHairline),
                    shape = RoundedCornerShape(20.dp),
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Column(
                        modifier = Modifier.padding(18.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                    ) {
                        if (signedInUser != null) {
                            Surface(
                                color = KundliColors.SurfaceRecessed,
                                border = BorderStroke(1.dp, KundliColors.Teal.copy(alpha = 0.55f)),
                                shape = RoundedCornerShape(14.dp),
                                modifier = Modifier.fillMaxWidth(),
                            ) {
                                Column(modifier = Modifier.padding(14.dp)) {
                                    Text("● SIGNED IN FOR CLOUD SYNC", style = MaterialTheme.typography.labelSmall, color = KundliColors.Teal)
                                    Text("${signedInUser.name} · ${signedInUser.email}", style = MaterialTheme.typography.bodySmall, color = KundliColors.TextMain)
                                }
                            }
                            Button(
                                onClick = {
                                    if (name.isBlank()) name = signedInUser.name
                                    step = 2
                                },
                                shape = RoundedCornerShape(14.dp),
                                modifier = Modifier.fillMaxWidth().height(48.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = KundliColors.Gold, contentColor = KundliColors.OrbInk),
                            ) {
                                Text("Continue as ${signedInUser.name} →", style = MaterialTheme.typography.labelLarge)
                            }
                        } else {
                            Button(
                                onClick = onSignInWithGoogle,
                                enabled = !authBusy,
                                shape = RoundedCornerShape(14.dp),
                                modifier = Modifier.fillMaxWidth().height(48.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = KundliColors.SurfaceRecessed, contentColor = KundliColors.TextMain),
                                border = BorderStroke(1.dp, KundliColors.GoldHairline),
                            ) {
                                Text(if (authBusy) "Connecting to Google…" else "Continue with Google (Sync across devices)")
                            }
                            Text("or continue privately on this device", style = MaterialTheme.typography.labelSmall, color = KundliColors.TextMuted)
                            Button(
                                onClick = { step = 2 },
                                shape = RoundedCornerShape(14.dp),
                                modifier = Modifier.fillMaxWidth().height(48.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = KundliColors.Gold, contentColor = KundliColors.OrbInk),
                            ) {
                                Text("✦ Start Privately (Local-First) →", style = MaterialTheme.typography.labelLarge)
                            }
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(5.dp),
                            ) {
                                Icon(Icons.Rounded.Lock, contentDescription = null, tint = KundliColors.Teal, modifier = Modifier.size(13.dp))
                                Text("Encrypted local vault · No central account required", style = MaterialTheme.typography.labelSmall, color = KundliColors.Teal)
                            }
                        }
                        if (!authMessage.isNullOrBlank()) {
                            Text(authMessage, style = MaterialTheme.typography.bodySmall, color = KundliColors.Teal, textAlign = TextAlign.Center)
                        }
                    }
                }

                // Local-First Privacy Architecture Card (Stitch onboarding.png)
                Surface(
                    color = KundliColors.Surface,
                    border = BorderStroke(1.dp, KundliColors.SubtleDivider),
                    shape = RoundedCornerShape(18.dp),
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                        verticalAlignment = Alignment.Top,
                    ) {
                        Surface(
                            color = KundliColors.SurfaceRecessed,
                            border = BorderStroke(1.dp, KundliColors.Teal.copy(alpha = 0.35f)),
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier.size(36.dp),
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Icon(Icons.Rounded.VerifiedUser, contentDescription = null, tint = KundliColors.Teal, modifier = Modifier.size(18.dp))
                            }
                        }
                        Column(verticalArrangement = Arrangement.spacedBy(3.dp)) {
                            Text("Local-First Privacy Architecture", style = MaterialTheme.typography.titleSmall, color = KundliColors.Teal)
                            Text(
                                text = "Your birth coordinates and reflections remain strictly private on this device. Computed via Swiss Ephemeris Lahiri.",
                                style = MaterialTheme.typography.bodySmall,
                                color = KundliColors.TextMuted,
                            )
                        }
                    }
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
                Surface(
                    color = KundliColors.Surface,
                    border = BorderStroke(1.dp, KundliColors.GoldHairline),
                    shape = RoundedCornerShape(20.dp),
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Column(
                        modifier = Modifier.padding(18.dp),
                        verticalArrangement = Arrangement.spacedBy(14.dp),
                    ) {
                        Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                            Text("EXACT EPHEMERIS INPUTS", style = MaterialTheme.typography.labelSmall, color = KundliColors.TextMuted)
                            Text("YOUR BIRTH SKY", style = MaterialTheme.typography.headlineSmall, color = KundliColors.Gold)
                        }
                        OutlinedTextField(
                            value = name,
                            onValueChange = { name = it },
                            label = { Text("Full Name") },
                            placeholder = { Text("Priya Sharma") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true,
                        )
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                        ) {
                            Text("TIME CERTAINTY", style = MaterialTheme.typography.labelSmall, color = KundliColors.TextMuted)
                            Text("affects Lagna accuracy", style = MaterialTheme.typography.labelSmall, color = KundliColors.TextMuted)
                        }
                        // Unified 3-Segment Certainty Track (Stitch onboarding.png)
                        Surface(
                            color = KundliColors.SurfaceRecessed,
                            border = BorderStroke(1.dp, KundliColors.SubtleDivider),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.fillMaxWidth(),
                        ) {
                            Row(modifier = Modifier.padding(3.dp)) {
                                listOf("exact" to "● Exact", "approx" to "±15 mins", "unknown" to "Unknown").forEach { (id, label) ->
                                    val active = timeCertainty == id
                                    Surface(
                                        color = if (active) KundliColors.SurfaceAlt else Color.Transparent,
                                        border = if (active) BorderStroke(1.dp, KundliColors.GoldHairline) else null,
                                        shape = RoundedCornerShape(9.dp),
                                        modifier = Modifier
                                            .weight(1f)
                                            .clickable { timeCertainty = id },
                                    ) {
                                        Box(
                                            modifier = Modifier.padding(vertical = 8.dp),
                                            contentAlignment = Alignment.Center,
                                        ) {
                                            Text(
                                                text = label,
                                                style = MaterialTheme.typography.labelSmall,
                                                color = if (active) KundliColors.Gold else KundliColors.TextMuted,
                                                maxLines = 1,
                                            )
                                        }
                                    }
                                }
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

                        // Recessed Birth City Picker + Coordinates Bar
                        Surface(
                            color = KundliColors.SurfaceRecessed,
                            border = BorderStroke(1.dp, KundliColors.GoldHairline),
                            shape = RoundedCornerShape(14.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { showPlacePicker = true },
                        ) {
                            Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                                Text("BIRTH CITY (PLACES / GPS)", style = MaterialTheme.typography.labelSmall, color = KundliColors.Gold)
                                Text(selectedPlace.name, style = MaterialTheme.typography.titleMedium, color = KundliColors.TextMain)
                                Text(
                                    text = String.format(Locale.US, "%.2f° N, %.2f° E · %s · %s", selectedPlace.lat, selectedPlace.lon, selectedPlace.tzId, ayanamsa.uppercase()),
                                    style = MaterialTheme.typography.labelSmall,
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
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier.fillMaxWidth().height(50.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = KundliColors.Gold, contentColor = KundliColors.OrbInk),
                ) {
                    Text("✦ Reveal My Natal Sky →", style = MaterialTheme.typography.labelLarge)
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
