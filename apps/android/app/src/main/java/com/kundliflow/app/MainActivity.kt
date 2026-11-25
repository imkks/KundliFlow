package com.kundliflow.app

import android.Manifest
import android.content.Intent
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.windowsizeclass.ExperimentalMaterial3WindowSizeClassApi
import androidx.compose.material3.windowsizeclass.WindowSizeClass
import androidx.compose.material3.windowsizeclass.calculateWindowSizeClass
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import com.kundliflow.app.ui.KundliViewModel
import com.kundliflow.app.ui.ask.AskCopilotPage
import com.kundliflow.app.ui.chart.ChartScreen
import com.kundliflow.app.ui.common.PlacePickerSheet
import com.kundliflow.app.ui.discovery.DiscoveryNodeSpec
import com.kundliflow.app.ui.discovery.DiscoveryPathEngine
import com.kundliflow.app.ui.discovery.DiscoveryStorySheet
import com.kundliflow.app.ui.journal.JournalScreen
import com.kundliflow.app.ui.me.ShareAndExportHelper
import com.kundliflow.app.ui.onboarding.OnboardingFlow
import com.kundliflow.app.ui.pages.DiscoveryMapPage
import com.kundliflow.app.ui.pages.GlossaryPage
import com.kundliflow.app.ui.pages.SettingsAndVaultPage
import com.kundliflow.app.ui.pages.StrengthsAndYogasPage
import com.kundliflow.app.ui.pages.TimeMachinePage
import com.kundliflow.app.ui.pages.ToolsStudioPage
import com.kundliflow.app.ui.safety.DistressGroundingScreen
import com.kundliflow.app.ui.search.SearchOverlaySheet
import com.kundliflow.app.ui.shell.AppPage
import com.kundliflow.app.ui.shell.KundliFlowShell
import com.kundliflow.app.ui.shell.MainDestination
import com.kundliflow.app.ui.subject.PlanetId
import com.kundliflow.app.ui.subject.Rung
import com.kundliflow.app.ui.subject.Subject
import com.kundliflow.app.ui.subject.SubjectFindingKind
import com.kundliflow.app.ui.subject.SubjectReadingContent
import com.kundliflow.app.ui.subject.SubjectRungNavigator
import com.kundliflow.app.ui.subject.SubjectSheet
import com.kundliflow.app.ui.theme.KundliColors
import com.kundliflow.app.ui.theme.KundliFlowTheme
import com.kundliflow.app.ui.time.TimeScreen
import com.kundliflow.app.ui.today.TodayDynamicSlot
import com.kundliflow.app.ui.today.TodayScreen
import com.kundliflow.app.widget.KundliWidgetUpdater
import kotlinx.coroutines.launch
import java.time.Instant
import java.time.LocalDate
import java.time.LocalTime
import java.time.ZoneId

class MainActivity : ComponentActivity() {
    private val viewModel: KundliViewModel by viewModels()
    private val launchActionState = mutableStateOf<String?>(null)

    @OptIn(ExperimentalMaterial3WindowSizeClassApi::class)
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        launchActionState.value = intent?.getStringExtra(KundliWidgetUpdater.EXTRA_LAUNCH_ACTION)
        enableEdgeToEdge()
        setContent {
            val windowSizeClass = calculateWindowSizeClass(this)
            KundliFlowTheme {
                KundliFlowRootScreen(
                    windowSizeClass = windowSizeClass,
                    viewModel = viewModel,
                    pendingLaunchAction = launchActionState.value,
                    onConsumeLaunchAction = { launchActionState.value = null },
                )
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        launchActionState.value = intent.getStringExtra(KundliWidgetUpdater.EXTRA_LAUNCH_ACTION)
    }
}

@Composable
private fun KundliFlowRootScreen(
    windowSizeClass: WindowSizeClass,
    viewModel: KundliViewModel,
    pendingLaunchAction: String? = null,
    onConsumeLaunchAction: () -> Unit = {},
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val state by viewModel.uiState.collectAsState()

    val vaultRestoreLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.OpenDocument(),
    ) { uri ->
        if (uri != null) {
            runCatching {
                context.contentResolver.openInputStream(uri)?.bufferedReader()?.use { it.readText() }
            }.getOrNull()?.let { rawJson ->
                viewModel.restoreVaultFromJson(rawJson)
            }
        }
    }

