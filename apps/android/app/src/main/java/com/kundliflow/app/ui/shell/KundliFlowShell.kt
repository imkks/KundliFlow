package com.kundliflow.app.ui.shell

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowBack
import androidx.compose.material.icons.automirrored.rounded.MenuBook
import androidx.compose.material.icons.rounded.Add
import androidx.compose.material.icons.rounded.AutoAwesome
import androidx.compose.material.icons.rounded.Book
import androidx.compose.material.icons.rounded.Build
import androidx.compose.material.icons.rounded.CalendarMonth
import androidx.compose.material.icons.rounded.Explore
import androidx.compose.material.icons.rounded.FavoriteBorder
import androidx.compose.material.icons.rounded.History
import androidx.compose.material.icons.rounded.Menu
import androidx.compose.material.icons.rounded.Schedule
import androidx.compose.material.icons.rounded.Search
import androidx.compose.material.icons.rounded.Settings
import androidx.compose.material.icons.rounded.Share
import androidx.compose.material.icons.rounded.Stars
import androidx.compose.material.icons.rounded.Timeline
import androidx.compose.material.icons.rounded.WbTwilight
import androidx.compose.material.icons.rounded.WorkspacePremium
import androidx.compose.material3.DrawerValue
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalDrawerSheet
import androidx.compose.material3.ModalNavigationDrawer
import androidx.compose.material3.NavigationRail
import androidx.compose.material3.NavigationRailItem
import androidx.compose.material3.NavigationRailItemDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.rememberDrawerState
import androidx.compose.material3.windowsizeclass.WindowSizeClass
import androidx.compose.material3.windowsizeclass.WindowWidthSizeClass
import androidx.compose.runtime.Composable
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.kundliflow.app.ui.me.OrbitProfileItem
import com.kundliflow.app.ui.theme.KundliColors
import kotlinx.coroutines.launch

enum class MainDestination(val label: String, val icon: ImageVector) {
    Today("Today", Icons.Rounded.WbTwilight),
    Chart("Chart", Icons.Rounded.Explore),
    Time("Time", Icons.Rounded.Schedule),
    Journal("Journal", Icons.Rounded.Book),
}

enum class AppPage {
    Shell,
    AskCopilot,
    StrengthsAndYogas,
    ToolsStudio,
    DiscoveryMap,
    TimeMachine,
    Glossary,
    SettingsAndVault,
}

