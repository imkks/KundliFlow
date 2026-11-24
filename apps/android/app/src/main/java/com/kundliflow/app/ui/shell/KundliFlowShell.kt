package com.kundliflow.app.ui.shell

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowBack
import androidx.compose.material.icons.rounded.AutoAwesome
import androidx.compose.material.icons.rounded.Book
import androidx.compose.material.icons.rounded.Explore
import androidx.compose.material.icons.rounded.KeyboardArrowDown
import androidx.compose.material.icons.rounded.Schedule
import androidx.compose.material.icons.rounded.Search
import androidx.compose.material.icons.rounded.WbTwilight
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationRail
import androidx.compose.material3.NavigationRailItem
import androidx.compose.material3.NavigationRailItemDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.windowsizeclass.WindowSizeClass
import androidx.compose.material3.windowsizeclass.WindowWidthSizeClass
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import com.kundliflow.app.ui.theme.KundliColors

enum class MainDestination(val label: String, val icon: ImageVector) {
    Today("Today", Icons.Rounded.WbTwilight),
    Chart("Chart", Icons.Rounded.Explore),
    Time("Time", Icons.Rounded.Schedule),
    Journal("Journal", Icons.Rounded.Book),
}

@Composable
fun KundliFlowShell(
    windowSizeClass: WindowSizeClass,
    activeProfileName: String,
    activeDestination: MainDestination,
    showBackToTodayPill: Boolean = false,
    onSelectDestination: (MainDestination) -> Unit,
    onBackToToday: () -> Unit = {},
    onOpenProfileSheet: () -> Unit,
    onOpenSearch: () -> Unit,
    onOpenAsk: () -> Unit,
    content: @Composable () -> Unit,
) {
    val isCompact = windowSizeClass.widthSizeClass == WindowWidthSizeClass.Compact

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
                    onBackToToday = onBackToToday,
                    onOpenProfileSheet = onOpenProfileSheet,
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
                    onOpenAsk = onOpenAsk,
                )
                Column(modifier = Modifier.weight(1f).fillMaxHeight()) {
                    TopHeaderBar(
                        profileName = activeProfileName,
                        showBackToTodayPill = showBackToTodayPill,
                        onBackToToday = onBackToToday,
                        onOpenProfileSheet = onOpenProfileSheet,
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

@Composable
private fun TopHeaderBar(
    profileName: String,
    showBackToTodayPill: Boolean,
    onBackToToday: () -> Unit,
    onOpenProfileSheet: () -> Unit,
    onOpenSearch: () -> Unit,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .statusBarsPadding()
            .height(56.dp)
            .padding(horizontal = 16.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Surface(
                color = KundliColors.Surface,
                shape = RoundedCornerShape(20.dp),
                border = BorderStroke(1.dp, KundliColors.GoldHairline),
                modifier = Modifier.clickable(onClick = onOpenProfileSheet),
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 7.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(
                        text = profileName,
                        style = MaterialTheme.typography.titleMedium,
                        color = KundliColors.TextMain,
                    )
                    Spacer(Modifier.width(4.dp))
                    Icon(
                        imageVector = Icons.Rounded.KeyboardArrowDown,
                        contentDescription = "Open Me sheet",
                        tint = KundliColors.Gold,
                        modifier = Modifier.size(18.dp),
                    )
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
                            text = "Back to Today",
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
            // Central Ask Jewel Orb
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
                    contentDescription = "Ask Copilot",
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
    onOpenAsk: () -> Unit,
) {
    NavigationRail(
        containerColor = KundliColors.Surface,
        contentColor = KundliColors.TextMain,
        header = {
            Spacer(Modifier.height(12.dp))
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
                    contentDescription = "Ask Copilot",
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
