package com.kundliflow.app.ui.me

import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Path
import android.graphics.Typeface
import androidx.core.content.FileProvider
import com.kundliflow.app.data.local.JournalEntryEntity
import com.kundliflow.app.data.local.LifeEventEntity
import com.kundliflow.app.ui.chart.ToolsStudioData
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.intOrNull
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import java.io.File
import java.io.FileOutputStream
import java.time.Instant

data class RestoredVaultData(
    val entries: List<JournalEntryEntity>,
    val milestones: List<LifeEventEntity>,
)

object ShareAndExportHelper {
    private val json = Json { ignoreUnknownKeys = true }

    fun buildLlmDossierMarkdown(
        profileName: String,
        ascendantSign: String,
        moonSign: String,
        moonNakshatra: String,
        activeChapter: String,
        toolsData: ToolsStudioData,
    ): String = buildString {
        appendLine("# KundliFlow Jyotish Dossier — $profileName")
        appendLine()
        appendLine("- **Rising (Lagna):** $ascendantSign")
        appendLine("- **Moon Sign:** $moonSign ($moonNakshatra)")
        appendLine("- **Current Chapter:** $activeChapter")
        appendLine()
        appendLine("## Planetary Positions")
        toolsData.quantPlanetRows.forEach { (p, pos, flags) ->
            appendLine("- **$p:** $pos ($flags)")
        }
        if (toolsData.kpCusps.isNotEmpty()) {
            appendLine()
            appendLine("## KP Cusps")
            toolsData.kpCusps.forEach { c ->
                appendLine("- **H${c.house} (${c.sign}):** Star ${c.starLord} · Sub ${c.subLord}")
            }
        }
        appendLine()
        appendLine("_Generated locally by KundliFlow Android (tradition & reflection, not prediction)._")
    }

