package com.kundliflow.app.ui.search

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.kundliflow.app.ui.chart.ChartUiState
import com.kundliflow.app.ui.subject.PlanetId
import com.kundliflow.app.ui.subject.Subject
import com.kundliflow.app.ui.subject.SubjectFindingKind
import com.kundliflow.app.ui.theme.KundliColors

data class SearchEntryItem(
    val id: String,
    val title: String,
    val subtitle: String,
    val category: String,
    val subject: Subject,
)

data class GlossaryEntry(
    val id: String,
    val term: String,
    val category: String,
    val plainSummary: String,
    val deeperNote: String,
)

object SearchCatalog {

    private val HOUSE_THEMES = mapOf(
        1 to "Self, vitality & presence",
        2 to "Resources, voice & values",
        3 to "Initiative, craft & siblings",
        4 to "Home, roots & emotional peace",
        5 to "Creativity, learning & joy",
        6 to "Routine, service & problem-solving",
        7 to "Partnerships & commitments",
        8 to "Depth, research & renewal",
        9 to "Purpose, mentors & long horizons",
        10 to "Career, public craft & duty",
        11 to "Gains, alliances & aspirations",
        12 to "Rest, solitude & letting go",
    )

    // 7 classical Glossary categories (§7.1)
    val glossaryEntries: List<GlossaryEntry> = listOf(
        // 1. Core Chart
        GlossaryEntry("glossary.lagna", "Lagna (Ascendant)", "Core Chart", "The zodiac sign rising on the eastern horizon at your birth moment — sets all 12 houses.", "Even a 10–15 minute shift can change degrees or house cusps near sign borders."),
        GlossaryEntry("glossary.rashi", "Rashi (Moon Sign)", "Core Chart", "The sidereal zodiac sign occupied by the Moon at birth — governs inner mood and transit sensitivity.", "Traditional Panchang and Chandra Bala are always measured from your natal Rashi."),
        GlossaryEntry("glossary.nakshatra", "Nakshatra (Birth Star)", "Core Chart", "One of 27 lunar mansions (13°20' each) that fine-tunes personality tone and starts your Vimshottari Dasha.", "Your Moon's Nakshatra lord determines the opening planetary chapter of your life."),
        // 2. Houses & Drishti
        GlossaryEntry("glossary.bhava", "Bhava (House)", "Houses & Aspects", "One of 12 fields of life — each steered by the planet ruling the sign inside that house.", "Empty houses are still active; inspect where their ruling planet sits."),
        GlossaryEntry("glossary.drishti", "Graha Drishti (Aspect)", "Houses & Aspects", "Full planetary gaze: every planet aspects the 7th house from itself; Mars adds 4/8, Jupiter 5/9, Saturn 3/10.", "Long-press any house on the Chart canvas to visualize exact Parashari Drishti arcs."),
        GlossaryEntry("glossary.vargottama", "Vargottama", "Houses & Aspects", "A planet occupying the exact same zodiac sign in both D1 (Birth) and D9 (Navamsha).", "Roughly 1 in 9 placements (~11%) — classically gives clear, steady expression."),
        // 3. Daily Scoring
        GlossaryEntry("glossary.hora", "Hora (Planetary Hour)", "Daily Rhythm", "Sunrise-calibrated planetary hour cycling in Chaldean order across the 24-hour day.", "KundliFlow aligns your Hora ruler with its natal house so the timing cue is personal."),
        GlossaryEntry("glossary.chandra_bala", "Chandra Bala", "Daily Rhythm", "Support measured by how many signs today's transiting Moon sits from your natal Moon.", "Houses 1, 3, 6, 7, 10, 11 from natal Moon are classically supportive; 4, 8, 12 invite gentler pacing."),
        GlossaryEntry("glossary.tara_bala", "Tara Bala", "Daily Rhythm", "9-fold star rhythm comparing today's Moon Nakshatra to your birth Nakshatra.", "Sampat, Kshema, Sadhaka, Mitra, and Parama Mitra Taras favor momentum."),
        GlossaryEntry("glossary.rahu_kalam", "Rahu Kalam", "Daily Rhythm", "A daily ~90-minute sunrise-derived window traditionally reserved for review rather than new starts.", "Shown calmly inside Today's wave and Rung 3 details."),
        // 4. Timing & Dashas
        GlossaryEntry("glossary.vimshottari", "Vimshottari Dasha", "Timing & Chapters", "120-year classical planetary chapter cycle seeded by your Moon's exact Nakshatra degree.", "Nested into Mahadasha (major), Antardasha (sub-chapter), and Pratyantar (fine rhythm)."),
        GlossaryEntry("glossary.yogini", "Yogini Dasha", "Timing & Chapters", "A brisk 36-year complementary Dasha system used alongside Vimshottari for cross-checking.", "Switch to Yogini in the Time tab to compare themes."),
        GlossaryEntry("glossary.chara", "Chara Dasha (Jaimini)", "Timing & Chapters", "Sign-based Jaimini timing system whose chapter lengths depend on each sign lord's distance.", "Useful for confirming house shifts alongside planet-based Vimshottari."),
        GlossaryEntry("glossary.sade_sati", "Sade Sati", "Timing & Chapters", "Saturn's ~7.5-year transit across the 12th, 1st, and 2nd signs from your natal Moon.", "Frames seasons of maturity, patience, and simplification — never a doom sentence."),
        // 5. Strengths & Vargas
        GlossaryEntry("glossary.sav", "Ashtakvarga SAV", "Strengths & Vargas", "337-point Sarvashtakvarga bindu map scoring each sign's structural transit support (28 = average).", "Signs with 30+ bindus buffer transits warmly; lower bindu signs reward deliberate pacing."),
        GlossaryEntry("glossary.shadbala", "Shadbala", "Strengths & Vargas", "Six-fold planetary strength ratio (positional, directional, temporal, motional, natural, aspectual).", "A ratio >= 1.00x indicates the planet meets its classical Parashari threshold."),
        GlossaryEntry("glossary.navamsha", "Navamsha (D9)", "Strengths & Vargas", "The 9th harmonic divisional chart showing inner resilience, partnerships, and second-half maturity.", "Switch to D9 from the Chart tab's Varga chip to inspect every planet's inner dignity."),
        // 6. Yogas & Audits
        GlossaryEntry("glossary.yoga", "Classical Yoga", "Yogas & Audits", "Specific planetary combinations (like Gajakesari or Budhaditya) that spotlight natural strengths.", "All active Yogas in your chart appear in the Chart tab's Yogas sheet."),
        GlossaryEntry("glossary.bhanga", "Dosha Bhanga (Cancellation)", "Yogas & Audits", "Classical rules that soften or cancel apparent doshas when mitigating placements exist.", "KundliFlow audits cancellation factors first before ever flagging a dosha."),
        // 7. Specialist Systems
        GlossaryEntry("glossary.kp", "KP System (Krishnamurti Paddhati)", "Specialist Systems", "Sub-lord astrology dividing each Nakshatra into 9 unequal Vimshottari sub-divisions for cusp precision.", "Explore Star-Lords, Sub-Lords, and 4-Tier Significators in Tools Studio → KP."),
        GlossaryEntry("glossary.varshaphal", "Tajika Varshaphal", "Specialist Systems", "Solar-return annual chart cast when the Sun returns to its exact birth degree, with Muntha & 36 Sahams.", "Inspect any birthday year in Tools Studio → Annual."),
        GlossaryEntry("glossary.ayanamsa", "Ayanamsa (Sidereal Offset)", "Specialist Systems", "Precession offset separating sidereal Vedic longitudes from tropical coordinates (~24° Lahiri).", "You can choose Lahiri, KP New, KP Old, Raman, or Yukteshwar per profile."),
    )

