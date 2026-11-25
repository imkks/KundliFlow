package com.kundliflow.app.data

import com.kundliflow.app.data.local.AuthTokenStore
import com.kundliflow.app.data.local.ChartBundleEntity
import com.kundliflow.app.data.local.ChatMessageEntity
import com.kundliflow.app.data.local.DiscoveryNodeEntity
import com.kundliflow.app.data.local.GoalEntity
import com.kundliflow.app.data.local.JournalEntryEntity
import com.kundliflow.app.data.local.KundliFlowDatabase
import com.kundliflow.app.data.local.LifeEventEntity
import com.kundliflow.app.data.local.PreferenceEntity
import com.kundliflow.app.data.local.RhythmEntity
import com.kundliflow.app.data.local.StoredAuthUser
import com.kundliflow.app.data.local.TodaySkyCacheEntity
import com.kundliflow.app.data.mapper.BundleMappers
import com.kundliflow.app.data.mapper.ProfileMeta
import com.kundliflow.app.data.remote.KundliApiClient
import com.kundliflow.app.data.remote.ResolvedPlace
import com.kundliflow.app.ui.ask.AskSseEvent
import com.kundliflow.app.ui.discovery.DiscoveryNodeSpec
import com.kundliflow.app.ui.me.ShareAndExportHelper
import com.kundliflow.app.ui.onboarding.OnboardingResult
import com.kundliflow.app.work.TwoDayPrefetchCoordinator
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.builtins.ListSerializer
import kotlinx.serialization.builtins.serializer
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.intOrNull
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import java.time.DayOfWeek
import java.time.Instant
import java.time.LocalDate
import java.time.temporal.TemporalAdjusters
import kotlin.math.roundToInt

/**
 * Offline-first repository coordinating Room (9 tables) and live KundliFlow API
 * (`https://129.225.104.43.sslip.io`).
 */
