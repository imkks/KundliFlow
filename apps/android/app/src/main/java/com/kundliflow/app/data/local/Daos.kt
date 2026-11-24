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

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertBundle(bundle: ChartBundleEntity)

    @Query("DELETE FROM chart_bundles WHERE profileId = :profileId")
    suspend fun deleteBundle(profileId: String)

    @Query("SELECT * FROM today_sky_cache WHERE cacheKey = :cacheKey")
    suspend fun getTodaySky(cacheKey: String): TodaySkyCacheEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertTodaySky(entry: TodaySkyCacheEntity)

    @Query("DELETE FROM today_sky_cache WHERE profileId = :profileId")
    suspend fun clearTodaySky(profileId: String)
}

@Dao
interface JournalDao {
    @Query("SELECT * FROM journal_entries WHERE profileId = :profileId AND deleted = 0 ORDER BY createdAt DESC")
    fun observeEntries(profileId: String): Flow<List<JournalEntryEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertEntry(entry: JournalEntryEntity)

    @Query("SELECT * FROM life_events WHERE profileId = :profileId AND deleted = 0 ORDER BY eventDate DESC")
    fun observeMilestones(profileId: String): Flow<List<LifeEventEntity>>

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
