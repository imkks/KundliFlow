package com.kundliflow.app.ui.search

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.ExperimentalMaterial3Api
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
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.kundliflow.app.ui.subject.PlanetId
import com.kundliflow.app.ui.subject.Subject
import com.kundliflow.app.ui.subject.SubjectFindingKind
import com.kundliflow.app.ui.theme.KundliColors

data class SearchEntryItem(
    val id: String,
    val title: String,
    val category: String,
    val subject: Subject,
)

object SearchCatalog {
    val allEntries: List<SearchEntryItem> by lazy {
        val houses = (1..12).map { h ->
            SearchEntryItem("h_$h", "House $h", "Houses", Subject.House(h))
        }
        val planets = PlanetId.entries.map { p ->
            SearchEntryItem("p_${p.name}", "${p.displayName} (${p.sanskritName})", "Planets", Subject.Planet(p))
        }
        val topics = listOf("Career (H10/D10)", "Love & Marriage (H7/D9)", "Wealth (H2/D2)", "Home (H4)", "Year Ahead").map { t ->
            SearchEntryItem("t_$t", t, "Life Topics", Subject.Finding(t, SubjectFindingKind.PATTERN))
        }
        val glossary = listOf("Hora", "Chandra Bala", "Tara Bala", "Ashtakvarga SAV", "Bhanga", "Sade Sati", "KP System").map { g ->
            SearchEntryItem("g_$g", g, "Glossary & Systems", Subject.Finding(g, SubjectFindingKind.RULE))
        }
        topics + houses + planets + glossary
    }

    fun filter(query: String): List<SearchEntryItem> {
        val q = query.trim().lowercase()
        if (q.isEmpty()) return allEntries.take(12)
        return allEntries.filter {
            it.title.lowercase().contains(q) || it.category.lowercase().contains(q)
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SearchOverlaySheet(
    onSelectSubject: (Subject) -> Unit,
    onDismiss: () -> Unit,
) {
    var query by remember { mutableStateOf("") }
    val results = remember(query) { SearchCatalog.filter(query) }

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
                placeholder = { Text("Search Career, House 10, Moon, SAV…") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
            )
            LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                items(results, key = { it.id }) { item ->
                    Surface(
                        color = KundliColors.BgInk,
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onSelectSubject(item.subject) },
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Text(item.title, style = MaterialTheme.typography.titleMedium, color = KundliColors.TextMain)
                            Text(item.category, style = MaterialTheme.typography.labelMedium, color = KundliColors.Gold)
                        }
                    }
                }
            }
        }
    }
}