class KundliRepository(
    val db: KundliFlowDatabase,
    val authStore: AuthTokenStore,
    val api: KundliApiClient,
) {
    private val json = Json { ignoreUnknownKeys = true }

    suspend fun getOrInitPreferences(): PreferenceEntity {
        val existing = db.preferenceDao().getPreferences()
        if (existing != null) return existing
        val initial = PreferenceEntity(
            id = 1,
            firstLaunchAt = System.currentTimeMillis(),
            lastOpenedAt = System.currentTimeMillis(),
        )
        db.preferenceDao().upsertPreferences(initial)
        return initial
    }

    suspend fun savePreferences(prefs: PreferenceEntity) {
        db.preferenceDao().upsertPreferences(prefs)
    }

    suspend fun checkHealth(): Boolean = api.checkHealth().isSuccess

    suspend fun signInWithDevEmail(email: String, name: String): Result<StoredAuthUser> = withContext(Dispatchers.IO) {
        api.loginWithDevEmail(email.trim(), name.trim().ifBlank { "Native" }).mapCatching { raw ->
            parseAndPersistAuthUser(raw)
        }
    }

    suspend fun signInWithGoogleIdToken(idToken: String): Result<StoredAuthUser> = withContext(Dispatchers.IO) {
        api.loginWithGoogleIdToken(idToken.trim()).mapCatching { raw ->
            parseAndPersistAuthUser(raw)
        }
    }

    /**
     * Pulls any cloud profiles belonging to the signed-in Google account from `GET /api/profiles`
     * and hydrates their immutable bundles into Room so Web UI charts appear on Android seamlessly.
     */
    suspend fun syncCloudProfilesToRoom(): Int = withContext(Dispatchers.IO) {
        val rawList = api.listProfiles().getOrNull() ?: return@withContext 0
        var syncedCount = 0
        runCatching {
            val root = json.parseToJsonElement(rawList).jsonObject
            val profilesArr = root["profiles"]?.jsonArray ?: return@runCatching
            for (el in profilesArr) {
                val pObj = el.jsonObject
                val pid = pObj["id"]?.jsonPrimitive?.content ?: continue
                if (db.chartDao().getBundle(pid) != null) continue
                val bundleRes = api.fetchBundle(pid).getOrNull() ?: continue
                if (bundleRes.statusCode != 200 || bundleRes.body.isBlank()) continue
                val bRoot = json.parseToJsonElement(bundleRes.body).jsonObject
                val version = bRoot["bundleVersion"]?.jsonPrimitive?.intOrNull ?: 1
                val entity = ChartBundleEntity(
                    profileId = pid,
                    bundleVersion = version,
                    etag = bundleRes.etag ?: "\"bundle-$pid-v$version\"",
                    profileJson = bRoot["profile"]?.toString() ?: pObj.toString(),
                    level1Json = bRoot["level1Static"]?.toString() ?: "{}",
                    level2Json = bRoot["level2Static"]?.toString() ?: "{}",
                    computedAt = bRoot["computedAt"]?.jsonPrimitive?.content ?: Instant.now().toString(),
                )
                db.chartDao().upsertBundle(entity)
                syncedCount++
            }
        }
        syncedCount
    }

    fun signOut() {
        authStore.clearAuthOnly()
    }

    private fun parseAndPersistAuthUser(rawJson: String): StoredAuthUser {
        val root = json.parseToJsonElement(rawJson).jsonObject
        val token = root["token"]?.jsonPrimitive?.content ?: error("Missing auth token")
        val userObj = root["user"]?.jsonObject
        val user = StoredAuthUser(
            token = token,
            userId = userObj?.get("id")?.jsonPrimitive?.content ?: "",
            name = userObj?.get("name")?.jsonPrimitive?.content ?: "Native",
            email = userObj?.get("email")?.jsonPrimitive?.content ?: "",
        )
        authStore.saveUser(user)
        return user
    }

    /**
     * Edits an existing profile (`POST /api/profiles` with existing `id`), bumps `bundleVersion`
     * in Room, and unconditionally clears cached `TodaySkyCacheEntity` (AGENTS.md Invariant #4).
     */
    suspend fun updateExistingProfile(
        existingId: String,
        name: String,
        birthDate: String,
        birthTime: String,
        place: ResolvedPlace,
        timeCertainty: String,
        ayanamsa: String,
    ): Result<ChartBundleEntity> = withContext(Dispatchers.IO) {
        val resp = api.upsertProfile(
            id = existingId,
            name = name.ifBlank { "Native" },
            birthDate = birthDate,
            birthTime = if (timeCertainty == "unknown") "12:00:00" else birthTime,
            tzId = place.tzId,
            cityName = place.name,
            lat = place.lat,
            lon = place.lon,
            timeCertainty = timeCertainty,
            ayanamsa = ayanamsa,
            isActive = true,
        )
        resp.mapCatching { raw ->
            val root = json.parseToJsonElement(raw).jsonObject
            val profileObj = root["profile"]?.jsonObject ?: error("Missing profile in response")
            val dashboardObj = root["dashboard"]?.jsonObject ?: error("Missing dashboard in response")
            val profileId = profileObj["id"]?.jsonPrimitive?.content ?: existingId
            val prevVersion = db.chartDao().getBundle(profileId)?.bundleVersion ?: 1
            val serverVersion = profileObj["bundleVersion"]?.jsonPrimitive?.intOrNull ?: (prevVersion + 1)
            val bumpedVersion = maxOf(serverVersion, prevVersion + 1)
            val entity = ChartBundleEntity(
                profileId = profileId,
                bundleVersion = bumpedVersion,
                etag = "\"bundle-$profileId-v$bumpedVersion\"",
                profileJson = profileObj.toString(),
                level1Json = dashboardObj["level1"]?.toString() ?: "{}",
                level2Json = dashboardObj["level2"]?.toString() ?: "{}",
                computedAt = Instant.now().toString(),
            )
            db.chartDao().upsertBundle(entity)
            db.chartDao().clearTodaySky(profileId)
            entity
        }
    }

    /**
     * Creates or updates a profile on the live API (`POST /api/profiles`), caches the
     * immutable static bundle into Room, clears stale Today cache, seeds Discovery triad,
     * and prefetches Today + Tomorrow.
     */
    suspend fun createProfileFromOnboarding(
        result: OnboardingResult,
        place: ResolvedPlace,
        allDiscoverySpecs: List<DiscoveryNodeSpec>,
    ): Result<ChartBundleEntity> = withContext(Dispatchers.IO) {
        val resp = api.upsertProfile(
            name = result.name.ifBlank { "Native" },
            birthDate = result.birthDate,
            birthTime = if (result.timeCertainty == "unknown") "12:00:00" else result.birthTime,
            tzId = place.tzId,
            cityName = place.name,
            lat = place.lat,
            lon = place.lon,
            timeCertainty = result.timeCertainty,
            ayanamsa = result.ayanamsa,
            isActive = true,
        )
        resp.mapCatching { raw ->
            val root = json.parseToJsonElement(raw).jsonObject
            val profileObj = root["profile"]?.jsonObject ?: error("Missing profile in response")
            val dashboardObj = root["dashboard"]?.jsonObject ?: error("Missing dashboard in response")
            val profileId = profileObj["id"]?.jsonPrimitive?.content ?: error("Missing profile id")
            val bundleVersion = profileObj["bundleVersion"]?.jsonPrimitive?.intOrNull ?: 1
            val level1Str = dashboardObj["level1"]?.toString() ?: "{}"
            val level2Str = dashboardObj["level2"]?.toString() ?: "{}"

            val entity = ChartBundleEntity(
                profileId = profileId,
                bundleVersion = bundleVersion,
                etag = "\"bundle-$profileId-v$bundleVersion\"",
                profileJson = profileObj.toString(),
                level1Json = level1Str,
                level2Json = level2Str,
                computedAt = Instant.now().toString(),
            )
            db.chartDao().upsertBundle(entity)
            db.chartDao().clearTodaySky(profileId)

            // Save onboarding goals
            val goals = result.goals.ifEmpty { listOf("career") }
            db.discoveryDao().upsertGoals(
                GoalEntity(
                    profileId = profileId,
                    goalsJson = json.encodeToString(ListSerializer(String.serializer()), goals),
                    createdAt = System.currentTimeMillis(),
                ),
            )

            // Seed Discovery nodes (Triad lit immediately)
            val nowMs = System.currentTimeMillis()
            val triadIds = if (result.timeCertainty == "unknown") {
                setOf("core.moon_sign", "core.moon_nakshatra", "timing.current_chapter")
            } else {
                setOf("core.rising_sign", "core.moon_sign", "core.moon_nakshatra")
            }
            db.discoveryDao().upsertNodes(
                allDiscoverySpecs.map { spec ->
                    val lit = triadIds.contains(spec.id)
                    DiscoveryNodeEntity(
                        profileId = profileId,
                        id = spec.id,
                        ring = spec.ring,
                        state = if (lit) "lit" else "hidden",
                        litAt = if (lit) nowMs else null,
                        source = if (lit) "story" else null,
                    )
                },
            )

            val prefs = getOrInitPreferences()
            db.preferenceDao().upsertPreferences(prefs.copy(activeProfileId = profileId))
            entity
        }
    }

    /**
     * Reads cached Today + Tomorrow payloads from Room first, then fetches missing/stale dates
     * from `GET /api/profiles/:id/today` (2-day prefetch for Evening Horizon Hook).
     */
    suspend fun getOrFetchTodayAndTomorrow(
        meta: ProfileMeta,
        overridePlace: ResolvedPlace? = null,
        forceRefresh: Boolean = false,
    ): Pair<String?, String?> = withContext(Dispatchers.IO) {
        val lat = roundBucket(overridePlace?.lat ?: meta.lat)
        val lon = roundBucket(overridePlace?.lon ?: meta.lon)
        val tz = overridePlace?.tzId ?: meta.tzId
        val todayIso = LocalDate.now().toString()
        val tomorrowIso = LocalDate.now().plusDays(1).toString()
        val (todayKey, tomorrowKey) = TwoDayPrefetchCoordinator.buildTodayAndTomorrowKeys(
            meta.id, todayIso, tz, lat, lon,
        )

        var todayJson = if (!forceRefresh) db.chartDao().getTodaySky(todayKey)?.payloadJson else null
        var tomorrowJson = if (!forceRefresh) db.chartDao().getTodaySky(tomorrowKey)?.payloadJson else null

        if (todayJson == null) {
            api.fetchToday(meta.id, todayIso, tz, lat, lon).onSuccess { raw ->
                todayJson = raw
                db.chartDao().upsertTodaySky(
                    TodaySkyCacheEntity(todayKey, meta.id, todayIso, raw, System.currentTimeMillis()),
                )
            }
        }
        if (tomorrowJson == null) {
            api.fetchToday(meta.id, tomorrowIso, tz, lat, lon).onSuccess { raw ->
                tomorrowJson = raw
                db.chartDao().upsertTodaySky(
                    TodaySkyCacheEntity(tomorrowKey, meta.id, tomorrowIso, raw, System.currentTimeMillis()),
                )
            }
        }
        todayJson to tomorrowJson
    }

    suspend fun fetchCalendarJson(meta: ProfileMeta, year: Int, month: Int): String? = withContext(Dispatchers.IO) {
        val dateStr = "${year}-${month.toString().padStart(2, '0')}-15"
        api.fetchCalendar(meta.id, year, month, dateStr, meta.tzId).getOrNull()
    }

    suspend fun fetchVarshaphalJson(profileId: String, year: Int): String? = withContext(Dispatchers.IO) {
        api.fetchVarshaphal(profileId, year).getOrNull()
    }

    suspend fun deleteProfileCascade(profileId: String) = withContext(Dispatchers.IO) {
        db.chartDao().deleteBundle(profileId)
        db.chartDao().clearTodaySky(profileId)
        db.chatDao().clearProfileMessages(profileId)
        api.deleteProfile(profileId)
    }

    suspend fun revalidateBundleIfNeeded(bundle: ChartBundleEntity): ChartBundleEntity = withContext(Dispatchers.IO) {
        val res = api.fetchBundle(bundle.profileId, etag = bundle.etag).getOrNull() ?: return@withContext bundle
        if (res.statusCode == 304 || res.body.isBlank()) return@withContext bundle
        runCatching {
            val root = json.parseToJsonElement(res.body).jsonObject
            val updated = bundle.copy(
                bundleVersion = root["bundleVersion"]?.jsonPrimitive?.intOrNull ?: bundle.bundleVersion,
                etag = res.etag ?: bundle.etag,
                profileJson = root["profile"]?.toString() ?: bundle.profileJson,
                level1Json = root["level1Static"]?.toString() ?: bundle.level1Json,
                level2Json = root["level2Static"]?.toString() ?: bundle.level2Json,
                computedAt = root["computedAt"]?.jsonPrimitive?.content ?: bundle.computedAt,
            )
            db.chartDao().upsertBundle(updated)
            updated
        }.getOrDefault(bundle)
    }

    suspend fun saveJournalEntryAndSync(entry: JournalEntryEntity) = withContext(Dispatchers.IO) {
        db.journalDao().upsertEntry(entry)

        // Update Monday-reset Weekly Rhythm
        val today = LocalDate.now()
        val weekStart = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)).toString()
        val existingRhythm = db.discoveryDao().observeRhythm(entry.profileId, weekStart)
        // Best-effort sync to server
        syncProfileJournalBestEffort(entry.profileId, listOf(entry), emptyList())
    }

    suspend fun saveMilestoneAndSync(event: LifeEventEntity) = withContext(Dispatchers.IO) {
        db.journalDao().upsertMilestone(event)
        syncProfileJournalBestEffort(event.profileId, emptyList(), listOf(event))
    }

    private suspend fun syncProfileJournalBestEffort(
        profileId: String,
        entries: List<JournalEntryEntity>,
        events: List<LifeEventEntity>,
    ) {
        val entriesJson = entries.joinToString(",") { e ->
            val escapedNote = e.note.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n")
            val snapField = if (e.skySnapshotJson != null) ""","skySnapshot":${e.skySnapshotJson}""" else ""
            """{"id":"${e.id}","entryDate":"${e.entryDate}","note":"$escapedNote","energy":${e.energy},"focus":${e.focus},"mood":${e.mood},"kind":"${e.kind}","tags":${e.tagsJson},"createdAt":"${e.createdAt}","updatedAt":"${e.updatedAt}","deleted":${e.deleted}$snapField}"""
        }
        val eventsJson = events.joinToString(",") { ev ->
            val escapedTitle = ev.title.replace("\\", "\\\\").replace("\"", "\\\"")
            """{"id":"${ev.id}","title":"$escapedTitle","eventDate":"${ev.eventDate}","category":"${ev.category}","updatedAt":"${ev.updatedAt}","deleted":${ev.deleted}}"""
        }
        val payload = """{"profileId":"$profileId","journalEntries":[$entriesJson],"lifeEvents":[$eventsJson]}"""
        api.syncJournal(payload).onSuccess {
            if (entries.isNotEmpty()) db.journalDao().markEntriesSynced(entries.map { it.id })
            if (events.isNotEmpty()) db.journalDao().markMilestonesSynced(events.map { it.id })
            authStore.setLastSyncIso(Instant.now().toString())
        }
    }

    suspend fun syncAllPendingJournalChanges(): Boolean = withContext(Dispatchers.IO) {
        val pendingEntries = db.journalDao().getAllUnsyncedEntries()
        val pendingMilestones = db.journalDao().getAllUnsyncedMilestones()
        if (pendingEntries.isEmpty() && pendingMilestones.isEmpty()) return@withContext true
        val profileIds = (pendingEntries.map { it.profileId } + pendingMilestones.map { it.profileId }).toSet()
        var allOk = true
        profileIds.forEach { pid ->
            val eList = pendingEntries.filter { it.profileId == pid }
            val mList = pendingMilestones.filter { it.profileId == pid }
            runCatching { syncProfileJournalBestEffort(pid, eList, mList) }.onFailure { allOk = false }
        }
        allOk
    }

    suspend fun buildFullVaultBackupJson(profileId: String): String = withContext(Dispatchers.IO) {
        val bundle = db.chartDao().getBundle(profileId)
        val entries = db.journalDao().getEntriesOnce(profileId)
        val milestones = db.journalDao().getMilestonesOnce(profileId)
        ShareAndExportHelper.buildVaultBackupJson(
            profileJson = bundle?.profileJson ?: "{}",
            entries = entries,
            milestones = milestones,
            exportedAtIso = Instant.now().toString(),
        )
    }

    suspend fun restoreVaultBackup(profileId: String, rawJson: String): Result<Int> = withContext(Dispatchers.IO) {
        val parsed = ShareAndExportHelper.parseVaultBackupJson(rawJson, profileId)
            ?: return@withContext Result.failure(IllegalArgumentException("Not a valid KundliFlow vault backup JSON file."))
        parsed.entries.forEach { db.journalDao().upsertEntry(it) }
        parsed.milestones.forEach { db.journalDao().upsertMilestone(it) }
        Result.success(parsed.entries.size + parsed.milestones.size)
    }

    suspend fun lightDiscoveryNode(profileId: String, nodeId: String, ring: String, source: String) = withContext(Dispatchers.IO) {
        db.discoveryDao().upsertNodes(
            listOf(
                DiscoveryNodeEntity(
                    profileId = profileId,
                    id = nodeId,
                    ring = ring,
                    state = "lit",
                    litAt = System.currentTimeMillis(),
                    source = source,
                ),
            ),
        )
    }

    suspend fun streamAskCopilot(
        profileId: String,
        question: String,
        deep: Boolean,
        onEvent: (AskSseEvent) -> Unit,
    ): Result<Unit> {
        val nowIso = Instant.now().toString()
        db.chatDao().upsertMessage(
            ChatMessageEntity(
                id = "u_${System.currentTimeMillis()}",
                profileId = profileId,
                role = "user",
                content = question,
                createdAt = nowIso,
            ),
        )
        return api.askCopilotSse(profileId, question, deep) { ev ->
            onEvent(ev)
        }
    }

    suspend fun persistAssistantMessage(
        profileId: String,
        answer: String,
        responseType: String,
        evidenceIds: List<String>,
    ) = withContext(Dispatchers.IO) {
        db.chatDao().upsertMessage(
            ChatMessageEntity(
                id = "a_${System.currentTimeMillis()}",
                profileId = profileId,
                role = "assistant",
                content = answer,
                responseType = responseType,
                evidenceIdsJson = json.encodeToString(ListSerializer(String.serializer()), evidenceIds),
                createdAt = Instant.now().toString(),
            ),
        )
    }

    suspend fun clearConversation(profileId: String) = withContext(Dispatchers.IO) {
        db.chatDao().clearProfileMessages(profileId)
        api.clearConversation(profileId)
    }

    suspend fun resetAllLocalData() = withContext(Dispatchers.IO) {
        db.clearAllTables()
        authStore.clear()
    }

    fun decodeStringList(rawJson: String): List<String> = runCatching {
        json.decodeFromString(ListSerializer(String.serializer()), rawJson)
    }.getOrDefault(emptyList())

    private fun roundBucket(v: Double): Double = (v * 100.0).roundToInt() / 100.0
}
