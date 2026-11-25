package com.kundliflow.app.ui

import android.app.Application
import android.content.Context
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.kundliflow.app.KundliFlowApplication
import com.kundliflow.app.data.local.ChartBundleEntity
import com.kundliflow.app.data.local.JournalEntryEntity
import com.kundliflow.app.data.local.LifeEventEntity
import com.kundliflow.app.data.local.PreferenceEntity
import com.kundliflow.app.data.local.StoredAuthUser
import com.kundliflow.app.data.mapper.BundleMappers
import com.kundliflow.app.data.mapper.NatalSummary
import com.kundliflow.app.data.mapper.ProfileMeta
import com.kundliflow.app.data.remote.GoogleSignInHelper
import com.kundliflow.app.data.remote.OfflineCityItem
import com.kundliflow.app.data.remote.ResolvedPlace
import com.kundliflow.app.ui.ask.AskSseEvent
import com.kundliflow.app.ui.ask.AskUiMessage
import com.kundliflow.app.ui.chart.ChartReference
import com.kundliflow.app.ui.chart.ChartStyle
import com.kundliflow.app.ui.chart.ChartUiState
import com.kundliflow.app.ui.chart.ToolsDataExtractor
import com.kundliflow.app.ui.chart.ToolsStudioData
import com.kundliflow.app.ui.chart.VarshaphalViewData
import com.kundliflow.app.ui.discovery.DiscoveryNodeSpec
import com.kundliflow.app.ui.discovery.DiscoveryPathEngine
import com.kundliflow.app.ui.journal.FrozenSkySnapshot
import com.kundliflow.app.ui.journal.FrozenSkySnapshotCodec
import com.kundliflow.app.ui.journal.JournalEntryUi
import com.kundliflow.app.ui.journal.JournalPatternsCalculator
import com.kundliflow.app.ui.journal.MilestoneUi
import com.kundliflow.app.ui.me.OrbitProfileItem
import com.kundliflow.app.ui.me.ShareAndExportHelper
import com.kundliflow.app.ui.onboarding.OnboardingResult
import com.kundliflow.app.ui.safety.SafetyCheckResult
import com.kundliflow.app.ui.safety.SafetyEvaluator
import com.kundliflow.app.ui.safety.SafetyResources
import com.kundliflow.app.ui.subject.PlanetId
import com.kundliflow.app.ui.subject.Subject
import com.kundliflow.app.ui.subject.SubjectFact
import com.kundliflow.app.ui.subject.SubjectFindingItem
import com.kundliflow.app.ui.subject.SubjectReadingContent
import com.kundliflow.app.ui.subject.SubjectTelemetryRow
import com.kundliflow.app.ui.subject.VargaType
import com.kundliflow.app.ui.time.TimeTabState
import com.kundliflow.app.ui.today.CheckInMoodSample
import com.kundliflow.app.ui.today.HoraSlot
import com.kundliflow.app.ui.today.HourlyScorePoint
import com.kundliflow.app.ui.today.ScoreFactorItem
import com.kundliflow.app.ui.today.SkyBand
import com.kundliflow.app.ui.today.TodayArbiterInput
import com.kundliflow.app.ui.today.TodayDynamicSlot
import com.kundliflow.app.ui.today.TodaySkyState
import com.kundliflow.app.ui.today.TodaySlotArbiter
import com.kundliflow.app.widget.KundliWidgetUpdater
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.serialization.builtins.ListSerializer
import kotlinx.serialization.builtins.serializer
import kotlinx.serialization.json.Json
import java.time.DayOfWeek
import java.time.Instant
import java.time.LocalDate
import java.time.LocalTime
import java.time.YearMonth
import java.time.ZoneId
import java.time.temporal.TemporalAdjusters
import java.util.Locale

data class KundliAppUiState(
    val bootstrapped: Boolean = false,
    val needsOnboarding: Boolean = false,
    val onboardingComputing: Boolean = false,
    val onboardingError: String? = null,
    val onboardingComputedLevel1Json: String? = null,
    val apiHealthOk: Boolean? = null,
    val statusBanner: String? = null,
    val activeProfile: ProfileMeta? = null,
    val savedProfiles: List<OrbitProfileItem> = emptyList(),
    val todaySky: TodaySkyState? = null,
    val isRefreshingToday: Boolean = false,
    val staleStatusLine: String? = null,
    val personalHookLine: String = "",
    val activeSlot: TodayDynamicSlot = TodayDynamicSlot.CuriosityNode("core.moon_sign", "Moon sign", "Tap to discover."),
    val isEveningAfter19: Boolean = false,
    val showConstructiveRedirect: Boolean = false,
    val chartState: ChartUiState? = null,
    val timeState: TimeTabState? = null,
    val isCalendarLoading: Boolean = false,
    val journalEntries: List<JournalEntryUi> = emptyList(),
    val milestones: List<MilestoneUi> = emptyList(),
    val daysLoggedThisWeek: Set<Int> = emptySet(),
    val orderedDiscoveryNodes: List<DiscoveryNodeSpec> = emptyList(),
    val litNodeIds: Set<String> = emptySet(),
    val chatMessages: List<AskUiMessage> = emptyList(),
    val liveStepTicker: String? = null,
    val liveTraceSteps: List<String> = emptyList(),
    val detailLevel: String = "balanced",
    val chartStyle: ChartStyle = ChartStyle.NORTH,
    val quietHoursStart: String = "22:00",
    val quietHoursEnd: String = "07:00",
    val morningNotificationsEnabled: Boolean = false,
    val signedInUser: StoredAuthUser? = null,
    val lastSyncLabel: String? = null,
    val authBusy: Boolean = false,
    val authMessage: String? = null,
    val updatingProfile: Boolean = false,
    val mathPromptShownCount: Int = 0,
    val distressTriggered: Boolean = false,
)

