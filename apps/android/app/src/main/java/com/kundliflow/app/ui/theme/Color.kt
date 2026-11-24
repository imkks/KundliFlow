package com.kundliflow.app.ui.theme

import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color

/**
 * KundliFlow Color Tokens (§1.1 of ANDROID_UX_LAYOUT_GUIDE.md).
 * Preserves 100% of the Midnight Indigo, Gold, Celestial Teal, Amber & Parchment palette.
 */
object KundliColors {
    val BgInk = Color(0xFF15132B)
    val Surface = Color(0xFF201D40)
    val SurfaceAlt = Color(0xFF2A2652)
    val GlassDockIndigo = Color(0xEB201D40) // 92% alpha
    val TextMain = Color(0xFFF3EEE2)
    val TextMuted = Color(0xFFA6A0BA)

    val Gold = Color(0xFFE3AD46)       // Steady band, active tab, chart lines, lit discovery
    val Teal = Color(0xFF5FC2B3)       // Flowing band, NOW markers, Ask orb, Bhanga, Moon pulse
    val Amber = Color(0xFFD97736)      // Go gently band (never red for astrological states)
    val AlertCrimson = Color(0xFFF87171) // Destructive UI actions & network errors ONLY

    val GoldHairline = Color(0x33E3AD46)   // 20% alpha
    val SubtleDivider = Color(0x14F3EEE2)  // 8% alpha
    val OrbInk = Color(0xFF121026)

    val AskOrbBrush = Brush.linearGradient(
        colors = listOf(Teal, Gold),
        start = Offset.Zero,
        end = Offset(200f, 200f),
    )

    fun cosmicHeroRadial(width: Float, height: Float): Brush =
        Brush.radialGradient(
            colors = listOf(
                Gold.copy(alpha = 0.14f),
                Teal.copy(alpha = 0.06f),
                BgInk,
            ),
            center = Offset(width * 0.85f, height * 0.12f),
            radius = maxOf(width, height) * 0.9f,
        )
}
