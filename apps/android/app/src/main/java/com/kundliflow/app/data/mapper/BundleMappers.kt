package com.kundliflow.app.data.mapper

import com.kundliflow.app.ui.chart.ChartHouseData
import com.kundliflow.app.ui.chart.ChartPlanetPlacement
import com.kundliflow.app.ui.chart.ChartReference
import com.kundliflow.app.ui.chart.ChartUiState
import com.kundliflow.app.ui.chart.DoshaAuditItem
import com.kundliflow.app.ui.chart.ShadbalaBarItem
import com.kundliflow.app.ui.chart.YogaDetailItem
import com.kundliflow.app.ui.discovery.DiscoveryPathEngine
import com.kundliflow.app.ui.journal.FrozenSkySnapshot
import com.kundliflow.app.ui.search.SearchCatalog
import com.kundliflow.app.ui.subject.PlanetId
import com.kundliflow.app.ui.subject.Subject
import com.kundliflow.app.ui.subject.SubjectFact
import com.kundliflow.app.ui.subject.SubjectFindingItem
import com.kundliflow.app.ui.subject.SubjectReadingContent
import com.kundliflow.app.ui.subject.SubjectTelemetryRow
import com.kundliflow.app.ui.subject.VargaType
import com.kundliflow.app.ui.time.ActiveDashaState
import com.kundliflow.app.ui.time.DashaSystem
import com.kundliflow.app.ui.time.MonthDayCell
import com.kundliflow.app.ui.time.NextShiftDelta
import com.kundliflow.app.ui.time.SkyMoverItem
import com.kundliflow.app.ui.time.TimeTabState
import com.kundliflow.app.ui.time.UpcomingDashaItem
import com.kundliflow.app.ui.today.HoraSlot
import com.kundliflow.app.ui.today.HourlyScorePoint
import com.kundliflow.app.ui.today.PanchangSummary
import com.kundliflow.app.ui.today.ScoreFactorItem
import com.kundliflow.app.ui.today.SkyBand
import com.kundliflow.app.ui.today.TodayDynamicSlot
import com.kundliflow.app.ui.today.TodaySkyState
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.booleanOrNull
import kotlinx.serialization.json.doubleOrNull
import kotlinx.serialization.json.floatOrNull
import kotlinx.serialization.json.intOrNull
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import java.time.Instant
import java.time.LocalDate
import java.time.LocalTime
import java.time.YearMonth
import java.time.format.TextStyle
import java.util.Locale

data class NatalSummary(
    val lagnaSign: String,
    val moonSign: String,
    val moonNakshatra: String,
    val sunSign: String,
)

data class ProfileMeta(
    val id: String,
    val name: String,
    val birthDate: String,
    val birthTime: String,
    val tzId: String,
    val cityName: String,
    val lat: Double,
    val lon: Double,
    val timeCertainty: String,
    val ayanamsa: String,
)

/**
 * Deterministic mappers from KundliFlow API JSON (`level1Static`, `level2Static`, `/today`, `/calendar`)
 * into Compose UI models. Follows AGENTS.md Invariant #2 (`graha.houses.houseFromLagna`).
 */
object BundleMappers {
    private val json = Json { ignoreUnknownKeys = true }

    private val SIGN_NAMES = listOf(
        "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
        "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
    )

    private val SIGN_LORDS = listOf(
        PlanetId.MARS, PlanetId.VENUS, PlanetId.MERCURY, PlanetId.MOON,
        PlanetId.SUN, PlanetId.MERCURY, PlanetId.VENUS, PlanetId.MARS,
        PlanetId.JUPITER, PlanetId.SATURN, PlanetId.SATURN, PlanetId.JUPITER,
    )

    fun parseProfileMeta(profileJson: String): ProfileMeta? = runCatching {
        val o = json.parseToJsonElement(profileJson).jsonObject
        ProfileMeta(
            id = o.str("id") ?: return@runCatching null,
            name = o.str("name") ?: "Native",
            birthDate = o.str("birthDate") ?: "1998-09-07",
            birthTime = o.str("birthTime") ?: "12:00:00",
            tzId = o.str("tzId") ?: "Asia/Kolkata",
            cityName = o.str("cityName") ?: "Bengaluru",
            lat = o.dbl("lat") ?: 12.97,
            lon = o.dbl("lon") ?: 77.59,
            timeCertainty = o.str("timeCertainty") ?: "exact",
            ayanamsa = o.str("ayanamsa") ?: "lahiri",
        )
    }.getOrNull()

    fun parsePlanetId(raw: String?): PlanetId = when (raw?.lowercase()?.trim()) {
        "sun", "surya" -> PlanetId.SUN
        "moon", "chandra" -> PlanetId.MOON
        "mars", "mangal" -> PlanetId.MARS
        "mercury", "budha" -> PlanetId.MERCURY
        "jupiter", "guru" -> PlanetId.JUPITER
        "venus", "shukra" -> PlanetId.VENUS
        "saturn", "shani" -> PlanetId.SATURN
        "rahu" -> PlanetId.RAHU
        "ketu" -> PlanetId.KETU
        else -> PlanetId.JUPITER
    }

    private fun shortGlyph(p: PlanetId): String = when (p) {
        PlanetId.SUN -> "Su"; PlanetId.MOON -> "Mo"; PlanetId.MARS -> "Ma"
        PlanetId.MERCURY -> "Me"; PlanetId.JUPITER -> "Ju"; PlanetId.VENUS -> "Ve"
        PlanetId.SATURN -> "Sa"; PlanetId.RAHU -> "Ra"; PlanetId.KETU -> "Ke"
    }

    fun extractNatalSummaryFull(level1Json: String): NatalSummary = runCatching {
        val l1 = json.parseToJsonElement(level1Json).jsonObject
        val natal = l1.obj("natal")
        val grahas = natal?.obj("grahas")
        val lagnaSign = cap(natal?.obj("lagna")?.str("sign") ?: "—")
        val moon = grahas?.obj("moon")
        val sun = grahas?.obj("sun")
        NatalSummary(
            lagnaSign = lagnaSign,
            moonSign = cap(moon?.str("sign") ?: "—"),
            moonNakshatra = moon?.str("nakshatra") ?: "—",
            sunSign = cap(sun?.str("sign") ?: "—"),
        )
    }.getOrDefault(NatalSummary("—", "—", "—", "—"))

    fun extractNatalSummary(level1Json: String): Triple<String, String, String> {
        val s = extractNatalSummaryFull(level1Json)
        return Triple(s.lagnaSign, s.moonSign, s.moonNakshatra)
    }

    /**
     * Captures the exact live sky snapshot (Moon sign, Hora ruler, Chandra/Tara Bala, SAV bindus, score)
     * when a user logs a check-in so every Journal entry stores true historical astronomy.
     */
    fun extractLiveFrozenSkySnapshot(
        todayJson: String?,
        sky: TodaySkyState,
        level1Json: String?,
    ): FrozenSkySnapshot {
        val root = todayJson?.let { runCatching { json.parseToJsonElement(it).jsonObject }.getOrNull() }
        val tr = root?.obj("transits")
        val moonObj = tr?.obj("transits")?.obj("moon")
            ?: tr?.obj("planets")?.obj("moon")
            ?: tr?.arr("planets")?.firstOrNull { it.jsonObject.str("id") == "moon" }?.jsonObject
        val moonSign = cap(moonObj?.str("sign") ?: extractNatalSummaryFull(level1Json ?: "").moonSign)
        val moonSignIdx = moonObj?.int("signIndex")
        val sav = if (moonSignIdx != null && level1Json != null) {
            runCatching {
                json.parseToJsonElement(level1Json).jsonObject
                    .obj("ashtakvarga")?.arr("sarva")
                    ?.getOrNull(moonSignIdx)?.jsonPrimitive?.intOrNull
            }.getOrNull() ?: 28
        } else 28

        val chandra = sky.activeFactors.firstOrNull { it.id == "chandra_bala" }?.summary ?: "Chandra Bala"
        val tara = sky.activeFactors.firstOrNull { it.id == "tara_bala" }?.summary ?: "Tara Bala"
        return FrozenSkySnapshot(
            band = sky.currentBand,
            moonSign = moonSign,
            horaRuler = sky.currentHora.ruler,
            chandraBalaSummary = chandra,
            taraBalaSummary = tara,
            savBindus = sav,
            score = sky.currentScore,
        )
    }

