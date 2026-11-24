# Verified Android app-to-website association

The Android package `com.dotexsolutions.akye` must be associated with `https://games.dotexsolutions.com` to display a verified full-screen Trusted Web Activity. Until verified, Android may show browser controls.

1. Enrol the app in **Play App Signing** in Google Play Console.
2. Copy the SHA-256 fingerprint of the **app-signing certificate** (not merely the upload certificate).
3. Generate the JSON locally or in a trusted CI environment:
   ```sh
   node android/scripts/create-assetlinks.mjs 'AA:BB:...32 bytes...' > assetlinks.json
   ```
4. Review the generated statement, especially the package name and fingerprint. The SHA-256 certificate fingerprint is public metadata, not a signing secret.
5. Publish exactly that JSON at `https://games.dotexsolutions.com/.well-known/assetlinks.json` with a successful HTTPS response and `application/json` content type. For this repository, the Cloudflare Worker serves assets from `public/`; only commit the real file to `public/.well-known/assetlinks.json` after the certificate is known. Do **not** deploy a placeholder.
6. Verify the URL is accessible without login, redirects or a challenge. Install the Play-signed app and check that browser chrome disappears.
7. Repeat association tests whenever the app-signing certificate changes.

**Important:** This branch does not yet contain a real Digital Asset Links statement because the Play app-signing fingerprint is unavailable. It also does not contain a signed release AAB.
