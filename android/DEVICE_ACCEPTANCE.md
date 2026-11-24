# Akye Android device acceptance — pre-release checklist

Build evidence: GitHub Actions run 45307531484 passed, producing `akye-android-debug-apk` and `akye-android-unsigned-aab` on commit `77ceb9d12f0391e9646368a42c099f911f75e627`.

## Installation
- [ ] Download debug APK from GitHub Actions, unzip and install on a test Android device (not production accounts)
- [ ] Confirm app icon, displayed name and package ID `com.dotexsolutions.akye`
- [ ] Confirm TWA launches `https://games.dotexsolutions.com/akye/` without a blank screen
- [ ] Record whether browser chrome appears: expected until signed Digital Asset Links verification is configured
- [ ] Verify back navigation and return to home screen
- [ ] Verify portrait and landscape behaviour on small and large screens

## Gameplay
- [ ] Board and tokens fully visible without horizontal clipping
- [ ] Place tokens, slide, win, draw and restart using the agreed rules
- [ ] Sound settings and game audio behave correctly
- [ ] Tutorial and accessibility labels are usable with touch
- [ ] Offline shell shows a helpful state; online matches fail safely without connectivity
- [ ] Resume game after backgrounding, network loss and reconnect

## Account and multiplayer
- [ ] Register and sign in with synthetic adult test account
- [ ] Session timeout, logout and private-code reset/recovery
- [ ] Friends, invitations, live match and reconnect with two test devices
- [ ] Guardian consent, revocation and child-account restrictions with synthetic accounts
- [ ] Account deletion workflow and retention disclosures
- [ ] Resend messages delivered; no secrets or private codes exposed in logs

## Play readiness
- [ ] Obtain Google Play developer account organisation verification or approved alternative
- [ ] Configure Play App Signing and protect upload keystore outside source control
- [ ] Publish `/.well-known/assetlinks.json` with Play app-signing SHA-256 and `com.dotexsolutions.akye`
- [ ] Verify verified TWA full-screen on a Play-signed installation
- [ ] Review current Play target API and policies at submission time
- [ ] Complete privacy policy, Data safety, account deletion URL, content rating, target audience and app access instructions
- [ ] Create store icon, feature graphic and screenshots from tested devices
- [ ] Upload signed release AAB to internal testing before production rollout

## Reporting
For each failed item record device model, Android version, Chrome version, test steps, screenshot or video and whether the same issue occurs in the browser at `games.dotexsolutions.com`.

**No public Play Store release until the signed TWA, gameplay, account security and policy gates are accepted.**