    fun findHoraRulerNatalHouse(level1Json: String, horaRuler: PlanetId): Int? = runCatching {
        val l1 = json.parseToJsonElement(level1Json).jsonObject
        val graha = l1.obj("natal")?.obj("grahas")?.obj(horaRuler.name.lowercase())
        graha?.obj("houses")?.int("houseFromLagna")
    }.getOrNull()

    fun extractCurrentBandFromTodayJson(todayJson: String?, nowHour: Int = LocalTime.now().hour): SkyBand? {
        if (todayJson.isNullOrBlank()) return null
        return runCatching {
            val root = json.parseToJsonElement(todayJson).jsonObject
            val dayView = root.obj("dayView") ?: return@runCatching null
            val hourly = dayView.arr("hourlyScores")
            val hourBand = hourly.getOrNull(nowHour.coerceIn(0, (hourly.size - 1).coerceAtLeast(0)))
                ?.jsonObject?.str("band")
            SkyBand.fromApi(hourBand ?: dayView.str("dayBand") ?: "steady")
        }.getOrNull()
    }

    fun mapTodaySkyState(
        todayJson: String,
        tomorrowJson: String?,
        level2Json: String?,
        cityName: String,
        nowHour: Int = LocalTime.now().hour,
        nowEpochMs: Long = System.currentTimeMillis(),
    ): TodaySkyState? = runCatching {
        val root = json.parseToJsonElement(todayJson).jsonObject
        val dayView = root.obj("dayView") ?: return@runCatching null

        val hourlyScores = dayView.arr("hourlyScores").mapIndexed { idx, el ->
            val o = el.jsonObject
            val band = SkyBand.fromApi(o.str("band") ?: "steady")
            val factors = o.arr("factors").map { f ->
                val fo = f.jsonObject
                ScoreFactorItem(
                    id = fo.str("id") ?: "factor",
                    name = fo.str("name") ?: "Factor",
                    value = fo.int("value") ?: 0,
                    summary = fo.str("summary") ?: "",
                )
            }
            HourlyScorePoint(
                hour = idx,
                score = o.int("score") ?: 0,
                band = band,
                horaRuler = parsePlanetId(o.str("horaRuler")),
                factors = factors,
            )
        }

        val horas = dayView.arr("horas").mapIndexed { idx, el ->
            val o = el.jsonObject
            val startIso = o.str("startIso")
            val endIso = o.str("endIso")
            Triple(
                HoraSlot(
                    index = o.int("index") ?: (idx + 1),
                    ruler = parsePlanetId(o.str("lord")),
                    startTime = o.str("startFormatted") ?: "${idx.toString().padStart(2, '0')}:00",
                    endTime = o.str("endFormatted") ?: "${((idx + 1) % 24).toString().padStart(2, '0')}:00",
                ),
                startIso?.let { runCatching { Instant.parse(it).toEpochMilli() }.getOrNull() },
                endIso?.let { runCatching { Instant.parse(it).toEpochMilli() }.getOrNull() },
            )
        }

        val activeHoraIndex = horas.indexOfFirst { (_, s, e) ->
            s != null && e != null && nowEpochMs in s until e
        }.takeIf { it >= 0 } ?: nowHour.coerceIn(0, (horas.size - 1).coerceAtLeast(0))

        val currentHora = horas.getOrNull(activeHoraIndex)?.first
            ?: HoraSlot(nowHour + 1, hourlyScores.getOrNull(nowHour)?.horaRuler ?: PlanetId.JUPITER, "${nowHour.toString().padStart(2, '0')}:00", "${((nowHour + 1) % 24).toString().padStart(2, '0')}:00")
        val nextHora = horas.getOrNull((activeHoraIndex + 1).coerceAtMost((horas.size - 1).coerceAtLeast(0)))?.first
            ?: currentHora

        val currentHourPoint = hourlyScores.getOrNull(nowHour.coerceIn(0, (hourlyScores.size - 1).coerceAtLeast(0)))
        val nextHourPoint = hourlyScores.getOrNull((nowHour + 1).coerceAtMost((hourlyScores.size - 1).coerceAtLeast(0)))

        val rahuStart = dayView.obj("rahuKalam")?.str("start")
            ?: dayView.obj("inauspicious")?.obj("rahuKalam")?.str("startFormatted") ?: "—"
        val rahuEnd = dayView.obj("rahuKalam")?.str("end")
            ?: dayView.obj("inauspicious")?.obj("rahuKalam")?.str("endFormatted") ?: "—"
        val rahuLabel = if (rahuStart != "—") "$rahuStart–$rahuEnd" else "—"

        val bestWin = dayView.arr("flowingWindows").firstOrNull()?.jsonObject
        val bestLabel = if (bestWin != null) "${bestWin.str("startHour")} to ${bestWin.str("endHour")}" else "Steady day"

        val gentlyWin = dayView.arr("goGentlyWindows").firstOrNull()?.jsonObject
        val gentlyLabel = if (gentlyWin != null) "${gentlyWin.str("startHour")} to ${gentlyWin.str("endHour")}" else rahuLabel

        val tomorrowSummary = tomorrowJson?.let { buildTomorrowSummary(it) }
        val chapterSubtitle = extractActiveChapterSubtitle(root, level2Json)

        val panchangObj = dayView.obj("panchang") ?: root.obj("panchang")
        // Real Sunrise = Hora 1 start; Real Sunset = Hora 12 end / Hora 13 start from buildDay()
        val sunriseFromHoras = horas.firstOrNull()?.first?.startTime
        val sunsetFromHoras = horas.getOrNull(11)?.first?.endTime ?: horas.getOrNull(12)?.first?.startTime
        val panchangSummary = panchangObj?.let { p ->
            fun readPanchangField(key: String): String =
                p.str(key) ?: p.obj(key)?.str("name") ?: p.obj(key)?.str("label") ?: "—"
            val tithiObj = p.obj("tithi")
            val tithiFull = if (tithiObj != null) {
                val paksha = tithiObj.str("paksha")?.takeIf { it.isNotBlank() }
                val name = tithiObj.str("name") ?: "—"
                if (paksha != null && !name.contains(paksha, ignoreCase = true)) "$paksha $name" else name
            } else readPanchangField("tithi")
            val nakObj = p.obj("nakshatra")
            val nakFull = if (nakObj != null) {
                val name = nakObj.str("name") ?: "—"
                val pada = nakObj.int("pada")
                if (pada != null) "$name · Pada $pada" else name
            } else readPanchangField("nakshatra")
            PanchangSummary(
                tithi = tithiFull,
                nakshatra = nakFull,
                yoga = readPanchangField("yoga"),
                karana = readPanchangField("karana"),
                sunrise = p.str("sunriseFormatted") ?: p.str("sunrise") ?: dayView.str("sunriseFormatted") ?: sunriseFromHoras ?: "—",
                sunset = p.str("sunsetFormatted") ?: p.str("sunset") ?: dayView.str("sunsetFormatted") ?: sunsetFromHoras ?: "—",
            )
        }

        val greeting = when (nowHour) {
            in 5..11 -> "Good morning"
            in 12..16 -> "Good afternoon"
            else -> "Good evening"
        }

        TodaySkyState(
            greeting = greeting,
            cityName = cityName,
            currentBand = currentHourPoint?.band ?: SkyBand.fromApi(dayView.str("dayBand") ?: "steady"),
            currentScore = currentHourPoint?.score ?: 0,
            currentHora = currentHora,
            nextShiftTime = currentHora.endTime,
            nextShiftHora = nextHora.ruler,
            nextShiftBand = nextHourPoint?.band ?: SkyBand.Steady,
            tomorrowOpeningSummary = tomorrowSummary,
            currentChapterSubtitle = chapterSubtitle,
            activeFactors = currentHourPoint?.factors ?: emptyList(),
            hourlyWave = hourlyScores,
            rahuKalamLabel = rahuLabel,
            bestWindowLabel = bestLabel,
            goGentlyLabel = gentlyLabel,
            allHoras = horas.map { it.first },
            panchang = panchangSummary,
        )
    }.getOrNull()

