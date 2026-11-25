package com.kundliflow.app.ui.common

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.DatePicker
import androidx.compose.material3.DatePickerDialog
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TimePicker
import androidx.compose.material3.rememberDatePickerState
import androidx.compose.material3.rememberTimePickerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.kundliflow.app.ui.theme.KundliColors
import com.kundliflow.app.ui.theme.TelemetryNumberStyle
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneOffset
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BirthDatePickerField(
    birthDateIso: String,
    onDateSelected: (String) -> Unit,
    modifier: Modifier = Modifier,
) {
    var showDialog by remember { mutableStateOf(false) }

    Surface(
        color = KundliColors.Surface,
        border = BorderStroke(1.dp, KundliColors.SubtleDivider),
        shape = RoundedCornerShape(14.dp),
        modifier = modifier
            .fillMaxWidth()
            .clickable { showDialog = true },
    ) {
        Row(
            modifier = Modifier.padding(14.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column {
                Text("Birth Date", style = MaterialTheme.typography.labelMedium, color = KundliColors.Gold)
                Spacer(Modifier.height(2.dp))
                Text(birthDateIso, style = TelemetryNumberStyle, color = KundliColors.TextMain)
            }
            Text("Pick date ▾", style = MaterialTheme.typography.labelMedium, color = KundliColors.Teal)
        }
    }

    if (showDialog) {
        val initialMillis = remember(birthDateIso) {
            runCatching {
                LocalDate.parse(birthDateIso.take(10))
                    .atStartOfDay(ZoneOffset.UTC)
                    .toInstant()
                    .toEpochMilli()
            }.getOrNull()
        }
        val state = rememberDatePickerState(initialSelectedDateMillis = initialMillis)
        DatePickerDialog(
            onDismissRequest = { showDialog = false },
            confirmButton = {
                TextButton(
                    onClick = {
                        state.selectedDateMillis?.let { ms ->
                            val picked = Instant.ofEpochMilli(ms).atZone(ZoneOffset.UTC).toLocalDate()
                            onDateSelected(picked.toString())
                        }
                        showDialog = false
                    },
                ) {
                    Text("Confirm", color = KundliColors.Gold)
                }
            },
            dismissButton = {
                TextButton(onClick = { showDialog = false }) {
                    Text("Cancel", color = KundliColors.TextMuted)
                }
            },
        ) {
            DatePicker(state = state)
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BirthTimePickerField(
    birthTimeHms: String,
    allowSeconds: Boolean,
    onTimeSelected: (String) -> Unit,
    modifier: Modifier = Modifier,
) {
    var showDialog by remember { mutableStateOf(false) }
    val parts = remember(birthTimeHms) {
        val tokens = birthTimeHms.split(":")
        Triple(
            (tokens.getOrNull(0)?.toIntOrNull() ?: 12).coerceIn(0, 23),
            (tokens.getOrNull(1)?.toIntOrNull() ?: 0).coerceIn(0, 59),
            (tokens.getOrNull(2)?.toIntOrNull() ?: 0).coerceIn(0, 59),
        )
    }

    Surface(
        color = KundliColors.Surface,
        border = BorderStroke(1.dp, KundliColors.SubtleDivider),
        shape = RoundedCornerShape(14.dp),
        modifier = modifier
            .fillMaxWidth()
            .clickable { showDialog = true },
    ) {
        Row(
            modifier = Modifier.padding(14.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column {
                Text(
                    text = if (allowSeconds) "Birth Time (Exact HH:MM:SS)" else "Birth Time (Approx HH:MM)",
                    style = MaterialTheme.typography.labelMedium,
                    color = KundliColors.Gold,
                )
                Spacer(Modifier.height(2.dp))
                Text(birthTimeHms, style = TelemetryNumberStyle, color = KundliColors.TextMain)
            }
            Text("Pick time ▾", style = MaterialTheme.typography.labelMedium, color = KundliColors.Teal)
        }
    }

    if (showDialog) {
        val timeState = rememberTimePickerState(
            initialHour = parts.first,
            initialMinute = parts.second,
            is24Hour = true,
        )
        var secondsText by remember(birthTimeHms) {
            mutableStateOf(String.format(Locale.US, "%02d", parts.third))
        }

        AlertDialog(
            onDismissRequest = { showDialog = false },
            containerColor = KundliColors.Surface,
            titleContentColor = KundliColors.TextMain,
            textContentColor = KundliColors.TextMain,
            title = { Text("Select Birth Time", style = MaterialTheme.typography.titleMedium) },
            text = {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    TimePicker(state = timeState)
                    if (allowSeconds) {
                        OutlinedTextField(
                            value = secondsText,
                            onValueChange = { raw ->
                                secondsText = raw.filter { it.isDigit() }.take(2)
                            },
                            label = { Text("Seconds (00–59, optional)") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth(),
                        )
                    }
                }
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        val sec = if (allowSeconds) (secondsText.toIntOrNull() ?: 0).coerceIn(0, 59) else 0
                        val formatted = String.format(Locale.US, "%02d:%02d:%02d", timeState.hour, timeState.minute, sec)
                        onTimeSelected(formatted)
                        showDialog = false
                    },
                ) {
                    Text("Confirm", color = KundliColors.Gold)
                }
            },
            dismissButton = {
                TextButton(onClick = { showDialog = false }) {
                    Text("Cancel", color = KundliColors.TextMuted)
                }
            },
        )
    }
}
