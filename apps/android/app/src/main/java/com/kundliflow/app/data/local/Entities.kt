package com.kundliflow.app.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "chart_bundles")
data class ChartBundleEntity(
    @PrimaryKey val profileId: String,
    val bundleVersion: Int,
    val etag: String,
    val profileJson: String,
    val level1Json: String,
    val level2Json: String,
    val computedAt: String,
)

@Entity(tableName = "today_sky_cache")
data class TodaySkyCacheEntity(
    @PrimaryKey val cacheKey: String, // profileId|date|tzId|lat|lon
    val profileId: String,
    val date: String,
    val payloadJson: String,
    val fetchedAt: Long,
)

@Entity(tableName = "journal_entries")
data class JournalEntryEntity(
    @PrimaryKey val id: String,
    val profileId: String,
    val entryDate: String,
    val mood: Int,
    val energy: Int,
    val focus: Int,
    val kind: String = "checkin",
    val tagsJson: String = "[]",
    val note: String = "",
    val skySnapshotJson: String? = null,
    val createdAt: String,
    val updatedAt: String,
    val synced: Boolean = false,
    val deleted: Boolean = false,
)

@Entity(tableName = "life_events")
data class LifeEventEntity(
    @PrimaryKey val id: String,
    val profileId: String,
    val title: String,
    val eventDate: String,
    val category: String,
    val updatedAt: String,
    val synced: Boolean = false,
    val deleted: Boolean = false,
)

@Entity(tableName = "discovery_nodes", primaryKeys = ["profileId", "id"])
data class DiscoveryNodeEntity(
    val profileId: String,
    val id: String,
    val ring: String,
    val state: String = "hidden", // hidden | previewed | lit
    val litAt: Long? = null,
    val source: String? = null,   // story | explore
)

@Entity(tableName = "goals")
data class GoalEntity(
    @PrimaryKey val profileId: String,
    val goalsJson: String, // up to 2 onboarding goals
    val createdAt: Long,
)

@Entity(tableName = "weekly_rhythm", primaryKeys = ["profileId", "weekStart"])
data class RhythmEntity(
    val profileId: String,
    val weekStart: String,
    val daysLoggedJson: String, // ISO dates in week
    val goal: Int = 4,
)

@Entity(tableName = "chat_messages")
data class ChatMessageEntity(
    @PrimaryKey val id: String,
    val profileId: String,
    val role: String, // user | assistant
    val content: String,
    val responseType: String? = null,
    val evidenceIdsJson: String = "[]",
    val structuredJson: String? = null,
    val createdAt: String,
)

@Entity(tableName = "preferences")
data class PreferenceEntity(
    @PrimaryKey val id: Int = 1,
    val detailLevel: String = "balanced", // simple | balanced | full
    val mathPromptShownCount: Int = 0,
    val chartStyle: String = "north", // north | south
    val activeProfileId: String? = null,
    val quietHoursStart: String = "22:00",
    val quietHoursEnd: String = "07:00",
    val openedTodayCount: Int = 0,
    val lastOpenedAt: Long = 0L,
    val lastSeenBand: String? = null,
    val lastSeenHora: String? = null,
    val firstLaunchAt: Long = 0L,
    val ahaCardState: String = "pending", // pending | shown | dismissed
    val lastWeeklyReviewWeekStart: String? = null,
    val dismissedSlotKeysJson: String = "[]",
    val actTwoEnabled: Boolean = false,
)
