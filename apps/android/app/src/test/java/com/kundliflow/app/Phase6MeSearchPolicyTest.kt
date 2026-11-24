package com.kundliflow.app

import com.kundliflow.app.ui.search.SearchCatalog
import com.kundliflow.app.work.NotificationCapPolicy
import com.kundliflow.app.work.TwoDayPrefetchCoordinator
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class Phase6MeSearchPolicyTest {

    @Test
    fun `NotificationCapPolicy enforces hard cap 2 per day and 22-07 quiet hours`() {
        assertTrue(NotificationCapPolicy.canSendNotification(0, 8))
        assertTrue(NotificationCapPolicy.canSendNotification(1, 18))
        assertFalse(NotificationCapPolicy.canSendNotification(2, 12))
        assertFalse(NotificationCapPolicy.canSendNotification(0, 23))
        assertFalse(NotificationCapPolicy.canSendNotification(0, 5))
        assertTrue(NotificationCapPolicy.canSendNotification(0, 7))
    }

    @Test
    fun `SearchCatalog filters houses, planets, topics, and glossary cleanly`() {
        assertTrue(SearchCatalog.filter("Saturn").any { it.title.contains("Saturn") })
        assertTrue(SearchCatalog.filter("House 10").any { it.title == "House 10" })
        assertTrue(SearchCatalog.filter("Bhanga").any { it.category == "Glossary & Systems" })
    }

    @Test
    fun `TwoDayPrefetchCoordinator generates today and tomorrow cache keys`() {
        val (todayKey, tomorrowKey) = TwoDayPrefetchCoordinator.buildTodayAndTomorrowKeys(
            profileId = "priya_1",
            todayIso = "2026-11-24",
            tzId = "Asia/Kolkata",
            latBucket = 12.97,
            lonBucket = 77.59,
        )
        assertEquals("priya_1|2026-11-24|Asia/Kolkata|12.97|77.59", todayKey)
        assertEquals("priya_1|2026-11-25|Asia/Kolkata|12.97|77.59", tomorrowKey)
    }
}
