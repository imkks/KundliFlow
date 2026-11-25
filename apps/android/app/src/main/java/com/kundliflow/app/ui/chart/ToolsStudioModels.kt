package com.kundliflow.app.ui.chart

import androidx.compose.runtime.Immutable
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.doubleOrNull
import kotlinx.serialization.json.intOrNull
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import java.util.Locale

@Immutable
data class ChalitShiftRow(
    val planet: String,
    val rashiHouse: Int,
    val chalitHouse: Int,
    val meaning: String,
)

@Immutable
data class KpCuspRow(
    val house: Int,
    val sign: String,
    val starLord: String,
    val subLord: String,
)

@Immutable
data class SahamRow(
    val name: String,
    val sign: String,
    val degree: String,
    val meaning: String,
)

@Immutable
data class VarshaphalViewData(
    val targetYear: Int,
    val varshaLagna: String,
    val munthaSign: String,
    val munthaHouse: Int,
    val varsheshwara: String,
    val summary: String,
    val sahams: List<SahamRow>,
    val arudhas: List<Pair<String, String>>,
    val upagrahas: List<Pair<String, String>>,
)

@Immutable
data class ToolsStudioData(
    val chalitShifts: List<ChalitShiftRow>,
    val kpCusps: List<KpCuspRow>,
    val avakahadaCells: List<Pair<String, String>>,
    val birthPanchangCells: List<Pair<String, String>>,
    val quantPlanetRows: List<Triple<String, String, String>>, // Planet, Lon/Sign, Flags (Vargottama/Retro)
    val initialVarshaphal: VarshaphalViewData?,
)

object ToolsDataExtractor {
    private val json = Json { ignoreUnknownKeys = true }

    fun extract(level1Json: String?, level2Json: String?): ToolsStudioData {
        val l1 = level1Json?.let { runCatching { json.parseToJsonElement(it).jsonObject }.getOrNull() }
        val l2 = level2Json?.let { runCatching { json.parseToJsonElement(it).jsonObject }.getOrNull() }
        val extras = l2?.obj("standard")?.obj("kundliExtras")

        val chalitShifts = extras?.arr("chalitShifts")?.map { el ->
            val o = el.jsonObject
            ChalitShiftRow(
                planet = (o.str("planet") ?: "").uppercase(),
                rashiHouse = o.int("rashiHouse") ?: 1,
                chalitHouse = o.int("chalitHouse") ?: 1,
                meaning = o.str("plainMeaning") ?: "",
            )
        } ?: emptyList()

        val kpCusps = extras?.arr("kpCusps")?.map { el ->
            val o = el.jsonObject
            KpCuspRow(
                house = o.int("house") ?: 1,
                sign = cap(o.str("sign") ?: ""),
                starLord = cap(o.str("starLord") ?: ""),
                subLord = cap(o.str("subLord") ?: ""),
            )
        } ?: emptyList()

        val ava = l1?.obj("avakahada")
        val avakahadaCells = listOf(
            "Paya" to (ava?.str("paya") ?: "—"),
            "Varna" to (ava?.str("varna") ?: "—"),
            "Yoni" to (ava?.str("yoni") ?: "—"),
            "Gana" to (ava?.str("gana") ?: "—"),
            "Vasya" to (ava?.str("vasya") ?: "—"),
            "Nadi" to (ava?.str("nadi") ?: "—"),
        )

        val pan = l1?.obj("panchang")
        val jd = l1?.obj("natal")?.obj("time")?.dbl("julianDayUt")
        val birthPanchangCells = listOf(
            "Tithi" to (pan?.obj("tithi")?.str("name") ?: pan?.str("tithi") ?: "—"),
            "Vara" to (pan?.obj("vara")?.str("name") ?: pan?.str("vara") ?: "—"),
            "Nakshatra" to (pan?.obj("nakshatra")?.str("name") ?: l1?.obj("natal")?.obj("grahas")?.obj("moon")?.str("nakshatra") ?: "—"),
            "Yoga" to (pan?.obj("yoga")?.str("name") ?: pan?.str("yoga") ?: "—"),
            "Karana" to (pan?.obj("karana")?.str("name") ?: pan?.str("karana") ?: "—"),
            "Julian Day UT" to (jd?.let { String.format(Locale.US, "%.4f", it) } ?: "—"),
        )

        val grahas = l1?.obj("natal")?.obj("grahas")
        val d9Grahas = l1?.obj("vargas")?.obj("D9")?.obj("grahas")
        val quantRows = listOf("sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn", "rahu", "ketu").mapNotNull { key ->
            val g = grahas?.obj(key) ?: return@mapNotNull null
            val sign = cap(g.str("sign") ?: "")
            val deg = g.dbl("degInSign") ?: 0.0
            val signIdx = g.int("signIndex") ?: -1
            val d9Idx = d9Grahas?.int(key) ?: -2
            val houseLagna = g.obj("houses")?.int("houseFromLagna") ?: 1
            val flags = buildList {
                if (d9Idx == signIdx) add("★ Vargottama")
                if (g.str("retrograde") == "true") add("R")
            }.joinToString(" · ").ifBlank { "H$houseLagna" }
            Triple(
                cap(key),
                String.format(Locale.US, "%s %.2f°", sign, deg),
                flags,
            )
        }

        val vpSummary = extras?.obj("varshaphal")
        val initialVp = vpSummary?.let { parseVarshaphalSummary(it, l1) }

        return ToolsStudioData(
            chalitShifts = chalitShifts,
            kpCusps = kpCusps,
            avakahadaCells = avakahadaCells,
            birthPanchangCells = birthPanchangCells,
            quantPlanetRows = quantRows,
            initialVarshaphal = initialVp,
        )
    }