    private fun esc(s: String): String =
        s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "\\r")

    fun buildVaultBackupJson(
        profileJson: String,
        entries: List<JournalEntryEntity>,
        milestones: List<LifeEventEntity>,
        exportedAtIso: String,
    ): String {
        val entriesJson = entries.joinToString(",") { e ->
            val snap = e.skySnapshotJson ?: "null"
            """{"id":"${esc(e.id)}","entryDate":"${esc(e.entryDate)}","mood":${e.mood},"energy":${e.energy},"focus":${e.focus},"kind":"${esc(e.kind)}","tagsJson":"${esc(e.tagsJson)}","note":"${esc(e.note)}","skySnapshot":$snap,"createdAt":"${esc(e.createdAt)}","updatedAt":"${esc(e.updatedAt)}"}"""
        }
        val milestonesJson = milestones.joinToString(",") { m ->
            """{"id":"${esc(m.id)}","title":"${esc(m.title)}","eventDate":"${esc(m.eventDate)}","category":"${esc(m.category)}","updatedAt":"${esc(m.updatedAt)}"}"""
        }
        return """{"schema":"kundliflow_vault_v2","exportedAt":"${esc(exportedAtIso)}","profile":$profileJson,"journalCount":${entries.size},"milestonesCount":${milestones.size},"journalEntries":[$entriesJson],"lifeEvents":[$milestonesJson]}"""
    }

    fun parseVaultBackupJson(rawJson: String, targetProfileId: String): RestoredVaultData? = runCatching {
        val root = json.parseToJsonElement(rawJson).jsonObject
        val schema = root["schema"]?.jsonPrimitive?.content ?: return@runCatching null
        if (!schema.startsWith("kundliflow_vault")) return@runCatching null
        val nowIso = Instant.now().toString()

        val entries = root["journalEntries"]?.jsonArray?.mapNotNull { el ->
            val o = el.jsonObject
            val id = o["id"]?.jsonPrimitive?.content ?: return@mapNotNull null
            val snapEl = o["skySnapshot"]
            val snapStr = if (snapEl != null && snapEl.toString() != "null") snapEl.toString() else null
            JournalEntryEntity(
                id = id,
                profileId = targetProfileId,
                entryDate = o["entryDate"]?.jsonPrimitive?.content ?: nowIso.take(10),
                mood = o["mood"]?.jsonPrimitive?.intOrNull ?: 3,
                energy = o["energy"]?.jsonPrimitive?.intOrNull ?: 3,
                focus = o["focus"]?.jsonPrimitive?.intOrNull ?: 3,
                kind = o["kind"]?.jsonPrimitive?.content ?: "checkin",
                tagsJson = o["tagsJson"]?.jsonPrimitive?.content ?: "[]",
                note = o["note"]?.jsonPrimitive?.content ?: "",
                skySnapshotJson = snapStr,
                createdAt = o["createdAt"]?.jsonPrimitive?.content ?: nowIso,
                updatedAt = o["updatedAt"]?.jsonPrimitive?.content ?: nowIso,
                synced = false,
                deleted = false,
            )
        } ?: emptyList()

        val milestones = root["lifeEvents"]?.jsonArray?.mapNotNull { el ->
            val o = el.jsonObject
            val id = o["id"]?.jsonPrimitive?.content ?: return@mapNotNull null
            LifeEventEntity(
                id = id,
                profileId = targetProfileId,
                title = o["title"]?.jsonPrimitive?.content ?: "Milestone",
                eventDate = o["eventDate"]?.jsonPrimitive?.content ?: nowIso.take(10),
                category = o["category"]?.jsonPrimitive?.content ?: "career",
                updatedAt = o["updatedAt"]?.jsonPrimitive?.content ?: nowIso,
                synced = false,
                deleted = false,
            )
        } ?: emptyList()

        RestoredVaultData(entries = entries, milestones = milestones)
    }.getOrNull()

    fun shareCosmicBlueprintPng(
        context: Context,
        profileName: String,
        ascendantSign: String,
        moonSign: String,
        moonNakshatra: String,
        rarityLine: String,
        chapterLine: String,
    ) {
        val bitmap = Bitmap.createBitmap(1080, 1920, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)

        // Midnight Indigo Canvas (#15132B)
        canvas.drawColor(Color.parseColor("#15132B"))

        // Subtle Gold outer frame
        val borderPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.parseColor("#E3AD46")
            style = Paint.Style.STROKE
            strokeWidth = 4f
            alpha = 140
        }
        canvas.drawRoundRect(64f, 64f, 1016f, 1856f, 48f, 48f, borderPaint)

        // Sacred North-Indian Diamond centerpiece
        val cx = 540f
        val cy = 860f
        val r = 270f
        val diamond = Path().apply {
            moveTo(cx, cy - r)
            lineTo(cx + r, cy)
            lineTo(cx, cy + r)
            lineTo(cx - r, cy)
            close()
        }
        val fillPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.parseColor("#201D40")
            style = Paint.Style.FILL
        }
        canvas.drawPath(diamond, fillPaint)
        canvas.drawPath(diamond, borderPaint)

        val eyebrowPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.parseColor("#E3AD46")
            textSize = 42f
            letterSpacing = 0.14f
            textAlign = Paint.Align.CENTER
            typeface = Typeface.create(Typeface.SERIF, Typeface.BOLD)
        }
        val heroPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.parseColor("#F3EEE2")
            textSize = 86f
            textAlign = Paint.Align.CENTER
            typeface = Typeface.create(Typeface.SERIF, Typeface.BOLD)
        }
        val tealPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.parseColor("#5FC2B3")
            textSize = 46f
            textAlign = Paint.Align.CENTER
            typeface = Typeface.create(Typeface.SANS_SERIF, Typeface.NORMAL)
        }
        val mutedPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.parseColor("#A6A0BA")
            textSize = 38f
            textAlign = Paint.Align.CENTER
            typeface = Typeface.create(Typeface.SANS_SERIF, Typeface.NORMAL)
        }

        canvas.drawText("KUNDLIFLOW", cx, 220f, eyebrowPaint)
        canvas.drawText(profileName.uppercase(), cx, 320f, mutedPaint)
        canvas.drawText("$ascendantSign Rising", cx, 850f, heroPaint)
        canvas.drawText("Moon in $moonSign · $moonNakshatra", cx, 940f, tealPaint)
        canvas.drawText(rarityLine, cx, 1340f, mutedPaint)
        canvas.drawText(chapterLine, cx, 1440f, eyebrowPaint)
        canvas.drawText("Tradition & reflection · kundliflow", cx, 1740f, mutedPaint)

        val dir = File(context.cacheDir, "shared").apply { mkdirs() }
        val file = File(dir, "cosmic_blueprint.png")
        FileOutputStream(file).use { out ->
            bitmap.compress(Bitmap.CompressFormat.PNG, 100, out)
        }
        bitmap.recycle()

        val uri = FileProvider.getUriForFile(context, "${context.packageName}.fileprovider", file)
        val intent = Intent(Intent.ACTION_SEND).apply {
            type = "image/png"
            putExtra(Intent.EXTRA_STREAM, uri)
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }
        context.startActivity(Intent.createChooser(intent, "Share Cosmic Blueprint"))
    }

    fun shareTextDocument(
        context: Context,
        fileName: String,
        mimeType: String,
        content: String,
    ) {
        val dir = File(context.cacheDir, "shared").apply { mkdirs() }
        val file = File(dir, fileName)
        file.writeText(content)
        val uri = FileProvider.getUriForFile(context, "${context.packageName}.fileprovider", file)
        val intent = Intent(Intent.ACTION_SEND).apply {
            type = mimeType
            putExtra(Intent.EXTRA_STREAM, uri)
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }
        context.startActivity(Intent.createChooser(intent, "Export $fileName"))
    }
}
