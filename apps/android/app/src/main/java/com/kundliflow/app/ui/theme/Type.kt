package com.kundliflow.app.ui.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

/**
 * KundliFlow Typography (§1.2).
 * Display serif uses Cinzel (font resource hook with Serif fallback);
 * body and telemetry use Plus Jakarta Sans (SansSerif fallback) with tabular numerals (`tnum`).
 */
val CinzelDisplayFamily: FontFamily = FontFamily.Serif
val JakartaSansFamily: FontFamily = FontFamily.SansSerif

val KundliTypography = Typography(
    displaySmall = TextStyle(
        fontFamily = CinzelDisplayFamily,
        fontWeight = FontWeight.SemiBold,
        fontSize = 32.sp,
        lineHeight = 38.sp,
        letterSpacing = 0.04.sp,
    ),
    headlineSmall = TextStyle(
        fontFamily = CinzelDisplayFamily,
        fontWeight = FontWeight.Medium,
        fontSize = 22.sp,
        lineHeight = 28.sp,
        letterSpacing = 0.03.sp,
    ),
    titleMedium = TextStyle(
        fontFamily = JakartaSansFamily,
        fontWeight = FontWeight.SemiBold,
        fontSize = 16.sp,
        lineHeight = 22.sp,
    ),
    bodyMedium = TextStyle(
        fontFamily = JakartaSansFamily,
        fontWeight = FontWeight.Normal,
        fontSize = 15.sp,
        lineHeight = 23.sp,
    ),
    bodySmall = TextStyle(
        fontFamily = JakartaSansFamily,
        fontWeight = FontWeight.Normal,
        fontSize = 13.sp,
        lineHeight = 19.sp,
    ),
    labelMedium = TextStyle(
        fontFamily = JakartaSansFamily,
        fontWeight = FontWeight.Medium,
        fontSize = 12.sp,
        lineHeight = 16.sp,
    ),
)

/** Tabular numerals style for planetary degrees, Shadbala, Ashtakvarga bindus & timers. */
val TelemetryNumberStyle = TextStyle(
    fontFamily = JakartaSansFamily,
    fontWeight = FontWeight.SemiBold,
    fontSize = 14.sp,
    lineHeight = 18.sp,
    fontFeatureSettings = "tnum",
)