    private fun buildTomorrowSummary(tomorrowJson: String): String? = runCatching {
        val dv = json.parseToJsonElement(tomorrowJson).jsonObject.obj("dayView") ?: return@runCatching null
        val band = SkyBand.fromApi(dv.str("dayBand") ?: "steady").label
        val best = dv.arr("flowingWindows").firstOrNull()?.jsonObject
        if (best != null) {
            "Tomorrow opens $band · Best ${best.str("startHour")}–${best.str("endHour")}"
        } else {
            "Tomorrow opens $band"
        }
    }.getOrNull()

    private fun extractActiveChapterSubtitle(todayRoot: JsonObject, level2Json: String?): String? {
        val activeDashas = todayRoot.arr("activeDashas")
        if (activeDashas.size >= 2) {
            val m = cap(activeDashas[0].jsonObject.str("lord") ?: "")
            val a = cap(activeDashas[1].jsonObject.str("lord") ?: "")
            if (m.isNotBlank() && a.isNotBlank()) return "$m Mahadasha · $a Antardasha"
        }
        return runCatching {
            val l2 = json.parseToJsonElement(level2Json ?: return null).jsonObject
            val dashas = l2.obj("standard")?.arr("dashas") ?: return null
            if (dashas.size >= 2) {
                val m = cap(dashas[0].jsonObject.str("lord") ?: "")
                val a = cap(dashas[1].jsonObject.str("lord") ?: "")
                if (m.isNotBlank() && a.isNotBlank()) "$m Mahadasha · $a Antardasha" else null
            } else null
        }.getOrNull()
    }

    fun mapChartUiState(
        level1Json: String,
        level2Json: String,
        todayJson: String?,
        primaryGoalLabel: String,
        primaryGoalHouse: Int,
        varga: VargaType = VargaType.D1,
        reference: ChartReference = ChartReference.LAGNA,
    ): ChartUiState? = runCatching {
        val l1 = json.parseToJsonElement(level1Json).jsonObject
        val l2 = json.parseToJsonElement(level2Json).jsonObject
        val natal = l1.obj("natal") ?: return@runCatching null
        val grahasObj = natal.obj("grahas") ?: return@runCatching null

        val vargaObj = l1.obj("vargas")?.obj(varga.label)
        val d9Grahas = l1.obj("vargas")?.obj("D9")?.obj("grahas")

        val natalLagnaSignIndex = vargaObj?.int("lagnaSignIndex")
            ?: natal.obj("lagna")?.int("signIndex")
            ?: grahasObj.obj("moon")?.int("signIndex")
            ?: 0
        val moonSignIndex = vargaObj?.obj("grahas")?.int("moon")
            ?: grahasObj.obj("moon")?.int("signIndex")
            ?: 0
        val baseSignIndex = if (reference == ChartReference.MOON) moonSignIndex else natalLagnaSignIndex
        val sarva = l1.obj("ashtakvarga")?.arr("sarva")?.mapNotNull { it.jsonPrimitive.intOrNull } ?: emptyList()

        // Planet placements grouped by house (1..12)
        val placementsByHouse = mutableMapOf<Int, MutableList<ChartPlanetPlacement>>()
        val planetHouseMap = mutableMapOf<PlanetId, Int>()

        PlanetId.entries.forEach { pid ->
            val key = pid.name.lowercase()
            val g = grahasObj.obj(key) ?: return@forEach
            val d1SignIdx = g.int("signIndex") ?: 0
            val signIdx = vargaObj?.obj("grahas")?.int(key) ?: d1SignIdx
            val houseNum = when {
                reference == ChartReference.MOON && varga == VargaType.D1 ->
                    g.obj("houses")?.int("houseFromMoon") ?: (((signIdx - baseSignIndex + 12) % 12) + 1)
                varga == VargaType.D1 && natal.obj("lagna") != null ->
                    // AGENTS.md Invariant #2: GrahaDetail house positions live under graha.houses.houseFromLagna
                    g.obj("houses")?.int("houseFromLagna") ?: (((signIdx - baseSignIndex + 12) % 12) + 1)
                else ->
                    ((signIdx - baseSignIndex + 12) % 12) + 1
            }
            planetHouseMap[pid] = houseNum
            val deg = g.dbl("degInSign") ?: 0.0
            val degInt = deg.toInt()
            val minInt = ((deg - degInt) * 60.0).toInt()
            val d9Sign = d9Grahas?.int(key)
            val placement = ChartPlanetPlacement(
                id = pid,
                shortGlyph = shortGlyph(pid),
                house = houseNum,
                signIndex = signIdx,
                signName = SIGN_NAMES[signIdx.coerceIn(0, 11)],
                degreeFormatted = "${degInt.toString().padStart(2, '0')}°${minInt.toString().padStart(2, '0')}'",
                dignity = if (g.bool("retrograde") == true) "Retrograde" else "Direct",
                vargottama = d9Sign != null && d9Sign == d1SignIdx,
            )
            placementsByHouse.getOrPut(houseNum) { mutableListOf() }.add(placement)
        }

        val l2Houses = l2.obj("standard")?.arr("houses") ?: JsonArray(emptyList())
        val houses = (1..12).map { h ->
            val signIdx = (baseSignIndex + h - 1) % 12
            val lord = SIGN_LORDS[signIdx]
            val hJson = if (reference == ChartReference.LAGNA) l2Houses.getOrNull(h - 1)?.jsonObject else null
            val findings = hJson?.arr("findings")?.take(3)?.map { f ->
                val fo = f.jsonObject
                SubjectFindingItem(
                    id = fo.str("id") ?: "f_$h",
                    title = cap(fo.str("theme")?.replace("_", " ") ?: "Insight"),
                    plainMeaning = fo.str("text") ?: "",
                    whyDetail = "Rule ${fo.str("ruleId") ?: ""} · ${fo.str("polarity") ?: ""}",
                )
            } ?: emptyList()

            ChartHouseData(
                number = h,
                signIndex = signIdx,
                signName = SIGN_NAMES[signIdx],
                lord = lord,
                lordHouse = planetHouseMap[lord] ?: h,
                savBindus = sarva.getOrNull(signIdx) ?: 28,
                summaryLine = hJson?.str("bottomLine")
                    ?: if (reference == ChartReference.MOON) "House $h from Moon (${SIGN_NAMES[signIdx]}) · Lord ${lord.displayName} in H${planetHouseMap[lord] ?: h}"
                    else "Steered by ${lord.displayName}",
                planets = placementsByHouse[h] ?: emptyList(),
                findings = findings,
            )
        }

        // Shadbala bars from level2Static.standard.strengths.planets (includes rupas, baladi, plainSummary)
        val shadbalaBars = l2.obj("standard")?.obj("strengths")?.arr("planets")?.mapNotNull { el ->
            val o = el.jsonObject
            val pName = o.str("planet") ?: return@mapNotNull null
            val ratio = o.flt("ratio") ?: return@mapNotNull null
            ShadbalaBarItem(
                planet = parsePlanetId(pName),
                ratio = ratio,
                rupas = o.flt("rupas"),
                baladi = o.str("baladi")?.takeIf { it != "—" } ?: "",
                plainSummary = o.str("plainSummary") ?: "",
            )
        } ?: emptyList()

        // Yogas & Doshas from level2Static.standard.yogas (backend emits plainMeaning + cancellationNote)
        val allYogas = l2.obj("standard")?.arr("yogas") ?: JsonArray(emptyList())
        val activeYogas = allYogas.mapNotNull { el ->
            val o = el.jsonObject
            if (o.bool("presence") == true && o.str("category") != "dosha") {
                val name = o.str("name") ?: return@mapNotNull null
                val planetsText = o.arr("planets")
                    .mapNotNull { runCatching { it.jsonPrimitive.content }.getOrNull() }
                    .joinToString(", ") { cap(it) }
                YogaDetailItem(
                    name = name,
                    category = cap(o.str("category") ?: "Classical"),
                    meaning = o.str("plainMeaning") ?: o.str("meaning") ?: o.str("description") ?: o.str("summary") ?: "Classical Parashari combination active in your natal chart.",
                    planets = planetsText,
                )
            } else null
        }
        val activeYogaNames = activeYogas.map { it.name }
        val doshaAudits = allYogas.mapNotNull { el ->
            val o = el.jsonObject
            if (o.str("category") == "dosha") {
                val present = o.bool("presence") == true
                val cancelNote = o.str("cancellationNote")?.takeIf { it.isNotBlank() }
                val cancelled = cancelNote != null || o.bool("cancelled") == true || o.str("status")?.contains("cancel", ignoreCase = true) == true
                val statusLabel = when {
                    cancelled -> "Cancelled by Bhanga"
                    !present -> "Verified Absent"
                    else -> "Active"
                }
                DoshaAuditItem(
                    name = o.str("name") ?: "Dosha",
                    status = statusLabel,
                    bhangaCancelled = cancelled || !present,
                    explanation = cancelNote ?: o.str("plainMeaning") ?: o.str("meaning") ?: o.str("description") ?: "",
                )
            } else null
        }

        // Live transit Moon house from /today transits (nested under transits.transits.moon)
        val liveMoonHouse = todayJson?.let { tj ->
            runCatching {
                val trRoot = json.parseToJsonElement(tj).jsonObject.obj("transits")
                val moonTr = trRoot?.obj("transits")?.obj("moon")
                    ?: trRoot?.obj("planets")?.obj("moon")
                    ?: trRoot?.arr("planets")?.firstOrNull { it.jsonObject.str("id") == "moon" }?.jsonObject
                if (reference == ChartReference.MOON) {
                    moonTr?.int("houseFromMoon") ?: moonTr?.int("houseFromLagna")
                } else {
                    moonTr?.int("houseFromLagna") ?: moonTr?.int("houseFromMoon")
                }
            }.getOrNull()
        } ?: 1

        ChartUiState(
            ascendantSign = SIGN_NAMES[natalLagnaSignIndex.coerceIn(0, 11)],
            moonSign = SIGN_NAMES[moonSignIndex.coerceIn(0, 11)],
            primaryGoalLabel = primaryGoalLabel,
            primaryGoalHouse = primaryGoalHouse,
            liveTransitMoonHouse = liveMoonHouse,
            houses = houses,
            shadbalaBars = shadbalaBars,
            doshaAudits = doshaAudits,
            activeYogaNames = activeYogaNames,
            activeYogas = activeYogas,
            reference = reference,
        )
    }.getOrNull()

