package com.kundliflow.app.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase

@Database(
    entities = [
        ChartBundleEntity::class,
        TodaySkyCacheEntity::class,
        JournalEntryEntity::class,
        LifeEventEntity::class,
        DiscoveryNodeEntity::class,
        GoalEntity::class,
        RhythmEntity::class,
        ChatMessageEntity::class,
        PreferenceEntity::class,
    ],
    version = 1,
    exportSchema = false,
)
abstract class KundliFlowDatabase : RoomDatabase() {
    abstract fun chartDao(): ChartDao
    abstract fun journalDao(): JournalDao
    abstract fun discoveryDao(): DiscoveryDao
    abstract fun chatDao(): ChatDao
    abstract fun preferenceDao(): PreferenceDao

    companion object {
        @Volatile
        private var INSTANCE: KundliFlowDatabase? = null

        fun getInstance(context: Context): KundliFlowDatabase =
            INSTANCE ?: synchronized(this) {
                INSTANCE ?: Room.databaseBuilder(
                    context.applicationContext,
                    KundliFlowDatabase::class.java,
                    "kundliflow.db",
                ).build().also { INSTANCE = it }
            }
    }
}
