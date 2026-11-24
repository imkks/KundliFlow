package com.kundliflow.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.windowsizeclass.ExperimentalMaterial3WindowSizeClassApi
import androidx.compose.material3.windowsizeclass.WindowSizeClass
import androidx.compose.material3.windowsizeclass.calculateWindowSizeClass
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.kundliflow.app.data.remote.KundliApiClient
import com.kundliflow.app.ui.ask.AskCopilotSheet
import com.kundliflow.app.ui.ask.AskUiMessage
import com.kundliflow.app.ui.chart.ChartHouseData
import com.kundliflow.app.ui.chart.ChartPlanetPlacement
import com.kundliflow.app.ui.chart.ChartScreen
import com.kundliflow.app.ui.chart.ChartStyle
import com.kundliflow.app.ui.chart.ChartUiState
import com.kundliflow.app.ui.chart.DoshaAuditItem
import com.kundliflow.app.ui.chart.ShadbalaBarItem
import com.kundliflow.app.ui.discovery.DiscoveryMapSheet
import com.kundliflow.app.ui.discovery.DiscoveryNodeSpec
import com.kundliflow.app.ui.discovery.DiscoveryPathEngine
import com.kundliflow.app.ui.discovery.DiscoveryStorySheet
import com.kundliflow.app.ui.journal.FrozenSkySnapshot
import com.kundliflow.app.ui.journal.JournalEntryUi
import com.kundliflow.app.ui.journal.JournalScreen
import com.kundliflow.app.ui.journal.MilestoneUi
import com.kundliflow.app.ui.me.MeSheet
import com.kundliflow.app.ui.me.OrbitProfileItem
import com.kundliflow.app.ui.onboarding.OnboardingFlow
import com.kundliflow.app.ui.safety.DistressGroundingScreen
import com.kundliflow.app.ui.safety.SafetyCheckResult
import com.kundliflow.app.ui.safety.SafetyEvaluator
import com.kundliflow.app.ui.search.SearchOverlaySheet
import com.kundliflow.app.ui.shell.KundliFlowShell
import com.kundliflow.app.ui.shell.MainDestination
import com.kundliflow.app.ui.subject.PlanetId
import com.kundliflow.app.ui.subject.Rung
import com.kundliflow.app.ui.subject.Subject
import com.kundliflow.app.ui.subject.SubjectFact
import com.kundliflow.app.ui.subject.SubjectFindingItem
import com.kundliflow.app.ui.subject.SubjectFindingKind
import com.kundliflow.app.ui.subject.SubjectReadingContent
import com.kundliflow.app.ui.subject.SubjectRungNavigator
import com.kundliflow.app.ui.subject.SubjectSheet
import com.kundliflow.app.ui.subject.SubjectTelemetryRow
import com.kundliflow.app.ui.theme.KundliColors
import com.kundliflow.app.ui.theme.KundliFlowTheme
import com.kundliflow.app.ui.time.ActiveDashaState
import com.kundliflow.app.ui.time.DashaSystem
import com.kundliflow.app.ui.time.MonthDayCell
import com.kundliflow.app.ui.time.NextShiftDelta
import com.kundliflow.app.ui.time.SkyMoverItem
import com.kundliflow.app.ui.time.TimeScreen
import com.kundliflow.app.ui.time.TimeTabState
import com.kundliflow.app.ui.today.CheckInMoodSample
import com.kundliflow.app.ui.today.HoraSlot
import com.kundliflow.app.ui.today.HourlyScorePoint
import com.kundliflow.app.ui.today.ScoreFactorItem
import com.kundliflow.app.ui.today.SkyBand
import com.kundliflow.app.ui.today.TodayArbiterInput
import com.kundliflow.app.ui.today.TodayDynamicSlot
import com.kundliflow.app.ui.today.TodayScreen
import com.kundliflow.app.ui.today.TodaySkyState
import com.kundliflow.app.ui.today.TodaySlotArbiter

class MainActivity : ComponentActivity() {
    @OptIn(ExperimentalMaterial3WindowSizeClassApi::class)
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            val windowSizeClass = calculateWindowSizeClass(this)
            KundliFlowTheme {
                KundliFlowRootScreen(windowSizeClass = windowSizeClass)
            }
        }
    }
}

