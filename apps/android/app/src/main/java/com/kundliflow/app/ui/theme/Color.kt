package com.kundliflow.app.ui.theme

import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color

/**
 * KundliFlow Color Tokens (§1.1 of ANDROID_UX_LAYOUT_GUIDE.md).
 * Preserves 100% of the Midnight Indigo, Gold, Celestial Teal, Amber & Parchment palette.
 */
object KundliColors {
    val BgInk = Color(0xFF121028)            // Stitch nocturnal space canvas
    val Surface = Color(0xFF1E1B38)          // Stitch primary almanac card
    val SurfaceRecessed = Color(0xFF14122B)  // Stitch dark inner telemetry tile
    val SurfaceAlt = Color(0xFF29264B)       // Stitch elevated active chip/tile
    val GlassDockIndigo = Color(0xF01C1936)  // 94% alpha floating capsule dock
    val TextMain = Color(0xFFF3EEE2)         // Warm Parchment
    val TextMuted = Color(0xFFA6A0BA)        // Muted Lavender-Grey

    val Gold = Color(0xFFE3AD46)       // Steady band, active tab, chart lines, lit discovery
    val Teal = Color(0xFF5FC2B3)       // Flowing band, NOW markers, Ask orb, Bhanga, Moon pulse
    val Amber = Color(0xFFD97736)      // Go gently band (never red for astrological states)
    val AlertCrimson = Color(0xFFF87171) // Destructive UI actions & network errors ONLY

    val GoldHairline = Color(0x3BE3AD46)   // 23% alpha crisp jewel hairline
    val SubtleDivider = Color(0x1CF3EEE2)  // 11% alpha subtle border
    val OrbInk = Color(0xFF121026)

    val AskOrbBrush = Brush.linearGradient(
        colors = listOf(Teal, Gold),
        start = Offset.Zero,
        end = Offset(200f, 200f),
    )

    fun cosmicHeroRadial(width: Float, height: Float): Brush =
        Brush.radialGradient(
            colors = listOf(
                Gold.copy(alpha = 0.16f),
                Teal.copy(alpha = 0.08f),
                Surface,
            ),
            center = Offset(width * 0.5f, height * 0.30f),
            radius = maxOf(width, height) * 0.72f,
        )
}
