package com.kundliflow.app.data.remote

import com.kundliflow.app.BuildConfig
import com.kundliflow.app.ui.ask.AskSseEvent
import com.kundliflow.app.ui.ask.AskSseParser
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.BufferedReader
import java.io.InputStreamReader
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder

data class HttpPayloadResult(
    val statusCode: Int,
    val body: String,
    val etag: String? = null,
)

/**
 * HTTP & SSE client targeting KundliFlow backend (`BuildConfig.API_BASE_URL`).
 * Default server: https://129.225.104.43.sslip.io
 */
class KundliApiClient(
    private val baseUrl: String = BuildConfig.API_BASE_URL.trimEnd('/'),
    private val authTokenProvider: () -> String? = { null },
) {
    suspend fun checkHealth(): Result<String> = get("/health").map { it.body }

    suspend fun loginWithGoogleIdToken(idToken: String): Result<String> =
        request("POST", "/api/auth/google", bodyJson = """{"idToken":${jsonStr(idToken)}}""").map { it.body }

    suspend fun loginWithDevEmail(devEmail: String, devName: String): Result<String> =
        request(
            "POST",
            "/api/auth/google",
            bodyJson = """{"devEmail":${jsonStr(devEmail)},"devName":${jsonStr(devName)}}""",
        ).map { it.body }

    suspend fun fetchMe(): Result<String> = get("/api/auth/me").map { it.body }

    suspend fun listProfiles(): Result<String> = get("/api/profiles").map { it.body }

    suspend fun upsertProfile(
        id: String? = null,
        name: String,
        birthDate: String,
        birthTime: String,
        tzId: String,
        cityName: String,
        lat: Double,
        lon: Double,
        timeCertainty: String,
        ayanamsa: String,
        isActive: Boolean = true,
    ): Result<String> {
        val idField = if (id != null) """"id":${jsonStr(id)},""" else ""
        val body = """{$idField"name":${jsonStr(name)},"birthDate":${jsonStr(birthDate)},"birthTime":${jsonStr(birthTime)},"tzId":${jsonStr(tzId)},"cityName":${jsonStr(cityName)},"lat":$lat,"lon":$lon,"timeCertainty":${jsonStr(timeCertainty)},"ayanamsa":${jsonStr(ayanamsa)},"isActive":$isActive}"""
        return request("POST", "/api/profiles", bodyJson = body).map { it.body }
    }

    suspend fun activateProfile(profileId: String): Result<String> =
        request("POST", "/api/profiles/${encode(profileId)}/activate", bodyJson = "{}").map { it.body }

    suspend fun deleteProfile(profileId: String): Result<String> =
        request("DELETE", "/api/profiles/${encode(profileId)}").map { it.body }

    /**
     * Supports ETag / 304 Not Modified so switching profiles or revalidating uses 0 payload bytes.
     */
    suspend fun fetchBundle(profileId: String, etag: String? = null): Result<HttpPayloadResult> =
        get("/api/profiles/${encode(profileId)}/bundle", ifNoneMatch = etag, allow304 = true)

    suspend fun fetchToday(
        profileId: String,
        date: String,
        tzId: String,
        lat: Double,
        lon: Double,
    ): Result<String> =
        get("/api/profiles/${encode(profileId)}/today?date=${encode(date)}&tzId=${encode(tzId)}&lat=$lat&lon=$lon")
            .map { it.body }

    suspend fun fetchCalendar(
        profileId: String,
        year: Int,
        month: Int,
        selectedDate: String,
        tzId: String,
    ): Result<String> =
        get("/api/profiles/${encode(profileId)}/calendar?year=$year&month=$month&date=${encode(selectedDate)}&tzId=${encode(tzId)}")
            .map { it.body }

    suspend fun fetchVarshaphal(profileId: String, year: Int): Result<String> =
        get("/api/profiles/${encode(profileId)}/varshaphal?year=$year").map { it.body }

    suspend fun fetchConversations(profileId: String): Result<String> =
        get("/api/conversations/${encode(profileId)}").map { it.body }

    suspend fun clearConversation(profileId: String): Result<String> =
        request("DELETE", "/api/conversations/${encode(profileId)}").map { it.body }

    suspend fun syncJournal(payloadJson: String): Result<String> =
        request("POST", "/api/sync", bodyJson = payloadJson).map { it.body }

    suspend fun askCopilotSse(
        profileId: String,
        question: String,
        deep: Boolean,
        onEvent: (AskSseEvent) -> Unit,
    ): Result<Unit> = withContext(Dispatchers.IO) {
        runCatching {
            val conn = (URL("$baseUrl/api/ask").openConnection() as HttpURLConnection).apply {
                requestMethod = "POST"
                connectTimeout = 15_000
                readTimeout = 60_000
                doOutput = true
                setRequestProperty("Content-Type", "application/json")
                setRequestProperty("Accept", "text/event-stream")
                authTokenProvider()?.let { setRequestProperty("Authorization", "Bearer $it") }
            }
            val body = """{"profileId":${jsonStr(profileId)},"question":${jsonStr(question)},"deep":$deep}"""
            conn.outputStream.use { it.write(body.toByteArray(Charsets.UTF_8)) }

            val code = conn.responseCode
            if (code !in 200..299) {
                val err = conn.errorStream?.bufferedReader()?.readText() ?: "HTTP $code"
                conn.disconnect()
                throw IllegalStateException(err)
            }

            BufferedReader(InputStreamReader(conn.inputStream)).use { reader ->
                var currentEvent = "message"
                val dataBuffer = StringBuilder()
                while (true) {
                    val line = reader.readLine() ?: break
                    when {
                        line.startsWith("event:") -> currentEvent = line.removePrefix("event:").trim()
                        line.startsWith("data:") -> {
                            if (dataBuffer.isNotEmpty()) dataBuffer.append('\n')
                            dataBuffer.append(line.removePrefix("data:").trim())
                        }
                        line.isBlank() && dataBuffer.isNotEmpty() -> {
                            AskSseParser.parseFrame(currentEvent, dataBuffer.toString())?.let(onEvent)
                            dataBuffer.clear()
                            currentEvent = "message"
                        }
                    }
                }
            }
            conn.disconnect()
        }
    }

    private suspend fun get(
        path: String,
        ifNoneMatch: String? = null,
        allow304: Boolean = false,
    ): Result<HttpPayloadResult> =
        request("GET", path, ifNoneMatch = ifNoneMatch, allow304 = allow304)

    private suspend fun request(
        method: String,
        path: String,
        bodyJson: String? = null,
        ifNoneMatch: String? = null,
        allow304: Boolean = false,
    ): Result<HttpPayloadResult> = withContext(Dispatchers.IO) {
        runCatching {
            val conn = (URL("$baseUrl$path").openConnection() as HttpURLConnection).apply {
                requestMethod = method
                connectTimeout = 15_000
                readTimeout = 30_000
                setRequestProperty("Accept", "application/json")
                if (ifNoneMatch != null) setRequestProperty("If-None-Match", ifNoneMatch)
                authTokenProvider()?.let { setRequestProperty("Authorization", "Bearer $it") }
                if (bodyJson != null) {
                    doOutput = true
                    setRequestProperty("Content-Type", "application/json")
                }
            }
            if (bodyJson != null) {
                conn.outputStream.use { it.write(bodyJson.toByteArray(Charsets.UTF_8)) }
            }
            val code = conn.responseCode
            val etag = conn.getHeaderField("ETag")
            if (allow304 && code == 304) {
                conn.disconnect()
                return@runCatching HttpPayloadResult(304, "", etag)
            }
            val text = if (code in 200..299) {
                conn.inputStream.bufferedReader().use { it.readText() }
            } else {
                val err = conn.errorStream?.bufferedReader()?.readText() ?: "HTTP $code"
                conn.disconnect()
                throw IllegalStateException(err)
            }
            conn.disconnect()
            HttpPayloadResult(code, text, etag)
        }
    }

    private fun encode(v: String): String = URLEncoder.encode(v, "UTF-8")

    private fun jsonStr(value: String): String {
        val escaped = value
            .replace("\\", "\\\\")
            .replace("\"", "\\\"")
            .replace("\n", "\\n")
            .replace("\r", "\\r")
        return "\"$escaped\""
    }
}
