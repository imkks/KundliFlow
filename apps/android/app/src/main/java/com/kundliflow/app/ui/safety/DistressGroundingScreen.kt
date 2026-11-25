package com.kundliflow.app.ui.safety

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.OpenInNew
import androidx.compose.material.icons.rounded.Call
import androidx.compose.material.icons.rounded.FavoriteBorder
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.kundliflow.app.ui.theme.KundliColors

/**
 * Full-screen calm grounding takeover (§7.3).
 * Skips all astrology UI immediately; never asks probing questions or stores trigger text.
 */
@Composable
fun DistressGroundingScreen(
    resources: SafetyResources,
    countryCode: String = "IN",
    onReturnCalmly: () -> Unit,
) {
    val context = LocalContext.current
    val countryHelplines = resources.helplines.firstOrNull { it.countryCode == countryCode }
        ?: resources.helplines.first()
    val globalFallback = resources.helplines.firstOrNull { it.countryCode == "GLOBAL" }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(KundliColors.BgInk)
            .statusBarsPadding()
            .navigationBarsPadding()
            .verticalScroll(rememberScrollState())
            .padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(18.dp),
    ) {
        Icon(
            imageVector = Icons.Rounded.FavoriteBorder,
            contentDescription = null,
            tint = KundliColors.Teal,
        )
        Text(
            text = resources.groundingScreen.title,
            style = MaterialTheme.typography.displaySmall,
            color = KundliColors.TextMain,
        )
        Text(
            text = resources.groundingScreen.acknowledgement,
            style = MaterialTheme.typography.bodyMedium,
            color = KundliColors.TextMuted,
        )

        resources.groundingScreen.steps.forEach { step ->
            Surface(
                color = KundliColors.Surface,
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier.fillMaxWidth(),
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = step.title,
                        style = MaterialTheme.typography.titleMedium,
                        color = KundliColors.Gold,
                    )
                    Spacer(Modifier.height(4.dp))
                    Text(
                        text = step.detail,
                        style = MaterialTheme.typography.bodySmall,
                        color = KundliColors.TextMain,
                    )
                }
            }
        }

        Text(
            text = "Support lines (${countryHelplines.countryName})",
            style = MaterialTheme.typography.titleMedium,
            color = KundliColors.TextMain,
        )

        countryHelplines.services.forEach { service ->
            Surface(
                color = KundliColors.SurfaceAlt,
                border = BorderStroke(1.dp, KundliColors.GoldHairline),
                shape = RoundedCornerShape(14.dp),
                modifier = Modifier.fillMaxWidth(),
            ) {
                Row(
                    modifier = Modifier.padding(14.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween,
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = service.name,
                            style = MaterialTheme.typography.titleMedium,
                            color = KundliColors.TextMain,
                        )
                        Text(
                            text = service.number,
                            style = MaterialTheme.typography.bodySmall,
                            color = KundliColors.Teal,
                        )
                    }
                    Button(
                        onClick = {
                            val uri = service.dialUri ?: service.webUri ?: return@Button
                            val action = if (service.dialUri != null) Intent.ACTION_DIAL else Intent.ACTION_VIEW
                            runCatching { context.startActivity(Intent(action, Uri.parse(uri))) }
                        },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = KundliColors.Teal,
                            contentColor = KundliColors.OrbInk,
                        ),
                    ) {
                        Icon(
                            imageVector = if (service.dialUri != null) Icons.Rounded.Call else Icons.AutoMirrored.Rounded.OpenInNew,
                            contentDescription = "Reach ${service.name}",
                        )
                        Spacer(Modifier.width(6.dp))
                        Text(if (service.dialUri != null) "Call" else "Open")
                    }
                }
            }
        }

        if (globalFallback != null && globalFallback.countryCode != countryHelplines.countryCode) {
            globalFallback.services.forEach { service ->
                OutlinedButton(
                    onClick = {
                        service.webUri?.let { uri ->
                            runCatching { context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(uri))) }
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                    border = BorderStroke(1.dp, KundliColors.SubtleDivider),
                ) {
                    Text("International directory: ${service.number}", color = KundliColors.TextMuted)
                }
            }
        }

        Spacer(Modifier.height(8.dp))
        TextButton(
            onClick = onReturnCalmly,
            modifier = Modifier.align(Alignment.CenterHorizontally),
        ) {
            Text("I'm okay to continue", color = KundliColors.TextMuted)
        }
    }
}
