package com.kundliflow.app.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable

private val KundliFlowDarkColorScheme = darkColorScheme(
    primary = KundliColors.Gold,
    onPrimary = KundliColors.OrbInk,
    secondary = KundliColors.Teal,
    onSecondary = KundliColors.OrbInk,
    tertiary = KundliColors.Amber,
    onTertiary = KundliColors.OrbInk,
    background = KundliColors.BgInk,
    onBackground = KundliColors.TextMain,
    surface = KundliColors.Surface,
    onSurface = KundliColors.TextMain,
    surfaceVariant = KundliColors.SurfaceAlt,
    onSurfaceVariant = KundliColors.TextMuted,
    surfaceContainerLowest = KundliColors.BgInk,
    surfaceContainerLow = KundliColors.Surface,
    surfaceContainerHigh = KundliColors.SurfaceAlt,
    outline = KundliColors.GoldHairline,
    outlineVariant = KundliColors.SubtleDivider,
    error = KundliColors.AlertCrimson,
)

@Composable
fun KundliFlowTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = KundliFlowDarkColorScheme,
        typography = KundliTypography,
        content = content,
    )
}