    fun parseVarshaphalEndpointJson(rawJson: String): VarshaphalViewData? = runCatching {
        val root = json.parseToJsonElement(rawJson).jsonObject
        val vp = root.obj("varshaphal") ?: return@runCatching null
        val sahams = vp.arr("sahamsList").map { el ->
            val o = el.jsonObject
            SahamRow(
                name = o.str("name") ?: "Saham",
                sign = cap(o.str("sign") ?: ""),
                degree = o.dbl("degInSign")?.let { String.format(Locale.US, "%.1f°", it) } ?: "—",
                meaning = o.str("meaning") ?: o.str("domain") ?: "",
            )
        }
        val arudhas = extractPairs(root["arudhas"])
        val upagrahas = extractPairs(root["upagrahas"])
        VarshaphalViewData(
            targetYear = root.int("targetYear") ?: vp.int("targetYear") ?: 2026,
            varshaLagna = cap(vp.str("varshaLagnaSign") ?: "—"),
            munthaSign = cap(vp.str("munthaSign") ?: "—"),
            munthaHouse = vp.int("munthaHouseInVarsha") ?: 1,
            varsheshwara = cap(vp.str("varsheshwara") ?: "—"),
            summary = "Annual Varsha Lagna ${cap(vp.str("varshaLagnaSign") ?: "")} · Muntha in ${cap(vp.str("munthaSign") ?: "")} (H${vp.int("munthaHouseInVarsha") ?: 1})",
            sahams = sahams,
            arudhas = arudhas,
            upagrahas = upagrahas,
        )
    }.getOrNull()

    private fun parseVarshaphalSummary(vp: JsonObject, l1: JsonObject?): VarshaphalViewData {
        val sahams = vp.arr("sahams").map { el ->
            val o = el.jsonObject
            SahamRow(
                name = o.str("name") ?: "Saham",
                sign = cap(o.str("sign") ?: ""),
                degree = o.dbl("degInSign")?.let { String.format(Locale.US, "%.1f°", it) } ?: "—",
                meaning = o.str("meaning") ?: o.str("domain") ?: "",
            )
        }
        return VarshaphalViewData(
            targetYear = vp.int("targetYear") ?: 2026,
            varshaLagna = cap(vp.str("varshaLagnaSign") ?: "—"),
            munthaSign = cap(vp.str("munthaSign") ?: "—"),
            munthaHouse = vp.int("munthaHouseInVarsha") ?: 1,
            varsheshwara = cap(vp.str("varsheshwara") ?: "—"),
            summary = vp.str("plainSummary") ?: "",
            sahams = sahams,
            arudhas = extractPairs(l1?.get("arudhas")),
            upagrahas = extractPairs(l1?.get("upagrahas")),
        )
    }

    private fun extractPairs(elem: kotlinx.serialization.json.JsonElement?): List<Pair<String, String>> {
        if (elem == null) return emptyList()
        return runCatching {
            when (elem) {
                is JsonArray -> elem.mapNotNull { item ->
                    val o = item.jsonObject
                    val k = o.str("code") ?: o.str("name") ?: o.str("id") ?: return@mapNotNull null
                    val v = cap(o.str("sign") ?: o.str("signName") ?: "—")
                    k to v
                }
                is JsonObject -> elem.entries.mapNotNull { (k, v) ->
                    val sign = runCatching { v.jsonObject.str("sign") ?: v.jsonObject.str("signName") }.getOrNull()
                        ?: runCatching { v.jsonPrimitive.content }.getOrNull()
                        ?: return@mapNotNull null
                    k.uppercase() to cap(sign)
                }
                else -> emptyList()
            }
        }.getOrDefault(emptyList())
    }

    private fun cap(s: String): String =
        s.replaceFirstChar { if (it.isLowerCase()) it.titlecase(Locale.getDefault()) else it.toString() }

    private fun JsonObject.obj(key: String): JsonObject? = runCatching { this[key]?.jsonObject }.getOrNull()
    private fun JsonObject.arr(key: String): JsonArray = runCatching { this[key]?.jsonArray }.getOrNull() ?: JsonArray(emptyList())
    private fun JsonObject.str(key: String): String? = runCatching { this[key]?.jsonPrimitive?.content }.getOrNull()?.takeIf { it != "null" }
    private fun JsonObject.int(key: String): Int? = runCatching { this[key]?.jsonPrimitive?.intOrNull }.getOrNull()
    private fun JsonObject.dbl(key: String): Double? = runCatching { this[key]?.jsonPrimitive?.doubleOrNull }.getOrNull()
}
