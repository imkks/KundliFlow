package com.kundliflow.app.ui.discovery

import android.content.Context
import androidx.compose.runtime.Immutable
import com.kundliflow.app.ui.today.TodayDynamicSlot
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json

@Serializable
data class DiscoveryCatalog(
    val version: String,
    val totalNodes: Int,
    val moonOnlyTotalNodes: Int,
    val rings: List<DiscoveryRingMeta>,
    val nodes: List<DiscoveryNodeSpec>,
)

@Serializable
data class DiscoveryRingMeta(
    val id: String,
    val label: String,
    val order: Int,
    val nodeCount: Int,
)

@Serializable
data class DiscoverySubjectRef(
    val type: String,
    val id: String? = null,
    val number: Int? = null,
    val kind: String? = null,
    val varga: String? = null,
)

@Serializable
data class DiscoveryStorySpec(
    val hookTemplate: String,
    val revealBinding: String,
    val reflectPrompt: String,
)

@Serializable
data class DiscoveryNodeSpec(
    val id: String,
    val ring: String,
    val defaultOrder: Int,
    val title: String,
    val subtitle: String,
    val moonOnlyEligible: Boolean,
    val onboardingTriad: Boolean,
    val subject: DiscoverySubjectRef,
    val goalWeights: Map<String, Int> = emptyMap(),
    val story: DiscoveryStorySpec,
)

@Immutable
data class DiscoveryNodeProgress(
    val spec: DiscoveryNodeSpec,
    val lit: Boolean,
    val rarityNote: String? = null,
)

object DiscoveryPathEngine {
    private val json = Json { ignoreUnknownKeys = true }

    fun loadCatalogFromAssets(context: Context): DiscoveryCatalog {
        val raw = context.assets.open("discovery_nodes.json").bufferedReader().use { it.readText() }
        return json.decodeFromString(DiscoveryCatalog.serializer(), raw)
    }

    /**
     * Filters to 11 Moon-only nodes when timeCertainty == "unknown" (otherwise all 24),
     * keeping Onboarding Triad first and sorting remaining nodes by goal weights.
     */
    fun orderNodes(
        nodes: List<DiscoveryNodeSpec>,
        timeCertainty: String,
        selectedGoals: List<String>,
    ): List<DiscoveryNodeSpec> {
        val eligible = if (timeCertainty == "unknown") {
            nodes.filter { it.moonOnlyEligible }
        } else {
            nodes
        }
        val triad = eligible.filter { it.onboardingTriad }.sortedBy { it.defaultOrder }
        val remaining = eligible.filterNot { it.onboardingTriad }.sortedWith(
            compareByDescending<DiscoveryNodeSpec> { node ->
                selectedGoals.sumOf { goal -> node.goalWeights[goal] ?: 0 }
            }.thenBy { it.defaultOrder },
        )
        return triad + remaining
    }

    fun formatCombinatorialRarity(
        ascendantSign: String,
        sunSign: String,
        moonNakshatra: String,
        timeCertainty: String,
    ): String {
        val anchorSign = if (timeCertainty == "unknown") "$sunSign Sun" else "$ascendantSign rising"
        return "$anchorSign with $moonNakshatra Moon — a 1-in-324 sky signature"
    }

    fun isMapComplete(
        orderedNodes: List<DiscoveryNodeSpec>,
        litNodeIds: Set<String>,
    ): Boolean = orderedNodes.isNotEmpty() && orderedNodes.all { litNodeIds.contains(it.id) }

    fun nextUnlitNode(
        orderedNodes: List<DiscoveryNodeSpec>,
        litNodeIds: Set<String>,
    ): DiscoveryNodeSpec? = orderedNodes.firstOrNull { !litNodeIds.contains(it.id) }

    fun nextActTwoCycle(
        dayIndex: Int,
        moonNakshatra: String,
        topPatternHeadline: String?,
    ): TodayDynamicSlot.ActTwoCycle {
        val cycles = listOf(
            TodayDynamicSlot.ActTwoCycle(
                cycleKind = "Lunar Return",
                title = "Moon approaches $moonNakshatra",
                body = "Every 27.3 days the Moon returns to your birth star—a quiet reset for your inner baseline.",
            ),
            TodayDynamicSlot.ActTwoCycle(
                cycleKind = "Personal Signal",
                title = "Your Rhythm Spotlight",
                body = topPatternHeadline ?: "Your check-ins are revealing which Hora rulers feel clearest for you.",
            ),
            TodayDynamicSlot.ActTwoCycle(
                cycleKind = "Pratyantar Shift",
                title = "Sub-chapter pulse",
                body = "Shorter Pratyantar chapters tune how your Mahadasha expresses week to week.",
            ),
            TodayDynamicSlot.ActTwoCycle(
                cycleKind = "Varshaphal",
                title = "Annual Solar Return",
                body = "Your yearly Tajika chart maps the themes of your current solar year.",
            ),
        )
        return cycles[dayIndex % cycles.size]
    }
}