    /**
     * Zero-network SubjectSheet reading resolver from cached level1Static + level2Static (§2 Rule 4).
     */
    fun mapSubjectReading(
        subject: Subject,
        level1Json: String,
        level2Json: String,
        todaySky: TodaySkyState?,
        detailLevel: String,
    ): SubjectReadingContent {
        val l1 = runCatching { json.parseToJsonElement(level1Json).jsonObject }.getOrNull()
        val l2 = runCatching { json.parseToJsonElement(level2Json).jsonObject }.getOrNull()
        val lvlKey = when (detailLevel.lowercase()) {
            "simple" -> "simple"
            "full", "detailed" -> "detailed"
            else -> "standard"
        }
        val bucket = l2?.obj(lvlKey) ?: l2?.obj("standard")

        return when (subject) {
            is Subject.House -> {
                val hJson = bucket?.arr("houses")?.getOrNull(subject.number - 1)?.jsonObject
                val lifeArea = hJson?.str("lifeArea") ?: "House ${subject.number}"
                val sign = cap(hJson?.str("sign") ?: "")
                val lord = cap(hJson?.str("lord") ?: "")
                val lordHouse = hJson?.int("lordPlacedHouse") ?: subject.number
                val findings = extractRenderedFindings(hJson)
                val sarva = l1?.obj("ashtakvarga")?.arr("sarva")
                val signIdx = SIGN_NAMES.indexOfFirst { it.equals(sign, ignoreCase = true) }.coerceAtLeast(0)
                val sav = sarva?.getOrNull(signIdx)?.jsonPrimitive?.intOrNull ?: 28
                SubjectReadingContent(
                    title = "House ${subject.number} · $lifeArea",
                    subtitle = "$sign · Lord $lord in H$lordHouse",
                    activeHouseNumber = subject.number,
                    peekSummary = hJson?.str("bottomLine") ?: "In Jyotish tradition, House ${subject.number} shapes $lifeArea.",
                    peekFacts = listOf(
                        SubjectFact("Sign", sign.ifBlank { "—" }),
                        SubjectFact("Lord", lord.ifBlank { "—" }),
                        SubjectFact("SAV", "$sav"),
                    ),
                    findings = findings,
                    telemetryRows = listOf(
                        SubjectTelemetryRow("House / Bhava", "H${subject.number} ($lifeArea)"),
                        SubjectTelemetryRow("Rashi Sign", sign.ifBlank { "—" }),
                        SubjectTelemetryRow("Lord Placement", "$lord in H$lordHouse"),
                        SubjectTelemetryRow("Ashtakvarga SAV", "$sav / 337 bindus"),
                        SubjectTelemetryRow("Net Tone", cap(hJson?.str("tone") ?: "Mixed")),
                    ),
                )
            }

            is Subject.Planet -> {
                val pKey = subject.id.name.lowercase()
                val pJson = bucket?.arr("planets")?.firstOrNull {
                    it.jsonObject.str("planet")?.equals(pKey, ignoreCase = true) == true
                }?.jsonObject
                val gJson = l1?.obj("natal")?.obj("grahas")?.obj(pKey)
                val sign = cap(pJson?.str("sign") ?: gJson?.str("sign") ?: "")
                val house = pJson?.int("house") ?: gJson?.obj("houses")?.int("houseFromLagna") ?: 1
                val nak = pJson?.str("nakshatra") ?: gJson?.str("nakshatra") ?: "—"
                val dignity = cap(pJson?.str("dignity") ?: "Neutral")
                val lon = gJson?.dbl("lon") ?: 0.0
                SubjectReadingContent(
                    title = "${subject.id.displayName} in $sign",
                    subtitle = "House $house · $nak",
                    activeHouseNumber = house,
                    peekSummary = pJson?.str("bottomLine") ?: "In Jyotish tradition, ${subject.id.displayName} in $sign colors House $house.",
                    peekFacts = listOf(
                        SubjectFact("Sign", sign.ifBlank { "—" }),
                        SubjectFact("Star", nak),
                        SubjectFact("Dignity", dignity),
                    ),
                    findings = extractRenderedFindings(pJson),
                    telemetryRows = listOf(
                        SubjectTelemetryRow("Nirayana Longitude", String.format(Locale.US, "%.2f°", lon)),
                        SubjectTelemetryRow("Nakshatra / Pada", "$nak · Pada ${gJson?.int("pada") ?: 1}"),
                        SubjectTelemetryRow("House from Lagna", "H$house"),
                        SubjectTelemetryRow("House from Moon", "H${gJson?.obj("houses")?.int("houseFromMoon") ?: 1}"),
                        SubjectTelemetryRow("Retrograde", if (gJson?.bool("retrograde") == true) "Yes" else "No"),
                    ),
                )
            }

            is Subject.Period -> {
                val dasha = bucket?.arr("dashas")?.firstOrNull()?.jsonObject
                val lord = cap(dasha?.str("lord") ?: "Active")
                SubjectReadingContent(
                    title = "$lord Chapter",
                    subtitle = "Vimshottari Dasha",
                    activeHouseNumber = null,
                    peekSummary = dasha?.str("bottomLine") ?: "Active planetary chapter shaping your current themes.",
                    peekFacts = listOf(
                        SubjectFact("Lord", lord),
                        SubjectFact("Level", "Mahadasha"),
                        SubjectFact("System", "Vimshottari"),
                    ),
                    findings = extractRenderedFindings(dasha),
                    telemetryRows = listOf(
                        SubjectTelemetryRow("Dasha Lord", lord),
                        SubjectTelemetryRow("Start", dasha?.str("startUtc")?.take(10) ?: "—"),
                        SubjectTelemetryRow("End", dasha?.str("endUtc")?.take(10) ?: "—"),
                    ),
                )
            }

            is Subject.DivisionalChart -> SubjectReadingContent(
                title = "${subject.varga.label} · ${subject.varga.domain}",
                subtitle = "Harmonic Divisional Chart",
                activeHouseNumber = 1,
                peekSummary = "${subject.varga.label} refines ${subject.varga.domain.lowercase()} beyond the D1 birth chart.",
                peekFacts = listOf(
                    SubjectFact("Varga", subject.varga.label),
                    SubjectFact("Domain", subject.varga.domain),
                    SubjectFact("Source", "Parashari"),
                ),
                findings = emptyList(),
                telemetryRows = listOf(
                    SubjectTelemetryRow("Divisional Chart", subject.varga.label),
                    SubjectTelemetryRow("Focus Area", subject.varga.domain),
                ),
            )

            is Subject.Finding -> {
                val glossary = SearchCatalog.glossaryById(subject.id)
                if (glossary != null) {
                    SubjectReadingContent(
                        title = glossary.term,
                        subtitle = "Glossary · ${glossary.category}",
                        activeHouseNumber = null,
                        peekSummary = glossary.plainSummary,
                        peekFacts = listOf(
                            SubjectFact("Category", glossary.category),
                            SubjectFact("Tradition", "Jyotish"),
                            SubjectFact("Reference", "Verified"),
                        ),
                        findings = listOf(
                            SubjectFindingItem(glossary.id, "In Plain English", glossary.plainSummary, glossary.deeperNote),
                        ),
                        telemetryRows = listOf(
                            SubjectTelemetryRow("Term", glossary.term),
                            SubjectTelemetryRow("Category", glossary.category),
                            SubjectTelemetryRow("Practical Context", glossary.deeperNote),
                        ),
                    )
                } else {
                    val sky = todaySky
                    val telemetry = buildList {
                        sky?.activeFactors?.forEach {
                            add(SubjectTelemetryRow(it.name, "${if (it.value > 0) "+${it.value}" else "${it.value}"} (${it.id})"))
                        }
                        sky?.panchang?.let { p ->
                            add(SubjectTelemetryRow("Panchang · Tithi", p.tithi))
                            add(SubjectTelemetryRow("Panchang · Nakshatra", p.nakshatra))
                            add(SubjectTelemetryRow("Panchang · Yoga", p.yoga))
                            add(SubjectTelemetryRow("Panchang · Karana", p.karana))
                            if (p.sunrise != "—") add(SubjectTelemetryRow("Sunrise / Sunset", "${p.sunrise} / ${p.sunset}"))
                        }
                        if (subject.id == "today.band" && sky != null && sky.allHoras.isNotEmpty()) {
                            sky.allHoras.forEach { h ->
                                add(SubjectTelemetryRow("Hora ${h.index} (${h.startTime}–${h.endTime})", h.ruler.displayName))
                            }
                        }
                        if (isEmpty()) add(SubjectTelemetryRow("Reference ID", subject.id))
                    }
                    SubjectReadingContent(
                        title = if (subject.id == "today.band" && sky != null) {
                            "${sky.currentBand.label} (${if (sky.currentScore > 0) "+${sky.currentScore}" else "${sky.currentScore}"})"
                        } else {
                            subject.id.replace(".", " · ").replace("_", " ")
                        },
                        subtitle = sky?.let { "${it.currentHora.ruler.displayName} Hora · ${it.cityName}" } ?: "Classical Rule Evidence",
                        activeHouseNumber = null,
                        peekSummary = if (subject.id == "today.band" && sky != null) {
                            "Calculated from Chandra Bala, Tara Bala, Ashtakvarga SAV, and sunrise-calibrated Hora alignment."
                        } else {
                            "Traditional Jyotish synthesis evaluated against your verified natal chart."
                        },
                        peekFacts = if (sky != null) {
                            listOf(
                                SubjectFact("Score", "${sky.currentScore} / +7"),
                                SubjectFact("Hora", sky.currentHora.ruler.displayName),
                                SubjectFact("Rahu Kalam", sky.rahuKalamLabel),
                            )
                        } else emptyList(),
                        findings = sky?.activeFactors?.map {
                            SubjectFindingItem(it.id, it.name, it.summary, "Engine heuristic weight: ${it.value}")
                        } ?: emptyList(),
                        telemetryRows = telemetry,
                    )
                }
            }
        }
    }