class KundliViewModel(application: Application) : AndroidViewModel(application) {
    private val app = application as KundliFlowApplication
    val repo = app.repository
    val placesService = app.placesService

    private val json = Json { ignoreUnknownKeys = true }
    val safetyResources: SafetyResources = SafetyEvaluator.loadFromAssets(application)
    val discoveryCatalog = DiscoveryPathEngine.loadCatalogFromAssets(application)
    val offlineCities: List<OfflineCityItem> = placesService.loadOfflineCities(application)

    private val _uiState = MutableStateFlow(KundliAppUiState())
    val uiState: StateFlow<KundliAppUiState> = _uiState.asStateFlow()

    private var activeBundle: ChartBundleEntity? = null
    private var activeTodayJson: String? = null
    private var activeTomorrowJson: String? = null
    private var activeCalendarJson: String? = null
    private var selectedCalYear: Int = LocalDate.now().year
    private var selectedCalMonth: Int = LocalDate.now().monthValue
    private var activeGoals: List<String> = listOf("career")
    private var prefs: PreferenceEntity = PreferenceEntity()
    private var profileObserversJob: Job? = null

    init {
        bootstrap()
    }

    private fun bootstrap() {
        viewModelScope.launch {
            prefs = repo.getOrInitPreferences()
            val health = repo.checkHealth()
            _uiState.update {
                it.copy(
                    apiHealthOk = health,
                    detailLevel = prefs.detailLevel,
                    chartStyle = if (prefs.chartStyle == "south") ChartStyle.SOUTH else ChartStyle.NORTH,
                    quietHoursStart = prefs.quietHoursStart,
                    quietHoursEnd = prefs.quietHoursEnd,
                    morningNotificationsEnabled = repo.authStore.isMorningNotificationEnabled(),
                    signedInUser = repo.authStore.getUser(),
                    lastSyncLabel = repo.authStore.getLastSyncIso(),
                    mathPromptShownCount = prefs.mathPromptShownCount,
                    isEveningAfter19 = LocalTime.now().hour >= 19,
                )
            }

            // Observe all locally cached bundles + live cached Today sky bands for Orbit Switcher
            launch {
                combine(
                    repo.db.chartDao().observeAllBundles(),
                    repo.db.chartDao().observeTodaySkyForDate(LocalDate.now().toString()),
                ) { bundles, todayCaches ->
                    bundles to todayCaches
                }.collect { (bundles, todayCaches) ->
                    val bandByProfile = todayCaches.associate { cache ->
                        cache.profileId to BundleMappers.extractCurrentBandFromTodayJson(cache.payloadJson)
                    }
                    val orbitItems = bundles.mapNotNull { b ->
                        val meta = BundleMappers.parseProfileMeta(b.profileJson) ?: return@mapNotNull null
                        val (lagna, moon, _) = BundleMappers.extractNatalSummary(b.level1Json)
                        OrbitProfileItem(
                            id = meta.id,
                            name = meta.name,
                            subtitle = if (meta.timeCertainty == "unknown") "$moon Moon" else "$lagna Rising · $moon Moon",
                            todayBand = bandByProfile[meta.id],
                            ayanamsa = meta.ayanamsa.uppercase(),
                        )
                    }
                    _uiState.update { it.copy(savedProfiles = orbitItems) }

                    if (activeBundle == null) {
                        val target = bundles.firstOrNull { it.profileId == prefs.activeProfileId } ?: bundles.firstOrNull()
                        if (target != null) {
                            activateLocalBundle(target)
                        } else {
                            _uiState.update { it.copy(bootstrapped = true, needsOnboarding = true) }
                        }
                    }
                }
            }
        }
    }

    private fun activateLocalBundle(bundle: ChartBundleEntity) {
        activeBundle = bundle
        val meta = BundleMappers.parseProfileMeta(bundle.profileJson) ?: return

        profileObserversJob?.cancel()
        profileObserversJob = viewModelScope.launch {
            val goalEntity = repo.db.discoveryDao().getGoals(meta.id)
            activeGoals = goalEntity?.let { repo.decodeStringList(it.goalsJson) }?.ifEmpty { listOf("career") } ?: listOf("career")
            val orderedNodes = DiscoveryPathEngine.orderNodes(discoveryCatalog.nodes, meta.timeCertainty, activeGoals)

            // Instant <100ms offline render from Room bundle first
            recomputeDerivedState(meta, bundle, orderedNodes, emptyList(), emptyList(), emptySet(), emptyList())

            // Observe live Room streams for this profile
            launch {
                combine(
                    repo.db.journalDao().observeEntries(meta.id),
                    repo.db.journalDao().observeMilestones(meta.id),
                    repo.db.discoveryDao().observeNodes(meta.id),
                    repo.db.chatDao().observeMessages(meta.id),
                ) { entries, milestones, nodes, chats ->
                    Quadruple(entries, milestones, nodes, chats)
                }.collect { (entries, milestones, nodes, chats) ->
                    val uiEntries = entries.map { e ->
                        JournalEntryUi(
                            id = e.id,
                            timestampLabel = e.entryDate,
                            mood = e.mood,
                            energy = e.energy,
                            kind = e.kind,
                            tags = repo.decodeStringList(e.tagsJson),
                            note = e.note,
                            sky = FrozenSkySnapshotCodec.decode(e.skySnapshotJson),
                            createdAtMillis = runCatching { Instant.parse(e.createdAt).toEpochMilli() }.getOrDefault(0L),
                        )
                    }
                    val uiMilestones = milestones.map { MilestoneUi(it.id, it.title, it.eventDate, it.category) }
                    val litIds = nodes.filter { it.state == "lit" }.map { it.id }.toSet()
                    val uiChats = chats.map { c ->
                        AskUiMessage(
                            id = c.id,
                            role = c.role,
                            content = c.content,
                            responseType = c.responseType ?: "answer",
                            evidenceIds = repo.decodeStringList(c.evidenceIdsJson),
                            createdAtMillis = runCatching { Instant.parse(c.createdAt).toEpochMilli() }.getOrDefault(0L),
                        )
                    }
                    recomputeDerivedState(meta, bundle, orderedNodes, uiEntries, uiMilestones, litIds, uiChats)
                }
            }

            // Background live refresh from https://129.225.104.43.sslip.io
            launch {
                val refreshedBundle = repo.revalidateBundleIfNeeded(bundle)
                activeBundle = refreshedBundle
                val (todayRaw, tomorrowRaw) = repo.getOrFetchTodayAndTomorrow(meta)
                activeTodayJson = todayRaw
                activeTomorrowJson = tomorrowRaw
                val now = LocalDate.now()
                selectedCalYear = now.year
                selectedCalMonth = now.monthValue
                activeCalendarJson = repo.fetchCalendarJson(meta, selectedCalYear, selectedCalMonth)
                refreshAfterNetwork(meta, refreshedBundle, orderedNodes)
            }
        }
    }

