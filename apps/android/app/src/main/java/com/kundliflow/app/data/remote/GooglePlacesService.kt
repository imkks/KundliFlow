package com.kundliflow.app.data.remote

import android.annotation.SuppressLint
import android.content.Context
import android.location.Geocoder
import android.location.LocationManager
import com.kundliflow.app.BuildConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.builtins.ListSerializer
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.doubleOrNull
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import java.net.HttpURLConnection
import java.net.URL
import java.util.Locale
import java.util.TimeZone

@Serializable
data class OfflineCityItem(
    val id: String,
    val name: String,
    val admin: String = "",
    val country: String = "",
    val lat: Double,
    val lon: Double,
    val tzId: String,
)

data class PlaceSuggestion(
    val placeId: String?,
    val primaryText: String,
    val secondaryText: String,
    val lat: Double? = null,
    val lon: Double? = null,
    val tzId: String? = null,
    val source: String = "offline",
)

data class ResolvedPlace(
    val name: String,
    val lat: Double,
    val lon: Double,
    val tzId: String,
)

/**
 * Unified Place & Coordinate Resolver:
 * 1. Google Places API (New) + Google Time Zone API when GOOGLE_MAPS_API_KEY is configured.
 * 2. Device GPS (LocationManager) + Android Geocoder for "Use Current GPS".
 * 3. Bundled offline cities.json fallback for instant zero-network search.
 */
