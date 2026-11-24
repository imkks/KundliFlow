package com.kundliflow.app.ui.subject

import androidx.compose.runtime.Immutable

enum class PlanetId(val displayName: String, val sanskritName: String) {
    SUN("Sun", "Surya"),
    MOON("Moon", "Chandra"),
    MARS("Mars", "Mangal"),
    MERCURY("Mercury", "Budha"),
    JUPITER("Jupiter", "Guru"),
    VENUS("Venus", "Shukra"),
    SATURN("Saturn", "Shani"),
    RAHU("Rahu", "Rahu"),
    KETU("Ketu", "Ketu"),
}

enum class VargaType(val label: String, val domain: String) {
    D1("D1", "Birth Chart"),
    D2("D2", "Wealth"),
    D3("D3", "Courage & Siblings"),
    D4("D4", "Home & Assets"),
    D7("D7", "Children & Creativity"),
    D9("D9", "Marriage & Dharma"),
    D10("D10", "Career & Status"),
    D12("D12", "Parents & Lineage"),
    D16("D16", "Comforts"),
    D20("D20", "Spiritual Practice"),
    D24("D24", "Learning & Wisdom"),
    D27("D27", "Strengths"),
    D30("D30", "Resilience"),
    D40("D40", "Maternal Heritage"),
    D45("D45", "Paternal Heritage"),
    D60("D60", "Deep Past-Life Root"),
}

enum class SubjectFindingKind { RULE, YOGA, DOSHA, TRANSIT, PATTERN }

sealed interface Subject {
    data class Planet(val id: PlanetId) : Subject
    data class House(val number: Int) : Subject
    data class Period(val id: String) : Subject
    data class Finding(val id: String, val kind: SubjectFindingKind = SubjectFindingKind.RULE) : Subject
    data class DivisionalChart(val varga: VargaType) : Subject
}

enum class Rung { Glance, Peek, Explain, Evidence }

@Immutable
data class SubjectFact(
    val label: String,
    val value: String,
)

@Immutable
data class SubjectFindingItem(
    val id: String,
    val title: String,
    val plainMeaning: String,
    val whyDetail: String,
    val glossaryTerm: String? = null,
)

@Immutable
data class SubjectTelemetryRow(
    val label: String,
    val value: String,
)

@Immutable
data class SubjectReadingContent(
    val title: String,
    val subtitle: String,
    val activeHouseNumber: Int? = null,
    val peekSummary: String,
    val peekFacts: List<SubjectFact>,
    val findings: List<SubjectFindingItem>,
    val telemetryRows: List<SubjectTelemetryRow>,
    val disclaimer: String = "This is tradition and reflection, not a prediction.",
)

/**
 * Pure stack operations for Visited-Stack Predictive Back (§2 Rule 6)
 * and 3-tap Self-Adapting Detail Level (§2 Rule 5).
 */
object SubjectRungNavigator {
    fun pushRung(stack: List<Rung>, target: Rung): List<Rung> {
        if (stack.lastOrNull() == target) return stack
        return stack + target
    }

    fun popRung(stack: List<Rung>): List<Rung>? {
        if (stack.size <= 1) return null // Dismiss sheet cleanly
        return stack.dropLast(1)
    }

    fun shouldOfferFullDetailsPrompt(
        mathTapCount: Int,
        currentDetailLevel: String,
        promptAlreadyShown: Boolean,
    ): Boolean = mathTapCount >= 3 && currentDetailLevel != "full" && !promptAlreadyShown
}