    private suspend fun refreshAfterNetwork(
        meta: ProfileMeta,
        bundle: ChartBundleEntity,
        orderedNodes: List<DiscoveryNodeSpec>,
    ) {
        val st = _uiState.value
        recomputeDerivedState(
            meta = meta,
            bundle = bundle,
            orderedNodes = orderedNodes,
            entries = st.journalEntries,
            milestones = st.milestones,
            litIds = st.litNodeIds,
            chats = st.chatMessages,
        )
        // Update Today open tracking for >8 opens constructive redirect & >72h Welcome-Back
        val sky = _uiState.value.todaySky
        if (sky != null) {
            val nowMs = System.currentTimeMillis()
            val bandChanged = prefs.lastSeenBand != null && prefs.lastSeenBand != sky.currentBand.name
            val horaChanged = prefs.lastSeenHora != null && prefs.lastSeenHora != sky.currentHora.ruler.name
            val sameDay = prefs.lastOpenedAt > 0 &&
                Instant.ofEpochMilli(prefs.lastOpenedAt).atZone(ZoneId.systemDefault()).toLocalDate() == LocalDate.now()
            val nextOpens = if (sameDay) prefs.openedTodayCount + 1 else 1
            val redirect = TodaySlotArbiter.shouldShowConstructiveRedirect(nextOpens, bandChanged, horaChanged)
            prefs = prefs.copy(
                openedTodayCount = nextOpens,
                lastOpenedAt = nowMs,
                lastSeenBand = sky.currentBand.name,
                lastSeenHora = sky.currentHora.ruler.name,
            )
            repo.savePreferences(prefs)
            val cached = repo.db.chartDao().getLatestTodaySkyForProfile(meta.id)
            val staleLine = computeStaleStatusLine(activeTodayJson != null, cached?.fetchedAt)
            _uiState.update { it.copy(showConstructiveRedirect = redirect, staleStatusLine = staleLine) }
            runCatching { KundliWidgetUpdater.updateAllWidgets(app) }
        }
    }

    private fun computeStaleStatusLine(hasTodayData: Boolean, fetchedAtMs: Long?): String? {
        if (!hasTodayData) return "Offline · Connect to refresh today's sky"
        if (fetchedAtMs == null) return null
        val ageHours = (System.currentTimeMillis() - fetchedAtMs) / 3_600_000L
        if (ageHours >= 6L) {
            val hhmm = Instant.ofEpochMilli(fetchedAtMs).atZone(ZoneId.systemDefault()).toLocalTime()
            return String.format(Locale.US, "Showing your sky from %02d:%02d", hhmm.hour, hhmm.minute)
        }
        return null
    }