@Composable
fun KundliFlowShell(
    windowSizeClass: WindowSizeClass,
    activeProfileName: String,
    activeProfileSubtitle: String = "",
    activeProfileId: String = "",
    savedProfiles: List<OrbitProfileItem> = emptyList(),
    detailLevel: String = "balanced",
    chartStyle: String = "NORTH",
    liveSkyBandLabel: String? = null,
    liveSkyBandColor: Color = KundliColors.Gold,
    liveSkySubtitle: String? = null,
    activeYogasCount: Int = 0,
    signedInEmail: String? = null,
    discoveryLitCount: Int = 0,
    discoveryTotalCount: Int = 24,
    activeDestination: MainDestination,
    showBackToTodayPill: Boolean = false,
    staleStatusLine: String? = null,
    onRefreshStale: () -> Unit = {},
    onSelectDestination: (MainDestination) -> Unit,
    onBackToToday: () -> Unit = {},
    onSelectProfile: (String) -> Unit = {},
    onAddProfile: () -> Unit = {},
    onChangeDetailLevel: (String) -> Unit = {},
    onChangeChartStyle: (String) -> Unit = {},
    onOpenTodayWave: () -> Unit = {},
    onJumpToAlmanac: () -> Unit = {},
    onNavigatePage: (AppPage) -> Unit = {},
    onShareBlueprint: () -> Unit = {},
    onOpenSupport: () -> Unit = {},
    onOpenSearch: () -> Unit,
    onOpenAsk: () -> Unit,
    content: @Composable () -> Unit,
) {
    val isCompact = windowSizeClass.widthSizeClass == WindowWidthSizeClass.Compact
    val drawerState = rememberDrawerState(initialValue = DrawerValue.Closed)
    val scope = rememberCoroutineScope()

    fun openDrawer() {
        scope.launch { drawerState.open() }
    }

    fun closeDrawerAnd(action: () -> Unit) {
        scope.launch {
            drawerState.close()
            action()
        }
    }

    ModalNavigationDrawer(
        drawerState = drawerState,
        gesturesEnabled = true,
        drawerContent = {
            ModalDrawerSheet(
                drawerContainerColor = KundliColors.Surface,
                drawerContentColor = KundliColors.TextMain,
                modifier = Modifier.width(310.dp),
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxHeight()
                        .statusBarsPadding()
                        .navigationBarsPadding()
                        .verticalScroll(rememberScrollState())
                        .padding(horizontal = 16.dp, vertical = 12.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    // Drawer Brand Header
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Text(
                            text = "KUNDLIFLOW",
                            style = MaterialTheme.typography.titleMedium,
                            color = KundliColors.Gold,
                        )
                        IconButton(onClick = { closeDrawerAnd { onNavigatePage(AppPage.SettingsAndVault) } }) {
                            Icon(
                                imageVector = Icons.Rounded.Settings,
                                contentDescription = "Settings and Data Vault",
                                tint = KundliColors.TextMuted,
                            )
                        }
                    }

                    // Active Profile Card
                    Surface(
                        color = KundliColors.SurfaceAlt,
                        border = BorderStroke(1.dp, KundliColors.GoldHairline),
                        shape = RoundedCornerShape(16.dp),
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Row(
                            modifier = Modifier.padding(14.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = activeProfileName,
                                    style = MaterialTheme.typography.titleMedium,
                                    color = KundliColors.TextMain,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis,
                                )
                                if (activeProfileSubtitle.isNotBlank()) {
                                    Text(
                                        text = activeProfileSubtitle,
                                        style = MaterialTheme.typography.bodySmall,
                                        color = KundliColors.Teal,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis,
                                    )
                                }
                            }
                            TextButton(
                                onClick = { closeDrawerAnd { onNavigatePage(AppPage.SettingsAndVault) } },
                                contentPadding = PaddingValues(horizontal = 8.dp),
                            ) {
                                Text("Edit", color = KundliColors.Gold)
                            }
                        }
                    }

                    // Live Sky Mini-Card (1-tap jump to Today)
                    if (!liveSkyBandLabel.isNullOrBlank()) {
                        Surface(
                            color = liveSkyBandColor.copy(alpha = 0.10f),
                            border = BorderStroke(1.dp, liveSkyBandColor.copy(alpha = 0.35f)),
                            shape = RoundedCornerShape(14.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { closeDrawerAnd { onSelectDestination(MainDestination.Today) } },
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 10.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically,
                            ) {
                                Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                                    Text(
                                        text = "SKY NOW · ${liveSkyBandLabel.uppercase()}",
                                        style = MaterialTheme.typography.labelMedium,
                                        color = liveSkyBandColor,
                                    )
                                    if (!liveSkySubtitle.isNullOrBlank()) {
                                        Text(
                                            text = liveSkySubtitle,
                                            style = MaterialTheme.typography.bodySmall,
                                            color = KundliColors.TextMain,
                                            maxLines = 1,
                                            overflow = TextOverflow.Ellipsis,
                                        )
                                    }
                                }
                                Text("→", style = MaterialTheme.typography.titleMedium, color = liveSkyBandColor)
                            }
                        }
                    }

                    // Horizontal Orbit Profile Switcher Rail (zero dropdown!)
                    Text("YOUR ORBIT", style = MaterialTheme.typography.labelMedium, color = KundliColors.TextMuted)
                    LazyRow(
                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                        contentPadding = PaddingValues(end = 4.dp),
                    ) {
                        items(savedProfiles, key = { it.id }) { prof ->
                            val isActive = prof.id == activeProfileId
                            val ringColor = prof.todayBand?.color ?: if (isActive) KundliColors.Gold else KundliColors.SubtleDivider
                            Column(
                                horizontalAlignment = Alignment.CenterHorizontally,
                                modifier = Modifier
                                    .width(64.dp)
                                    .clickable {
                                        closeDrawerAnd { onSelectProfile(prof.id) }
                                    },
                            ) {
                                Box(modifier = Modifier.size(48.dp)) {
                                    Box(
                                        modifier = Modifier
                                            .size(46.dp)
                                            .align(Alignment.Center)
                                            .clip(CircleShape)
                                            .background(if (isActive) KundliColors.SurfaceAlt else KundliColors.BgInk)
                                            .border(if (isActive) 2.dp else 1.5.dp, ringColor, CircleShape),
                                        contentAlignment = Alignment.Center,
                                    ) {
                                        Text(
                                            text = prof.name.take(2).uppercase(),
                                            style = MaterialTheme.typography.titleMedium,
                                            color = if (isActive) KundliColors.Gold else KundliColors.TextMain,
                                        )
                                    }
                                    if (prof.todayBand != null) {
                                        Box(
                                            modifier = Modifier
                                                .size(11.dp)
                                                .align(Alignment.BottomEnd)
                                                .clip(CircleShape)
                                                .background(prof.todayBand.color)
                                                .border(1.5.dp, KundliColors.Surface, CircleShape),
                                        )
                                    }
                                }
                                Spacer(Modifier.height(4.dp))
                                Text(
                                    text = prof.name,
                                    style = MaterialTheme.typography.labelMedium,
                                    color = if (isActive) KundliColors.Gold else KundliColors.TextMuted,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis,
                                )
                            }
                        }
                        item {
                            Column(
                                horizontalAlignment = Alignment.CenterHorizontally,
                                modifier = Modifier
                                    .width(64.dp)
                                    .clickable { closeDrawerAnd(onAddProfile) },
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(46.dp)
                                        .clip(CircleShape)
                                        .background(KundliColors.BgInk)
                                        .border(1.dp, KundliColors.Teal.copy(alpha = 0.6f), CircleShape),
                                    contentAlignment = Alignment.Center,
                                ) {
                                    Icon(Icons.Rounded.Add, contentDescription = "Add chart", tint = KundliColors.Teal)
                                }
                                Spacer(Modifier.height(4.dp))
                                Text("Add", style = MaterialTheme.typography.labelMedium, color = KundliColors.Teal)
                            }
                        }
                    }

                    // Quick Preferences: Reading Depth + Chart Style
                    Text("PREFERENCES", style = MaterialTheme.typography.labelMedium, color = KundliColors.TextMuted)
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        listOf("simple" to "Simple", "balanced" to "Balanced", "full" to "Full").forEach { (id, label) ->
                            FilterChip(
                                selected = detailLevel == id,
                                onClick = { onChangeDetailLevel(id) },
                                label = { Text(label) },
                                colors = FilterChipDefaults.filterChipColors(
                                    selectedContainerColor = KundliColors.SurfaceAlt,
                                    selectedLabelColor = KundliColors.Gold,
                                ),
                            )
                        }
                    }
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        listOf("NORTH" to "North Indian", "SOUTH" to "South Indian").forEach { (id, label) ->
                            FilterChip(
                                selected = chartStyle.equals(id, ignoreCase = true),
                                onClick = { onChangeChartStyle(id) },
                                label = { Text(label) },
                                colors = FilterChipDefaults.filterChipColors(
                                    selectedContainerColor = KundliColors.SurfaceAlt,
                                    selectedLabelColor = KundliColors.Teal,
                                ),
                            )
                        }
                    }

                    HorizontalDivider(color = KundliColors.SubtleDivider)

                    // Quick Access Section
                    Text("QUICK ACCESS", style = MaterialTheme.typography.labelMedium, color = KundliColors.TextMuted)
                    DrawerPageItem(
                        icon = Icons.Rounded.AutoAwesome,
                        title = "Ask AI Copilot",
                        accent = KundliColors.Gold,
                        onClick = { closeDrawerAnd(onOpenAsk) },
                    )
                    DrawerPageItem(
                        icon = Icons.Rounded.Timeline,
                        title = "Today's Wave & Panchang",
                        accent = KundliColors.Teal,
                        onClick = { closeDrawerAnd(onOpenTodayWave) },
                    )
                    DrawerPageItem(
                        icon = Icons.Rounded.CalendarMonth,
                        title = "Monthly Almanac",
                        accent = KundliColors.Gold,
                        onClick = { closeDrawerAnd(onJumpToAlmanac) },
                    )

                    HorizontalDivider(color = KundliColors.SubtleDivider)

                    // 2x2 Visual Studios Grid (AstroSage / CHANI pattern)
                    Text("DEEP DIVE STUDIOS", style = MaterialTheme.typography.labelMedium, color = KundliColors.TextMuted)
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        DrawerStudioTile(
                            icon = Icons.Rounded.WorkspacePremium,
                            title = "Yogas & SAV",
                            subtitle = if (activeYogasCount > 0) "$activeYogasCount active" else "Strengths",
                            accent = KundliColors.Gold,
                            onClick = { closeDrawerAnd { onNavigatePage(AppPage.StrengthsAndYogas) } },
                            modifier = Modifier.weight(1f),
                        )
                        DrawerStudioTile(
                            icon = Icons.Rounded.Build,
                            title = "Tools Studio",
                            subtitle = "KP · Varshaphala",
                            accent = KundliColors.Teal,
                            onClick = { closeDrawerAnd { onNavigatePage(AppPage.ToolsStudio) } },
                            modifier = Modifier.weight(1f),
                        )
                    }
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        DrawerStudioTile(
                            icon = Icons.Rounded.History,
                            title = "Time-Machine",
                            subtitle = "Past & Future",
                            accent = KundliColors.Teal,
                            onClick = { closeDrawerAnd { onNavigatePage(AppPage.TimeMachine) } },
                            modifier = Modifier.weight(1f),
                        )
                        DrawerStudioTile(
                            icon = Icons.Rounded.Stars,
                            title = "Discovery",
                            subtitle = "$discoveryLitCount / $discoveryTotalCount lit",
                            accent = KundliColors.Gold,
                            onClick = { closeDrawerAnd { onNavigatePage(AppPage.DiscoveryMap) } },
                            modifier = Modifier.weight(1f),
                        )
                    }

                    HorizontalDivider(color = KundliColors.SubtleDivider)

                    // Learn & Vault Section
                    Text("LEARN & VAULT", style = MaterialTheme.typography.labelMedium, color = KundliColors.TextMuted)
                    DrawerPageItem(
                        icon = Icons.AutoMirrored.Rounded.MenuBook,
                        title = "Plain English Glossary",
                        accent = KundliColors.TextMain,
                        onClick = { closeDrawerAnd { onNavigatePage(AppPage.Glossary) } },
                    )
                    DrawerPageItem(
                        icon = Icons.Rounded.Share,
                        title = "Share 9:16 Cosmic Blueprint",
                        accent = KundliColors.Gold,
                        onClick = { closeDrawerAnd(onShareBlueprint) },
                    )
                    DrawerPageItem(
                        icon = Icons.Rounded.Settings,
                        title = "Settings, Sync & Vault",
                        badgeText = if (!signedInEmail.isNullOrBlank()) "Synced" else "Local",
                        badgeColor = if (!signedInEmail.isNullOrBlank()) KundliColors.Teal else KundliColors.TextMuted,
                        accent = KundliColors.TextMuted,
                        onClick = { closeDrawerAnd { onNavigatePage(AppPage.SettingsAndVault) } },
                    )

                    HorizontalDivider(color = KundliColors.SubtleDivider)

                    // Always-reachable Support Helplines (v3 §4.10)
                    DrawerPageItem(
                        icon = Icons.Rounded.FavoriteBorder,
                        title = "Need support? (24/7 Helplines)",
                        accent = KundliColors.Teal,
                        onClick = { closeDrawerAnd(onOpenSupport) },
                    )
                }
            }
        },
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(KundliColors.BgInk),
        ) {
            if (isCompact) {
                Column(modifier = Modifier.fillMaxSize()) {
                    TopHeaderBar(
                        profileName = activeProfileName,
                        showBackToTodayPill = showBackToTodayPill,
                        staleStatusLine = staleStatusLine,
                        onRefreshStale = onRefreshStale,
                        onBackToToday = onBackToToday,
                        onOpenDrawer = { openDrawer() },
                        onOpenSearch = onOpenSearch,
                    )
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .fillMaxWidth(),
                    ) {
                        content()
                    }
                }
                FloatingCapsuleDock(
                    activeDestination = activeDestination,
                    onSelectDestination = onSelectDestination,
                    onOpenAsk = onOpenAsk,
                    modifier = Modifier
                        .align(Alignment.BottomCenter)
                        .navigationBarsPadding()
                        .padding(horizontal = 16.dp, vertical = 12.dp),
                )
            } else {
                Row(modifier = Modifier.fillMaxSize()) {
                    KundliNavigationRail(
                        activeDestination = activeDestination,
                        onSelectDestination = onSelectDestination,
                        onOpenDrawer = { openDrawer() },
                        onOpenAsk = onOpenAsk,
                    )
                    Column(modifier = Modifier.weight(1f).fillMaxHeight()) {
                        TopHeaderBar(
                            profileName = activeProfileName,
                            showBackToTodayPill = showBackToTodayPill,
                            staleStatusLine = staleStatusLine,
                            onRefreshStale = onRefreshStale,
                            onBackToToday = onBackToToday,
                            onOpenDrawer = { openDrawer() },
                            onOpenSearch = onOpenSearch,
                        )
                        Box(modifier = Modifier.weight(1f).fillMaxWidth()) {
                            content()
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun DrawerPageItem(
    icon: ImageVector,
    title: String,
    accent: Color,
    badgeText: String? = null,
    badgeColor: Color = KundliColors.Teal,
    onClick: () -> Unit,
) {
    Surface(
        color = Color.Transparent,
        shape = RoundedCornerShape(12.dp),
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Icon(icon, contentDescription = null, tint = accent, modifier = Modifier.size(20.dp))
            Text(
                text = title,
                style = MaterialTheme.typography.bodyMedium,
                color = KundliColors.TextMain,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
                modifier = Modifier.weight(1f),
            )
            if (!badgeText.isNullOrBlank()) {
                Surface(
                    color = badgeColor.copy(alpha = 0.14f),
                    shape = RoundedCornerShape(999.dp),
                ) {
                    Text(
                        text = badgeText,
                        style = MaterialTheme.typography.labelSmall,
                        color = badgeColor,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp),
                    )
                }
            }
        }
    }
}

@Composable
private fun DrawerStudioTile(
    icon: ImageVector,
    title: String,
    subtitle: String,
    accent: Color,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Surface(
        color = KundliColors.SurfaceAlt,
        border = BorderStroke(1.dp, accent.copy(alpha = 0.22f)),
        shape = RoundedCornerShape(14.dp),
        modifier = modifier.clickable(onClick = onClick),
    ) {
        Column(
            modifier = Modifier.padding(12.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp),
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = accent,
                modifier = Modifier.size(20.dp),
            )
            Text(
                text = title,
                style = MaterialTheme.typography.titleSmall,
                color = KundliColors.TextMain,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
            Text(
                text = subtitle,
                style = MaterialTheme.typography.labelSmall,
                color = KundliColors.TextMuted,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
        }
    }
}

@Composable
private fun TopHeaderBar(
    profileName: String,
    showBackToTodayPill: Boolean,
    staleStatusLine: String?,
    onRefreshStale: () -> Unit,
    onBackToToday: () -> Unit,
    onOpenDrawer: () -> Unit,
    onOpenSearch: () -> Unit,
) {
    Column(modifier = Modifier.fillMaxWidth().statusBarsPadding()) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp)
                .padding(horizontal = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp),
            ) {
                IconButton(onClick = onOpenDrawer) {
                    Icon(
                        imageVector = Icons.Rounded.Menu,
                        contentDescription = "Open navigation drawer",
                        tint = KundliColors.Gold,
                    )
                }
                Text(
                    text = profileName,
                    style = MaterialTheme.typography.titleMedium,
                    color = KundliColors.TextMain,
                    modifier = Modifier
                        .clip(RoundedCornerShape(12.dp))
                        .clickable(onClick = onOpenDrawer)
                        .padding(horizontal = 6.dp, vertical = 6.dp),
                )

                AnimatedVisibility(visible = showBackToTodayPill) {
                    Surface(
                        color = KundliColors.SurfaceAlt,
                        shape = RoundedCornerShape(20.dp),
                        modifier = Modifier.clickable(onClick = onBackToToday),
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Icon(
                                imageVector = Icons.AutoMirrored.Rounded.ArrowBack,
                                contentDescription = "Back to Today",
                                tint = KundliColors.Teal,
                                modifier = Modifier.size(15.dp),
                            )
                            Spacer(Modifier.width(4.dp))
                            Text(
                                text = "Today",
                                style = MaterialTheme.typography.labelMedium,
                                color = KundliColors.Teal,
                            )
                        }
                    }
                }
            }

            IconButton(onClick = onOpenSearch) {
                Icon(
                    imageVector = Icons.Rounded.Search,
                    contentDescription = "Search chart & glossary",
                    tint = KundliColors.TextMain,
                )
            }
        }

        // Non-blocking 1-line Offline / Stale Status Bar (v3 §4.1 & §5)
        AnimatedVisibility(visible = !staleStatusLine.isNullOrBlank()) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(KundliColors.Surface)
                    .clickable(onClick = onRefreshStale)
                    .padding(horizontal = 20.dp, vertical = 6.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    text = staleStatusLine.orEmpty(),
                    style = MaterialTheme.typography.labelMedium,
                    color = KundliColors.TextMuted,
                )
                Text(
                    text = "Refresh",
                    style = MaterialTheme.typography.labelMedium,
                    color = KundliColors.Gold,
                )
            }
        }
    }
}