    fun mapTimeTabState(
        level1Json: String,
        level2Json: String,
        calendarJson: String?,
        todayJson: String?,
        notedDaysOfMonth: Set<Int> = emptySet(),
        requestedYear: Int = LocalDate.now().year,
        requestedMonth: Int = LocalDate.now().monthValue,
        nowEpochMs: Long = System.currentTimeMillis(),
    ): TimeTabState {
        val l2 = runCatching { json.parseToJsonElement(level2Json).jsonObject }.getOrNull()
        val std = l2?.obj("standard")
        val dashasArr = std?.arr("dashas") ?: JsonArray(emptyList())
        val mahaObj = dashasArr.getOrNull(0)?.jsonObject
        val antarObj = dashasArr.getOrNull(1)?.jsonObject
        val pratyObj = dashasArr.getOrNull(2)?.jsonObject

        val mahaStart = mahaObj?.str("startUtc")
        val mahaEnd = mahaObj?.str("endUtc")
        val antarStart = antarObj?.str("startUtc")
        val antarEnd = antarObj?.str("endUtc")

        val vimshottari = ActiveDashaState(
            system = DashaSystem.VIMSHOTTARI,
            mahadashaLord = cap(mahaObj?.str("lord") ?: "—"),
            mahadashaProgress = computeElapsedProgress(mahaStart, mahaEnd, nowEpochMs),
            mahadashaRange = "${mahaStart?.take(4) ?: "—"}–${mahaEnd?.take(4) ?: "—"}",
            antardashaLord = cap(antarObj?.str("lord") ?: "—"),
            antardashaProgress = computeElapsedProgress(antarStart, antarEnd, nowEpochMs),
            antardashaRange = "${antarStart?.take(7) ?: "—"}–${antarEnd?.take(7) ?: "—"}",
            pratyantarLord = cap(pratyObj?.str("lord") ?: "—"),
            plainMeaning = antarObj?.str("bottomLine") ?: mahaObj?.str("bottomLine") ?: "Active Vimshottari timing chapter.",
        )

        val ext = std?.obj("extendedDashas")
        val yog = ext?.obj("yogini")
        val cha = ext?.obj("chara")
        val dashaMap = mapOf(
            DashaSystem.VIMSHOTTARI to vimshottari,
            DashaSystem.YOGINI to ActiveDashaState(
                system = DashaSystem.YOGINI,
                mahadashaLord = cap(yog?.str("maha") ?: "—"),
                mahadashaProgress = computeElapsedProgress(yog?.str("mahaStart"), yog?.str("mahaEnd"), nowEpochMs).takeIf { it > 0f } ?: 0.5f,
                mahadashaRange = yog?.str("mahaRange") ?: yog?.str("mahaEnd")?.let { "Ends $it" } ?: "—",
                antardashaLord = cap(yog?.str("antar") ?: yog?.str("mahaLord") ?: "—"),
                antardashaProgress = computeElapsedProgress(yog?.str("antarStart"), yog?.str("antarEnd"), nowEpochMs).takeIf { it > 0f } ?: 0.5f,
                antardashaRange = yog?.str("antarRange") ?: yog?.str("antarEnd")?.let { "Ends $it" } ?: "—",
                pratyantarLord = cap(yog?.str("antarLord") ?: yog?.str("mahaLord") ?: "—"),
                plainMeaning = yog?.str("plainSummary") ?: yog?.str("theme") ?: "36-year Yogini cycle perspective.",
            ),
            DashaSystem.CHARA to ActiveDashaState(
                system = DashaSystem.CHARA,
                mahadashaLord = cap(cha?.str("mahaSign") ?: "—"),
                mahadashaProgress = computeElapsedProgress(cha?.str("mahaStart"), cha?.str("mahaEnd"), nowEpochMs).takeIf { it > 0f } ?: 0.5f,
                mahadashaRange = cha?.str("mahaRange") ?: cha?.str("mahaEnd")?.let { "Ends $it" } ?: "—",
                antardashaLord = cap(cha?.str("antarSign") ?: "—"),
                antardashaProgress = computeElapsedProgress(cha?.str("antarStart"), cha?.str("antarEnd"), nowEpochMs).takeIf { it > 0f } ?: 0.5f,
                antardashaRange = cha?.str("antarRange") ?: cha?.str("antarEnd")?.let { "Ends $it" } ?: "—",
                pratyantarLord = "House ${cha?.int("mahaHouse") ?: 1}",
                plainMeaning = cha?.str("plainSummary") ?: "Jaimini sign-based Chara Dasha chapter.",
            ),
        )

        val calObj = calendarJson?.let { runCatching { json.parseToJsonElement(it).jsonObject }.getOrNull() }
        val monthData = calObj?.obj("monthData")
        val year = monthData?.int("year") ?: requestedYear
        val month = (monthData?.int("month") ?: requestedMonth).coerceIn(1, 12)
        val ym = YearMonth.of(year, month)
        val monthTitle = "${ym.month.getDisplayName(TextStyle.FULL, Locale.getDefault())} $year"

        val monthDays = monthData?.arr("days")?.mapIndexed { idx, el ->
            val d = el.jsonObject
            val band = SkyBand.fromApi(d.str("dayBand") ?: "steady")
            val score = d.int("dayScore") ?: 0
            val dom = d.str("date")?.takeLast(2)?.toIntOrNull() ?: (idx + 1)
            MonthDayCell(
                dayOfMonth = dom,
                band = band,
                score = score,
                hasNoteOrMilestone = notedDaysOfMonth.contains(dom),
                purposes = when (band) {
                    SkyBand.Flowing -> setOf("All", "Career", "Finance", "Travel")
                    SkyBand.Steady -> setOf("All", "Career")
                    SkyBand.GoGently -> setOf("All", "Rest")
                },
                summary = "${band.label} day (score ${if (score > 0) "+$score" else "$score"})",
            )
        } ?: (1..ym.lengthOfMonth()).map { d ->
            MonthDayCell(
                dayOfMonth = d,
                band = SkyBand.Steady,
                score = 0,
                hasNoteOrMilestone = notedDaysOfMonth.contains(d),
                summary = "Syncing calendar…",
            )
        }

        // Merge live /today transits (transits.transits) with level2 plainMeaning & order slow movers first
        val l2MeaningsByPlanet = std?.obj("transits")?.arr("planets")?.associate { el ->
            val o = el.jsonObject
            parsePlanetId(o.str("planet") ?: o.str("id")) to (o.str("plainMeaning") ?: o.str("summary") ?: "")
        } ?: emptyMap()

        val todayTransitsRoot = todayJson?.let { runCatching { json.parseToJsonElement(it).jsonObject.obj("transits") }.getOrNull() }
        val liveTransitsMap = todayTransitsRoot?.obj("transits")
        val priorityOrder = listOf(
            PlanetId.SATURN, PlanetId.JUPITER, PlanetId.RAHU, PlanetId.KETU,
            PlanetId.MOON, PlanetId.MARS, PlanetId.VENUS, PlanetId.MERCURY, PlanetId.SUN,
        )

        val transitList: List<SkyMoverItem> = if (liveTransitsMap != null && liveTransitsMap.isNotEmpty()) {
            priorityOrder.mapNotNull { pid ->
                val o = liveTransitsMap.obj(pid.name.lowercase()) ?: return@mapNotNull null
                val sign = cap(o.str("sign") ?: "")
                val hLagna = o.int("houseFromLagna") ?: 1
                val hMoon = o.int("houseFromMoon") ?: 1
                val bindus = o.int("ashtakvargaBindus")
                val retro = o.bool("retrograde") == true
                val vedhaBlocked = o.obj("vedha")?.bool("hasVedha") == true
                val kakshyaLord = o.obj("kakshya")?.str("kakshyaLord")?.let { cap(it) }
                val fallbackMeaning = buildString {
                    append("${pid.displayName} transits $sign (House $hLagna from Lagna, House $hMoon from Moon)")
                    if (bindus != null) append(" with $bindus/8 BAV bindus")
                    if (retro) append(" · Retrograde")
                }
                SkyMoverItem(
                    planet = pid,
                    signName = sign,
                    houseFromLagna = hLagna,
                    houseFromMoon = hMoon,
                    plainMeaning = l2MeaningsByPlanet[pid]?.takeIf { it.isNotBlank() } ?: fallbackMeaning,
                    vedhaNote = if (vedhaBlocked) "Vedha obstruction active" else "Clear Gochar transit",
                    kakshyaLabel = when {
                        kakshyaLord != null -> "$kakshyaLord Kakshya"
                        bindus != null -> "$bindus/8 Bindus"
                        else -> if (retro) "Retrograde" else "Direct"
                    },
                )
            }
        } else {
            (std?.obj("transits")?.arr("planets")?.map { el ->
                val o = el.jsonObject
                val bindus = o.int("bindus")
                SkyMoverItem(
                    planet = parsePlanetId(o.str("planet") ?: o.str("id")),
                    signName = cap(o.str("sign") ?: ""),
                    houseFromLagna = o.int("houseFromLagna") ?: 1,
                    houseFromMoon = o.int("houseFromMoon") ?: 1,
                    plainMeaning = o.str("plainMeaning") ?: o.str("summary") ?: "Active transit",
                    vedhaNote = o.str("bavQuality")?.let { "${cap(it)} BAV transit" } ?: "Clear transit",
                    kakshyaLabel = if (bindus != null) "$bindus/8 Bindus" else (o.str("kakshya") ?: "Direct"),
                )
            } ?: emptyList()).sortedBy { priorityOrder.indexOf(it.planet).let { i -> if (i < 0) 99 else i } }
        }

        val sadeObj = todayTransitsRoot?.obj("sadeSati") ?: std?.obj("transits")?.obj("sadeSati")
        val sadeSati = if (sadeObj != null) {
            val active = sadeObj.bool("isActive") == true
            val phase = sadeObj.str("phase")?.takeIf { it != "none" && it.isNotBlank() }
            val satHouse = sadeObj.int("houseFromMoon")
            val ashtama = sadeObj.bool("isAshtamaShani") == true
            val kantaka = sadeObj.bool("isKantakaShani") == true
            when {
                active && phase != null -> "Active · ${cap(phase)} phase (Saturn in H${satHouse ?: 1} from Moon)"
                ashtama -> "Ashtama Shani (Saturn in 8th from Moon)"
                kantaka -> "Kantaka Shani (Saturn in H${satHouse ?: 4} from Moon)"
                satHouse != null -> "Inactive · Saturn in H$satHouse from Moon"
                else -> "Inactive"
            }
        } else {
            "Not currently active"
        }

        val nextShift = resolveRealNextShiftDelta(
            level1Json = level1Json,
            currentAntarLord = vimshottari.antardashaLord,
            fallbackEndDate = antarEnd?.take(10),
            nowEpochMs = nowEpochMs,
        )
        val upcomingPeriods = resolveUpcomingPeriods(level1Json, nowEpochMs)

        return TimeTabState(
            activeDashas = dashaMap,
            nextShift = nextShift,
            upcomingPeriods = upcomingPeriods,
            calendarYear = year,
            calendarMonth = month,
            monthTitle = monthTitle,
            monthDays = monthDays,
            skyMovers = transitList,
            sadeSatiStatus = sadeSati,
        )
    }

