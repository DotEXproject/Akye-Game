plugins {
    id("com.android.application")
}

android {
    namespace = "com.dotexsolutions.akye"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.dotexsolutions.akye"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

dependencies {
    implementation("androidx.browser:browser:1.8.0")
}
