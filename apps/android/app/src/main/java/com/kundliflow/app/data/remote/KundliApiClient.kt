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

/**
 * Lightweight HTTP & SSE client targeting KundliFlow backend (`BuildConfig.API_BASE_URL`).
 * Default server: https://129.225.104.43.sslip.io
 */
class KundliApiClient(
    private val baseUrl: String = BuildConfig.API_BASE_URL.trimEnd('/'),
    private val authTokenProvider: () -> String? = { null },
) {
    suspend fun checkHealth(): Result<String> = get("/health")

    suspend fun fetchBundle(profileId: String, etag: String? = null): Result<String> =
        get("/api/profiles/${encode(profileId)}/bundle", ifNoneMatch = etag)

    suspend fun fetchToday(
        profileId: String,
        date: String,
        tzId: String,
        lat: Double,
        lon: Double,
    ): Result<String> =
        get("/api/profiles/${encode(profileId)}/today?date=${encode(date)}&tzId=${encode(tzId)}&lat=$lat&lon=$lon")

    suspend fun clearConversation(profileId: String): Result<String> =
        request("DELETE", "/api/conversations/${encode(profileId)}")

    suspend fun syncJournal(payloadJson: String): Result<String> =
        request("POST", "/api/sync", bodyJson = payloadJson)

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
            val escapedQ = question.replace("\\", "\\\\").replace("\"", "\\\"")
            val body = """{"profileId":"$profileId","question":"$escapedQ","deep":$deep}"""
            conn.outputStream.use { it.write(body.toByteArray(Charsets.UTF_8)) }

            val code = conn.responseCode
            if (code !in 200..299) {
                val err = conn.errorStream?.bufferedReader()?.readText() ?: "HTTP $code"
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

    private suspend fun get(path: String, ifNoneMatch: String? = null): Result<String> =
        request("GET", path, ifNoneMatch = ifNoneMatch)

    private suspend fun request(
        method: String,
        path: String,
        bodyJson: String? = null,
        ifNoneMatch: String? = null,
    ): Result<String> = withContext(Dispatchers.IO) {
        runCatching {
            val conn = (URL("$baseUrl$path").openConnection() as HttpURLConnection).apply {
                requestMethod = method
                connectTimeout = 15_000
                readTimeout = 20_000
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
            val text = if (code in 200..299) {
                conn.inputStream.bufferedReader().use { it.readText() }
            } else {
                val err = conn.errorStream?.bufferedReader()?.readText() ?: "HTTP $code"
                throw IllegalStateException(err)
            }
            conn.disconnect()
            text
        }
    }

    private fun encode(v: String): String = URLEncoder.encode(v, "UTF-8")
}
