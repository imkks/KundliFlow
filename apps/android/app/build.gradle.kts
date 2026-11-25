plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.kotlin.serialization)
    alias(libs.plugins.ksp)
}

android {
    namespace = "com.kundliflow.app"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.evertrail.kundliflow"
        minSdk = 26
        targetSdk = 36
        versionCode = project.findProperty("versionCode")?.toString()?.toIntOrNull() ?: 1
        versionName = project.findProperty("versionName")?.toString()?.takeIf { it.isNotBlank() } ?: "1.0.0"

        val apiBaseUrl = project.findProperty("apiBaseUrl")?.toString()
            ?: "https://129.225.104.43.sslip.io"
        val googleMapsKey = project.findProperty("googleMapsApiKey")?.toString()
            ?: System.getenv("GOOGLE_MAPS_API_KEY")
            ?: System.getenv("VITE_GOOGLE_MAPS_API_KEY")
            ?: ""
        val googleClientId = project.findProperty("googleClientId")?.toString()
            ?: System.getenv("GOOGLE_CLIENT_ID")
            ?: System.getenv("VITE_GOOGLE_CLIENT_ID")
            ?: "654362464468-7sdsra0madqrhmpntsamcbiuc707qccn.apps.googleusercontent.com"
        buildConfigField("String", "API_BASE_URL", "\"$apiBaseUrl\"")
        buildConfigField("String", "GOOGLE_MAPS_API_KEY", "\"$googleMapsKey\"")
        buildConfigField("String", "GOOGLE_CLIENT_ID", "\"$googleClientId\"")

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    val releaseStorePath = project.findProperty("releaseStoreFile")?.toString()
        ?: System.getenv("ANDROID_KEYSTORE_PATH")
        ?: ""
    val releaseStorePassword = project.findProperty("releaseStorePassword")?.toString()
        ?: System.getenv("ANDROID_KEYSTORE_PASSWORD")
        ?: ""
    val releaseKeyAlias = project.findProperty("releaseKeyAlias")?.toString()
        ?: System.getenv("ANDROID_KEY_ALIAS")
        ?: ""
    val releaseKeyPassword = project.findProperty("releaseKeyPassword")?.toString()
        ?: System.getenv("ANDROID_KEY_PASSWORD")
        ?: ""
    val hasReleaseSigning = releaseStorePath.isNotBlank() && file(releaseStorePath).exists()

    signingConfigs {
        if (hasReleaseSigning) {
            create("release") {
                storeFile = file(releaseStorePath)
                storePassword = releaseStorePassword
                keyAlias = releaseKeyAlias
                keyPassword = releaseKeyPassword
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            if (hasReleaseSigning) {
                signingConfig = signingConfigs.getByName("release")
            }
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }

    sourceSets {
        getByName("main") {
            // Single source of truth for discovery_nodes.json, safety_resources.json & offline cities.json
            assets.srcDirs("src/main/assets", "../../../packages/content/android", "../../../packages/content/places")
        }
    }
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.activity.compose)
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.compose.ui)
    implementation(libs.androidx.compose.ui.graphics)
    implementation(libs.androidx.compose.ui.tooling.preview)
    implementation(libs.androidx.compose.material3)
    implementation(libs.androidx.compose.material3.window.size)
    implementation(libs.androidx.compose.material.icons.extended)

    implementation(libs.androidx.room.runtime)
    implementation(libs.androidx.room.ktx)
    ksp(libs.androidx.room.compiler)
    implementation(libs.androidx.work.runtime.ktx)
    implementation(libs.androidx.credentials)
    implementation(libs.androidx.credentials.play.services)
    implementation(libs.google.identity.googleid)

    implementation(libs.kotlinx.serialization.json)

    testImplementation(libs.junit)
    androidTestImplementation(libs.androidx.junit)
    androidTestImplementation(platform(libs.androidx.compose.bom))
    androidTestImplementation(libs.androidx.compose.ui.test.junit4)
    debugImplementation(libs.androidx.compose.ui.tooling)
    debugImplementation(libs.androidx.compose.ui.test.manifest)
}
