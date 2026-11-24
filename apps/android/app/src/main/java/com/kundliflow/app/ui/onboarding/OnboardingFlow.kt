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
import com.kundliflow.app.ui.discovery.DiscoveryPathEngine
import com.kundliflow.app.ui.theme.KundliColors
import kotlinx.coroutines.delay

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
    onComplete: (OnboardingResult) -> Unit,
) {
    var step by remember { mutableIntStateOf(1) } // 1..6
    val selectedGoals = remember { mutableStateListOf<String>() }
    var name by remember { mutableStateOf("Priya") }
    var timeCertainty by remember { mutableStateOf("exact") }
    var birthDate by remember { mutableStateOf("1998-09-07") }
    var birthTime by remember { mutableStateOf("23:20:34") }
    var cityName by remember { mutableStateOf("Jamshedpur") }
    var ayanamsa by remember { mutableStateOf("lahiri") }
    var triadTappedCount by remember { mutableIntStateOf(0) }
    var testYear by remember { mutableStateOf<Int?>(null) }

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
                Spacer(Modifier.height(12.dp))
                Button(
                    onClick = { step = 2 },
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = KundliColors.Gold, contentColor = KundliColors.OrbInk),
                ) {
                    Text("Continue with Google")
                }
                OutlinedButton(
                    onClick = { step = 2 },
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Text("Local Dev Sign-In", color = KundliColors.TextMuted)
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
                OutlinedTextField(value = name, onValueChange = { name = it }, label = { Text("Name") }, modifier = Modifier.fillMaxWidth())
                Text("Time Certainty", style = MaterialTheme.typography.labelMedium, color = KundliColors.TextMuted)
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    listOf("exact" to "Exact", "approx" to "Approx ±15m", "unknown" to "Unknown (Moon)").forEach { (id, label) ->
                        FilterChip(selected = timeCertainty == id, onClick = { timeCertainty = id }, label = { Text(label) })
                    }
                }
                OutlinedTextField(value = birthDate, onValueChange = { birthDate = it }, label = { Text("Birth Date (YYYY-MM-DD)") }, modifier = Modifier.fillMaxWidth())
                if (timeCertainty != "unknown") {
                    OutlinedTextField(value = birthTime, onValueChange = { birthTime = it }, label = { Text("Birth Time (HH:MM:SS)") }, modifier = Modifier.fillMaxWidth())
                }
                OutlinedTextField(value = cityName, onValueChange = { cityName = it }, label = { Text("Birth City") }, modifier = Modifier.fillMaxWidth())
                Button(
                    onClick = { step = 4 },
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = KundliColors.Gold, contentColor = KundliColors.OrbInk),
                ) {
                    Text("Calculate Chart")
                }
            }

            4 -> {
                var computeStage by remember { mutableIntStateOf(0) }
                LaunchedEffect(Unit) {
                    delay(450L); computeStage = 1
                    delay(450L); computeStage = 2
                    delay(450L); step = 5
                }
                Text("Mapping Your Sky", style = MaterialTheme.typography.headlineSmall, color = KundliColors.Gold)
                listOf(
                    "Mapping Ascendant & Sidereal Degrees",
                    "Evaluating 537 Classical Rules",
                    "Aligning Vimshottari Dashas",
                ).forEachIndexed { idx, label ->
                    Text(
                        text = if (computeStage >= idx) "✓ $label" else "… $label",
                        style = MaterialTheme.typography.bodyMedium,
                        color = if (computeStage >= idx) KundliColors.Teal else KundliColors.TextMuted,
                    )
                }
            }

            5 -> {
                Text("Your Cosmic Triad", style = MaterialTheme.typography.headlineSmall, color = KundliColors.TextMain)
                Text(
                    text = DiscoveryPathEngine.formatCombinatorialRarity("Taurus", "Leo", "Revati", timeCertainty),
                    style = MaterialTheme.typography.labelMedium,
                    color = KundliColors.Gold,
                )
                val triad = listOf(
                    if (timeCertainty == "unknown") "Moon Nakshatra · Revati" else "Rising · Taurus",
                    "Moon · Pisces",
                    "Current Chapter · Venus–Saturn",
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
                    "Pick any past year to see which planetary chapter and house were active.",
                    style = MaterialTheme.typography.bodySmall,
                    color = KundliColors.TextMuted,
                )
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    listOf(2020, 2021, 2023, 2025).forEach { yr ->
                        FilterChip(selected = testYear == yr, onClick = { testYear = yr }, label = { Text("$yr") })
                    }
                }
                if (testYear != null) {
                    Surface(
                        color = KundliColors.SurfaceAlt,
                        shape = RoundedCornerShape(14.dp),
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Text(
                            text = "$testYear: Venus–Saturn Antardasha · activated your 10th house (Career) & 4th house (Home).",
                            style = MaterialTheme.typography.bodySmall,
                            color = KundliColors.Teal,
                            modifier = Modifier.padding(14.dp),
                        )
                    }
                }
                Button(
                    onClick = {
                        onComplete(
                            OnboardingResult(
                                name = name,
                                timeCertainty = timeCertainty,
                                birthDate = birthDate,
                                birthTime = birthTime,
                                cityName = cityName,
                                ayanamsa = ayanamsa,
                                goals = selectedGoals.toList(),
                            ),
                        )
                    },
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = KundliColors.Gold, contentColor = KundliColors.OrbInk),
                ) {
                    Text("Enter Today")
                }
                TextButton(
                    onClick = {
                        onComplete(
                            OnboardingResult(
                                name = name,
                                timeCertainty = timeCertainty,
                                birthDate = birthDate,
                                birthTime = birthTime,
                                cityName = cityName,
                                ayanamsa = ayanamsa,
                                goals = selectedGoals.toList(),
                            ),
                        )
                    },
                    modifier = Modifier.align(Alignment.CenterHorizontally),
                ) {
                    Text("Skip", color = KundliColors.TextMuted)
                }
            }
        }
    }
}