class GooglePlacesService(
    private val apiKey: String = BuildConfig.GOOGLE_MAPS_API_KEY,
) {
    private val json = Json { ignoreUnknownKeys = true }

    fun loadOfflineCities(context: Context): List<OfflineCityItem> = runCatching {
        val raw = context.assets.open("cities.json").bufferedReader().use { it.readText() }
        parseOfflineCities(raw)
    }.getOrDefault(emptyList())

    fun parseOfflineCities(rawJson: String): List<OfflineCityItem> =
        json.decodeFromString(ListSerializer(OfflineCityItem.serializer()), rawJson)

    fun filterOfflineCities(cities: List<OfflineCityItem>, query: String): List<PlaceSuggestion> {
        val q = query.trim().lowercase()
        val matched = if (q.isEmpty()) cities.take(8) else cities.filter {
            it.name.lowercase().contains(q) || it.admin.lowercase().contains(q) || it.country.lowercase().contains(q)
        }
        return matched.take(8).map {
            PlaceSuggestion(
                placeId = null,
                primaryText = it.name,
                secondaryText = listOf(it.admin, it.country).filter { s -> s.isNotBlank() }.joinToString(", "),
                lat = it.lat,
                lon = it.lon,
                tzId = it.tzId,
                source = "offline",
            )
        }
    }

    suspend fun autocomplete(
        query: String,
        offlineCities: List<OfflineCityItem>,
    ): List<PlaceSuggestion> = withContext(Dispatchers.IO) {
        val trimmed = query.trim()
        if (trimmed.length < 2 || apiKey.isBlank()) {
            return@withContext filterOfflineCities(offlineCities, trimmed)
        }

        val googleResults = runCatching {
            val conn = (URL("https://places.googleapis.com/v1/places:autocomplete").openConnection() as HttpURLConnection).apply {
                requestMethod = "POST"
                connectTimeout = 8_000
                readTimeout = 8_000
                doOutput = true
                setRequestProperty("Content-Type", "application/json")
                setRequestProperty("X-Goog-Api-Key", apiKey)
                setRequestProperty("X-Goog-FieldMask", "suggestions.placePrediction.placeId,suggestions.placePrediction.structuredFormat")
            }
            val escaped = trimmed.replace("\\", "\\\\").replace("\"", "\\\"")
            val payload = """{"input":"$escaped","includedPrimaryTypes":["(cities)"]}"""
            conn.outputStream.use { it.write(payload.toByteArray(Charsets.UTF_8)) }

            if (conn.responseCode !in 200..299) {
                conn.disconnect()
                return@runCatching emptyList<PlaceSuggestion>()
            }
            val text = conn.inputStream.bufferedReader().use { it.readText() }
            conn.disconnect()
            parseGoogleAutocompleteResponse(text)
        }.getOrDefault(emptyList())

        googleResults.ifEmpty { filterOfflineCities(offlineCities, trimmed) }
    }

    fun parseGoogleAutocompleteResponse(rawJson: String): List<PlaceSuggestion> = runCatching {
        val root = json.parseToJsonElement(rawJson).jsonObject
        val suggestions = root["suggestions"]?.jsonArray ?: return@runCatching emptyList()
        suggestions.mapNotNull { elem ->
            val pred = elem.jsonObject["placePrediction"]?.jsonObject ?: return@mapNotNull null
            val placeId = pred["placeId"]?.jsonPrimitive?.content ?: return@mapNotNull null
            val fmt = pred["structuredFormat"]?.jsonObject
            val main = fmt?.get("mainText")?.jsonObject?.get("text")?.jsonPrimitive?.content ?: return@mapNotNull null
            val secondary = fmt["secondaryText"]?.jsonObject?.get("text")?.jsonPrimitive?.content ?: ""
            PlaceSuggestion(
                placeId = placeId,
                primaryText = main,
                secondaryText = secondary,
                source = "google_places",
            )
        }
    }.getOrDefault(emptyList())

    suspend fun resolveSuggestion(suggestion: PlaceSuggestion): ResolvedPlace? = withContext(Dispatchers.IO) {
        // Offline city already carries exact coordinates & timezone
        if (suggestion.lat != null && suggestion.lon != null && suggestion.tzId != null) {
            return@withContext ResolvedPlace(
                name = suggestion.primaryText,
                lat = suggestion.lat,
                lon = suggestion.lon,
                tzId = suggestion.tzId,
            )
        }
        val pid = suggestion.placeId ?: return@withContext null
        if (apiKey.isBlank()) return@withContext null

        runCatching {
            val conn = (URL("https://places.googleapis.com/v1/places/$pid").openConnection() as HttpURLConnection).apply {
                requestMethod = "GET"
                connectTimeout = 8_000
                readTimeout = 8_000
                setRequestProperty("X-Goog-Api-Key", apiKey)
                setRequestProperty("X-Goog-FieldMask", "displayName,location")
            }
            if (conn.responseCode !in 200..299) {
                conn.disconnect()
                return@runCatching null
            }
            val detailsText = conn.inputStream.bufferedReader().use { it.readText() }
            conn.disconnect()

            val obj = json.parseToJsonElement(detailsText).jsonObject
            val loc = obj["location"]?.jsonObject ?: return@runCatching null
            val lat = loc["latitude"]?.jsonPrimitive?.doubleOrNull ?: return@runCatching null
            val lon = loc["longitude"]?.jsonPrimitive?.doubleOrNull ?: return@runCatching null
            val display = obj["displayName"]?.jsonObject?.get("text")?.jsonPrimitive?.content ?: suggestion.primaryText
            val tz = resolveTimeZone(lat, lon)
            ResolvedPlace(name = display, lat = lat, lon = lon, tzId = tz)
        }.getOrNull()
    }

    suspend fun resolveTimeZone(lat: Double, lon: Double): String = withContext(Dispatchers.IO) {
        if (apiKey.isNotBlank()) {
            val tz = runCatching {
                val ts = System.currentTimeMillis() / 1000L
                val url = "https://maps.googleapis.com/maps/api/timezone/json?location=$lat,$lon&timestamp=$ts&key=$apiKey"
                val conn = (URL(url).openConnection() as HttpURLConnection).apply {
                    requestMethod = "GET"
                    connectTimeout = 8_000
                    readTimeout = 8_000
                }
                val text = if (conn.responseCode in 200..299) {
                    conn.inputStream.bufferedReader().use { it.readText() }
                } else {
                    ""
                }
                conn.disconnect()
                json.parseToJsonElement(text).jsonObject["timeZoneId"]?.jsonPrimitive?.content
            }.getOrNull()
            if (!tz.isNullOrBlank()) return@withContext tz
        }
        TimeZone.getDefault().id
    }

    @SuppressLint("MissingPermission")
    suspend fun resolveCurrentGpsLocation(context: Context): ResolvedPlace? = withContext(Dispatchers.IO) {
        runCatching {
            val lm = context.getSystemService(Context.LOCATION_SERVICE) as? LocationManager ?: return@runCatching null
            val providers = listOf(LocationManager.GPS_PROVIDER, LocationManager.NETWORK_PROVIDER)
            val loc = providers.firstNotNullOfOrNull { provider ->
                runCatching { lm.getLastKnownLocation(provider) }.getOrNull()
            } ?: return@runCatching null

            val lat = loc.latitude
            val lon = loc.longitude
            val cityName = runCatching {
                @Suppress("DEPRECATION")
                val addresses = Geocoder(context, Locale.getDefault()).getFromLocation(lat, lon, 1)
                addresses?.firstOrNull()?.let { it.locality ?: it.subAdminArea ?: it.adminArea }
            }.getOrNull() ?: "Current Location"

            val tzId = resolveTimeZone(lat, lon)
            ResolvedPlace(name = cityName, lat = lat, lon = lon, tzId = tzId)
        }.getOrNull()
    }
}
