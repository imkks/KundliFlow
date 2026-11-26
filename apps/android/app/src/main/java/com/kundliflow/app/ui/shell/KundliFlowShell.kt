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
                    // Drawer Brand Header (Stitch drawer.png)
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(10.dp),
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(32.dp)
                                    .clip(CircleShape)
                                    .background(KundliColors.SurfaceRecessed)
                                    .border(1.5.dp, KundliColors.Gold, CircleShape),
                                contentAlignment = Alignment.Center,
                            ) {
                                Text("✦", style = MaterialTheme.typography.labelLarge, color = KundliColors.Gold)
                            }
                            Column {
                                Text(
                                    text = "KUNDLIFLOW",
                                    style = MaterialTheme.typography.titleLarge,
                                    color = KundliColors.TextMain,
                                )
                                Text(
                                    text = "VEDIC ASTROLOGY",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = KundliColors.TextMuted,
                                )
                            }
                        }
                        IconButton(onClick = { closeDrawerAnd { onNavigatePage(AppPage.SettingsAndVault) } }) {
                            Icon(
                                imageVector = Icons.Rounded.Settings,
                                contentDescription = "Settings and Data Vault",
                                tint = KundliColors.TextMuted,
                            )
                        }
                    }

                    // Active Profile Card (Stitch drawer.png: Cinzel name + inline Band pill + Edit >)
                    Surface(
                        color = KundliColors.SurfaceAlt.copy(alpha = 0.72f),
                        border = BorderStroke(1.dp, KundliColors.GoldHairline),
                        shape = RoundedCornerShape(16.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { closeDrawerAnd { onSelectDestination(MainDestination.Today) } },
                    ) {
                        Column(
                            modifier = Modifier.padding(14.dp),
                            verticalArrangement = Arrangement.spacedBy(6.dp),
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically,
                            ) {
                                Row(
                                    modifier = Modifier.weight(1f),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                                ) {
                                    Text(
                                        text = activeProfileName.uppercase(),
                                        style = MaterialTheme.typography.titleLarge,
                                        color = KundliColors.TextMain,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis,
                                    )
                                    if (!liveSkyBandLabel.isNullOrBlank()) {
                                        Surface(
                                            color = liveSkyBandColor.copy(alpha = 0.16f),
                                            border = BorderStroke(1.dp, liveSkyBandColor.copy(alpha = 0.45f)),
                                            shape = RoundedCornerShape(999.dp),
                                        ) {
                                            Text(
                                                text = "● $liveSkyBandLabel",
                                                style = MaterialTheme.typography.labelSmall,
                                                color = liveSkyBandColor,
                                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp),
                                            )
                                        }
                                    }
                                }
                                Surface(
                                    color = KundliColors.SurfaceRecessed,
                                    border = BorderStroke(1.dp, KundliColors.GoldHairline),
                                    shape = RoundedCornerShape(10.dp),
                                    modifier = Modifier.clickable {
                                        closeDrawerAnd { onNavigatePage(AppPage.SettingsAndVault) }
                                    },
                                ) {
                                    Text(
                                        text = "Edit >",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = KundliColors.Gold,
                                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp),
                                    )
                                }
                            }
                            if (activeProfileSubtitle.isNotBlank()) {
                                Text(
                                    text = activeProfileSubtitle,
                                    style = MaterialTheme.typography.bodySmall,
                                    color = KundliColors.TextMain.copy(alpha = 0.85f),
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis,
                                )
                            }
                            if (!liveSkySubtitle.isNullOrBlank()) {
                                Text(
                                    text = liveSkySubtitle,
                                    style = MaterialTheme.typography.labelSmall,
                                    color = KundliColors.TextMuted,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis,
                                )
                            }
                        }
                    }

                    // Horizontal Orbit Profile Switcher Rail
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Text("YOUR ORBIT", style = MaterialTheme.typography.labelSmall, color = KundliColors.TextMuted)
                        Text(
                            text = "${savedProfiles.size} charts cached",
                            style = MaterialTheme.typography.labelSmall,
                            color = KundliColors.TextMuted,
                        )
                    }
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

                    // Unified Segmented Reading Depth Bar (Stitch drawer.png)
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Text("READING DEPTH", style = MaterialTheme.typography.labelSmall, color = KundliColors.TextMuted)
                        Text(
                            text = when (detailLevel) {
                                "simple" -> "SIMPLE (L1)"
                                "full" -> "FULL (L3)"
                                else -> "BALANCED (L2)"
                            },
                            style = MaterialTheme.typography.labelSmall,
                            color = KundliColors.Gold,
                        )
                    }
                    Surface(
                        color = KundliColors.SurfaceRecessed,
                        border = BorderStroke(1.dp, KundliColors.SubtleDivider),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Row(modifier = Modifier.padding(3.dp)) {
                            listOf("simple" to "Simple", "balanced" to "Balanced", "full" to "Full").forEach { (id, label) ->
                                val active = detailLevel == id
                                Surface(
                                    color = if (active) KundliColors.SurfaceAlt else Color.Transparent,
                                    border = if (active) BorderStroke(1.dp, KundliColors.GoldHairline) else null,
                                    shape = RoundedCornerShape(9.dp),
                                    modifier = Modifier
                                        .weight(1f)
                                        .clickable { onChangeDetailLevel(id) },
                                ) {
                                    Box(
                                        modifier = Modifier.padding(vertical = 8.dp),
                                        contentAlignment = Alignment.Center,
                                    ) {
                                        Text(
                                            text = label,
                                            style = MaterialTheme.typography.labelMedium,
                                            color = if (active) KundliColors.Gold else KundliColors.TextMuted,
                                        )
                                    }
                                }
                            }
                        }
                    }

                    // Unified 2-Way Chart Style Segmented Bar
                    Surface(
                        color = KundliColors.SurfaceRecessed,
                        border = BorderStroke(1.dp, KundliColors.SubtleDivider),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Row(modifier = Modifier.padding(3.dp)) {
                            listOf("NORTH" to "North Indian", "SOUTH" to "South Indian").forEach { (id, label) ->
                                val active = chartStyle.equals(id, ignoreCase = true)
                                Surface(
                                    color = if (active) KundliColors.SurfaceAlt else Color.Transparent,
                                    border = if (active) BorderStroke(1.dp, KundliColors.Teal.copy(alpha = 0.4f)) else null,
                                    shape = RoundedCornerShape(9.dp),
                                    modifier = Modifier
                                        .weight(1f)
                                        .clickable { onChangeChartStyle(id) },
                                ) {
                                    Box(
                                        modifier = Modifier.padding(vertical = 7.dp),
                                        contentAlignment = Alignment.Center,
                                    ) {
                                        Text(
                                            text = label,
                                            style = MaterialTheme.typography.labelSmall,
                                            color = if (active) KundliColors.Teal else KundliColors.TextMuted,
                                        )
                                    }
                                }
                            }
                        }
                    }

                    HorizontalDivider(color = KundliColors.SubtleDivider)

                    // Explore & Specialist Studios (Stitch drawer.png rows with 36dp icon tiles + subtitles)
                    Text("EXPLORE & SPECIALIST STUDIOS", style = MaterialTheme.typography.labelSmall, color = KundliColors.TextMuted)
                    DrawerPageItem(
                        icon = Icons.Rounded.WorkspacePremium,
                        title = "Strengths, Yogas & SAV",
                        subtitle = "Shadbala · 337 Bindus · Dignities",
                        badgeText = if (activeYogasCount > 0) "$activeYogasCount" else null,
                        badgeColor = KundliColors.Gold,
                        accent = KundliColors.Gold,
                        onClick = { closeDrawerAnd { onNavigatePage(AppPage.StrengthsAndYogas) } },
                    )
                    DrawerPageItem(
                        icon = Icons.Rounded.Build,
                        title = "Tools & Systems Studio",
                        subtitle = "Chalit · KP Star-Lords · Varshaphal",
                        accent = KundliColors.Gold,
                        onClick = { closeDrawerAnd { onNavigatePage(AppPage.ToolsStudio) } },
                    )
                    DrawerPageItem(
                        icon = Icons.Rounded.Stars,
                        title = "Discovery Constellation",
                        subtitle = "24-Node Chart Journey",
                        badgeText = "$discoveryLitCount/$discoveryTotalCount",
                        badgeColor = KundliColors.Teal,
                        accent = KundliColors.Teal,
                        onClick = { closeDrawerAnd { onNavigatePage(AppPage.DiscoveryMap) } },
                    )
                    DrawerPageItem(
                        icon = Icons.Rounded.History,
                        title = "Time-Machine & Milestones",
                        subtitle = "1950–2060 Historical Calibration",
                        accent = KundliColors.Gold,
                        onClick = { closeDrawerAnd { onNavigatePage(AppPage.TimeMachine) } },
                    )
                    DrawerPageItem(
                        icon = Icons.Rounded.Timeline,
                        title = "Today's Wave & Almanac",
                        subtitle = "24-Hora Scrubber · Monthly Calendar",
                        accent = KundliColors.Teal,
                        onClick = { closeDrawerAnd(onOpenTodayWave) },
                    )
                    DrawerPageItem(
                        icon = Icons.AutoMirrored.Rounded.MenuBook,
                        title = "Plain English Glossary",
                        subtitle = "7 Categories · Vedic Lexicon",
                        accent = KundliColors.TextMain,
                        onClick = { closeDrawerAnd { onNavigatePage(AppPage.Glossary) } },
                    )
                    DrawerPageItem(
                        icon = Icons.Rounded.Share,
                        title = "Share 9:16 Blueprint",
                        subtitle = "Editorial Astro Wallpaper",
                        accent = KundliColors.Gold,
                        onClick = { closeDrawerAnd(onShareBlueprint) },
                    )
                    DrawerPageItem(
                        icon = Icons.Rounded.Settings,
                        title = "Settings & Data Vault",
                        subtitle = "Local-First · JSON Export & Sync",
                        badgeText = if (!signedInEmail.isNullOrBlank()) "Synced" else "Local",
                        badgeColor = if (!signedInEmail.isNullOrBlank()) KundliColors.Teal else KundliColors.TextMuted,
                        accent = KundliColors.TextMuted,
                        onClick = { closeDrawerAnd { onNavigatePage(AppPage.SettingsAndVault) } },
                    )

                    Spacer(Modifier.height(4.dp))

                    // Pinned Teal-Bordered Support Card (Stitch drawer.png)
                    Surface(
                        color = KundliColors.Teal.copy(alpha = 0.08f),
                        border = BorderStroke(1.dp, KundliColors.Teal.copy(alpha = 0.35f)),
                        shape = RoundedCornerShape(14.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { closeDrawerAnd(onOpenSupport) },
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 12.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(12.dp),
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(34.dp)
                                    .clip(CircleShape)
                                    .background(KundliColors.Teal.copy(alpha = 0.14f)),
                                contentAlignment = Alignment.Center,
                            ) {
                                Icon(Icons.Rounded.FavoriteBorder, contentDescription = null, tint = KundliColors.Teal, modifier = Modifier.size(18.dp))
                            }
                            Column(modifier = Modifier.weight(1f)) {
                                Text("Need support?", style = MaterialTheme.typography.titleSmall, color = KundliColors.Teal)
                                Text("24/7 Grounding & Helplines", style = MaterialTheme.typography.labelSmall, color = KundliColors.TextMuted)
                            }
                            Text(">", style = MaterialTheme.typography.bodyMedium, color = KundliColors.Teal)
                        }
                    }

                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = 2.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                    ) {
                        Text("● Local Vault encrypted", style = MaterialTheme.typography.labelSmall, color = KundliColors.Teal.copy(alpha = 0.8f))
                        Text("v5.0", style = MaterialTheme.typography.labelSmall, color = KundliColors.TextMuted)
                    }
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
                        activeDestination = activeDestination,
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
                            activeDestination = activeDestination,
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
    subtitle: String = "",
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
            modifier = Modifier.padding(horizontal = 4.dp, vertical = 7.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Surface(
                color = KundliColors.SurfaceRecessed,
                border = BorderStroke(1.dp, accent.copy(alpha = 0.22f)),
                shape = RoundedCornerShape(10.dp),
                modifier = Modifier.size(36.dp),
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(icon, contentDescription = null, tint = accent, modifier = Modifier.size(18.dp))
                }
            }
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(1.dp)) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                ) {
                    Text(
                        text = title,
                        style = MaterialTheme.typography.titleSmall,
                        color = KundliColors.TextMain,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        modifier = Modifier.weight(1f, fill = false),
                    )
                    if (!badgeText.isNullOrBlank()) {
                        Surface(
                            color = badgeColor.copy(alpha = 0.16f),
                            shape = RoundedCornerShape(999.dp),
                        ) {
                            Text(
                                text = badgeText,
                                style = MaterialTheme.typography.labelSmall,
                                color = badgeColor,
                                modifier = Modifier.padding(horizontal = 7.dp, vertical = 2.dp),
                            )
                        }
                    }
                }
                if (subtitle.isNotBlank()) {
                    Text(
                        text = subtitle,
                        style = MaterialTheme.typography.labelSmall,
                        color = KundliColors.TextMuted,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                    )
                }
            }
            Text(">", style = MaterialTheme.typography.bodySmall, color = KundliColors.TextMuted)
        }
    }
}

