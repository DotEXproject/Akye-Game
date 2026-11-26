# Akye internal acceptance and security review — 26 November 2026

Repository: `DotEXproject/Akye-Game`  
Branch: `feature/android-play-store`  
Reviewed source before this checkpoint: `81307d152d49f1c772f950f0ee41dac32cec4efc`  
Assessment basis: source review and isolated synthetic D1 tests, mapped to relevant OWASP ASVS 5.0 Level 2 controls. This is an internal review, not an independent audit or ASVS certification.

## Results completed in this workspace

- `npm run check:release` passed after the scoped fixes below: gameplay, authenticated account and social flows, recovery, guardian consent, deletion, retention safeguards, security checks, `npm audit --audit-level=low` and Wrangler deployment dry run.
- `npm audit` reported zero vulnerabilities. Wrangler read 48 assets and completed the dry run with the expected D1 and assets bindings.
- Security tests use a fresh local Miniflare D1 database and synthetic accounts. They cover route/method allowlists, origin and Fetch Metadata rejection, JSON type/size limits, rate limits under concurrent requests, membership/turn authorization, room isolation, versioned concurrent moves and single-result credit, escaped names, hashed session and recovery credentials, one-time recovery codes, guardian approval/revocation, account deletion and anonymised results, generic errors, and response security headers.
- The final branch CI run is the authoritative Chromium and Android emulator acceptance evidence; local browser binaries are unavailable in this executor. See the GitHub Actions runs for this commit once completed.

## Findings and fixes

| Finding | Severity | Resolution / status |
| --- | --- | --- |
| The friendly-challenge prompt and Twi localisation still mentioned threefold repetition and 40 slides after the approved fivefold / 100-slide rule was implemented elsewhere. | Medium functional acceptance issue | Updated the displayed rules and added a security-copy regression check rejecting the stale thresholds. |
| Chromium acceptance attempted to interact with the game behind its intentionally modal welcome screen. | Test infrastructure | The browser test now enters silently and uses the visible skip control to close the welcome animation. |
| The hosted Android runner did not expose `/dev/kvm` even after pinning to Ubuntu 24.04, so installation never began. | Test infrastructure | Android emulator workflows now use software acceleration and a 60-minute timeout. Emulator acceptance must pass on the new final commit. |

No confirmed high or critical security vulnerability was found in the controls exercised locally. This statement applies only to the source and tests listed here.

## Production observation

Read-only checks on `https://games.dotexsolutions.com/akye/` returned HTTP 200 for the game, JavaScript and manifest. The live responses carried CSP, HSTS, `nosniff`, frame denial, no-referrer and restrictive Permissions Policy headers. A desktop browser session loaded and played a three-coin match through a legal win.

The production UI still displays **three repeated positions / 40 slides**, and responses identify release `2026-11-04-security-1`. Production therefore does not yet meet the approved draw-rule acceptance. No account or persistent multiplayer data was created or modified in this browser check. Deploy the accepted branch before treating production gameplay as complete.

## Remaining gates outside this source-only assessment

- Confirm Chromium desktop and touch/mobile browser CI, including screenshot evidence, on the final commit.
- Confirm Android emulator install/launch on the corrected runner. The APK and unsigned AAB compile and pass package/permission checks in the preceding Android Actions run; the emulator part did not start because of the missing KVM device.
- Exercise live email verification, recovery and guardian delivery using the configured Resend sender. Local tests use a fake mail adapter and do not transmit email.
- Exercise signed-in accounts and multiplayer against the designated Cloudflare pre-launch UAT Worker/D1 with synthetic accounts. Cloudflare credentials and a database recovery timestamp are not available in this executor; do not create synthetic accounts in production as a substitute.
- Review Cloudflare/WAF/D1 configuration and recovery controls, test production restoration and operational monitoring, and complete device-level Android UAT. These controls cannot be verified from repository source alone.
- Google Play registration/organisation verification, app-signing certificate and signed AAB remain separate external release dependencies. They do not block an otherwise accepted web deployment.

## Release status

**Web: hold until final Chromium acceptance, the applicable source security gate and deployment checks pass; then merge/deploy and re-check the live 100-slide / fivefold copy and gameplay.**  
**Google Play: not release-ready; external registration, Play App Signing, Digital Asset Links, signed AAB, policy declarations and device UAT remain open.**