    val notificationPermissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission(),
    ) { granted ->
        viewModel.setMorningNotificationsEnabled(granted)
    }

    var currentPage by remember { mutableStateOf(AppPage.Shell) }
    var activeDestination by remember { mutableStateOf(MainDestination.Today) }
    var showBackToTodayPill by remember { mutableStateOf(false) }
    var pendingChartTopic by remember { mutableStateOf<String?>(null) }
    var openJournalComposer by remember { mutableStateOf(false) }
    var showSearchSheet by remember { mutableStateOf(false) }
    var showTravelCityPicker by remember { mutableStateOf(false) }
    var showManualAddOnboarding by remember { mutableStateOf(false) }
    var askOriginContext by remember { mutableStateOf("Viewing Today") }
    var activeStoryNode by remember { mutableStateOf<DiscoveryNodeSpec?>(null) }
    var activeSubject by remember { mutableStateOf<Subject?>(null) }
    var activeSubjectReadingOverride by remember { mutableStateOf<SubjectReadingContent?>(null) }
    var rungStack by remember { mutableStateOf<List<Rung>>(emptyList()) }
    var mathPromptDismissed by remember { mutableStateOf(false) }

    // Predictive Back across all full-screen secondary pages
    BackHandler(enabled = currentPage != AppPage.Shell) {
        currentPage = AppPage.Shell
    }

    LaunchedEffect(pendingLaunchAction) {
        when (pendingLaunchAction) {
            KundliWidgetUpdater.ACTION_OPEN_CHECKIN -> {
                currentPage = AppPage.Shell
                activeDestination = MainDestination.Journal
                openJournalComposer = true
                onConsumeLaunchAction()
            }
            KundliWidgetUpdater.ACTION_OPEN_TODAY -> {
                currentPage = AppPage.Shell
                activeDestination = MainDestination.Today
                showBackToTodayPill = false
                onConsumeLaunchAction()
            }
        }
    }

    // P0: Distress Safety Screen overrides all astrology UI immediately (§7.3)
    if (state.distressTriggered) {
        DistressGroundingScreen(
            resources = viewModel.safetyResources,
            onReturnCalmly = { viewModel.clearDistressFlag() },
        )
        return
    }

    if (!state.bootstrapped) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            CircularProgressIndicator(color = KundliColors.Gold)
        }
        return
    }

    if (state.needsOnboarding || showManualAddOnboarding) {
        OnboardingFlow(
            placesService = viewModel.placesService,
            offlineCities = viewModel.offlineCities,
            signedInUser = state.signedInUser,
            authBusy = state.authBusy,
            authMessage = state.authMessage,
            computing = state.onboardingComputing,
            computeError = state.onboardingError,
            computedLevel1Json = state.onboardingComputedLevel1Json,
            onSignInWithGoogle = { viewModel.signInWithGoogle(context) },
            onComputeProfile = { res, place -> viewModel.computeOnboardingProfile(res, place) },
            onComplete = {
                showManualAddOnboarding = false
                viewModel.finishOnboarding()
            },
        )
        return
    }

    val activeProfile = state.activeProfile
    val todaySky = state.todaySky
    val chartState = state.chartState
    val timeState = state.timeState

    // Check if the latest journal entry was logged during the current local hour
    val latestCheckInMoodThisHour = remember(state.journalEntries) {
        val latest = state.journalEntries.firstOrNull() ?: return@remember null
        val zdt = runCatching { Instant.ofEpochMilli(latest.createdAtMillis).atZone(ZoneId.systemDefault()) }.getOrNull()
        val nowDate = LocalDate.now()
        val nowHour = LocalTime.now().hour
        if (zdt != null && zdt.toLocalDate() == nowDate && zdt.hour == nowHour) latest.mood else null
    }

    fun triggerShareBlueprint() {
        val natal = viewModel.extractActiveNatalSummary()
        ShareAndExportHelper.shareCosmicBlueprintPng(
            context = context,
            profileName = activeProfile?.name ?: "Native",
            ascendantSign = natal.lagnaSign,
            moonSign = natal.moonSign,
            moonNakshatra = natal.moonNakshatra,
            rarityLine = DiscoveryPathEngine.formatCombinatorialRarity(
                natal.lagnaSign,
                natal.sunSign,
                natal.moonNakshatra,
                activeProfile?.timeCertainty ?: "exact",
            ),
            chapterLine = todaySky?.currentChapterSubtitle ?: "KundliFlow Almanac",
        )
    }

    fun triggerExportDossier() {
        ShareAndExportHelper.shareTextDocument(
            context = context,
            fileName = "kundliflow_dossier.md",
            mimeType = "text/markdown",
            content = viewModel.buildLlmDossierMarkdown(),
        )
    }

    when (currentPage) {
        AppPage.AskCopilot -> {
            AskCopilotPage(
                profileName = activeProfile?.name ?: "Chart",
                originContextLabel = askOriginContext,
                messages = state.chatMessages,
                liveStepTicker = state.liveStepTicker,
                liveTraceSteps = state.liveTraceSteps,
                onSendQuestion = { q, deep -> viewModel.sendAskQuestion(q, deep) },
                onClearHistory = { viewModel.clearChatHistory() },
                onTapEvidence = { subj ->
                    activeSubjectReadingOverride = null
                    activeSubject = subj
                    rungStack = listOf(Rung.Explain)
                },
                onJumpToTiming = {
                    currentPage = AppPage.Shell
                    activeDestination = MainDestination.Time
                },
                onOpenReflect = {
                    currentPage = AppPage.Shell
                    activeDestination = MainDestination.Journal
                    openJournalComposer = true
                },
                onExportDossier = { triggerExportDossier() },
                onBack = { currentPage = AppPage.Shell },
            )
        }

        AppPage.StrengthsAndYogas -> if (chartState != null) {
            StrengthsAndYogasPage(
                chart = chartState,
                onAskAboutStrengths = {
                    askOriginContext = "Strengths & Yogas"
                    currentPage = AppPage.AskCopilot
                },
                onBack = { currentPage = AppPage.Shell },
            )
        } else {
            currentPage = AppPage.Shell
        }

        AppPage.ToolsStudio -> if (chartState != null) {
            ToolsStudioPage(
                data = remember(activeProfile?.id) { viewModel.getToolsStudioData() },
                houses = chartState.houses,
                onFetchVarshaphalYear = { yr -> viewModel.fetchVarshaphalForYear(yr) },
                onExportDossier = { triggerExportDossier() },
                onBack = { currentPage = AppPage.Shell },
            )
        } else {
            currentPage = AppPage.Shell
        }

        AppPage.DiscoveryMap -> {
            DiscoveryMapPage(
                orderedNodes = state.orderedDiscoveryNodes,
                litNodeIds = state.litNodeIds,
                isMoonOnlyMode = activeProfile?.timeCertainty == "unknown",
                onSelectNode = { node -> activeStoryNode = node },
                onBack = { currentPage = AppPage.Shell },
            )
        }

        AppPage.TimeMachine -> {
            TimeMachinePage(
                milestones = state.milestones,
                lookupDashaForYear = { yr -> viewModel.lookupDashaForYear(yr) },
                onAddMilestone = { title, date, cat -> viewModel.addMilestone(title, date, cat) },
                onExplainYearWithAi = { yr ->
                    askOriginContext = "Time-Machine · Year $yr"
                    currentPage = AppPage.AskCopilot
                },
                onBack = { currentPage = AppPage.Shell },
            )
        }

        AppPage.Glossary -> {
            GlossaryPage(onBack = { currentPage = AppPage.Shell })
        }

        AppPage.SettingsAndVault -> {
            SettingsAndVaultPage(
                activeProfile = activeProfile,
                placesService = viewModel.placesService,
                offlineCities = viewModel.offlineCities,
                detailLevel = state.detailLevel,
                chartStyle = state.chartStyle,
                quietHoursStart = state.quietHoursStart,
                quietHoursEnd = state.quietHoursEnd,
                morningNotificationsEnabled = state.morningNotificationsEnabled,
                signedInUser = state.signedInUser,
                authBusy = state.authBusy,
                lastSyncLabel = state.lastSyncLabel,
                statusMessage = state.statusBanner,
                updatingProfile = state.updatingProfile,
                onUpdateActiveProfile = { name, date, time, place, cert, ay ->
                    viewModel.updateActiveProfile(name, date, time, place, cert, ay)
                },
                onChangeDetailLevel = { viewModel.setDetailLevel(it) },
                onChangeChartStyle = { viewModel.setChartStyle(it) },
                onChangeQuietHours = { start, end -> viewModel.setQuietHours(start, end) },
                onToggleMorningNotifications = { enabled ->
                    if (enabled && Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                        notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
                    } else {
                        viewModel.setMorningNotificationsEnabled(enabled)
                    }
                },
                onSignInWithGoogle = { viewModel.signInWithGoogle(context) },
                onSignOut = { viewModel.signOut() },
                onExportLlmDossier = { triggerExportDossier() },
                onExportVaultJson = {
                    scope.launch {
                        val jsonDump = viewModel.buildVaultBackupJsonAsync()
                        ShareAndExportHelper.shareTextDocument(
                            context = context,
                            fileName = "kundliflow_vault_backup.json",
                            mimeType = "application/json",
                            content = jsonDump,
                        )
                    }
                },
                onRestoreVaultJson = {
                    vaultRestoreLauncher.launch(arrayOf("application/json", "text/plain", "*/*"))
                },
                onOpenSupport = { viewModel.openSupportHelplines() },
                onResetDataVault = {
                    currentPage = AppPage.Shell
                    viewModel.resetDataVault()
                },
                onBack = { currentPage = AppPage.Shell },
            )
        }

        AppPage.Shell -> {
            val activeOrbitItem = state.savedProfiles.firstOrNull { it.id == activeProfile?.id }
            KundliFlowShell(
                windowSizeClass = windowSizeClass,
                activeProfileName = activeProfile?.name ?: "Chart",
                activeProfileSubtitle = activeOrbitItem?.subtitle ?: "",
                activeProfileId = activeProfile?.id ?: "",
                savedProfiles = state.savedProfiles,
                detailLevel = state.detailLevel,
                discoveryLitCount = state.litNodeIds.size,
                discoveryTotalCount = state.orderedDiscoveryNodes.size.coerceAtLeast(1),
                activeDestination = activeDestination,
                showBackToTodayPill = showBackToTodayPill,
                staleStatusLine = state.staleStatusLine,
                onRefreshStale = { viewModel.refreshTodaySky() },
                onSelectDestination = {
                    activeDestination = it
                    showBackToTodayPill = false
                },
                onBackToToday = {
                    activeDestination = MainDestination.Today
                    showBackToTodayPill = false
                },
                onSelectProfile = { viewModel.switchProfile(it) },
                onAddProfile = { showManualAddOnboarding = true },
                onChangeDetailLevel = { viewModel.setDetailLevel(it) },
                onNavigatePage = { page -> currentPage = page },
                onShareBlueprint = { triggerShareBlueprint() },
                onOpenSupport = { viewModel.openSupportHelplines() },
                onOpenSearch = { showSearchSheet = true },
                onOpenAsk = {
                    askOriginContext = "Viewing ${activeDestination.label}"
                    currentPage = AppPage.AskCopilot
                },
            ) {
                when (activeDestination) {
                    MainDestination.Today -> if (todaySky != null) {
                        TodayScreen(
                            sky = todaySky,
                            personalHookLine = state.personalHookLine,
                            activeSlot = state.activeSlot,
                            hasLoggedAtLeastOnce = state.journalEntries.isNotEmpty(),
                            latestCheckInMoodThisHour = latestCheckInMoodThisHour,
                            discoveryLitCount = state.litNodeIds.size,
                            discoveryTotalCount = state.orderedDiscoveryNodes.size.coerceAtLeast(1),
                            isEveningAfter19 = state.isEveningAfter19,
                            showConstructiveRedirect = state.showConstructiveRedirect,
                            isRefreshing = state.isRefreshingToday,
                            onRefresh = { viewModel.refreshTodaySky() },
                            onTapHeroPeek = {
                                activeSubjectReadingOverride = null
                                activeSubject = Subject.Finding("today.band", SubjectFindingKind.TRANSIT)
                                rungStack = listOf(Rung.Peek)
                            },
                            onQuickCheckIn = { mood -> viewModel.submitCheckIn(mood, 3, "checkin", emptyList(), "") },
                            onEditCheckInMood = { mood -> viewModel.editLatestCheckInMood(mood) },
                            onUndoCheckIn = { viewModel.undoLatestCheckIn() },
                            onAddTagToLastCheckIn = { tag -> viewModel.addTagToLatestEntry(tag) },
                            onOpenFullComposer = {
                                activeDestination = MainDestination.Journal
                                openJournalComposer = true
                            },
                            onTapSlotAction = { slot ->
                                when (slot) {
                                    is TodayDynamicSlot.FirstWeekNudge -> when (slot.targetTab) {
                                        "chart" -> {
                                            activeDestination = MainDestination.Chart
                                            showBackToTodayPill = true
                                        }
                                        "journal" -> {
                                            activeDestination = MainDestination.Journal
                                            showBackToTodayPill = true
                                        }
                                        else -> {
                                            activeSubjectReadingOverride = null
                                            activeSubject = Subject.Finding("today.band", SubjectFindingKind.TRANSIT)
                                            rungStack = listOf(Rung.Explain)
                                        }
                                    }
                                    is TodayDynamicSlot.SundayWeeklyReview -> {
                                        viewModel.markWeeklyReviewViewed()
                                        activeDestination = MainDestination.Journal
                                        showBackToTodayPill = true
                                    }
                                    is TodayDynamicSlot.LiveSkyEvent -> {
                                        activeDestination = MainDestination.Time
                                        showBackToTodayPill = true
                                    }
                                    is TodayDynamicSlot.CuriosityNode -> {
                                        activeStoryNode = state.orderedDiscoveryNodes.firstOrNull { it.id == slot.nodeId }
                                    }
                                    else -> {
                                        activeSubjectReadingOverride = null
                                        activeSubject = Subject.Planet(PlanetId.MOON)
                                        rungStack = listOf(Rung.Peek)
                                    }
                                }
                            },
                            onDismissSlot = { slot ->
                                when (slot) {
                                    is TodayDynamicSlot.AhaMomentComparison -> viewModel.dismissAhaCard()
                                    is TodayDynamicSlot.SundayWeeklyReview -> viewModel.markWeeklyReviewViewed()
                                    else -> Unit
                                }
                            },
                            onOpenDiscoveryMap = { currentPage = AppPage.DiscoveryMap },
                            onTapExploreTopic = { topic ->
                                when {
                                    topic.equals("Year", ignoreCase = true) -> {
                                        activeDestination = MainDestination.Time
                                        showBackToTodayPill = true
                                    }
                                    topic.equals("Strengths", ignoreCase = true) -> {
                                        currentPage = AppPage.StrengthsAndYogas
                                    }
                                    else -> {
                                        pendingChartTopic = topic
                                        activeDestination = MainDestination.Chart
                                        showBackToTodayPill = true
                                    }
                                }
                            },
                            onTapCitySwitcher = { showTravelCityPicker = true },
                        )
                    }

                    MainDestination.Journal -> JournalScreen(
                        entries = state.journalEntries,
                        milestones = state.milestones,
                        daysLoggedThisWeek = state.daysLoggedThisWeek,
                        weeklyGoal = 4,
                        onTapSkySnapshot = { snap ->
                            val matchingDate = state.journalEntries.firstOrNull { it.sky == snap }?.timestampLabel ?: "Historical Sky"
                            activeSubjectReadingOverride = viewModel.resolveSnapshotSubjectReading(snap, matchingDate)
                            activeSubject = Subject.Finding("snapshot.${snap.moonSign}", SubjectFindingKind.TRANSIT)
                            rungStack = listOf(Rung.Explain)
                        },
                        onSubmitCheckIn = { mood, energy, kind, tags, note ->
                            viewModel.submitCheckIn(mood, energy, kind, tags, note)
                        },
                        externalOpenComposer = openJournalComposer,
                        onExternalComposerHandled = { openJournalComposer = false },
                    )

                    MainDestination.Chart -> if (chartState != null) {
                        ChartScreen(
                            chart = chartState,
                            initialStyle = state.chartStyle,
                            initialTopic = pendingChartTopic,
                            onInitialTopicConsumed = { pendingChartTopic = null },
                            resolveChartVariant = { varga, ref -> viewModel.resolveChartVariant(varga, ref) },
                            onOpenSubject = { subj, rung ->
                                activeSubjectReadingOverride = null
                                activeSubject = subj
                                rungStack = listOf(rung)
                            },
                            onOpenStrengthsPage = { currentPage = AppPage.StrengthsAndYogas },
                            onOpenToolsPage = { currentPage = AppPage.ToolsStudio },
                            onJumpToTimeTab = {
                                activeDestination = MainDestination.Time
                                showBackToTodayPill = false
                            },
                        )
                    }

                    MainDestination.Time -> if (timeState != null) {
                        TimeScreen(
                            state = timeState,
                            milestones = state.milestones,
                            isCalendarLoading = state.isCalendarLoading,
                            onOpenPeriodSubject = { subj, rung ->
                                activeSubjectReadingOverride = null
                                activeSubject = subj
                                rungStack = listOf(rung)
                            },
                            onChangeCalendarMonth = { y, m -> viewModel.loadCalendarMonth(y, m) },
                            onAddDateNote = {
                                activeDestination = MainDestination.Journal
                                openJournalComposer = true
                            },
                            onOpenTimeMachinePage = { currentPage = AppPage.TimeMachine },
                        )
                    }
                }
            }
        }
    }

    // Single-layer universal overlays
    val subject = activeSubject
    if (subject != null && rungStack.isNotEmpty()) {
        SubjectSheet(
            subject = subject,
            reading = activeSubjectReadingOverride ?: viewModel.resolveSubjectReading(subject),
            rungStack = rungStack,
            showAlwaysDetailsPrompt = SubjectRungNavigator.shouldOfferFullDetailsPrompt(
                mathTapCount = state.mathPromptShownCount,
                currentDetailLevel = state.detailLevel,
                promptAlreadyShown = mathPromptDismissed,
            ),
            onPushRung = { next ->
                if (next == Rung.Evidence) viewModel.recordMathTap()
                rungStack = SubjectRungNavigator.pushRung(rungStack, next)
            },
            onPopRung = {
                val popped = SubjectRungNavigator.popRung(rungStack)
                if (popped == null) {
                    activeSubject = null
                    activeSubjectReadingOverride = null
                    rungStack = emptyList()
                } else {
                    rungStack = popped
                }
            },
            onAcceptAlwaysDetails = {
                viewModel.setDetailLevel("full")
                mathPromptDismissed = true
            },
            onDismissAlwaysDetails = { mathPromptDismissed = true },
            onAskSubject = { subj ->
                activeSubject = null
                activeSubjectReadingOverride = null
                rungStack = emptyList()
                askOriginContext = "Inspecting $subj"
                currentPage = AppPage.AskCopilot
            },
            onReflectSubject = {
                activeSubject = null
                activeSubjectReadingOverride = null
                rungStack = emptyList()
                currentPage = AppPage.Shell
                activeDestination = MainDestination.Journal
                openJournalComposer = true
            },
            onDismiss = {
                activeSubject = null
                activeSubjectReadingOverride = null
                rungStack = emptyList()
            },
        )
    }

    val storyNode = activeStoryNode
    if (storyNode != null) {
        val storySubject = when (storyNode.subject.type) {
            "House" -> Subject.House(storyNode.subject.number ?: 1)
            "Planet" -> Subject.Planet(
                PlanetId.entries.firstOrNull { it.name.equals(storyNode.subject.id, ignoreCase = true) } ?: PlanetId.MOON,
            )
            "Period" -> Subject.Period(storyNode.subject.id ?: "current")
            else -> Subject.Finding(storyNode.id, SubjectFindingKind.PATTERN)
        }
        val resolvedReading = viewModel.resolveSubjectReading(storySubject)
        DiscoveryStorySheet(
            node = storyNode,
            personalRevealText = resolvedReading.peekSummary,
            rarityBadge = viewModel.resolveDiscoveryRarityBadge(storyNode.id) ?: resolvedReading.subtitle,
            onOpenSubject = {
                viewModel.lightDiscoveryNode(storyNode, "explore")
                activeStoryNode = null
                activeSubjectReadingOverride = null
                activeSubject = storySubject
                rungStack = listOf(Rung.Explain)
            },
            onCompleteReflect = {
                viewModel.lightDiscoveryNode(storyNode, "story")
                activeStoryNode = null
                currentPage = AppPage.Shell
                activeDestination = MainDestination.Journal
                openJournalComposer = true
            },
            onDismiss = { activeStoryNode = null },
        )
    }

    if (showSearchSheet) {
        SearchOverlaySheet(
            chart = chartState,
            onSelectSubject = { subj ->
                showSearchSheet = false
                activeSubjectReadingOverride = null
                activeSubject = subj
                rungStack = listOf(Rung.Peek)
            },
            onDismiss = { showSearchSheet = false },
        )
    }

    if (showTravelCityPicker) {
        PlacePickerSheet(
            title = "Switch Current City (Today Sky)",
            placesService = viewModel.placesService,
            offlineCities = viewModel.offlineCities,
            onPlaceSelected = { place ->
                showTravelCityPicker = false
                viewModel.switchTravelLocation(place)
            },
            onDismiss = { showTravelCityPicker = false },
        )
    }
}