@Composable
private fun KundliFlowRootScreen(windowSizeClass: WindowSizeClass) {
    val context = LocalContext.current
    val safetyResources = remember { SafetyEvaluator.loadFromAssets(context) }
    val discoveryCatalog = remember { DiscoveryPathEngine.loadCatalogFromAssets(context) }
    val apiClient = remember { KundliApiClient() }
    var apiHealthOk by remember { mutableStateOf<Boolean?>(null) }

    LaunchedEffect(Unit) {
        apiHealthOk = apiClient.checkHealth().isSuccess
    }

    var activeDestination by remember { mutableStateOf(MainDestination.Today) }
    var showBackToTodayPill by remember { mutableStateOf(false) }
    var openJournalComposer by remember { mutableStateOf(false) }

    var showDiscoveryMap by remember { mutableStateOf(false) }
    var showMeSheet by remember { mutableStateOf(false) }
    var showSearchSheet by remember { mutableStateOf(false) }
    var showOnboarding by remember { mutableStateOf(false) }
    var chartStyle by remember { mutableStateOf(ChartStyle.NORTH) }
    var activeProfileId by remember { mutableStateOf("priya_1") }
    var showAskSheet by remember { mutableStateOf(false) }
    var askOriginContext by remember { mutableStateOf("Today · Flowing") }
    val chatMessages = remember { mutableStateListOf<AskUiMessage>() }
    var activeStoryNode by remember { mutableStateOf<DiscoveryNodeSpec?>(null) }
    val litNodeIds = remember { mutableStateOf(setOf("core.rising_sign", "core.moon_sign", "core.moon_nakshatra")) }
    val orderedDiscoveryNodes = remember(discoveryCatalog) {
        DiscoveryPathEngine.orderNodes(discoveryCatalog.nodes, "exact", listOf("career"))
    }
    val nextDiscoveryNode = DiscoveryPathEngine.nextUnlitNode(orderedDiscoveryNodes, litNodeIds.value)
    val actTwoEnabled = DiscoveryPathEngine.isMapComplete(orderedDiscoveryNodes, litNodeIds.value)

    var distressTriggered by remember { mutableStateOf(false) }
    var ahaCardState by remember { mutableStateOf("pending") }
    val journalEntries = remember { mutableStateListOf<JournalEntryUi>() }
    val milestones = remember { mutableStateListOf<MilestoneUi>() }
    val daysLoggedThisWeek = remember { mutableStateOf(setOf(0, 1)) }

    var activeSubject by remember { mutableStateOf<Subject?>(null) }
    var rungStack by remember { mutableStateOf<List<Rung>>(emptyList()) }
    var mathTapCount by remember { mutableIntStateOf(0) }
    var detailLevel by remember { mutableStateOf("balanced") }
    var mathPromptDismissed by remember { mutableStateOf(false) }

    val sky = remember { sampleTodaySkyState() }
    val personalHook = remember(sky) {
        TodaySlotArbiter.resolvePersonalHook(
            band = sky.currentBand,
            horaRuler = sky.currentHora.ruler,
            factors = sky.activeFactors,
            horaRulerNatalHouse = 10,
            timeCertainty = "exact",
        )
    }

    val distinctSamples = remember(journalEntries.size) {
        val list = mutableListOf<CheckInMoodSample>()
        journalEntries.reversed().forEach { entry ->
            if (list.none { it.band == entry.sky.band }) {
                list.add(CheckInMoodSample(entry.mood, entry.sky.band, entry.sky.horaRuler))
            }
        }
        list
    }

    val activeSlot = TodaySlotArbiter.resolveTodaySlot(
        TodayArbiterInput(
            distressTriggered = distressTriggered,
            currentBand = sky.currentBand,
            ahaCardState = ahaCardState,
            distinctBandSamples = distinctSamples,
            entriesThisWeek = daysLoggedThisWeek.value.size,
            actTwoEnabled = actTwoEnabled,
            nextDiscoveryNode = nextDiscoveryNode?.let {
                TodayDynamicSlot.CuriosityNode(it.id, it.title, it.story.hookTemplate)
            },
            nextActTwoCycle = DiscoveryPathEngine.nextActTwoCycle(0, "Revati", null),
        ),
    )

    // P0: Distress Safety Screen overrides all astrology UI immediately
    if (distressTriggered) {
        DistressGroundingScreen(
            resources = safetyResources,
            onReturnCalmly = { distressTriggered = false },
        )
        return
    }

    if (showOnboarding) {
        OnboardingFlow(
            onComplete = { showOnboarding = false },
        )
        return
    }

    fun submitCheckIn(mood: Int, energy: Int, kind: String, tags: List<String>, note: String) {
        val now = System.currentTimeMillis()
        val recentMoods = journalEntries.map { it.mood to it.createdAtMillis }
        when (SafetyEvaluator.evaluate(note, mood, recentMoods, now, safetyResources)) {
            is SafetyCheckResult.Triggered -> {
                // Zero persistence / zero transmission of triggering text (§7.3)
                distressTriggered = true
            }
            SafetyCheckResult.Clear -> {
                journalEntries.add(
                    0,
                    JournalEntryUi(
                        id = "je_$now",
                        timestampLabel = "Just now",
                        mood = mood,
                        energy = energy,
                        kind = kind,
                        tags = tags,
                        note = note,
                        sky = FrozenSkySnapshot(
                            band = sky.currentBand,
                            moonSign = "Pisces",
                            horaRuler = sky.currentHora.ruler,
                            chandraBalaSummary = "11th from natal Moon (+2)",
                            taraBalaSummary = "Sampat Tara (+2)",
                            savBindus = 31,
                        ),
                        createdAtMillis = now,
                    ),
                )
            }
        }
    }

    KundliFlowShell(
        windowSizeClass = windowSizeClass,
        activeProfileName = "Priya",
        activeDestination = activeDestination,
        showBackToTodayPill = showBackToTodayPill,
        onSelectDestination = {
            activeDestination = it
            showBackToTodayPill = false
        },
        onBackToToday = {
            activeDestination = MainDestination.Today
            showBackToTodayPill = false
        },
        onOpenProfileSheet = { showMeSheet = true },
        onOpenSearch = { showSearchSheet = true },
        onOpenAsk = {
            askOriginContext = "Viewing ${activeDestination.label}"
            showAskSheet = true
        },
    ) {
        when (activeDestination) {
            MainDestination.Today -> TodayScreen(
                sky = sky,
                personalHookLine = personalHook,
                activeSlot = activeSlot,
                hasLoggedAtLeastOnce = journalEntries.isNotEmpty(),
                isEveningAfter19 = false,
                showConstructiveRedirect = false,
                onTapHeroPeek = {
                    activeSubject = Subject.Finding("today.band", SubjectFindingKind.TRANSIT)
                    rungStack = listOf(Rung.Peek)
                },
                onQuickCheckIn = { mood -> submitCheckIn(mood, 3, "checkin", emptyList(), "") },
                onAddTagToLastCheckIn = { tag ->
                    val first = journalEntries.firstOrNull()
                    if (first != null && !first.tags.contains(tag)) {
                        journalEntries[0] = first.copy(tags = first.tags + tag)
                    }
                },
                onOpenFullComposer = {
                    activeDestination = MainDestination.Journal
                    openJournalComposer = true
                },
                onTapSlotAction = { slot ->
                    when (slot) {
                        is TodayDynamicSlot.FirstWeekNudge -> if (slot.targetTab == "chart") {
                            activeDestination = MainDestination.Chart
                            showBackToTodayPill = true
                        }
                        is TodayDynamicSlot.CuriosityNode -> {
                            activeStoryNode = orderedDiscoveryNodes.firstOrNull { it.id == slot.nodeId }
                        }
                        else -> {
                            activeSubject = Subject.Planet(PlanetId.MOON)
                            rungStack = listOf(Rung.Peek)
                        }
                    }
                },
                onDismissSlot = { slot ->
                    if (slot is TodayDynamicSlot.AhaMomentComparison) {
                        ahaCardState = "dismissed"
                    }
                },
                onTapExploreTopic = {
                    activeDestination = MainDestination.Chart
                    showBackToTodayPill = true
                },
                onTapCitySwitcher = {},
            )

            MainDestination.Journal -> JournalScreen(
                entries = journalEntries,
                milestones = milestones,
                daysLoggedThisWeek = daysLoggedThisWeek.value,
                weeklyGoal = 4,
                onTapSkySnapshot = { snap ->
                    activeSubject = Subject.Finding("snapshot.${snap.moonSign}", SubjectFindingKind.TRANSIT)
                    rungStack = listOf(Rung.Explain)
                },
                onSubmitCheckIn = ::submitCheckIn,
                externalOpenComposer = openJournalComposer,
                onExternalComposerHandled = { openJournalComposer = false },
            )

            MainDestination.Chart -> ChartScreen(
                chart = remember { sampleChartUiState() },
                initialStyle = chartStyle,
                onOpenSubject = { subj, rung ->
                    activeSubject = subj
                    rungStack = listOf(rung)
                },
                onJumpToTimeTab = {
                    activeDestination = MainDestination.Time
                    showBackToTodayPill = false
                },
            )

            MainDestination.Time -> TimeScreen(
                state = remember { sampleTimeTabState() },
                milestones = milestones,
                onOpenPeriodSubject = { subj, rung ->
                    activeSubject = subj
                    rungStack = listOf(rung)
                },
                onAddDateNote = {
                    activeDestination = MainDestination.Journal
                    openJournalComposer = true
                },
                onAddMilestone = { title, date, cat ->
                    milestones.add(0, MilestoneUi("ms_${System.currentTimeMillis()}", title, date, cat))
                },
                onExplainYearWithAi = { yr ->
                    askOriginContext = "Time-Machine · Year $yr"
                    showAskSheet = true
                },
            )
        }
    }

    val subject = activeSubject
    if (subject != null && rungStack.isNotEmpty()) {
        SubjectSheet(
            subject = subject,
            reading = sampleReading(subject, sky),
            rungStack = rungStack,
            showAlwaysDetailsPrompt = SubjectRungNavigator.shouldOfferFullDetailsPrompt(
                mathTapCount = mathTapCount,
                currentDetailLevel = detailLevel,
                promptAlreadyShown = mathPromptDismissed,
            ),
            onPushRung = { next ->
                if (next == Rung.Evidence) mathTapCount++
                rungStack = SubjectRungNavigator.pushRung(rungStack, next)
            },
            onPopRung = {
                val popped = SubjectRungNavigator.popRung(rungStack)
                if (popped == null) {
                    activeSubject = null
                    rungStack = emptyList()
                } else {
                    rungStack = popped
                }
            },
            onAcceptAlwaysDetails = {
                detailLevel = "full"
                mathPromptDismissed = true
            },
            onDismissAlwaysDetails = { mathPromptDismissed = true },
            onAskSubject = { subj ->
                activeSubject = null
                rungStack = emptyList()
                askOriginContext = "Inspecting $subj"
                showAskSheet = true
            },
            onReflectSubject = {
                activeSubject = null
                rungStack = emptyList()
                activeDestination = MainDestination.Journal
                openJournalComposer = true
            },
            onDismiss = { activeSubject = null; rungStack = emptyList() },
        )
    }

    if (showDiscoveryMap) {
        DiscoveryMapSheet(
            orderedNodes = orderedDiscoveryNodes,
            litNodeIds = litNodeIds.value,
            isMoonOnlyMode = false,
            onSelectNode = { node ->
                showDiscoveryMap = false
                activeStoryNode = node
            },
            onDismiss = { showDiscoveryMap = false },
        )
    }

    val storyNode = activeStoryNode
    if (storyNode != null) {
        DiscoveryStorySheet(
            node = storyNode,
            personalRevealText = "${storyNode.title} (${storyNode.subtitle}) — mapped from your natal chart.",
            rarityBadge = "Vargottama placement · same sign in D1 & D9 (~11%)",
            onOpenSubject = {
                activeStoryNode = null
                activeSubject = Subject.House(storyNode.subject.number ?: 10)
                rungStack = listOf(Rung.Explain)
            },
            onCompleteReflect = {
                litNodeIds.value = litNodeIds.value + storyNode.id
                activeStoryNode = null
                activeDestination = MainDestination.Journal
                openJournalComposer = true
            },
            onDismiss = { activeStoryNode = null },
        )
    }

    if (showAskSheet) {
        AskCopilotSheet(
            profileName = "Priya",
            originContextLabel = askOriginContext,
            messages = chatMessages,
            liveStepTicker = null,
            onSendQuestion = { q, deep ->
                val now = System.currentTimeMillis()
                chatMessages.add(
                    AskUiMessage(
                        id = "u_$now",
                        role = "user",
                        content = q,
                        createdAtMillis = now,
                        contextTag = askOriginContext,
                    ),
                )
                chatMessages.add(
                    AskUiMessage(
                        id = "a_${now + 1}",
                        role = "assistant",
                        content = "In Jyotish tradition (${if (deep) "Deep" else "Fast"}), your 10th house Saturn and Venus–Saturn chapter highlight steady, structured progress.",
                        evidenceIds = listOf("rule.h10.saturn", "dasha.venus.saturn"),
                        followUps = listOf("How does next month look?", "Which Hora fits best?"),
                        createdAtMillis = now + 1,
                    ),
                )
            },
            onClearHistory = { chatMessages.clear() },
            onTapEvidence = { subj ->
                showAskSheet = false
                activeSubject = subj
                rungStack = listOf(Rung.Explain)
            },
            onJumpToTiming = {
                showAskSheet = false
                activeDestination = MainDestination.Time
            },
            onOpenReflect = {
                showAskSheet = false
                activeDestination = MainDestination.Journal
                openJournalComposer = true
            },
            onExportDossier = {},
            onDismiss = { showAskSheet = false },
        )
    }

    if (showMeSheet) {
        MeSheet(
            profiles = listOf(
                OrbitProfileItem("priya_1", "Priya", "Taurus Rising · Pisces Moon", SkyBand.Flowing),
                OrbitProfileItem("arjun_2", "Arjun", "Leo Rising · Aries Moon", SkyBand.Steady),
            ),
            activeProfileId = activeProfileId,
            detailLevel = detailLevel,
            chartStyle = chartStyle,
            quietHoursLabel = "22:00–07:00",
            onSelectProfile = {
                activeProfileId = it
                showMeSheet = false
            },
            onAddProfile = {
                showMeSheet = false
                showOnboarding = true
            },
            onChangeDetailLevel = { detailLevel = it },
            onChangeChartStyle = { chartStyle = it },
            onOpenDiscoveryMap = {
                showMeSheet = false
                showDiscoveryMap = true
            },
            onDismiss = { showMeSheet = false },
        )
    }

    if (showSearchSheet) {
        SearchOverlaySheet(
            onSelectSubject = { subj ->
                showSearchSheet = false
                activeSubject = subj
                rungStack = listOf(Rung.Peek)
            },
            onDismiss = { showSearchSheet = false },
        )
    }
}

