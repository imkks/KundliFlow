package com.kundliflow.app.ui.chart

import android.provider.Settings
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.TextMeasurer
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.drawText
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.rememberTextMeasurer
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.kundliflow.app.ui.theme.JakartaSansFamily
import com.kundliflow.app.ui.theme.KundliColors

/**
 * Full-width 1:1 Kundli Canvas supporting North & South Indian layouts,
 * Gold selected-house glow + House->Lord vector, Live Transit Moon Pulse (Teal),
 * and Long-Press Drishti Threads (Rung 1.5).
 */
@Composable
fun KundliChartCanvas(
    chart: ChartUiState,
    style: ChartStyle,
    selectedHouse: Int?,
    highlightedHouses: Set<Int> = emptySet(),
    onSelectHouse: (Int) -> Unit,
    modifier: Modifier = Modifier,
) {
    val context = LocalContext.current
    val reducedMotion = remember(context) {
        runCatching {
            Settings.Global.getFloat(context.contentResolver, Settings.Global.ANIMATOR_DURATION_SCALE, 1f) == 0f
        }.getOrDefault(false)
    }
    val haptics = LocalHapticFeedback.current
    val textMeasurer = rememberTextMeasurer()
    var drishtiOriginHouse by remember { mutableStateOf<Int?>(null) }

    val pulseTransition = rememberInfiniteTransition(label = "moon_pulse")
    val animatedPulse by pulseTransition.animateFloat(
        initialValue = 0.85f,
        targetValue = 1.25f,
        animationSpec = infiniteRepeatable(tween(1200), RepeatMode.Reverse),
        label = "moon_pulse_scale",
    )
    val moonPulseScale = if (reducedMotion) 1.0f else animatedPulse

    Canvas(
        modifier = modifier
            .fillMaxWidth()
            .aspectRatio(1f)
            .clip(RoundedCornerShape(18.dp))
            .background(KundliColors.Surface)
            .border(1.dp, KundliColors.GoldHairline, RoundedCornerShape(18.dp))
            .semantics {
                contentDescription = "${style.label} birth chart. ${chart.ascendantSign} rising, Moon in ${chart.moonSign}. Tap any house to inspect."
            }
            .pointerInput(style, chart.houses) {
                detectTapGestures(
                    onTap = { pos ->
                        drishtiOriginHouse = null
                        val nx = (pos.x / size.width).coerceIn(0f, 1f)
                        val ny = (pos.y / size.height).coerceIn(0f, 1f)
                        val hitHouse = when (style) {
                            ChartStyle.NORTH -> DrishtiCalculator.hitTestNorthIndianHouse(nx, ny)
                            ChartStyle.SOUTH -> {
                                val sign = DrishtiCalculator.hitTestSouthIndianSign(nx, ny)
                                chart.houses.firstOrNull { it.signIndex == sign }?.number
                            }
                        }
                        if (hitHouse != null) {
                            haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                            onSelectHouse(hitHouse)
                        }
                    },
                    onLongPress = { pos ->
                        val nx = (pos.x / size.width).coerceIn(0f, 1f)
                        val ny = (pos.y / size.height).coerceIn(0f, 1f)
                        val hitHouse = when (style) {
                            ChartStyle.NORTH -> DrishtiCalculator.hitTestNorthIndianHouse(nx, ny)
                            ChartStyle.SOUTH -> {
                                val sign = DrishtiCalculator.hitTestSouthIndianSign(nx, ny)
                                chart.houses.firstOrNull { it.signIndex == sign }?.number
                            }
                        }
                        if (hitHouse != null) {
                            haptics.performHapticFeedback(HapticFeedbackType.LongPress)
                            drishtiOriginHouse = hitHouse
                            onSelectHouse(hitHouse)
                        }
                    },
                )
            },
    ) {
        if (style == ChartStyle.NORTH) {
            drawNorthIndianChart(
                chart = chart,
                selectedHouse = selectedHouse,
                highlightedHouses = highlightedHouses,
                drishtiOriginHouse = drishtiOriginHouse,
                moonPulseScale = moonPulseScale,
                textMeasurer = textMeasurer,
            )
        } else {
            drawSouthIndianChart(
                chart = chart,
                selectedHouse = selectedHouse,
                highlightedHouses = highlightedHouses,
                drishtiOriginHouse = drishtiOriginHouse,
                moonPulseScale = moonPulseScale,
                textMeasurer = textMeasurer,
            )
        }
    }
}

