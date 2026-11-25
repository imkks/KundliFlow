package com.kundliflow.app.ui.common

import android.Manifest
import android.content.pm.PackageManager
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.MyLocation
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import com.kundliflow.app.data.remote.GooglePlacesService
import com.kundliflow.app.data.remote.OfflineCityItem
import com.kundliflow.app.data.remote.PlaceSuggestion
import com.kundliflow.app.data.remote.ResolvedPlace
import com.kundliflow.app.ui.theme.KundliColors
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

/**
 * Reusable Google Places + GPS + Offline cities.json Place Picker Sheet.
 * Used in Onboarding Beat 3 (Birth City) and Today's Travel Location Switcher.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PlacePickerSheet(
    title: String,
    placesService: GooglePlacesService,
    offlineCities: List<OfflineCityItem>,
    onPlaceSelected: (ResolvedPlace) -> Unit,
    onDismiss: () -> Unit,
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var query by remember { mutableStateOf("") }
    var suggestions by remember { mutableStateOf(placesService.filterOfflineCities(offlineCities, "")) }
    var busy by remember { mutableStateOf(false) }
    var statusNote by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(query) {
        delay(220L)
        busy = true
        suggestions = placesService.autocomplete(query, offlineCities)
        busy = false
    }

    val gpsPermissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions(),
    ) { grants ->
        val granted = grants.values.any { it }
        if (granted) {
            scope.launch {
                busy = true
                val resolved = placesService.resolveCurrentGpsLocation(context)
                busy = false
                if (resolved != null) onPlaceSelected(resolved)
                else statusNote = "GPS location unavailable — pick a city below."
            }
        } else {
            statusNote = "Location permission declined — search a city below."
        }
    }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = KundliColors.Surface,
        contentColor = KundliColors.TextMain,
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .navigationBarsPadding()
                .padding(horizontal = 20.dp, vertical = 12.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Text(title, style = MaterialTheme.typography.headlineSmall)

            OutlinedTextField(
                value = query,
                onValueChange = { query = it },
                placeholder = { Text("Search any city worldwide…") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
            )

            OutlinedButton(
                onClick = {
                    val hasFine = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
                    val hasCoarse = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED
                    if (hasFine || hasCoarse) {
                        scope.launch {
                            busy = true
                            val resolved = placesService.resolveCurrentGpsLocation(context)
                            busy = false
                            if (resolved != null) onPlaceSelected(resolved)
                            else statusNote = "Could not read GPS fix — search a city below."
                        }
                    } else {
                        gpsPermissionLauncher.launch(
                            arrayOf(Manifest.permission.ACCESS_COARSE_LOCATION, Manifest.permission.ACCESS_FINE_LOCATION),
                        )
                    }
                },
                modifier = Modifier.fillMaxWidth(),
            ) {
                Icon(Icons.Rounded.MyLocation, contentDescription = null, tint = KundliColors.Teal)
                Spacer(Modifier.width(8.dp))
                Text("Use Current GPS", color = KundliColors.Teal)
            }

            if (busy) {
                LinearProgressIndicator(
                    modifier = Modifier.fillMaxWidth().height(2.dp),
                    color = KundliColors.Gold,
                    trackColor = KundliColors.SurfaceAlt,
                )
            }

            if (statusNote != null) {
                Text(statusNote!!, style = MaterialTheme.typography.bodySmall, color = KundliColors.Amber)
            }

            LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                items(suggestions, key = { "${it.source}_${it.placeId ?: it.primaryText}_${it.secondaryText}" }) { item ->
                    Surface(
                        color = KundliColors.BgInk,
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable {
                                scope.launch {
                                    busy = true
                                    val resolved = placesService.resolveSuggestion(item)
                                    busy = false
                                    if (resolved != null) onPlaceSelected(resolved)
                                    else statusNote = "Unable to resolve coordinates for ${item.primaryText}."
                                }
                            },
                    ) {
                        Row(
                            modifier = Modifier.padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween,
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(item.primaryText, style = MaterialTheme.typography.titleMedium, color = KundliColors.TextMain)
                                if (item.secondaryText.isNotBlank()) {
                                    Text(item.secondaryText, style = MaterialTheme.typography.bodySmall, color = KundliColors.TextMuted)
                                }
                            }
                            Text(
                                text = if (item.source == "google_places") "Google" else "Offline",
                                style = MaterialTheme.typography.labelMedium,
                                color = if (item.source == "google_places") KundliColors.Teal else KundliColors.Gold,
                            )
                        }
                    }
                }
            }
        }
    }
}