    /**
     * Computes exact elapsed progress [0f..1f] between startIso and endIso at nowEpochMs.
     */
    fun computeElapsedProgress(startIso: String?, endIso: String?, nowEpochMs: Long = System.currentTimeMillis()): Float {
        if (startIso.isNullOrBlank() || endIso.isNullOrBlank()) return 0f
        val startMs = parseFlexibleDateMillis(startIso) ?: return 0f
        val endMs = parseFlexibleDateMillis(endIso) ?: return 0f
        val span = (endMs - startMs).coerceAtLeast(1L)
        return ((nowEpochMs - startMs).toDouble() / span.toDouble()).toFloat().coerceIn(0f, 1f)
    }

    /**
     * Reads the real next Antardasha from level1Static.dashas and compares natal house placement
     * of the outgoing vs. incoming lords for the 3-row Diff-Only preview (§5.5).
     */
    fun resolveRealNextShiftDelta(
        level1Json: String,
        currentAntarLord: String,
        fallbackEndDate: String?,
        nowEpochMs: Long = System.currentTimeMillis(),
    ): NextShiftDelta {
        val nowIso = Instant.ofEpochMilli(nowEpochMs).toString().take(10)
        val parsed = runCatching {
            val l1 = json.parseToJsonElement(level1Json).jsonObject
            val mahaList = l1.obj("dashas")?.arr("mahadashas")?.ifEmpty { l1.obj("dashas")?.arr("periods") ?: JsonArray(emptyList()) }
                ?: JsonArray(emptyList())
            val allAntars = mutableListOf<Triple<String, String, String>>() // lord, start, end
            mahaList.forEach { mEl ->
                val m = mEl.jsonObject
                val mLord = cap(m.str("lord") ?: "")
                val antars = m.arr("antardashas").ifEmpty { m.arr("subPeriods") }
                antars.forEach { aEl ->
                    val a = aEl.jsonObject
                    val aLord = cap(a.str("lord") ?: "")
                    val s = (a.str("startUtc") ?: a.str("start") ?: "").take(10)
                    val e = (a.str("endUtc") ?: a.str("end") ?: "").take(10)
                    if (s.isNotBlank() && e.isNotBlank()) allAntars.add(Triple("$mLord–$aLord", s, e))
                }
            }
            val currentIdx = allAntars.indexOfFirst { (_, s, e) -> nowIso >= s && nowIso <= e }
            val currentTuple = allAntars.getOrNull(currentIdx)
            val nextTuple = allAntars.getOrNull(currentIdx + 1)
            if (nextTuple != null) {
                val curLordName = currentTuple?.first?.substringAfter("–") ?: currentAntarLord
                val nextLordName = nextTuple.first.substringAfter("–")
                val curHouse = findHoraRulerNatalHouse(level1Json, parsePlanetId(curLordName))
                val nextHouse = findHoraRulerNatalHouse(level1Json, parsePlanetId(nextLordName))
                val houseShift = if (curHouse != null && nextHouse != null) {
                    "House $curHouse (${houseShortTheme(curHouse)}) → House $nextHouse (${houseShortTheme(nextHouse)})"
                } else {
                    "$curLordName tone → $nextLordName tone"
                }
                NextShiftDelta(
                    shiftDate = "${nextTuple.second} · ${nextTuple.first}",
                    windsDown = "$curLordName sub-period themes",
                    wakesUp = "$nextLordName sub-period energy",
                    houseFocusShift = houseShift,
                )
            } else null
        }.getOrNull()

        return parsed ?: NextShiftDelta(
            shiftDate = "${fallbackEndDate ?: "Upcoming"} · Next Chapter",
            windsDown = "$currentAntarLord sub-period themes",
            wakesUp = "Upcoming Antardasha lord",
            houseFocusShift = "Open 'Now' chapter for full period timeline",
        )
    }