private fun sampleTimeTabState(): TimeTabState {
    val dashas = mapOf(
        DashaSystem.VIMSHOTTARI to ActiveDashaState(
            system = DashaSystem.VIMSHOTTARI,
            mahadashaLord = "Venus",
            mahadashaProgress = 0.62f,
            mahadashaRange = "2014–2034",
            antardashaLord = "Saturn",
            antardashaProgress = 0.45f,
            antardashaRange = "2024–2027",
            pratyantarLord = "Mercury",
            plainMeaning = "A season of steady craft, structured ambition, and durable partnerships.",
        ),
        DashaSystem.YOGINI to ActiveDashaState(
            system = DashaSystem.YOGINI,
            mahadashaLord = "Siddha",
            mahadashaProgress = 0.50f,
            mahadashaRange = "2022–2029",
            antardashaLord = "Sankata",
            antardashaProgress = 0.30f,
            antardashaRange = "2025–2026",
            pratyantarLord = "Mangala",
            plainMeaning = "Focus on clearing bottlenecks and clarifying priorities.",
        ),
        DashaSystem.CHARA to ActiveDashaState(
            system = DashaSystem.CHARA,
            mahadashaLord = "Aquarius",
            mahadashaProgress = 0.70f,
            mahadashaRange = "2021–2028",
            antardashaLord = "Pisces",
            antardashaProgress = 0.40f,
            antardashaRange = "2025–2026",
            pratyantarLord = "Aries",
            plainMeaning = "10th-house career themes blend with 11th-house allies.",
        ),
    )
    val days = (1..30).map { d ->
        val band = when {
            d % 5 == 0 -> SkyBand.GoGently
            d % 3 == 0 -> SkyBand.Flowing
            else -> SkyBand.Steady
        }
        MonthDayCell(
            dayOfMonth = d,
            band = band,
            score = when (band) { SkyBand.Flowing -> 4; SkyBand.Steady -> 1; SkyBand.GoGently -> -3 },
            hasNoteOrMilestone = d in listOf(4, 12, 19),
            purposes = if (band == SkyBand.Flowing) setOf("All", "Career", "Finance") else setOf("All", "Rest"),
            summary = "Sampat Tara · Good for focused work",
        )
    }
    return TimeTabState(
        activeDashas = dashas,
        nextShift = NextShiftDelta(
            shiftDate = "14 Jan 2027 · Venus–Mercury",
            windsDown = "Saturn's heavy restructuring pace",
            wakesUp = "Mercury's analytical & communication speed",
            houseFocusShift = "Career (H10) → Voice & Assets (H2)",
        ),
        monthTitle = "November 2026",
        monthDays = days,
        skyMovers = listOf(
            SkyMoverItem(PlanetId.JUPITER, "Gemini", 2, 4, "Expands learning and domestic comfort", "No Vedha obstruction", "K4"),
            SkyMoverItem(PlanetId.SATURN, "Pisces", 11, 1, "Asks for steady discipline in goals", "Clear transit", "K7"),
            SkyMoverItem(PlanetId.RAHU, "Aquarius", 10, 12, "Stirs unconventional career curiosity", "Clear transit", "K2"),
        ),
        sadeSatiStatus = "Peak Phase (Saturn over Natal Moon)",
    )
}