private fun DrawScope.drawNorthIndianChart(
    chart: ChartUiState,
    selectedHouse: Int?,
    highlightedHouses: Set<Int>,
    drishtiOriginHouse: Int?,
    moonPulseScale: Float,
    textMeasurer: TextMeasurer,
) {
    val w = size.width
    val h = size.height
    val pad = 8.dp.toPx()
    val iw = w - pad * 2
    val ih = h - pad * 2

    // Highlight selected & Life-Topic houses
    chart.houses.forEach { house ->
        val poly = northHousePolygon(house.number, pad, iw, ih)
        when {
            house.number == selectedHouse -> drawPath(poly, KundliColors.Gold.copy(alpha = 0.20f))
            highlightedHouses.contains(house.number) -> drawPath(poly, KundliColors.Teal.copy(alpha = 0.12f))
        }
    }

    val lineStroke = 1.3.dp.toPx()
    val lineColor = KundliColors.Gold.copy(alpha = 0.55f)
    drawRect(lineColor, topLeft = Offset(pad, pad), size = Size(iw, ih), style = Stroke(lineStroke))
    drawLine(lineColor, Offset(pad, pad), Offset(pad + iw, pad + ih), lineStroke)
    drawLine(lineColor, Offset(pad + iw, pad), Offset(pad, pad + ih), lineStroke)
    val diamond = Path().apply {
        moveTo(pad + iw / 2f, pad)
        lineTo(pad + iw, pad + ih / 2f)
        lineTo(pad + iw / 2f, pad + ih)
        lineTo(pad, pad + ih / 2f)
        close()
    }
    drawPath(diamond, lineColor, style = Stroke(lineStroke))

    // House -> Lord animated dashed vector
    val selData = chart.houses.firstOrNull { it.number == selectedHouse }
    if (selData != null && selData.lordHouse != selData.number) {
        val fromPt = northHouseCenter(selData.number, pad, iw, ih)
        val toPt = northHouseCenter(selData.lordHouse, pad, iw, ih)
        drawLine(
            color = KundliColors.Gold,
            start = fromPt,
            end = toPt,
            strokeWidth = 2.dp.toPx(),
            pathEffect = PathEffect.dashPathEffect(floatArrayOf(12f, 8f)),
        )
    }

    // Long-Press Drishti Threads (Rung 1.5)
    if (drishtiOriginHouse != null) {
        val originHouse = chart.houses.firstOrNull { it.number == drishtiOriginHouse }
        if (originHouse != null) {
            val targets = DrishtiCalculator.aspectHouses(
                fromHouse = originHouse.number,
                planetsInHouse = originHouse.planets.map { it.id },
            )
            val fromPt = northHouseCenter(originHouse.number, pad, iw, ih)
            targets.forEach { targetHouse ->
                val toPt = northHouseCenter(targetHouse, pad, iw, ih)
                drawLine(
                    color = KundliColors.Teal.copy(alpha = 0.85f),
                    start = fromPt,
                    end = toPt,
                    strokeWidth = 2.dp.toPx(),
                    pathEffect = PathEffect.dashPathEffect(floatArrayOf(8f, 6f)),
                )
            }
        }
    }

    // House labels, planet glyphs, and Live Transit Moon Pulse
    chart.houses.forEach { house ->
        val center = northHouseCenter(house.number, pad, iw, ih)
        val signText = "${house.signIndex + 1}"
        drawCenteredText(
            textMeasurer = textMeasurer,
            text = signText,
            center = Offset(center.x, center.y - 11.dp.toPx()),
            style = TextStyle(
                fontFamily = JakartaSansFamily,
                fontSize = 11.sp,
                color = KundliColors.TextMuted,
            ),
        )
        if (house.planets.isNotEmpty()) {
            val glyphs = house.planets.joinToString(" ") { it.shortGlyph }
            drawCenteredText(
                textMeasurer = textMeasurer,
                text = glyphs,
                center = Offset(center.x, center.y + 6.dp.toPx()),
                style = TextStyle(
                    fontFamily = JakartaSansFamily,
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 12.sp,
                    color = KundliColors.TextMain,
                ),
            )
        }
        if (house.number == chart.liveTransitMoonHouse) {
            drawCircle(
                color = KundliColors.Teal.copy(alpha = 0.25f),
                radius = 9.dp.toPx() * moonPulseScale,
                center = Offset(center.x + 18.dp.toPx(), center.y - 12.dp.toPx()),
            )
            drawCircle(
                color = KundliColors.Teal,
                radius = 4.dp.toPx(),
                center = Offset(center.x + 18.dp.toPx(), center.y - 12.dp.toPx()),
            )
        }
    }
}