    /**
     * Reads the next 3 real upcoming Antardashas / Mahadasha transitions directly from level1Static.dashas
     * with exact dates and natal house focus.
     */
    fun resolveUpcomingPeriods(
        level1Json: String,
        nowEpochMs: Long = System.currentTimeMillis(),
    ): List<UpcomingDashaItem> = runCatching {
        val nowIso = Instant.ofEpochMilli(nowEpochMs).toString().take(10)
        val l1 = json.parseToJsonElement(level1Json).jsonObject
        val mahaList = l1.obj("dashas")?.arr("mahadashas")
            ?.ifEmpty { l1.obj("dashas")?.arr("periods") ?: JsonArray(emptyList()) }
            ?: JsonArray(emptyList())

        data class FlatAntar(val mahaLord: String, val antarLord: String, val start: String, val end: String, val isFirstInMaha: Boolean)
        val flat = mutableListOf<FlatAntar>()
        mahaList.forEach { mEl ->
            val m = mEl.jsonObject
            val mLord = cap(m.str("lord") ?: "")
            val antars = m.arr("antardashas").ifEmpty { m.arr("subPeriods") }
            antars.forEachIndexed { idx, aEl ->
                val a = aEl.jsonObject
                val aLord = cap(a.str("lord") ?: "")
                val s = (a.str("startUtc") ?: a.str("start") ?: "").take(10)
                val e = (a.str("endUtc") ?: a.str("end") ?: "").take(10)
                if (s.isNotBlank() && e.isNotBlank()) {
                    flat.add(FlatAntar(mLord, aLord, s, e, idx == 0))
                }
            }
        }
        val currentIdx = flat.indexOfFirst { nowIso >= it.start && nowIso <= it.end }
        if (currentIdx < 0) return@runCatching emptyList()
        val currentMaha = flat[currentIdx].mahaLord

        flat.drop(currentIdx + 1).take(3).map { item ->
            val isMajor = item.mahaLord != currentMaha && item.isFirstInMaha
            val h = findHoraRulerNatalHouse(level1Json, parsePlanetId(if (isMajor) item.mahaLord else item.antarLord))
            val theme = if (h != null) "Activates House $h (${houseShortTheme(h)})" else "${item.mahaLord}–${item.antarLord} cycle"
            UpcomingDashaItem(
                title = if (isMajor) "${item.mahaLord} Mahadasha Begins" else "${item.antarLord} Antardasha",
                subtitle = "$theme · ${item.mahaLord} Maha",
                dateRange = "${item.start.take(7)} – ${item.end.take(7)}",
                isMajorTransition = isMajor,
            )
        }
    }.getOrDefault(emptyList())

