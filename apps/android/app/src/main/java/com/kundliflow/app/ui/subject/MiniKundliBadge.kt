package com.kundliflow.app.ui.subject

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import com.kundliflow.app.ui.theme.KundliColors

/**
 * 44dp Spatial Mini-Kundli Header Icon (§2 Rule 7).
 * Shows the 12-house North Indian diamond geometry with the active house glowing Gold.
 */
@Composable
fun MiniKundliBadge(
    activeHouse: Int?,
    modifier: Modifier = Modifier,
) {
    Canvas(
        modifier = modifier
            .size(44.dp)
            .semantics {
                contentDescription = if (activeHouse != null) {
                    "Mini chart highlighting house $activeHouse"
                } else {
                    "Mini chart"
                }
            },
    ) {
        val w = size.width
        val h = size.height
        val stroke = 1.2.dp.toPx()

        // Highlight active house polygon (simplified canonical North-Indian 12-house layout)
        if (activeHouse != null && activeHouse in 1..12) {
            val poly = housePolygon(activeHouse, w, h)
            drawPath(
                path = poly,
                color = KundliColors.Gold.copy(alpha = 0.25f),
            )
            drawPath(
                path = poly,
                color = KundliColors.Gold,
                style = Stroke(width = stroke * 1.4f),
            )
        }

        // Outer square
        drawRect(
            color = KundliColors.Gold.copy(alpha = 0.45f),
            style = Stroke(width = stroke),
        )
        // Diagonals
        drawLine(KundliColors.Gold.copy(alpha = 0.35f), Offset(0f, 0f), Offset(w, h), stroke)
        drawLine(KundliColors.Gold.copy(alpha = 0.35f), Offset(w, 0f), Offset(0f, h), stroke)
        // Inner diamond
        val diamond = Path().apply {
            moveTo(w / 2f, 0f)
            lineTo(w, h / 2f)
            lineTo(w / 2f, h)
            lineTo(0f, h / 2f)
            close()
        }
        drawPath(diamond, KundliColors.Gold.copy(alpha = 0.4f), style = Stroke(width = stroke))
    }
}

private fun housePolygon(house: Int, w: Float, h: Float): Path {
    val cx = w / 2f
    val cy = h / 2f
    val q1x = w * 0.25f
    val q3x = w * 0.75f
    val q1y = h * 0.25f
    val q3y = h * 0.75f
    val pts = when (house) {
        1 -> listOf(Offset(cx, 0f), Offset(q3x, q1y), Offset(cx, cy), Offset(q1x, q1y))
        2 -> listOf(Offset(0f, 0f), Offset(cx, 0f), Offset(q1x, q1y))
        3 -> listOf(Offset(0f, 0f), Offset(q1x, q1y), Offset(0f, cy))
        4 -> listOf(Offset(0f, cy), Offset(q1x, q1y), Offset(cx, cy), Offset(q1x, q3y))
        5 -> listOf(Offset(0f, cy), Offset(q1x, q3y), Offset(0f, h))
        6 -> listOf(Offset(0f, h), Offset(q1x, q3y), Offset(cx, h))
        7 -> listOf(Offset(cx, cy), Offset(q3x, q3y), Offset(cx, h), Offset(q1x, q3y))
        8 -> listOf(Offset(cx, h), Offset(q3x, q3y), Offset(w, h))
        9 -> listOf(Offset(w, cy), Offset(w, h), Offset(q3x, q3y))
        10 -> listOf(Offset(cx, cy), Offset(q3x, q1y), Offset(w, cy), Offset(q3x, q3y))
        11 -> listOf(Offset(w, 0f), Offset(w, cy), Offset(q3x, q1y))
        else -> listOf(Offset(cx, 0f), Offset(w, 0f), Offset(q3x, q1y))
    }
    return Path().apply {
        moveTo(pts.first().x, pts.first().y)
        pts.drop(1).forEach { lineTo(it.x, it.y) }
        close()
    }
}
