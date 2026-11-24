# Akye Android / Google Play packaging

Status: **preparation, not yet a signed Android App Bundle**.

## Chosen architecture
Use an Android Trusted Web Activity (TWA) with Chrome Custom Tabs, launching the existing HTTPS game at `https://games.dotexsolutions.com/akye/`. Keep the Cloudflare Worker, D1, multiplayer and Resend backend unchanged. Do not duplicate server-side account or game logic in Android.

- Display name: **Akye · King George**
- Publisher: **DotEX Solutions**
- Proposed Android application ID: `com.dotexsolutions.akye` (**confirm before first Play upload; immutable afterwards**)
- Proposed minimum Android SDK: 26; target latest Play-required API level at submission time
- Home URL: `https://games.dotexsolutions.com/akye/`
- Theme/background: `#201b16`
- No intrusive advertising or unnecessary device permissions
- No Android access to SMS, contacts, camera, microphone or location
- Do not place Resend, Cloudflare or other secrets in the APK/AAB

## Existing source verified
`public/game/manifest.webmanifest` has standalone display, start/scope `/akye/` and 192/512 px icons. `public/game/sw.js` provides a shell cache, while network requests for accounts and matches must remain online. `public/game/index.html` links the manifest.

## Build and domain verification
1. Generate an Android Studio/Gradle TWA project using a pinned, vetted Android Browser Helper dependency. Add a launcher icon and an offline/error screen.
2. Create a **Play App Signing** configuration and upload key privately, outside Git. Never commit a keystore or password.
3. Retrieve the **Play app-signing SHA-256 certificate fingerprint** from Play Console, then serve `https://games.dotexsolutions.com/.well-known/assetlinks.json` with the application ID and SHA-256 certificate. An upload-key fingerprint is not a substitute for Play's app-signing certificate.
4. Verify Digital Asset Links and that the TWA launches without browser chrome after Play-signed installation. Check redirects from `/`, `/game/` and `/akye/`.
5. Build a signed release **.aab** and upload to an internal Play testing track first.
6. Test installation, orientation, touch targets, back button, game audio, registration, private-code recovery, guardian approval, online matchmaking, reconnect, offline state and account deletion on Android devices.
7. Finish Play Console store listing, privacy policy, Data safety, account deletion URL, content rating, target audience/children policy, app access test credentials and country availability.

## Release gates
The successful Cloudflare Worker deployment is **not** proof of Android app compliance. Do not publish publicly until gameplay, account/guardian flows, child-safety controls, email delivery and OWASP ASVS L2 review are accepted. Account inactivity deletion remains disabled.

## Pending owner inputs
- Confirm application ID before first store submission.
- Provide Play Console access or upload the signed AAB manually; Play Console account and signing certificates are not accessible from GitHub alone.
- Confirm privacy policy, account deletion and support URLs before store review.