@Composable
private fun TopHeaderBar(
    profileName: String,
    activeDestination: MainDestination,
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
                modifier = Modifier.weight(1f),
            ) {
                IconButton(onClick = onOpenDrawer) {
                    Icon(
                        imageVector = Icons.Rounded.Menu,
                        contentDescription = "Open navigation drawer",
                        tint = KundliColors.TextMain,
                    )
                }
                when (activeDestination) {
                    MainDestination.Today -> {
                        Surface(
                            color = KundliColors.Surface,
                            border = BorderStroke(1.dp, KundliColors.SubtleDivider),
                            shape = RoundedCornerShape(999.dp),
                            modifier = Modifier.clickable(onClick = onOpenDrawer),
                        ) {
                            Text(
                                text = "${profileName.uppercase()}  ▾",
                                style = MaterialTheme.typography.titleLarge,
                                color = KundliColors.TextMain,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis,
                                modifier = Modifier.padding(horizontal = 14.dp, vertical = 5.dp),
                            )
                        }
                    }
                    MainDestination.Chart -> {
                        Column(modifier = Modifier.clickable(onClick = onOpenDrawer)) {
                            Text("NATAL BLUEPRINT", style = MaterialTheme.typography.titleLarge, color = KundliColors.TextMain)
                            Text("$profileName · Vedic Workbench", style = MaterialTheme.typography.labelSmall, color = KundliColors.Gold)
                        }
                    }
                    MainDestination.Time -> {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            modifier = Modifier.clickable(onClick = onOpenDrawer),
                        ) {
                            Text("TIME", style = MaterialTheme.typography.titleLarge, color = KundliColors.TextMain)
                            Text("$profileName ▾", style = MaterialTheme.typography.labelMedium, color = KundliColors.Gold)
                        }
                    }
                    MainDestination.Journal -> {
                        Column(modifier = Modifier.clickable(onClick = onOpenDrawer)) {
                            Text("JOURNAL & RHYTHMS", style = MaterialTheme.typography.titleLarge, color = KundliColors.TextMain)
                            Text("$profileName ▾", style = MaterialTheme.typography.labelSmall, color = KundliColors.TextMuted)
                        }
                    }
                }

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

            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(4.dp),
            ) {
                IconButton(onClick = onOpenSearch) {
                    Icon(
                        imageVector = Icons.Rounded.Search,
                        contentDescription = "Search chart & glossary",
                        tint = KundliColors.TextMain,
                    )
                }
                Box(
                    modifier = Modifier
                        .size(34.dp)
                        .clip(CircleShape)
                        .background(KundliColors.Gold.copy(alpha = 0.16f))
                        .border(1.5.dp, KundliColors.Gold, CircleShape)
                        .clickable(onClick = onOpenDrawer),
                    contentAlignment = Alignment.Center,
                ) {
                    Text(
                        text = profileName.take(1).uppercase(),
                        style = MaterialTheme.typography.labelLarge,
                        color = KundliColors.Gold,
                    )
                }
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
        border = BorderStroke(1.dp, KundliColors.GoldHairline),
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