private fun sampleTodaySkyState(): TodaySkyState {
    val factors = listOf(
        ScoreFactorItem("chandra_bala", "Chandra Bala", 2, "Moon in 11th from natal Moon (+2)"),
        ScoreFactorItem("tara_bala", "Sampat Tara", 2, "Tara 2 Sampat (+2)"),
        ScoreFactorItem("hora", "Hora Alignment", 1, "Jupiter hora friendly to Lagna (+1)"),
    )
    val wave = (0..23).map { hr ->
        val score = when {
            hr in 16..18 -> 5
            hr in 10..11 -> -3
            else -> 1
        }
        HourlyScorePoint(
            hour = hr,
            score = score,
            band = when {
                score >= 3 -> SkyBand.Flowing
                score <= -2 -> SkyBand.GoGently
                else -> SkyBand.Steady
            },
            horaRuler = if (hr % 2 == 0) PlanetId.JUPITER else PlanetId.VENUS,
            factors = factors,
        )
    }
    return TodaySkyState(
        greeting = "Good evening",
        cityName = "Bengaluru",
        currentBand = SkyBand.Flowing,
        currentScore = 5,
        currentHora = HoraSlot(14, PlanetId.JUPITER, "18:40", "19:40"),
        nextShiftTime = "19:40",
        nextShiftHora = PlanetId.VENUS,
        nextShiftBand = SkyBand.Steady,
        tomorrowOpeningSummary = "Tomorrow opens Flowing · Best 09:15–11:30 (Venus Hora)",
        currentChapterSubtitle = "Venus Mahadasha · Saturn Antardasha",
        activeFactors = factors,
        hourlyWave = wave,
        rahuKalamLabel = "10:30 to 12:00",
        bestWindowLabel = "16:20 to 18:00",
        goGentlyLabel = "10:30 to 12:00",
    )
}

