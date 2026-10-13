# Akye: DotEX web release and future Android release

## Web deployment
This package includes the existing game, all artwork/audio/tutorial assets, the server-authoritative multiplayer API and its SQL schema. No ChatGPT sign-in or ChatGPT API is needed by the game. Local players and Okyere use browser storage; online guests use a secure same-origin cookie. Keep frontend and API on the same HTTPS origin.

Option A: keep the current hosted deployment and complete verification for games.dotexsolutions.com. Add a Play Akye link from the DotEX website. This is a custom-domain deployment; it retains the current hosting provider.

Option B: deploy independently in DotEX's own Cloudflare account using standalone/worker.mjs and standalone/wrangler.jsonc. From this package root:
1. Install Node 22 or later and run npm install.
2. Authenticate Wrangler: npx wrangler login.
3. Create the database: npx wrangler d1 create dotex-akye.
4. Replace only the database_id placeholder in standalone/wrangler.jsonc with the returned database ID.
5. Apply the schema: npx wrangler d1 migrations apply dotex-akye --remote --config standalone/wrangler.jsonc.
6. Deploy: npx wrangler deploy --config standalone/wrangler.jsonc.
7. Add games.dotexsolutions.com as a custom domain for this Worker in Cloudflare. Remove any existing hosting association for that hostname when switching providers; preserve all unrelated DNS records.
8. Link to https://games.dotexsolutions.com from the corporate website.

This standalone Worker serves /game/* and /api/achi/*; it does not use the Sites framework, connector code or authentication helpers. A directory-only upload to Cloudflare Pages will NOT provide multiplayer.

## Installable browser app
The game includes an app manifest, 192/512 pixel icons and a service worker. Supported browsers can offer installation/add-to-home-screen. The worker caches the local shell and assets after successful visits; online matches require a connection. Media and artwork not previously fetched may be unavailable offline. Profiles and API responses are never cached by it. New installations on another origin start new browser data; guest accounts and statistics do not automatically migrate from the previous hostname.

## Android release path
Use this HTTPS web deployment as the shared game/API foundation. A later Trusted Web Activity can use the same browser-origin identity. Native WebView cookies and storage do not automatically share the browser's identity. Stable cross-device player accounts, recovery and deletion remain future work.

No APK, signed AAB, Play Billing implementation or Play Store submission is included. Before release choose a final package ID, create signing keys, associate the domain with the signed Android app through Digital Asset Links, test real devices and deep links, publish approved privacy/support information, complete Play Console disclosures/testing and build a signed AAB. Keep Android digital-purchase handling separate from web checkout and verify current Google Play rules before enabling payments.

## Release limitations and verification
No live payments, advertising, paid subscriptions or purchases are enabled. Guest leaderboards are provisional and are not suitable for cash-prize ranked contests. Perform two-device/two-network multiplayer, mobile layout, offline/reconnect, home-screen installation and accessibility checks before a promoted public launch. Broad release also requires load tests, stronger anti-abuse limits and moderation. Automated checks do not replace browser/device testing or an independent security assessment.
