package com.kundliflow.app

import com.kundliflow.app.ui.subject.PlanetId
import com.kundliflow.app.ui.subject.Rung
import com.kundliflow.app.ui.subject.Subject
import com.kundliflow.app.ui.subject.SubjectFindingKind
import com.kundliflow.app.ui.subject.SubjectRungNavigator
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class SubjectRungNavigatorTest {

    @Test
    fun `visited-stack back pops Peek to Explain to Evidence cleanly`() {
        var stack = listOf(Rung.Peek)
        stack = SubjectRungNavigator.pushRung(stack, Rung.Explain)
        stack = SubjectRungNavigator.pushRung(stack, Rung.Evidence)
        assertEquals(listOf(Rung.Peek, Rung.Explain, Rung.Evidence), stack)

        stack = SubjectRungNavigator.popRung(stack)!!
        assertEquals(listOf(Rung.Peek, Rung.Explain), stack)

        stack = SubjectRungNavigator.popRung(stack)!!
        assertEquals(listOf(Rung.Peek), stack)

        assertNull(SubjectRungNavigator.popRung(stack))
    }

    @Test
    fun `direct jump to Explain dismisses directly without unseen Peek`() {
        val stack = listOf(Rung.Explain)
        assertNull(SubjectRungNavigator.popRung(stack))
    }

    @Test
    fun `pushing active rung is idempotent`() {
        val stack = SubjectRungNavigator.pushRung(listOf(Rung.Peek), Rung.Peek)
        assertEquals(listOf(Rung.Peek), stack)
    }

    @Test
    fun `3-tap Show the math triggers Always show details prompt once`() {
        assertFalse(SubjectRungNavigator.shouldOfferFullDetailsPrompt(2, "balanced", false))
        assertTrue(SubjectRungNavigator.shouldOfferFullDetailsPrompt(3, "balanced", false))
        assertFalse(SubjectRungNavigator.shouldOfferFullDetailsPrompt(3, "full", false))
        assertFalse(SubjectRungNavigator.shouldOfferFullDetailsPrompt(4, "balanced", true))
    }

    @Test
    fun `single subject identity equality holds across entry points`() {
        assertEquals(Subject.Planet(PlanetId.MOON), Subject.Planet(PlanetId.MOON))
        assertEquals(Subject.House(10), Subject.House(10))
        assertEquals(
            Subject.Finding("rule.h10", SubjectFindingKind.YOGA),
            Subject.Finding("rule.h10", SubjectFindingKind.YOGA),
        )
    }
}
