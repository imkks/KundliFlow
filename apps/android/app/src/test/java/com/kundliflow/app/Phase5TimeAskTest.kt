package com.kundliflow.app

import com.kundliflow.app.ui.ask.AskSessionGrouper
import com.kundliflow.app.ui.ask.AskSseEvent
import com.kundliflow.app.ui.ask.AskSseParser
import com.kundliflow.app.ui.ask.AskUiMessage
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class Phase5TimeAskTest {

    @Test
    fun `AskSseParser parses step, result with level2_fallback, and error frames`() {
        val step = AskSseParser.parseFrame("step", """{"message":"Reading 10th house rules"}""")
        assertTrue(step is AskSseEvent.Step)
        assertEquals("Reading 10th house rules", (step as AskSseEvent.Step).label)

        val resultJson = """
            {
              "observedEvidenceIds": ["rule.h10", "dasha.saturn"],
              "response": {
                "answer": "Career focus intensifies during Saturn Antardasha.",
                "responseType": "level2_fallback",
                "followUps": ["When does this shift?", "Which Hora helps?", "Ignored 3rd"]
              }
            }
        """.trimIndent()
        val result = AskSseParser.parseFrame("result", resultJson) as AskSseEvent.Result
        assertEquals("level2_fallback", result.responseType)
        assertEquals(listOf("rule.h10", "dasha.saturn"), result.evidenceIds)
        assertEquals(2, result.followUps.size)

        val err = AskSseParser.parseFrame("error", """{"error":"Rate limit"}""") as AskSseEvent.Error
        assertEquals("Rate limit", err.message)
    }

    @Test
    fun `AskSessionGrouper splits single-thread messages by 2h gap and caps at 2 recent sessions`() {
        val hr = 60L * 60L * 1000L
        val messages = listOf(
            AskUiMessage("1", "user", "Q1", createdAtMillis = 1 * hr, contextTag = "Topic A"),
            AskUiMessage("2", "assistant", "A1", createdAtMillis = 1 * hr + 1000L),
            AskUiMessage("3", "user", "Q2", createdAtMillis = 5 * hr, contextTag = "Topic B"),
            AskUiMessage("4", "assistant", "A2", createdAtMillis = 5 * hr + 1000L),
            AskUiMessage("5", "user", "Q3", createdAtMillis = 9 * hr, contextTag = "Topic C"),
            AskUiMessage("6", "assistant", "A3", createdAtMillis = 9 * hr + 1000L),
        )
        val grouped = AskSessionGrouper.groupIntoRecentSessions(messages)
        assertEquals(2, grouped.size)
        assertEquals("Topic C", grouped[0].contextTag)
        assertEquals("Topic B", grouped[1].contextTag)
    }
}