    private fun recomputeDerivedState(
        meta: ProfileMeta,
        bundle: ChartBundleEntity,
        orderedNodes: List<DiscoveryNodeSpec>,
        entries: List<JournalEntryUi>,
        milestones: List<MilestoneUi>,
        litIds: Set<String>,
        chats: List<AskUiMessage>,
    ) {
        val todaySky = activeTodayJson?.let {
            BundleMappers.mapTodaySkyState(it, activeTomorrowJson, bundle.level2Json, meta.cityName)
        } ?: fallbackOfflineTodaySky(meta.cityName)

        val horaHouse = BundleMappers.findHoraRulerNatalHouse(bundle.level1Json, todaySky.currentHora.ruler)
        val personalHook = TodaySlotArbiter.resolvePersonalHook(
            band = todaySky.currentBand,
            horaRuler = todaySky.currentHora.ruler,
            factors = todaySky.activeFactors,
            horaRulerNatalHouse = horaHouse,
            timeCertainty = meta.timeCertainty,
        )

        val primaryGoal = activeGoals.firstOrNull() ?: "career"
        val (goalLabel, goalHouse) = goalToHouse(primaryGoal)
        val chartUi = BundleMappers.mapChartUiState(
            level1Json = bundle.level1Json,
            level2Json = bundle.level2Json,
            todayJson = activeTodayJson,
            primaryGoalLabel = goalLabel,
            primaryGoalHouse = goalHouse,
        )
        val targetYm = YearMonth.of(selectedCalYear, selectedCalMonth)
        val notedDays = buildSet {
            entries.forEach { entry ->
                runCatching { LocalDate.parse(entry.timestampLabel.take(10)) }.getOrNull()?.let { d ->
                    if (YearMonth.from(d) == targetYm) add(d.dayOfMonth)
                }
            }
            milestones.forEach { ms ->
                runCatching { LocalDate.parse(ms.eventDate.take(10)) }.getOrNull()?.let { d ->
                    if (YearMonth.from(d) == targetYm) add(d.dayOfMonth)
                }
            }
        }
        val timeUi = BundleMappers.mapTimeTabState(
            level1Json = bundle.level1Json,
            level2Json = bundle.level2Json,
            calendarJson = activeCalendarJson,
            todayJson = activeTodayJson,
            notedDaysOfMonth = notedDays,
            requestedYear = selectedCalYear,
            requestedMonth = selectedCalMonth,
        )

        val distinctSamples = mutableListOf<CheckInMoodSample>()
        entries.reversed().forEach { entry ->
            if (distinctSamples.none { it.band == entry.sky.band }) {
                distinctSamples.add(CheckInMoodSample(entry.mood, entry.sky.band, entry.sky.horaRuler))
            }
        }

        val todayDate = LocalDate.now()
        val weekStart = todayDate.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY))
        val entriesThisWeekList = entries.filter { entry ->
            val d = runCatching { LocalDate.parse(entry.timestampLabel.take(10)) }.getOrNull()
            d != null && !d.isBefore(weekStart) && !d.isAfter(todayDate)
        }
        val daysThisWeek = entriesThisWeekList
            .mapNotNull { runCatching { LocalDate.parse(it.timestampLabel.take(10)).dayOfWeek.value - 1 }.getOrNull() }
            .toSet()

        val yesterdayIso = todayDate.minusDays(1).toString()
        val yesterdaySample = entries.firstOrNull { it.timestampLabel.startsWith(yesterdayIso) }?.let { e ->
            CheckInMoodSample(e.mood, e.sky.band, e.sky.horaRuler)
        }
        val todayTargetHoraTime = yesterdaySample?.let { sample ->
            todaySky.hourlyWave.firstOrNull { it.horaRuler == sample.horaRuler }
                ?.let { String.format(Locale.US, "%02d:00", it.hour) }
        }
        val weeklyReviewHeadline = JournalPatternsCalculator.computeWeeklyReviewHeadline(entriesThisWeekList)
        val liveSkyEvent = BundleMappers.detectLiveSkyEvent(bundle.level1Json, activeTodayJson)

        val nextNode = DiscoveryPathEngine.nextUnlitNode(orderedNodes, litIds)
        val actTwo = DiscoveryPathEngine.isMapComplete(orderedNodes, litIds)
        val (_, _, moonNak) = BundleMappers.extractNatalSummary(bundle.level1Json)

        val nowMs = System.currentTimeMillis()
        val hoursSinceLastOpen = if (prefs.lastOpenedAt > 0) (nowMs - prefs.lastOpenedAt) / 3_600_000L else 0L
        val daysSinceLaunch = if (prefs.firstLaunchAt > 0) ((nowMs - prefs.firstLaunchAt) / 86_400_000L).toInt() else 0

        val activeSlot = TodaySlotArbiter.resolveTodaySlot(
            TodayArbiterInput(
                distressTriggered = _uiState.value.distressTriggered,
                hoursSinceLastOpen = hoursSinceLastOpen,
                shiftWhileAwaySummary = if (hoursSinceLastOpen >= 72L) "Your sky rhythm shifted into ${todaySky.currentBand.label}." else null,
                currentBand = todaySky.currentBand,
                ahaCardState = prefs.ahaCardState,
                distinctBandSamples = distinctSamples,
                isSunday = todayDate.dayOfWeek == DayOfWeek.SUNDAY,
                weeklyReviewViewedThisWeek = prefs.lastWeeklyReviewWeekStart == weekStart.toString(),
                weeklyReviewPatternHeadline = weeklyReviewHeadline,
                entriesThisWeek = daysThisWeek.size,
                liveSkyEvent = liveSkyEvent,
                daysSinceFirstLaunch = daysSinceLaunch,
                yesterdayHoraMoodSample = yesterdaySample,
                todayTargetHoraTime = todayTargetHoraTime,
                primaryGoalLabel = goalLabel,
                primaryGoalHouse = goalHouse,
                actTwoEnabled = actTwo,
                nextDiscoveryNode = nextNode?.let { TodayDynamicSlot.CuriosityNode(it.id, it.title, it.story.hookTemplate) },
                nextActTwoCycle = DiscoveryPathEngine.nextActTwoCycle(daysSinceLaunch, moonNak, null),
            ),
        )

        _uiState.update {
            it.copy(
                bootstrapped = true,
                needsOnboarding = false,
                activeProfile = meta,
                todaySky = todaySky,
                personalHookLine = personalHook,
                activeSlot = activeSlot,
                isEveningAfter19 = LocalTime.now().hour >= 19,
                chartState = chartUi,
                timeState = timeUi,
                journalEntries = entries,
                milestones = milestones,
                daysLoggedThisWeek = daysThisWeek,
                orderedDiscoveryNodes = orderedNodes,
                litNodeIds = litIds,
                chatMessages = chats,
            )
        }
    }

    fun computeOnboardingProfile(result: OnboardingResult, place: ResolvedPlace) {
        viewModelScope.launch {
            _uiState.update { it.copy(onboardingComputing = true, onboardingError = null) }
            val created = repo.createProfileFromOnboarding(result, place, discoveryCatalog.nodes)
            created.onSuccess { entity ->
                _uiState.update {
                    it.copy(
                        onboardingComputing = false,
                        onboardingComputedLevel1Json = entity.level1Json,
                    )
                }
                activateLocalBundle(entity)
            }.onFailure { err ->
                _uiState.update {
                    it.copy(
                        onboardingComputing = false,
                        onboardingError = "Could not reach server (${err.message ?: "offline"}). Check internet and retry.",
                    )
                }
            }
        }
    }

    fun finishOnboarding() {
        _uiState.update { it.copy(needsOnboarding = false, onboardingComputedLevel1Json = null) }
    }

    fun switchProfile(profileId: String) {
        viewModelScope.launch {
            val bundle = repo.db.chartDao().getBundle(profileId) ?: return@launch
            prefs = prefs.copy(activeProfileId = profileId)
            repo.savePreferences(prefs)
            activeTodayJson = null
            activeTomorrowJson = null
            activeCalendarJson = null
            activateLocalBundle(bundle)
        }
    }

    fun refreshTodaySky() {
        val meta = _uiState.value.activeProfile ?: return
        val bundle = activeBundle ?: return
        viewModelScope.launch {
            _uiState.update { it.copy(isRefreshingToday = true) }
            val (todayRaw, tomorrowRaw) = repo.getOrFetchTodayAndTomorrow(meta, forceRefresh = true)
            activeTodayJson = todayRaw
            activeTomorrowJson = tomorrowRaw
            val st = _uiState.value
            recomputeDerivedState(
                meta = meta,
                bundle = bundle,
                orderedNodes = st.orderedDiscoveryNodes,
                entries = st.journalEntries,
                milestones = st.milestones,
                litIds = st.litNodeIds,
                chats = st.chatMessages,
            )
            _uiState.update { it.copy(isRefreshingToday = false) }
        }
    }

    fun switchTravelLocation(place: ResolvedPlace) {
        val meta = _uiState.value.activeProfile ?: return
        val bundle = activeBundle ?: return
        viewModelScope.launch {
            val (todayRaw, tomorrowRaw) = repo.getOrFetchTodayAndTomorrow(meta, overridePlace = place, forceRefresh = true)
            activeTodayJson = todayRaw
            activeTomorrowJson = tomorrowRaw
            val st = _uiState.value
            val updatedMeta = meta.copy(cityName = place.name, lat = place.lat, lon = place.lon, tzId = place.tzId)
            recomputeDerivedState(updatedMeta, bundle, st.orderedDiscoveryNodes, st.journalEntries, st.milestones, st.litNodeIds, st.chatMessages)
        }
    }

    fun submitCheckIn(mood: Int, energy: Int, kind: String, tags: List<String>, note: String) {
        val meta = _uiState.value.activeProfile ?: return
        val sky = _uiState.value.todaySky ?: return
        val nowMs = System.currentTimeMillis()
        val recentMoods = _uiState.value.journalEntries.map { it.mood to it.createdAtMillis }

        // Strict on-device safety evaluation BEFORE Room write or network sync (§7.3)
        when (SafetyEvaluator.evaluate(note, mood, recentMoods, nowMs, safetyResources)) {
            is SafetyCheckResult.Triggered -> {
                _uiState.update { it.copy(distressTriggered = true) }
                return
            }
            SafetyCheckResult.Clear -> Unit
        }

        val nowIso = Instant.now().toString()
        val frozenSky = BundleMappers.extractLiveFrozenSkySnapshot(activeTodayJson, sky, activeBundle?.level1Json)
        val entity = JournalEntryEntity(
            id = "je_$nowMs",
            profileId = meta.id,
            entryDate = LocalDate.now().toString(),
            mood = mood,
            energy = energy,
            focus = energy,
            kind = kind,
            tagsJson = json.encodeToString(ListSerializer(String.serializer()), tags),
            note = note,
            skySnapshotJson = FrozenSkySnapshotCodec.encode(frozenSky),
            createdAt = nowIso,
            updatedAt = nowIso,
        )
        viewModelScope.launch {
            repo.saveJournalEntryAndSync(entity)
        }
    }

    fun addTagToLatestEntry(tag: String) {
        val meta = _uiState.value.activeProfile ?: return
        val latest = _uiState.value.journalEntries.firstOrNull() ?: return
        if (latest.tags.contains(tag)) return
        val nowIso = Instant.now().toString()
        val updated = JournalEntryEntity(
            id = latest.id,
            profileId = meta.id,
            entryDate = latest.timestampLabel,
            mood = latest.mood,
            energy = latest.energy,
            focus = latest.energy,
            kind = latest.kind,
            tagsJson = json.encodeToString(ListSerializer(String.serializer()), latest.tags + tag),
            note = latest.note,
            skySnapshotJson = FrozenSkySnapshotCodec.encode(latest.sky),
            createdAt = Instant.ofEpochMilli(latest.createdAtMillis).toString(),
            updatedAt = nowIso,
        )
        viewModelScope.launch { repo.saveJournalEntryAndSync(updated) }
    }

    fun addMilestone(title: String, date: String, category: String) {
        val meta = _uiState.value.activeProfile ?: return
        val entity = LifeEventEntity(
            id = "ms_${System.currentTimeMillis()}",
            profileId = meta.id,
            title = title,
            eventDate = date,
            category = category,
            updatedAt = Instant.now().toString(),
        )
        viewModelScope.launch { repo.saveMilestoneAndSync(entity) }
    }

    fun lightDiscoveryNode(node: DiscoveryNodeSpec, source: String = "story") {
        val meta = _uiState.value.activeProfile ?: return
        viewModelScope.launch { repo.lightDiscoveryNode(meta.id, node.id, node.ring, source) }
    }

    fun sendAskQuestion(question: String, deep: Boolean) {
        val meta = _uiState.value.activeProfile ?: return
        viewModelScope.launch {
            _uiState.update {
                it.copy(
                    liveStepTicker = "Connecting to KundliFlow engine…",
                    liveTraceSteps = listOf("Connecting to KundliFlow engine…"),
                )
            }
            val result = repo.streamAskCopilot(meta.id, question, deep) { ev ->
                when (ev) {
                    is AskSseEvent.Step -> _uiState.update {
                        it.copy(
                            liveStepTicker = ev.label,
                            liveTraceSteps = it.liveTraceSteps + ev.label,
                        )
                    }
                    is AskSseEvent.Result -> {
                        _uiState.update { it.copy(liveStepTicker = null, liveTraceSteps = emptyList()) }
                        viewModelScope.launch {
                            repo.persistAssistantMessage(meta.id, ev.answer, ev.responseType, ev.evidenceIds)
                        }
                    }
                    is AskSseEvent.Error -> {
                        _uiState.update { it.copy(liveStepTicker = null, liveTraceSteps = emptyList()) }
                        viewModelScope.launch {
                            repo.persistAssistantMessage(meta.id, ev.message, "level2_fallback", emptyList())
                        }
                    }
                }
            }
            result.onFailure { err ->
                _uiState.update { it.copy(liveStepTicker = null, liveTraceSteps = emptyList()) }
                repo.persistAssistantMessage(
                    meta.id,
                    "Offline fallback (${err.message ?: "no network"}): your static chart readings remain available across all Rungs 1–3.",
                    "level2_fallback",
                    emptyList(),
                )
            }
        }
    }

    fun clearChatHistory() {
        val meta = _uiState.value.activeProfile ?: return
        viewModelScope.launch { repo.clearConversation(meta.id) }
    }

    fun dismissAhaCard() {
        viewModelScope.launch {
            prefs = prefs.copy(ahaCardState = "dismissed")
            repo.savePreferences(prefs)
            _uiState.update { it.copy(activeSlot = TodayDynamicSlot.CuriosityNode("core.moon_sign", "Explore chart", "Tap to continue your constellation.")) }
        }
    }

    fun setDetailLevel(level: String) {
        viewModelScope.launch {
            prefs = prefs.copy(detailLevel = level)
            repo.savePreferences(prefs)
            _uiState.update { it.copy(detailLevel = level) }
        }
    }

    fun setChartStyle(style: ChartStyle) {
        viewModelScope.launch {
            prefs = prefs.copy(chartStyle = if (style == ChartStyle.SOUTH) "south" else "north")
            repo.savePreferences(prefs)
            _uiState.update { it.copy(chartStyle = style) }
        }
    }

    fun setQuietHours(start: String, end: String) {
        viewModelScope.launch {
            prefs = prefs.copy(quietHoursStart = start, quietHoursEnd = end)
            repo.savePreferences(prefs)
            _uiState.update { it.copy(quietHoursStart = start, quietHoursEnd = end) }
        }
    }

    fun setMorningNotificationsEnabled(enabled: Boolean) {
        repo.authStore.setMorningNotificationEnabled(enabled)
        _uiState.update {
            it.copy(
                morningNotificationsEnabled = enabled,
                statusBanner = if (enabled) "Calm Morning Sky summary enabled (respects quiet hours)." else "Morning notifications turned off.",
            )
        }
    }

    fun signInWithGoogle(activityContext: Context) {
        viewModelScope.launch {
            _uiState.update { it.copy(authBusy = true, authMessage = null) }
            val idTokenRes = GoogleSignInHelper.requestGoogleIdToken(activityContext)
            idTokenRes.onFailure { err ->
                _uiState.update {
                    it.copy(
                        authBusy = false,
                        authMessage = err.message ?: "Google Sign-In could not complete.",
                        statusBanner = err.message ?: "Google Sign-In could not complete.",
                    )
                }
                return@launch
            }
            val idToken = idTokenRes.getOrThrow()
            repo.signInWithGoogleIdToken(idToken).onSuccess { user ->
                val synced = repo.syncCloudProfilesToRoom()
                val msg = if (synced > 0) {
                    "Signed in as ${user.email} · Synced $synced chart(s) from your account."
                } else {
                    "Signed in as ${user.email}."
                }
                _uiState.update {
                    it.copy(
                        authBusy = false,
                        signedInUser = user,
                        authMessage = msg,
                        statusBanner = msg,
                    )
                }
                if (synced > 0 && activeBundle == null) {
                    repo.db.chartDao().getAllBundlesOnce().firstOrNull()?.let { activateLocalBundle(it) }
                }
            }.onFailure { err ->
                _uiState.update {
                    it.copy(
                        authBusy = false,
                        authMessage = "Server verification failed (${err.message ?: "offline"}).",
                        statusBanner = "Google sign-in server verification failed.",
                    )
                }
            }
        }
    }

    fun signInWithEmail(email: String, name: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(authBusy = true, authMessage = null) }
            repo.signInWithDevEmail(email, name).onSuccess { user ->
                _uiState.update {
                    it.copy(
                        authBusy = false,
                        signedInUser = user,
                        authMessage = "Signed in as ${user.email}",
                        statusBanner = "Connected sync account (${user.email}).",
                    )
                }
            }.onFailure { err ->
                _uiState.update {
                    it.copy(
                        authBusy = false,
                        authMessage = "Sync sign-in unavailable (${err.message ?: "offline"}). Local vault remains active.",
                        statusBanner = "Sign-in unavailable right now; local-first vault remains active.",
                    )
                }
            }
        }
    }

    fun signOut() {
        repo.signOut()
        _uiState.update {
            it.copy(
                signedInUser = null,
                statusBanner = "Signed out. Local charts and journal entries remain safely on this device.",
            )
        }
    }

    fun updateActiveProfile(
        name: String,
        birthDate: String,
        birthTime: String,
        place: ResolvedPlace,
        timeCertainty: String,
        ayanamsa: String,
    ) {
        val currentId = _uiState.value.activeProfile?.id ?: return
        viewModelScope.launch {
            _uiState.update { it.copy(updatingProfile = true, statusBanner = null) }
            repo.updateExistingProfile(
                existingId = currentId,
                name = name,
                birthDate = birthDate,
                birthTime = birthTime,
                place = place,
                timeCertainty = timeCertainty,
                ayanamsa = ayanamsa,
            ).onSuccess { updated ->
                activeTodayJson = null
                activeTomorrowJson = null
                activeCalendarJson = null
                _uiState.update {
                    it.copy(
                        updatingProfile = false,
                        statusBanner = "Birth details updated & chart recalculated (v${updated.bundleVersion}).",
                    )
                }
                activateLocalBundle(updated)
            }.onFailure { err ->
                _uiState.update {
                    it.copy(
                        updatingProfile = false,
                        statusBanner = "Could not recalculate profile (${err.message ?: "offline"}).",
                    )
                }
            }
        }
    }

    fun restoreVaultFromJson(rawJson: String) {
        val pid = _uiState.value.activeProfile?.id ?: return
        viewModelScope.launch {
            repo.restoreVaultBackup(pid, rawJson).onSuccess { count ->
                _uiState.update { it.copy(statusBanner = "Restored $count journal & milestone items into your vault.") }
            }.onFailure { err ->
                _uiState.update { it.copy(statusBanner = "Restore failed: ${err.message ?: "invalid JSON"}") }
            }
        }
    }

    suspend fun buildVaultBackupJsonAsync(): String {
        val pid = _uiState.value.activeProfile?.id ?: return "{}"
        return repo.buildFullVaultBackupJson(pid)
    }

    fun recordMathTap() {
        viewModelScope.launch {
            val next = prefs.mathPromptShownCount + 1
            prefs = prefs.copy(mathPromptShownCount = next)
            repo.savePreferences(prefs)
            _uiState.update { it.copy(mathPromptShownCount = next) }
        }
    }

    fun clearDistressFlag() {
        _uiState.update { it.copy(distressTriggered = false) }
    }

    fun openSupportHelplines() {
        _uiState.update { it.copy(distressTriggered = true) }
    }

    fun editLatestCheckInMood(newMood: Int) {
        val meta = _uiState.value.activeProfile ?: return
        val latest = _uiState.value.journalEntries.firstOrNull() ?: return
        val nowIso = Instant.now().toString()
        val updated = JournalEntryEntity(
            id = latest.id,
            profileId = meta.id,
            entryDate = latest.timestampLabel,
            mood = newMood.coerceIn(1, 5),
            energy = latest.energy,
            focus = latest.energy,
            kind = latest.kind,
            tagsJson = json.encodeToString(ListSerializer(String.serializer()), latest.tags),
            note = latest.note,
            skySnapshotJson = FrozenSkySnapshotCodec.encode(latest.sky),
            createdAt = Instant.ofEpochMilli(latest.createdAtMillis).toString(),
            updatedAt = nowIso,
        )
        viewModelScope.launch { repo.saveJournalEntryAndSync(updated) }
    }

    fun undoLatestCheckIn() {
        val latest = _uiState.value.journalEntries.firstOrNull() ?: return
        viewModelScope.launch {
            repo.db.journalDao().softDeleteEntry(latest.id)
        }
    }

    fun resetDataVault() {
        viewModelScope.launch {
            repo.resetAllLocalData()
            activeBundle = null
            activeTodayJson = null
            activeTomorrowJson = null
            activeCalendarJson = null
            _uiState.value = KundliAppUiState(bootstrapped = true, needsOnboarding = true)
        }
    }

    fun resolveSubjectReading(subject: Subject): SubjectReadingContent {
        val b = activeBundle
        return if (b != null) {
            BundleMappers.mapSubjectReading(
                subject = subject,
                level1Json = b.level1Json,
                level2Json = b.level2Json,
                todaySky = _uiState.value.todaySky,
                detailLevel = _uiState.value.detailLevel,
            )
        } else {
            SubjectReadingContent(
                title = "Chart Subject",
                subtitle = "Loading chart…",
                peekSummary = "Add your birth details to view verified Vedic calculations.",
                peekFacts = emptyList(),
                findings = emptyList(),
                telemetryRows = emptyList(),
            )
        }
    }

    fun resolveChartForVarga(varga: VargaType): ChartUiState? =
        resolveChartVariant(varga, ChartReference.LAGNA)

    fun resolveChartVariant(varga: VargaType, reference: ChartReference = ChartReference.LAGNA): ChartUiState? {
        val b = activeBundle ?: return _uiState.value.chartState
        val (goalLabel, goalHouse) = goalToHouse(activeGoals.firstOrNull() ?: "career")
        return BundleMappers.mapChartUiState(b.level1Json, b.level2Json, activeTodayJson, goalLabel, goalHouse, varga, reference)
    }

    fun getToolsStudioData(): ToolsStudioData =
        ToolsDataExtractor.extract(activeBundle?.level1Json, activeBundle?.level2Json)

    suspend fun fetchVarshaphalForYear(year: Int): VarshaphalViewData? {
        val pid = _uiState.value.activeProfile?.id ?: return null
        val raw = repo.fetchVarshaphalJson(pid, year) ?: return null
        return ToolsDataExtractor.parseVarshaphalEndpointJson(raw)
    }

    fun deleteProfile(profileId: String) {
        viewModelScope.launch {
            repo.deleteProfileCascade(profileId)
            if (activeBundle?.profileId == profileId) {
                activeBundle = null
                activeTodayJson = null
                activeTomorrowJson = null
                activeCalendarJson = null
                _uiState.update { it.copy(activeProfile = null, needsOnboarding = it.savedProfiles.size <= 1) }
            }
        }
    }

    fun buildLlmDossierMarkdown(): String {
        val meta = _uiState.value.activeProfile
        val (lagna, moon, nak) = activeBundle?.let { BundleMappers.extractNatalSummary(it.level1Json) }
            ?: Triple("—", "—", "—")
        val chapter = _uiState.value.todaySky?.currentChapterSubtitle ?: "Active Vimshottari Chapter"
        return ShareAndExportHelper.buildLlmDossierMarkdown(
            profileName = meta?.name ?: "Native",
            ascendantSign = lagna,
            moonSign = moon,
            moonNakshatra = nak,
            activeChapter = chapter,
            toolsData = getToolsStudioData(),
        )
    }

    fun buildVaultBackupJson(): String = ShareAndExportHelper.buildVaultBackupJson(
        profileJson = activeBundle?.profileJson ?: "{}",
        entries = emptyList(),
        milestones = emptyList(),
        exportedAtIso = Instant.now().toString(),
    )

    fun loadCalendarMonth(year: Int, month: Int) {
        val meta = _uiState.value.activeProfile ?: return
        val bundle = activeBundle ?: return
        selectedCalYear = year
        selectedCalMonth = month
        viewModelScope.launch {
            _uiState.update { it.copy(isCalendarLoading = true) }
            activeCalendarJson = repo.fetchCalendarJson(meta, year, month)
            val st = _uiState.value
            recomputeDerivedState(
                meta = meta,
                bundle = bundle,
                orderedNodes = st.orderedDiscoveryNodes,
                entries = st.journalEntries,
                milestones = st.milestones,
                litIds = st.litNodeIds,
                chats = st.chatMessages,
            )
            _uiState.update { it.copy(isCalendarLoading = false) }
        }
    }

    fun markWeeklyReviewViewed() {
        viewModelScope.launch {
            val weekStart = LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)).toString()
            prefs = prefs.copy(lastWeeklyReviewWeekStart = weekStart)
            repo.savePreferences(prefs)
            val meta = _uiState.value.activeProfile ?: return@launch
            val bundle = activeBundle ?: return@launch
            val st = _uiState.value
            recomputeDerivedState(meta, bundle, st.orderedDiscoveryNodes, st.journalEntries, st.milestones, st.litNodeIds, st.chatMessages)
        }
    }

    fun resolveSnapshotSubjectReading(snap: FrozenSkySnapshot, dateLabel: String): SubjectReadingContent =
        SubjectReadingContent(
            title = "${snap.band.label} Sky Snapshot",
            subtitle = "$dateLabel · Moon in ${snap.moonSign} · ${snap.horaRuler.displayName} Hora",
            activeHouseNumber = null,
            peekSummary = "Frozen at check-in: ${snap.band.label} (${if (snap.score > 0) "+${snap.score}" else "${snap.score}"}) during ${snap.horaRuler.displayName} Hora with Moon in ${snap.moonSign}.",
            peekFacts = listOf(
                SubjectFact("Band", snap.band.label),
                SubjectFact("Moon Sign", snap.moonSign),
                SubjectFact("SAV Bindus", "${snap.savBindus}"),
            ),
            findings = listOf(
                SubjectFindingItem("chandra", "Chandra Bala", snap.chandraBalaSummary, "Lunar support at the time you logged this entry."),
                SubjectFindingItem("tara", "Tara Bala", snap.taraBalaSummary, "Birth-star nakshatra transit alignment."),
            ),
            telemetryRows = listOf(
                SubjectTelemetryRow("Entry Date", dateLabel),
                SubjectTelemetryRow("Composite Score", if (snap.score > 0) "+${snap.score}" else "${snap.score}"),
                SubjectTelemetryRow("Active Hora Ruler", snap.horaRuler.displayName),
                SubjectTelemetryRow("Transiting Moon", snap.moonSign),
                SubjectTelemetryRow("Sarvashtakvarga Bindus", "${snap.savBindus} / 337"),
            ),
        )

    fun resolveDiscoveryRarityBadge(nodeId: String): String? =
        BundleMappers.resolveNodeRarityBadge(
            nodeId = nodeId,
            level1Json = activeBundle?.level1Json,
            level2Json = activeBundle?.level2Json,
            timeCertainty = _uiState.value.activeProfile?.timeCertainty ?: "exact",
        )

    fun extractActiveNatalSummary(): NatalSummary =
        activeBundle?.let { BundleMappers.extractNatalSummaryFull(it.level1Json) }
            ?: NatalSummary("—", "—", "—", "—")

    fun extractActiveTriadSummary(): Triple<String, String, String> {
        val s = extractActiveNatalSummary()
        return Triple(s.lagnaSign, s.moonSign, s.moonNakshatra)
    }

    fun lookupDashaForYear(year: Int): String =
        activeBundle?.let { BundleMappers.lookupDashaForYear(it.level1Json, year) }
            ?: "$year: Active Vimshottari Dasha"

    private fun goalToHouse(goal: String): Pair<String, Int> = when (goal) {
        "relationships" -> "Relationships" to 7
        "home_family" -> "Home" to 4
        "money" -> "Money" to 2
        "understanding_myself" -> "Self" to 1
        "daily_rhythm" -> "Daily Rhythm" to 6
        else -> "Career" to 10
    }

    private fun fallbackOfflineTodaySky(cityName: String): TodaySkyState {
        val hr = LocalTime.now().hour
        val wave = (0..23).map { h ->
            HourlyScorePoint(h, 0, SkyBand.Steady, PlanetId.JUPITER, emptyList())
        }
        return TodaySkyState(
            greeting = if (hr < 12) "Good morning" else if (hr < 17) "Good afternoon" else "Good evening",
            cityName = cityName,
            currentBand = SkyBand.Steady,
            currentScore = 0,
            currentHora = HoraSlot(1, PlanetId.JUPITER, "06:00", "07:00"),
            nextShiftTime = "Next Hora",
            nextShiftHora = PlanetId.VENUS,
            nextShiftBand = SkyBand.Steady,
            tomorrowOpeningSummary = null,
            currentChapterSubtitle = null,
            activeFactors = listOf(ScoreFactorItem("offline", "Cached Sky", 0, "Connect to refresh today's Hora & Moon transits.")),
            hourlyWave = wave,
            rahuKalamLabel = "—",
            bestWindowLabel = "Syncing…",
            goGentlyLabel = "—",
        )
    }
}

private data class Quadruple<A, B, C, D>(val first: A, val second: B, val third: C, val fourth: D)
