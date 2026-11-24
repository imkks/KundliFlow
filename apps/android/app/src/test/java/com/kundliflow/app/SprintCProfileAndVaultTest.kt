package com.kundliflow.app

import com.kundliflow.app.data.local.JournalEntryEntity
import com.kundliflow.app.data.local.LifeEventEntity
import com.kundliflow.app.data.mapper.BundleMappers
import com.kundliflow.app.ui.journal.FrozenSkySnapshot
import com.kundliflow.app.ui.journal.FrozenSkySnapshotCodec
import com.kundliflow.app.ui.me.ShareAndExportHelper
import com.kundliflow.app.ui.subject.PlanetId
import com.kundliflow.app.ui.today.SkyBand
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Test

class SprintCProfileAndVaultTest {

    @Test
    fun `Vault JSON export and restore preserves entries, snapshots, and milestones losslessly`() {
        val snap = FrozenSkySnapshot(SkyBand.Flowing, "Pisces", PlanetId.JUPITER, "Good", "Mitra", 31, 4)
        val entry = JournalEntryEntity(
            id = "je_101",
            profileId = "old_profile",
            entryDate = "2026-11-24",
            mood = 5,
            energy = 4,
            focus = 4,
            kind = "reflection",
            tagsJson = """["focus","calm"]""",
            note = "Clarity in the morning Jupiter hour.",
            skySnapshotJson = FrozenSkySnapshotCodec.encode(snap),
            createdAt = "2026-11-24T08:00:00Z",
            updatedAt = "2026-11-24T08:00:00Z",
        )
        val milestone = LifeEventEntity(
            id = "ms_201",
            profileId = "old_profile",
            title = "Launched KundliFlow Android",
            eventDate = "2026-11-24",
            category = "career",
            updatedAt = "2026-11-24T09:00:00Z",
        )

        val exported = ShareAndExportHelper.buildVaultBackupJson(
            profileJson = """{"id":"old_profile","name":"Priya"}""",
            entries = listOf(entry),
            milestones = listOf(milestone),
            exportedAtIso = "2026-11-24T10:00:00Z",
        )
        val restored = ShareAndExportHelper.parseVaultBackupJson(exported, targetProfileId = "new_profile")
        assertNotNull(restored)
        assertEquals(1, restored!!.entries.size)
        assertEquals(1, restored.milestones.size)
        assertEquals("new_profile", restored.entries[0].profileId)
        assertEquals("Clarity in the morning Jupiter hour.", restored.entries[0].note)
        assertEquals(snap, FrozenSkySnapshotCodec.decode(restored.entries[0].skySnapshotJson))
        assertEquals("Launched KundliFlow Android", restored.milestones[0].title)
    }

    @Test
    fun `extractCurrentBandFromTodayJson powers real Orbit Band Dots`() {
        val flowingToday = """{"dayView":{"dayBand":"steady","hourlyScores":[{"band":"flowing"},{"band":"go_gently"}]}}"""
        assertEquals(SkyBand.Flowing, BundleMappers.extractCurrentBandFromTodayJson(flowingToday, nowHour = 0))
        assertEquals(SkyBand.GoGently, BundleMappers.extractCurrentBandFromTodayJson(flowingToday, nowHour = 1))
        assertNull(BundleMappers.extractCurrentBandFromTodayJson(null))
    }
}
