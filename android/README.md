# Akye Android prototype

Application ID: `com.dotexsolutions.akye` (approved).

This Android Studio project currently launches the existing game through an Android Custom Tab. **It is not yet a Trusted Web Activity and is not Play Store release-ready.** The live Cloudflare game is unchanged.

## Build a local debug APK
1. Install Android Studio with JDK 17 and Android SDK 35.
2. Open this `android/` directory as a Gradle project.
3. Run the `app` configuration on a physical Android device or emulator.
4. Test that `https://games.dotexsolutions.com/akye/` opens, gameplay works and back navigation returns correctly.

## Before a Play Store release
- Implement a verified TWA (Android Browser Helper / Trusted Web Activity launcher), rather than shipping this Custom Tab prototype.
- Register the **Play app-signing** SHA-256 certificate and package `com.dotexsolutions.akye` at `https://games.dotexsolutions.com/.well-known/assetlinks.json`.
- Add a suitable adaptive launcher icon and branded offline/error experience.
- Run device tests including game audio, log-in, multiplayer, guardian controls and account deletion.
- Supply Play Console declarations, privacy policy and account deletion links.
- Set up secure signing outside GitHub and produce a signed release AAB.

No keystores, signing passwords or backend secrets belong in Git.
