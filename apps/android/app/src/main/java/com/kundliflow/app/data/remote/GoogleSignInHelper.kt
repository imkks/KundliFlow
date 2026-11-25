package com.kundliflow.app.data.remote

import android.content.Context
import androidx.credentials.CredentialManager
import androidx.credentials.CustomCredential
import androidx.credentials.GetCredentialRequest
import androidx.credentials.exceptions.GetCredentialCancellationException
import androidx.credentials.exceptions.GetCredentialException
import androidx.credentials.exceptions.NoCredentialException
import com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import com.kundliflow.app.BuildConfig

/**
 * Native Android Gmail / Google Sign-In via Credential Manager.
 * Uses the exact same Web OAuth Client ID (`BuildConfig.GOOGLE_CLIENT_ID`) as the Web UI
 * so the returned ID token verifies directly against `POST /api/auth/google`.
 */
object GoogleSignInHelper {

    suspend fun requestGoogleIdToken(
        activityContext: Context,
        serverClientId: String = BuildConfig.GOOGLE_CLIENT_ID,
    ): Result<String> {
        if (serverClientId.isBlank()) {
            return Result.failure(IllegalStateException("Google Client ID is not configured."))
        }
        return try {
            val credentialManager = CredentialManager.create(activityContext)
            val googleOption = GetSignInWithGoogleOption.Builder(serverClientId).build()
            val request = GetCredentialRequest.Builder()
                .addCredentialOption(googleOption)
                .build()

            val response = credentialManager.getCredential(
                context = activityContext,
                request = request,
            )
            val credential = response.credential
            if (credential is CustomCredential &&
                credential.type == GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL
            ) {
                val googleIdTokenCredential = GoogleIdTokenCredential.createFrom(credential.data)
                Result.success(googleIdTokenCredential.idToken)
            } else {
                Result.failure(IllegalStateException("Unexpected credential type returned by Google Sign-In."))
            }
        } catch (_: GetCredentialCancellationException) {
            Result.failure(IllegalStateException("Sign-in cancelled."))
        } catch (_: NoCredentialException) {
            Result.failure(IllegalStateException("No Google account found on this device. Add a Gmail account in Android Settings."))
        } catch (e: GetCredentialException) {
            Result.failure(IllegalStateException(e.errorMessage?.toString() ?: e.message ?: "Google Sign-In failed."))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