@Composable
private fun FloatingCapsuleDock(
    activeDestination: MainDestination,
    onSelectDestination: (MainDestination) -> Unit,
    onOpenAsk: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Surface(
        modifier = modifier
            .fillMaxWidth()
            .height(72.dp),
        color = KundliColors.GlassDockIndigo,
        shape = RoundedCornerShape(36.dp),
        border = BorderStroke(1.dp, KundliColors.SubtleDivider),
        tonalElevation = 0.dp,
    ) {
        Row(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceEvenly,
        ) {
            DockTabItem(MainDestination.Today, activeDestination == MainDestination.Today) {
                onSelectDestination(MainDestination.Today)
            }
            DockTabItem(MainDestination.Chart, activeDestination == MainDestination.Chart) {
                onSelectDestination(MainDestination.Chart)
            }
            // Central Ask Jewel Orb -> Full-Screen AskCopilotPage
            Box(
                modifier = Modifier
                    .size(52.dp)
                    .clip(CircleShape)
                    .background(KundliColors.AskOrbBrush)
                    .clickable(onClick = onOpenAsk),
                contentAlignment = Alignment.Center,
            ) {
                Icon(
                    imageVector = Icons.Rounded.AutoAwesome,
                    contentDescription = "Ask AI Copilot",
                    tint = KundliColors.OrbInk,
                    modifier = Modifier.size(24.dp),
                )
            }
            DockTabItem(MainDestination.Time, activeDestination == MainDestination.Time) {
                onSelectDestination(MainDestination.Time)
            }
            DockTabItem(MainDestination.Journal, activeDestination == MainDestination.Journal) {
                onSelectDestination(MainDestination.Journal)
            }
        }
    }
}