    fun glossaryById(id: String): GlossaryEntry? =
        glossaryEntries.firstOrNull { it.id == id }

    fun buildPersonalizedEntries(chart: ChartUiState?): List<SearchEntryItem> {
        val topics = listOf(
            SearchEntryItem("t_career", "Career & Public Work", chart?.houses?.getOrNull(9)?.let { "House 10 · ${it.signName} · Lord ${it.lord.displayName}" } ?: "House 10 & D10 Dashamsha", "Life Topics", Subject.House(10)),
            SearchEntryItem("t_love", "Love & Partnerships", chart?.houses?.getOrNull(6)?.let { "House 7 · ${it.signName} · Lord ${it.lord.displayName}" } ?: "House 7 & D9 Navamsha", "Life Topics", Subject.House(7)),
            SearchEntryItem("t_wealth", "Money & Resources", chart?.houses?.getOrNull(1)?.let { "House 2 · ${it.signName} · Lord ${it.lord.displayName}" } ?: "House 2 & D2 Hora", "Life Topics", Subject.House(2)),
            SearchEntryItem("t_home", "Home & Inner Peace", chart?.houses?.getOrNull(3)?.let { "House 4 · ${it.signName} · Lord ${it.lord.displayName}" } ?: "House 4 · Emotional roots", "Life Topics", Subject.House(4)),
            SearchEntryItem("t_year", "Current Chapter & Year Ahead", "Active Vimshottari Mahadasha & Antardasha", "Life Topics", Subject.Period("current")),
        )

        val houses = (1..12).map { h ->
            val hd = chart?.houses?.firstOrNull { it.number == h }
            val title = if (hd != null) {
                "House $h · ${hd.signName} · Lord ${hd.lord.displayName}"
            } else {
                "House $h"
            }
            val occupants = hd?.planets?.joinToString(", ") { it.id.displayName }.orEmpty()
            val theme = HOUSE_THEMES[h] ?: ""
            val subtitle = buildString {
                append(theme)
                if (hd != null) {
                    append(" · ${hd.savBindus} SAV")
                    if (occupants.isNotBlank()) append(" · $occupants")
                }
            }
            SearchEntryItem("h_$h", title, subtitle, "Houses", Subject.House(h))
        }

        val planetPlacements = chart?.allPlanets()?.associateBy { it.id }.orEmpty()
        val planets = PlanetId.entries.map { p ->
            val pl = planetPlacements[p]
            val title = if (pl != null) {
                "${p.displayName} (${p.sanskritName}) · ${pl.signName}"
            } else {
                "${p.displayName} (${p.sanskritName})"
            }
            val subtitle = if (pl != null) {
                "House ${pl.house} · ${pl.degreeFormatted} · ${pl.dignity}" + if (pl.vargottama) " · Vargottama" else ""
            } else {
                "Natal planet reading"
            }
            SearchEntryItem("p_${p.name}", title, subtitle, "Planets", Subject.Planet(p))
        }

        val glossary = glossaryEntries.map { g ->
            SearchEntryItem(
                id = g.id,
                title = g.term,
                subtitle = g.plainSummary,
                category = "Glossary · ${g.category}",
                subject = Subject.Finding(g.id, SubjectFindingKind.RULE),
            )
        }

        return topics + houses + planets + glossary
    }

