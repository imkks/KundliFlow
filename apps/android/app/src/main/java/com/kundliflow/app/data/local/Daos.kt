package com.kundliflow.app.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface ChartDao {
    @Query("SELECT * FROM chart_bundles WHERE profileId = :profileId")
    suspend fun getBundle(profileId: String): ChartBundleEntity?

    @Query("SELECT * FROM chart_bundles")
    fun observeAllBundles(): Flow<List<ChartBundleEntity>>

    @Query("SELECT * FROM chart_bundles")
    suspend fun getAllBundlesOnce(): List<ChartBundleEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertBundle(bundle: ChartBundleEntity)

    @Query("DELETE FROM chart_bundles WHERE profileId = :profileId")
    suspend fun deleteBundle(profileId: String)

    @Query("SELECT * FROM today_sky_cache WHERE cacheKey = :cacheKey")
    suspend fun getTodaySky(cacheKey: String): TodaySkyCacheEntity?

    @Query("SELECT * FROM today_sky_cache WHERE date = :date")
    fun observeTodaySkyForDate(date: String): Flow<List<TodaySkyCacheEntity>>

    @Query("SELECT * FROM today_sky_cache WHERE profileId = :profileId ORDER BY fetchedAt DESC LIMIT 1")
    suspend fun getLatestTodaySkyForProfile(profileId: String): TodaySkyCacheEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertTodaySky(entry: TodaySkyCacheEntity)

    @Query("DELETE FROM today_sky_cache WHERE profileId = :profileId")
    suspend fun clearTodaySky(profileId: String)
}

@Dao
interface JournalDao {
    @Query("SELECT * FROM journal_entries WHERE profileId = :profileId AND deleted = 0 ORDER BY createdAt DESC")
    fun observeEntries(profileId: String): Flow<List<JournalEntryEntity>>

    @Query("SELECT * FROM journal_entries WHERE profileId = :profileId AND deleted = 0 ORDER BY createdAt DESC")
    suspend fun getEntriesOnce(profileId: String): List<JournalEntryEntity>

    @Query("SELECT * FROM journal_entries WHERE synced = 0")
    suspend fun getAllUnsyncedEntries(): List<JournalEntryEntity>

    @Query("UPDATE journal_entries SET synced = 1 WHERE id IN (:ids)")
    suspend fun markEntriesSynced(ids: List<String>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertEntry(entry: JournalEntryEntity)

    @Query("UPDATE journal_entries SET deleted = 1, synced = 0 WHERE id = :id")
    suspend fun softDeleteEntry(id: String)

    @Query("SELECT * FROM life_events WHERE profileId = :profileId AND deleted = 0 ORDER BY eventDate DESC")
    fun observeMilestones(profileId: String): Flow<List<LifeEventEntity>>

    @Query("SELECT * FROM life_events WHERE profileId = :profileId AND deleted = 0 ORDER BY eventDate DESC")
    suspend fun getMilestonesOnce(profileId: String): List<LifeEventEntity>

    @Query("SELECT * FROM life_events WHERE synced = 0")
    suspend fun getAllUnsyncedMilestones(): List<LifeEventEntity>

    @Query("UPDATE life_events SET synced = 1 WHERE id IN (:ids)")
    suspend fun markMilestonesSynced(ids: List<String>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertMilestone(event: LifeEventEntity)
}

@Dao
interface DiscoveryDao {
    @Query("SELECT * FROM discovery_nodes WHERE profileId = :profileId")
    fun observeNodes(profileId: String): Flow<List<DiscoveryNodeEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertNodes(nodes: List<DiscoveryNodeEntity>)

    @Query("SELECT * FROM goals WHERE profileId = :profileId")
    suspend fun getGoals(profileId: String): GoalEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertGoals(goal: GoalEntity)

    @Query("SELECT * FROM weekly_rhythm WHERE profileId = :profileId AND weekStart = :weekStart")
    fun observeRhythm(profileId: String, weekStart: String): Flow<RhythmEntity?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertRhythm(rhythm: RhythmEntity)
}

@Dao
interface ChatDao {
    @Query("SELECT * FROM chat_messages WHERE profileId = :profileId ORDER BY createdAt ASC")
    fun observeMessages(profileId: String): Flow<List<ChatMessageEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertMessage(message: ChatMessageEntity)

    @Query("DELETE FROM chat_messages WHERE profileId = :profileId")
    suspend fun clearProfileMessages(profileId: String)
}

@Dao
interface PreferenceDao {
    @Query("SELECT * FROM preferences WHERE id = 1")
    fun observePreferences(): Flow<PreferenceEntity?>

    @Query("SELECT * FROM preferences WHERE id = 1")
    suspend fun getPreferences(): PreferenceEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertPreferences(prefs: PreferenceEntity)
}