@Composable
private fun DockTabItem(
    destination: MainDestination,
    selected: Boolean,
    onClick: () -> Unit,
) {
    val tint = if (selected) KundliColors.Gold else KundliColors.TextMuted
    Column(
        modifier = Modifier
            .clip(RoundedCornerShape(16.dp))
            .clickable(onClick = onClick)
            .padding(horizontal = 10.dp, vertical = 6.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Icon(
            imageVector = destination.icon,
            contentDescription = destination.label,
            tint = tint,
            modifier = Modifier.size(22.dp),
        )
        Spacer(Modifier.height(2.dp))
        Text(
            text = destination.label,
            style = MaterialTheme.typography.labelMedium,
            color = tint,
        )
    }
}

@Composable
private fun KundliNavigationRail(
    activeDestination: MainDestination,
    onSelectDestination: (MainDestination) -> Unit,
    onOpenDrawer: () -> Unit,
    onOpenAsk: () -> Unit,
) {
    NavigationRail(
        containerColor = KundliColors.Surface,
        contentColor = KundliColors.TextMain,
        header = {
            IconButton(onClick = onOpenDrawer) {
                Icon(Icons.Rounded.Menu, contentDescription = "Open navigation drawer", tint = KundliColors.Gold)
            }
            Spacer(Modifier.height(8.dp))
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .clip(CircleShape)
                    .background(KundliColors.AskOrbBrush)
                    .clickable(onClick = onOpenAsk),
                contentAlignment = Alignment.Center,
            ) {
                Icon(
                    imageVector = Icons.Rounded.AutoAwesome,
                    contentDescription = "Ask AI Copilot",
                    tint = KundliColors.OrbInk,
                )
            }
        },
    ) {
        Spacer(Modifier.height(16.dp))
        MainDestination.entries.forEach { dest ->
            NavigationRailItem(
                selected = activeDestination == dest,
                onClick = { onSelectDestination(dest) },
                icon = { Icon(dest.icon, contentDescription = dest.label) },
                label = { Text(dest.label) },
                colors = NavigationRailItemDefaults.colors(
                    selectedIconColor = KundliColors.Gold,
                    selectedTextColor = KundliColors.Gold,
                    unselectedIconColor = KundliColors.TextMuted,
                    unselectedTextColor = KundliColors.TextMuted,
                    indicatorColor = KundliColors.SurfaceAlt,
                ),
            )
        }
    }
}
