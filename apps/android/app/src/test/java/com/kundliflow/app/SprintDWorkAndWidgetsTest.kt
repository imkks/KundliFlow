package com.kundliflow.app

import com.kundliflow.app.ui.today.SkyBand
import com.kundliflow.app.work.KundliWorkScheduler
import com.kundliflow.app.work.NotificationCapPolicy
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import java.time.LocalDateTime

class SprintDWorkAndWidgetsTest {

    @Test
    fun `KundliWorkScheduler computes positive delay to next 05-30 or 17-30 window`() {
        val morning = LocalDateTime.of(2026, 11, 25, 4, 0)
        assertEquals(90L, KundliWorkScheduler.computeInitialDelayMinutes(morning, 5, 30))

        val afternoon = LocalDateTime.of(2026, 11, 25, 10, 0)
        // Next 12h slot after 05:30 is 17:30 -> 7h30m = 450 minutes
        assertEquals(450L, KundliWorkScheduler.computeInitialDelayMinutes(afternoon, 5, 30))
    }

    @Test
    fun `KundliWorkScheduler parses custom quiet hour strings cleanly`() {
        assertEquals(21, KundliWorkScheduler.parseHourOrDefault("21:00", 22))
        assertEquals(8, KundliWorkScheduler.parseHourOrDefault("08:00", 7))
        assertEquals(22, KundliWorkScheduler.parseHourOrDefault("invalid", 22))
    }

    @Test
    fun `NotificationCapPolicy respects custom quiet hours and daily cap 2`() {
        assertFalse(NotificationCapPolicy.canSendNotification(0, hourOfDay = 21, quietStartHour = 21, quietEndHour = 7))
        assertTrue(NotificationCapPolicy.canSendNotification(0, hourOfDay = 20, quietStartHour = 21, quietEndHour = 7))
        assertFalse(NotificationCapPolicy.canSendNotification(2, hourOfDay = 10, quietStartHour = 22, quietEndHour = 7))
        assertEquals(3, SkyBand.entries.size)
    }
}
