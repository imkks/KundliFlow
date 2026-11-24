package com.kundliflow.app

import com.kundliflow.app.ui.discovery.DiscoveryNodeSpec
import com.kundliflow.app.ui.discovery.DiscoveryPathEngine
import com.kundliflow.app.ui.discovery.DiscoveryStorySpec
import com.kundliflow.app.ui.discovery.DiscoverySubjectRef
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class Phase4DiscoveryTest {

    private fun sampleNodes(): List<DiscoveryNodeSpec> {
        val story = DiscoveryStorySpec("Hook", "Reveal", "Reflect")
        return listOf(
            DiscoveryNodeSpec("core.rising_sign", "core", 1, "Rising", "Lagna", moonOnlyEligible = false, onboardingTriad = true, subject = DiscoverySubjectRef("House", number = 1), story = story),
            DiscoveryNodeSpec("core.moon_sign", "core", 2, "Moon", "Rashi", moonOnlyEligible = true, onboardingTriad = true, subject = DiscoverySubjectRef("Planet", id = "moon"), story = story),
            DiscoveryNodeSpec("house.10", "houses", 14, "Career", "H10", moonOnlyEligible = false, onboardingTriad = false, subject = DiscoverySubjectRef("House", number = 10), goalWeights = mapOf("career" to 10), story = story),
            DiscoveryNodeSpec("timing.sade_sati", "timing", 20, "Sade Sati", "Saturn", moonOnlyEligible = true, onboardingTriad = false, subject = DiscoverySubjectRef("Finding", id = "sade"), goalWeights = mapOf("career" to 2), story = story),
        )
    }

    @Test
    fun `unknown birth time filters strictly to moonOnlyEligible nodes`() {
        val ordered = DiscoveryPathEngine.orderNodes(sampleNodes(), "unknown", listOf("career"))
        assertEquals(2, ordered.size)
        assertTrue(ordered.all { it.moonOnlyEligible })
    }

    @Test
    fun `goal weights promote house 10 immediately after triad for career goal`() {
        val ordered = DiscoveryPathEngine.orderNodes(sampleNodes(), "exact", listOf("career"))
        assertEquals("core.rising_sign", ordered[0].id)
        assertEquals("core.moon_sign", ordered[1].id)
        assertEquals("house.10", ordered[2].id)
    }

    @Test
    fun `formatCombinatorialRarity produces verifiable 1-in-324 signature`() {
        val exact = DiscoveryPathEngine.formatCombinatorialRarity("Taurus", "Leo", "Revati", "exact")
        assertTrue(exact.contains("Taurus rising"))
        assertTrue(exact.contains("1-in-324"))

        val unknown = DiscoveryPathEngine.formatCombinatorialRarity("Taurus", "Leo", "Revati", "unknown")
        assertTrue(unknown.contains("Leo Sun"))
        assertTrue(unknown.contains("1-in-324"))
    }

    @Test
    fun `Act II activates only once all ordered nodes are lit`() {
        val nodes = sampleNodes()
        assertFalse(DiscoveryPathEngine.isMapComplete(nodes, setOf("core.rising_sign")))
        assertTrue(DiscoveryPathEngine.isMapComplete(nodes, nodes.map { it.id }.toSet()))
    }
}
