# Akye Android prototype

Application ID: `com.dotexsolutions.akye` (approved).

This Android Studio project now uses Android Browser Helper's Trusted Web Activity launcher. **TWA verification is not yet active**: Play app-signing SHA-256 and website Digital Asset Links are pending. It is not Play Store release-ready. The live Cloudflare game is unchanged.

## Build a local debug APK
1. Install Android Studio with JDK 17 and Android SDK 35.
2. Open this `android/` directory as a Gradle project.
3. Run the `app` configuration on a physical Android device or emulator.
4. Test that `https://games.dotexsolutions.com/akye/` opens, gameplay works and back navigation returns correctly.

## Before a Play Store release
- Verify the Android Browser Helper TWA implementation with Digital Asset Links, browser fallback and a signed install.
- Register the **Play app-signing** SHA-256 certificate and package `com.dotexsolutions.akye` at `https://games.dotexsolutions.com/.well-known/assetlinks.json`.
- Add a suitable adaptive launcher icon and branded offline/error experience.
- Run device tests including game audio, log-in, multiplayer, guardian controls and account deletion.
- Supply Play Console declarations, privacy policy and account deletion links.
- Set up secure signing outside GitHub and produce a signed release AAB.

No keystores, signing passwords or backend secrets belong in Git.