    /**
     * Detects P4 Live Sky Events locally (Antardasha shift within 48h from /bundle,
     * or an ingress event from /today's monthPeakSummary.ingressEvents).
     */
    fun detectLiveSkyEvent(
        level1Json: String,
        todayJson: String?,
        nowEpochMs: Long = System.currentTimeMillis(),
    ): TodayDynamicSlot.LiveSkyEvent? {
        // 1. Check Antardasha ending within 48h locally from /bundle
        val fortyEightHoursMs = 48L * 60L * 60L * 1000L
        val nextShift = resolveRealNextShiftDelta(level1Json, "", null, nowEpochMs)
        val shiftDateStr = nextShift.shiftDate.substringBefore(" ·")
        val shiftMs = parseFlexibleDateMillis(shiftDateStr)
        if (shiftMs != null && (shiftMs - nowEpochMs) in 0..fortyEightHoursMs) {
            return TodayDynamicSlot.LiveSkyEvent(
                title = "Chapter shift within 48h",
                detail = "${nextShift.shiftDate}: ${nextShift.houseFocusShift}",
            )
        }

        // 2. Check /today ingressEvents
        val todayRoot = todayJson?.let { runCatching { json.parseToJsonElement(it).jsonObject }.getOrNull() }
        val todayIso = LocalDate.now().toString()
        val ingresses = todayRoot?.obj("monthPeakSummary")?.arr("ingressEvents") ?: JsonArray(emptyList())
        val imminent = ingresses.firstOrNull { el ->
            val d = el.jsonObject.str("date") ?: ""
            d >= todayIso
        }?.jsonObject
        if (imminent != null) {
            val d = imminent.str("date") ?: todayIso
            val desc = imminent.str("description") ?: "Planetary sign ingress"
            return TodayDynamicSlot.LiveSkyEvent(
                title = "Sky ingress · $d",
                detail = desc,
            )
        }
        return null
    }

    /**
     * Computes authentic, verifiable Vedic rarity badges per Discovery node from level1Static/level2Static (§6).
     */
    fun resolveNodeRarityBadge(
        nodeId: String,
        level1Json: String?,
        level2Json: String?,
        timeCertainty: String,
    ): String? {
        if (level1Json == null) return null
        val summary = extractNatalSummaryFull(level1Json)
        if (nodeId.startsWith("core.")) {
            return DiscoveryPathEngine.formatCombinatorialRarity(
                ascendantSign = summary.lagnaSign,
                sunSign = summary.sunSign,
                moonNakshatra = summary.moonNakshatra,
                timeCertainty = timeCertainty,
            )
        }
        return runCatching {
            val l1 = json.parseToJsonElement(level1Json).jsonObject
            val d1Grahas = l1.obj("natal")?.obj("grahas")
            val d9Grahas = l1.obj("vargas")?.obj("D9")?.obj("grahas")
            val sarva = l1.obj("ashtakvarga")?.arr("sarva")

            if (nodeId.startsWith("house.")) {
                val hNum = nodeId.removePrefix("house.").toIntOrNull() ?: return@runCatching null
                val lagnaIdx = l1.obj("natal")?.obj("lagna")?.int("signIndex") ?: 0
                val signIdx = (lagnaIdx + hNum - 1) % 12
                val bindus = sarva?.getOrNull(signIdx)?.jsonPrimitive?.intOrNull
                val vargottamaInHouse = listOf("sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn").firstOrNull { p ->
                    val g = d1Grahas?.obj(p)
                    g?.obj("houses")?.int("houseFromLagna") == hNum &&
                        g.int("signIndex") == d9Grahas?.int(p)
                }
                when {
                    vargottamaInHouse != null -> "★ Vargottama ${cap(vargottamaInHouse)} here — same sign in D1 & D9 (~11%)"
                    bindus != null && bindus >= 30 -> "Strong transit support: $bindus / 337 SAV bindus in ${SIGN_NAMES[signIdx]}"
                    else -> null
                }
            } else {
                val l2 = level2Json?.let { json.parseToJsonElement(it).jsonObject }
                val activeYoga = l2?.obj("standard")?.arr("yogas")?.firstOrNull { el ->
                    val o = el.jsonObject
                    o.bool("presence") == true && o.str("category") != "dosha"
                }?.jsonObject?.str("name")
                activeYoga?.let { "Active classical combination: $it" }
            }
        }.getOrNull()
    }

    private fun parseFlexibleDateMillis(raw: String): Long? {
        runCatching { return Instant.parse(raw).toEpochMilli() }
        runCatching {
            val d = LocalDate.parse(raw.take(10))
            return d.atStartOfDay(java.time.ZoneOffset.UTC).toInstant().toEpochMilli()
        }
        return null
    }

    private fun houseShortTheme(house: Int): String = when (house) {
        1 -> "Self"; 2 -> "Resources"; 3 -> "Initiative"; 4 -> "Home"
        5 -> "Learning"; 6 -> "Craft"; 7 -> "Partnerships"; 8 -> "Renewal"
        9 -> "Purpose"; 10 -> "Career"; 11 -> "Gains"; else -> "Rest"
    }

    /**
     * Local zero-latency Dasha lookup for any target year from level1Static.dashas
     * (powers Session-0 Onboarding Step 6 & Time-Machine).
     */
    fun lookupDashaForYear(level1Json: String, targetYear: Int): String? = runCatching {
        val l1 = json.parseToJsonElement(level1Json).jsonObject
        val dashas = l1.obj("dashas") ?: return@runCatching null
        val targetMid = "$targetYear-06-15"
        val mahaList = dashas.arr("mahadashas").ifEmpty { dashas.arr("periods") }
        val activeMaha = mahaList.firstOrNull { el ->
            val o = el.jsonObject
            val s = (o.str("startUtc") ?: o.str("start") ?: "").take(10)
            val e = (o.str("endUtc") ?: o.str("end") ?: "").take(10)
            s.isNotBlank() && e.isNotBlank() && targetMid >= s && targetMid <= e
        }?.jsonObject ?: return@runCatching null

        val mahaLord = cap(activeMaha.str("lord") ?: "Unknown")
        val antarList = activeMaha.arr("antardashas").ifEmpty { activeMaha.arr("subPeriods") }
        val activeAntar = antarList.firstOrNull { el ->
            val o = el.jsonObject
            val s = (o.str("startUtc") ?: o.str("start") ?: "").take(10)
            val e = (o.str("endUtc") ?: o.str("end") ?: "").take(10)
            s.isNotBlank() && e.isNotBlank() && targetMid >= s && targetMid <= e
        }?.jsonObject

        val antarLord = activeAntar?.str("lord")?.let { cap(it) }
        if (antarLord != null) {
            "$targetYear: $mahaLord Mahadasha · $antarLord Antardasha"
        } else {
            "$targetYear: $mahaLord Mahadasha"
        }
    }.getOrNull()

    private fun extractRenderedFindings(obj: JsonObject?): List<SubjectFindingItem> =
        obj?.arr("findings")?.take(3)?.map { el ->
            val fo = el.jsonObject
            SubjectFindingItem(
                id = fo.str("id") ?: "finding",
                title = cap(fo.str("theme")?.replace("_", " ") ?: "Insight"),
                plainMeaning = fo.str("text") ?: "",
                whyDetail = "Rule ${fo.str("ruleId") ?: ""} · ${fo.str("polarity") ?: ""}",
            )
        } ?: emptyList()

    private fun cap(s: String): String =
        s.replaceFirstChar { if (it.isLowerCase()) it.titlecase(Locale.getDefault()) else it.toString() }

    private fun JsonObject.obj(key: String): JsonObject? = runCatching { this[key]?.jsonObject }.getOrNull()
    private fun JsonObject.arr(key: String): JsonArray = runCatching { this[key]?.jsonArray }.getOrNull() ?: JsonArray(emptyList())
    private fun JsonObject.str(key: String): String? = runCatching { this[key]?.jsonPrimitive?.content }.getOrNull()?.takeIf { it != "null" }
    private fun JsonObject.int(key: String): Int? = runCatching { this[key]?.jsonPrimitive?.intOrNull }.getOrNull()
    private fun JsonObject.dbl(key: String): Double? = runCatching { this[key]?.jsonPrimitive?.doubleOrNull }.getOrNull()
    private fun JsonObject.flt(key: String): Float? = runCatching { this[key]?.jsonPrimitive?.floatOrNull }.getOrNull()
    private fun JsonObject.bool(key: String): Boolean? = runCatching { this[key]?.jsonPrimitive?.booleanOrNull }.getOrNull()
}
