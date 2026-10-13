# Akye / King George: release status

Implemented: server-validated online games, private invitation links, synchronized polling with reconnect, 3/4-token and centre-only variants, separate guest identities, server-recorded results, shared top-50 leaderboard (3 points/win, 1/draw), resignation and a five-minute turn deadline. Local play and three Okyere difficulties remain available. The final winning move stays visible before the Golden Stool celebration.

Guest identity currently belongs to a secure browser cookie. It is lost when browser data is cleared and is not transferable between devices. Invite codes are unguessable room identifiers; sharing a link allows its recipient to occupy the second seat. Only the two players can read that match. The leaderboard is provisional: guest accounts and friendly matches allow collusion. Do not market it as a fraud-resistant ranked competition.

## Android release work
1. Set up stable player accounts, recovery and account deletion; choose the final package ID and ownership of signing keys.
2. Build an Android app shell with deep links and tested WebView/TWA integration or a native frontend against this API. This repository does not yet include an Android package or App Bundle.
3. Test real Android devices, two independent networks, background/resume, timeouts, accessibility, browser cookies, storage persistence and mobile layout. Automated server tests are present; browser/device QA is pending.
4. Prepare Play Console developer verification, the privacy policy and Data Safety declarations, content rating, screenshots and store listing. Complete the testing requirements shown for the owner's developer account.
5. Create a signed Android App Bundle, upload to an internal/closed testing track, then request production release.

Official references:
- https://developer.android.com/studio/publish
- https://support.google.com/googleplay/android-developer/answer/14151465
- https://support.google.com/googleplay/android-developer/answer/9859348

## Future lives and purchases (disabled)
Proposed default: maximum 5 lives, regeneration of 1 life every 300 seconds, including elapsed time while the app is closed. The cap is a proposal, not a confirmed product decision. Server-clock refill math is implemented and tested, but lives are not enforced or stored yet. The current game remains unlimited.

Before enabling: define whether a chance is consumed on entering a match or on losing, rules for disconnect refunds and whether local practice costs a life. Store balances and refill timestamps on the server; atomically debit at the agreed event. Purchases need a stable account identity and a unique receipt ledger. Credit only server-verified, completed purchases, once per purchase token. Handle pending payments, consumption, refunds and notifications. Do not accept client-reported payments or trust the phone clock.

Use Google Play Billing for the planned Android consumable chance packs, with backend verification and idempotent entitlement grants. No payment collection, paid buttons or receipt endpoint is enabled in this build.
- https://developer.android.com/google/play/billing/integrate
- https://developer.android.com/google/play/billing/lifecycle/one-time

## Scaling and competition
Polling runs every 1.2 seconds only while a room is active. Before broad release, load-test, add account/IP rate limits and moderation/reporting, decide ranked matchmaking and seasonal scoring, and consider push/WebSocket delivery for higher concurrency. Turn expiration is adjudicated on the next player request, with the server clock authoritative. Waiting invitations expire after 24 hours. Finished games stay stored for leaderboard accounting.