private fun DrawScope.drawSouthIndianChart(
    chart: ChartUiState,
    selectedHouse: Int?,
    highlightedHouses: Set<Int>,
    drishtiOriginHouse: Int?,
    moonPulseScale: Float,
    textMeasurer: TextMeasurer,
) {
    val pad = 8.dp.toPx()
    val cellW = (size.width - pad * 2) / 4f
    val cellH = (size.height - pad * 2) / 4f
    val lineColor = KundliColors.Gold.copy(alpha = 0.5f)
    val stroke = 1.2.dp.toPx()

    for (row in 0..3) {
        for (col in 0..3) {
            val sign = DrishtiCalculator.southCellToSign(row, col) ?: continue
            val house = chart.houses.firstOrNull { it.signIndex == sign }
            val topLeft = Offset(pad + col * cellW, pad + row * cellH)
            if (house != null) {
                when {
                    house.number == selectedHouse -> drawRect(KundliColors.Gold.copy(alpha = 0.20f), topLeft, Size(cellW, cellH))
                    highlightedHouses.contains(house.number) -> drawRect(KundliColors.Teal.copy(alpha = 0.12f), topLeft, Size(cellW, cellH))
                }
            }
            drawRect(lineColor, topLeft, Size(cellW, cellH), style = Stroke(stroke))

            if (house != null) {
                val center = Offset(topLeft.x + cellW / 2f, topLeft.y + cellH / 2f)
                drawCenteredText(
                    textMeasurer = textMeasurer,
                    text = if (house.number == 1) "As" else "H${house.number}",
                    center = Offset(center.x, center.y - 12.dp.toPx()),
                    style = TextStyle(fontFamily = JakartaSansFamily, fontSize = 10.sp, color = KundliColors.Gold),
                )
                if (house.planets.isNotEmpty()) {
                    drawCenteredText(
                        textMeasurer = textMeasurer,
                        text = house.planets.joinToString(" ") { it.shortGlyph },
                        center = Offset(center.x, center.y + 5.dp.toPx()),
                        style = TextStyle(fontFamily = JakartaSansFamily, fontWeight = FontWeight.SemiBold, fontSize = 11.sp, color = KundliColors.TextMain),
                    )
                }
                if (house.number == chart.liveTransitMoonHouse) {
                    drawCircle(
                        color = KundliColors.Teal.copy(alpha = 0.25f),
                        radius = 8.dp.toPx() * moonPulseScale,
                        center = Offset(topLeft.x + cellW - 12.dp.toPx(), topLeft.y + 12.dp.toPx()),
                    )
                    drawCircle(
                        color = KundliColors.Teal,
                        radius = 3.5.dp.toPx(),
                        center = Offset(topLeft.x + cellW - 12.dp.toPx(), topLeft.y + 12.dp.toPx()),
                    )
                }
            }
        }
    }

    // Center 2x2 label
    drawCenteredText(
        textMeasurer = textMeasurer,
        text = "${chart.ascendantSign}\nD1",
        center = Offset(size.width / 2f, size.height / 2f),
        style = TextStyle(fontFamily = JakartaSansFamily, fontWeight = FontWeight.Medium, fontSize = 13.sp, color = KundliColors.TextMuted),
    )

    // Drishti overlay on South chart if active
    if (drishtiOriginHouse != null) {
        val origin = chart.houses.firstOrNull { it.number == drishtiOriginHouse }
        val fromPt = origin?.let { southHouseCenter(it.signIndex, pad, cellW, cellH) }
        if (origin != null && fromPt != null) {
            DrishtiCalculator.aspectHouses(origin.number, origin.planets.map { it.id }).forEach { targetNum ->
                val targetSign = chart.houses.firstOrNull { it.number == targetNum }?.signIndex ?: return@forEach
                val toPt = southHouseCenter(targetSign, pad, cellW, cellH) ?: return@forEach
                drawLine(
                    color = KundliColors.Teal,
                    start = fromPt,
                    end = toPt,
                    strokeWidth = 2.dp.toPx(),
                    pathEffect = PathEffect.dashPathEffect(floatArrayOf(8f, 6f)),
                )
            }
        }
    }
}