    val allEntries: List<SearchEntryItem> by lazy { buildPersonalizedEntries(null) }

    fun filter(query: String, chart: ChartUiState? = null, categoryFilter: String = "All"): List<SearchEntryItem> {
        val entries = if (chart != null) buildPersonalizedEntries(chart) else allEntries
        val byCat = when (categoryFilter) {
            "All" -> entries
            "Glossary" -> entries.filter { it.category.startsWith("Glossary") }
            else -> entries.filter { it.category == categoryFilter }
        }
        val q = query.trim().lowercase()
        if (q.isEmpty()) return byCat.take(24)
        return byCat.filter {
            it.title.lowercase().contains(q) ||
                it.subtitle.lowercase().contains(q) ||
                it.category.lowercase().contains(q)
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SearchOverlaySheet(
    chart: ChartUiState? = null,
    onSelectSubject: (Subject) -> Unit,
    onDismiss: () -> Unit,
) {
    var query by remember { mutableStateOf("") }
    var selectedCategory by remember { mutableStateOf("All") }
    val results = remember(query, chart, selectedCategory) {
        SearchCatalog.filter(query, chart, selectedCategory)
    }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = KundliColors.Surface,
        contentColor = KundliColors.TextMain,
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .navigationBarsPadding()
                .padding(horizontal = 20.dp, vertical = 12.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Text("Search Chart & Glossary", style = MaterialTheme.typography.headlineSmall)
            OutlinedTextField(
                value = query,
                onValueChange = { query = it },
                placeholder = { Text("Search Career, House 10, Moon, Hora, SAV…") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
            )
            LazyRow(
                horizontalArrangement = Arrangement.spacedBy(6.dp),
                contentPadding = PaddingValues(end = 6.dp),
            ) {
                items(listOf("All", "Life Topics", "Houses", "Planets", "Glossary")) { cat ->
                    FilterChip(
                        selected = selectedCategory == cat,
                        onClick = { selectedCategory = cat },
                        label = { Text(cat) },
                    )
                }
            }
            LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                items(results, key = { it.id }) { item ->
                    Surface(
                        color = KundliColors.BgInk,
                        border = BorderStroke(1.dp, KundliColors.SubtleDivider),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onSelectSubject(item.subject) },
                    ) {
                        Column(
                            modifier = Modifier.padding(12.dp),
                            verticalArrangement = Arrangement.spacedBy(3.dp),
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically,
                            ) {
                                Text(
                                    text = item.title,
                                    style = MaterialTheme.typography.titleMedium,
                                    color = KundliColors.TextMain,
                                    modifier = Modifier.weight(1f),
                                )
                            }
                            Text(
                                text = item.subtitle,
                                style = MaterialTheme.typography.bodySmall,
                                color = KundliColors.TextMuted,
                            )
                            Text(
                                text = item.category,
                                style = MaterialTheme.typography.labelMedium,
                                color = KundliColors.Gold,
                            )
                        }
                    }
                }
            }
        }
    }
}
