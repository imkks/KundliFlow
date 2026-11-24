package com.kundliflow.app.ui.ask

import androidx.compose.runtime.Immutable
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive

@Immutable
data class AskUiMessage(
    val id: String,
    val role: String, // "user" | "assistant"
    val content: String,
    val responseType: String = "answer", // "answer" | "level2_fallback"
    val evidenceIds: List<String> = emptyList(),
    val followUps: List<String> = emptyList(),
    val traceSteps: List<String> = emptyList(),
    val createdAtMillis: Long,
    val contextTag: String? = null,
)

@Immutable
data class AskSessionSummary(
    val id: String,
    val contextTag: String,
    val synopsis: String,
    val timestampLabel: String,
    val anchorMessageId: String,
)

sealed interface AskSseEvent {
    data class Step(val label: String) : AskSseEvent
    data class Result(
        val answer: String,
        val responseType: String,
        val evidenceIds: List<String>,
        val followUps: List<String>,
    ) : AskSseEvent

    data class Error(val message: String) : AskSseEvent
}

object AskSseParser {
    private val json = Json { ignoreUnknownKeys = true }

    fun parseFrame(eventType: String, dataJson: String): AskSseEvent? = runCatching {
        val obj = json.parseToJsonElement(dataJson).jsonObject
        when (eventType.trim()) {
            "step", "trace" -> {
                val msg = obj["message"]?.jsonPrimitive?.content
                    ?: obj["label"]?.jsonPrimitive?.content
                    ?: obj["type"]?.jsonPrimitive?.content
                    ?: "Inspecting chart facts…"
                AskSseEvent.Step(msg)
            }
            "result" -> {
                val respObj = obj["response"]?.jsonObject ?: obj
                val answer = respObj["answer"]?.jsonPrimitive?.content ?: ""
                val responseType = respObj["responseType"]?.jsonPrimitive?.content ?: "answer"
                val evidence = obj["observedEvidenceIds"]?.jsonArray
                    ?.mapNotNull { runCatching { it.jsonPrimitive.content }.getOrNull() }
                    ?: emptyList()
                val followUps = respObj["followUps"]?.jsonArray
                    ?.mapNotNull { runCatching { it.jsonPrimitive.content }.getOrNull() }
                    ?.take(2)
                    ?: emptyList()
                AskSseEvent.Result(answer, responseType, evidence, followUps)
            }
            "error" -> {
                val msg = obj["error"]?.jsonPrimitive?.content ?: "Unable to complete request"
                AskSseEvent.Error(msg)
            }
            else -> null
        }
    }.getOrNull()
}

object AskSessionGrouper {
    private const val TWO_HOURS_MS = 2L * 60L * 60L * 1000L

    /**
     * Groups flat chronological messages from GET /api/conversations/:id into up to 2
     * collapsible "Recent Q&As" memory cards (§5.4).
     */
    fun groupIntoRecentSessions(
        messages: List<AskUiMessage>,
        gapMillis: Long = TWO_HOURS_MS,
    ): List<AskSessionSummary> {
        if (messages.isEmpty()) return emptyList()
        val sorted = messages.sortedBy { it.createdAtMillis }
        val sessions = mutableListOf<List<AskUiMessage>>()
        var current = mutableListOf<AskUiMessage>()

        for (msg in sorted) {
            val prev = current.lastOrNull()
            if (prev != null && (msg.createdAtMillis - prev.createdAtMillis > gapMillis)) {
                sessions.add(current)
                current = mutableListOf()
            }
            current.add(msg)
        }
        if (current.isNotEmpty()) sessions.add(current)

        return sessions
            .takeLast(2)
            .reversed()
            .mapIndexed { idx, group ->
                val firstUser = group.firstOrNull { it.role == "user" }
                val firstAssistant = group.firstOrNull { it.role == "assistant" }
                AskSessionSummary(
                    id = "sess_${group.first().id}",
                    contextTag = firstUser?.contextTag ?: "Chart Q&A ${idx + 1}",
                    synopsis = firstAssistant?.content?.take(72) ?: firstUser?.content?.take(72) ?: "",
                    timestampLabel = "Recent",
                    anchorMessageId = group.first().id,
                )
            }
    }
}