private fun sampleReading(subject: Subject, sky: TodaySkyState) = SubjectReadingContent(
    title = when (subject) {
        is Subject.Planet -> "${subject.id.displayName} in Pisces"
        is Subject.House -> "House ${subject.number}"
        is Subject.Finding -> "${sky.currentBand.label} (${if (sky.currentScore > 0) "+${sky.currentScore}" else "${sky.currentScore}"})"
        is Subject.Period -> "Current Chapter"
        is Subject.DivisionalChart -> subject.varga.domain
    },
    subtitle = "${sky.currentHora.ruler.displayName} Hora · ${sky.cityName}",
    activeHouseNumber = 11,
    peekSummary = "In Jyotish tradition, today's Moon transit aligns supportively with your natal Moon and Sampat Tara.",
    peekFacts = listOf(
        SubjectFact("Score", "+5 / +7"),
        SubjectFact("Hora", sky.currentHora.ruler.displayName),
        SubjectFact("Rahu Kalam", sky.rahuKalamLabel),
    ),
    findings = sky.activeFactors.map {
        SubjectFindingItem(
            id = it.id,
            title = it.name,
            plainMeaning = it.summary,
            whyDetail = "Calculated from sunrise-calibrated Hora & sidereal Moon position.",
        )
    },
    telemetryRows = listOf(
        SubjectTelemetryRow("Time-Quality Score", "+5 (-7..+7)"),
        SubjectTelemetryRow("Chandra Bala", "+2"),
        SubjectTelemetryRow("Tara Bala", "+2 (Sampat)"),
        SubjectTelemetryRow("Hora Alignment", "+1 (Jupiter)"),
    ),
)