private fun DrawScope.drawCenteredText(
    textMeasurer: TextMeasurer,
    text: String,
    center: Offset,
    style: TextStyle,
) {
    val result = textMeasurer.measure(text, style)
    drawText(
        textLayoutResult = result,
        topLeft = Offset(center.x - result.size.width / 2f, center.y - result.size.height / 2f),
    )
}

private fun southHouseCenter(signIndex: Int, pad: Float, cellW: Float, cellH: Float): Offset? {
    for (r in 0..3) {
        for (c in 0..3) {
            if (DrishtiCalculator.southCellToSign(r, c) == signIndex) {
                return Offset(pad + c * cellW + cellW / 2f, pad + r * cellH + cellH / 2f)
            }
        }
    }
    return null
}

private fun northHouseCenter(house: Int, pad: Float, w: Float, h: Float): Offset = when (house) {
    1 -> Offset(pad + w * 0.50f, pad + h * 0.25f)
    2 -> Offset(pad + w * 0.25f, pad + h * 0.11f)
    3 -> Offset(pad + w * 0.11f, pad + h * 0.25f)
    4 -> Offset(pad + w * 0.25f, pad + h * 0.50f)
    5 -> Offset(pad + w * 0.11f, pad + h * 0.75f)
    6 -> Offset(pad + w * 0.25f, pad + h * 0.89f)
    7 -> Offset(pad + w * 0.50f, pad + h * 0.75f)
    8 -> Offset(pad + w * 0.75f, pad + h * 0.89f)
    9 -> Offset(pad + w * 0.89f, pad + h * 0.75f)
    10 -> Offset(pad + w * 0.75f, pad + h * 0.50f)
    11 -> Offset(pad + w * 0.89f, pad + h * 0.25f)
    else -> Offset(pad + w * 0.75f, pad + h * 0.11f)
}

private fun northHousePolygon(house: Int, pad: Float, w: Float, h: Float): Path {
    val cx = pad + w * 0.5f
    val cy = pad + h * 0.5f
    val q1x = pad + w * 0.25f
    val q3x = pad + w * 0.75f
    val q1y = pad + h * 0.25f
    val q3y = pad + h * 0.75f
    val pts = when (house) {
        1 -> listOf(Offset(cx, pad), Offset(q3x, q1y), Offset(cx, cy), Offset(q1x, q1y))
        2 -> listOf(Offset(pad, pad), Offset(cx, pad), Offset(q1x, q1y))
        3 -> listOf(Offset(pad, pad), Offset(q1x, q1y), Offset(pad, cy))
        4 -> listOf(Offset(pad, cy), Offset(q1x, q1y), Offset(cx, cy), Offset(q1x, q3y))
        5 -> listOf(Offset(pad, cy), Offset(q1x, q3y), Offset(pad, pad + h))
        6 -> listOf(Offset(pad, pad + h), Offset(q1x, q3y), Offset(cx, pad + h))
        7 -> listOf(Offset(cx, cy), Offset(q3x, q3y), Offset(cx, pad + h), Offset(q1x, q3y))
        8 -> listOf(Offset(cx, pad + h), Offset(q3x, q3y), Offset(pad + w, pad + h))
        9 -> listOf(Offset(pad + w, cy), Offset(pad + w, pad + h), Offset(q3x, q3y))
        10 -> listOf(Offset(cx, cy), Offset(q3x, q1y), Offset(pad + w, cy), Offset(q3x, q3y))
        11 -> listOf(Offset(pad + w, pad), Offset(pad + w, cy), Offset(q3x, q1y))
        else -> listOf(Offset(cx, pad), Offset(pad + w, pad), Offset(q3x, q1y))
    }
    return Path().apply {
        moveTo(pts.first().x, pts.first().y)
        pts.drop(1).forEach { lineTo(it.x, it.y) }
        close()
    }
}
