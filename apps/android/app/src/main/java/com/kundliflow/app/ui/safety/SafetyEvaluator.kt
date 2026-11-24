package com.kundliflow.app.ui.safety

import android.content.Context
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json

@Serializable
data class SafetyResources(
    val version: String,
    val policy: SafetyPolicy,
    val keywords: Map<String, List<String>>,
    val groundingScreen: GroundingScreenCopy,
    val helplines: List<HelplineCountry>,
)

@Serializable
data class SafetyPolicy(
    val evaluateOnDeviceOnly: Boolean = true,
    val neverPersistTriggerText: Boolean = true,
    val neverTransmitTriggerText: Boolean = true,
    val preemptsAllAstrologyUi: Boolean = true,
    val repeatedLowMoodThreshold: LowMoodThreshold = LowMoodThreshold(),
)

@Serializable
data class LowMoodThreshold(
    val moodValue: Int = 1,
    val count: Int = 2,
    val windowDays: Int = 3,
)

@Serializable
data class GroundingScreenCopy(
    val title: String,
    val acknowledgement: String,
    val steps: List<GroundingStep>,
)

@Serializable
data class GroundingStep(
    val id: String,
    val title: String,
    val detail: String,
)

@Serializable
data class HelplineCountry(
    val countryCode: String,
    val countryName: String,
    val services: List<HelplineService>,
)

@Serializable
data class HelplineService(
    val name: String,
    val number: String,
    val dialUri: String? = null,
    val webUri: String? = null,
)

sealed interface SafetyCheckResult {
    data object Clear : SafetyCheckResult
    data class Triggered(val reason: String) : SafetyCheckResult
}

object SafetyEvaluator {
    private val json = Json { ignoreUnknownKeys = true }

    fun loadFromAssets(context: Context): SafetyResources {
        val raw = context.assets.open("safety_resources.json").bufferedReader().use { it.readText() }
        return json.decodeFromString(SafetyResources.serializer(), raw)
    }

    /**
     * Evaluates distress strictly on-device BEFORE any Room write or network sync (§7.3).
     * Never persists or transmits the triggering text.
     */
    fun evaluate(
        noteText: String,
        newMood: Int?,
        recentMoodTimestamps: List<Pair<Int, Long>>,
        nowMillis: Long,
        resources: SafetyResources,
    ): SafetyCheckResult {
        val normalized = noteText.trim().lowercase()
        if (normalized.isNotEmpty()) {
            val allKeywords = resources.keywords.values.flatten()
            if (allKeywords.any { kw -> normalized.contains(kw.lowercase()) }) {
                return SafetyCheckResult.Triggered("keyword_match")
            }
        }

        val threshold = resources.policy.repeatedLowMoodThreshold
        if (newMood == threshold.moodValue) {
            val windowMs = threshold.windowDays * 24L * 60L * 60L * 1000L
            val priorLowCount = recentMoodTimestamps.count { (mood, ts) ->
                mood == threshold.moodValue && (nowMillis - ts) in 0..windowMs
            }
            if (priorLowCount + 1 >= threshold.count) {
                return SafetyCheckResult.Triggered("repeated_low_mood")
            }
        }

        return SafetyCheckResult.Clear
    }
}