private fun sampleChartUiState(): ChartUiState {
    val signs = listOf("Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces")
    val lords = listOf(
        PlanetId.MARS, PlanetId.VENUS, PlanetId.MERCURY, PlanetId.MOON,
        PlanetId.SUN, PlanetId.MERCURY, PlanetId.VENUS, PlanetId.MARS,
        PlanetId.JUPITER, PlanetId.SATURN, PlanetId.SATURN, PlanetId.JUPITER,
    )
    // Taurus rising (signIndex = 1)
    val houses = (1..12).map { h ->
        val signIdx = (1 + h - 1) % 12
        val planets = when (h) {
            1 -> listOf(ChartPlanetPlacement(PlanetId.VENUS, "Ve", 1, signIdx, signs[signIdx], "14°22'", "Own"))
            10 -> listOf(ChartPlanetPlacement(PlanetId.SATURN, "Sa", 10, signIdx, signs[signIdx], "08°41'", "Own", vargottama = true))
            11 -> listOf(ChartPlanetPlacement(PlanetId.MOON, "Mo", 11, signIdx, signs[signIdx], "18°14'", "Friendly"))
            else -> emptyList()
        }
        ChartHouseData(
            number = h,
            signIndex = signIdx,
            signName = signs[signIdx],
            lord = lords[signIdx],
            lordHouse = if (h == 10) 10 else if (h == 1) 1 else 11,
            savBindus = if (h in listOf(1, 10, 11)) 31 else 27,
            summaryLine = if (planets.isEmpty()) "Steered by ${lords[signIdx].displayName}" else "${planets.joinToString { it.id.displayName }} placed here",
            planets = planets,
            findings = emptyList(),
        )
    }
    return ChartUiState(
        ascendantSign = "Taurus",
        moonSign = "Pisces",
        primaryGoalLabel = "Career",
        primaryGoalHouse = 10,
        liveTransitMoonHouse = 11,
        houses = houses,
        shadbalaBars = listOf(
            ShadbalaBarItem(PlanetId.JUPITER, 1.32f),
            ShadbalaBarItem(PlanetId.SATURN, 1.19f),
            ShadbalaBarItem(PlanetId.MOON, 1.18f),
            ShadbalaBarItem(PlanetId.VENUS, 1.05f),
            ShadbalaBarItem(PlanetId.MARS, 0.92f),
        ),
        doshaAudits = listOf(
            DoshaAuditItem("Mangal Dosha", "Cancelled by Bhanga", true, "Jupiter aspect & sign placement neutralize Mangal intensity."),
            DoshaAuditItem("Kaal Sarp", "Verified Absent", true, "Planets span across both halves of the Rahu–Ketu axis."),
        ),
        activeYogaNames = listOf("Shasha Yoga", "Gaja Kesari Yoga"),
    )
}
