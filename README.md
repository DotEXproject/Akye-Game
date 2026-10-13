# Akye / King George

A Ghanaian strategy game by DotEX Solutions. This repository contains the latest approved game, Twi wording, welcome introduction signed Kwadwo Obeng, 3D board entrance, token holders, local and Okyere computer play, server-validated online matches, optional player accounts, friends and in-game challenges, cultural history and sound illustrations.

The game runs independently of ChatGPT. Its web frontend, multiplayer API and database are deployed together on Cloudflare Workers with D1. No ChatGPT account or OpenAI API key is required.

## Contents

- `public/game/`: playable browser game, app manifest, service worker and assets
- `server/`: authoritative game rules and multiplayer API
- `drizzle/`: database schema/migration
- `standalone/`: Cloudflare Worker and deployment configuration
- `scripts/`: automated gameplay and multiplayer checks
- `PLAY_STORE_ROADMAP.md`: Android release work and current limitations

## Run and deploy

Use Node 22.13 or later. Run `npm install`, then authenticate with `npx wrangler login`. The checked-in configuration points to DotEX’s existing D1 database. For a separate installation, create a database with `npx wrangler d1 create dotex-akye` and update `database_id` in both Wrangler configurations.

For a new empty database, apply the base schema using `npm run db:migrate`, then publish using `npm run deploy`. DotEX’s live base tables were created manually: do not reapply the base migration there. The account and friends tables are added idempotently on the first API request after deployment, without altering the existing player or match tables. Add `games.dotexsolutions.com` as the Worker's custom domain in your Cloudflare account, then link to it from the DotEX website. See `standalone/DEPLOYMENT.md` for details and migration considerations.

For local development, after configuring D1, apply the migration with `npx wrangler d1 migrations apply dotex-akye --local --config standalone/wrangler.jsonc`, then run `npm run dev`. Online guest cookies require HTTPS; use Wrangler's HTTPS local mode for full session testing (`npm run dev -- --local-protocol https`).

## Validation and release status

Run `npm test`. Automated checks cover game rules, online session isolation, room membership, concurrency, results and layout contracts. Browser/device visual and audio checks, load testing and independent security assessment remain outstanding. Passing these tests is not a claim that all release checks are complete.

No monetisation, paid lives, advertising or signed Android App Bundle is enabled. Guest identities and statistics do not migrate automatically between origins. The guest leaderboard is provisional and unsuitable for fraud-resistant cash-prize competition.

## Audio and artwork

Kete-inspired music and Atumpan-inspired sound illustrations are original synthesis. The Hurray celebration audio was supplied and approved by the project owner. Cultural source notes and artwork provenance are included in `public/game/assets/heritage-sources.txt` and `docs/`.

## Friends and player accounts

Use **Friends / sign in** to create a unique player ID and a cryptographically random private sign-in code. Only a SHA-256 digest of the code is stored. Keep the code privately; the player ID and code restore access on another device. Creating an account retains the current browser’s guest match record. Guest play remains available. There is no email recovery: a signed-in device can replace the code and revoke other sessions, but losing both the code and all signed-in sessions loses access. Sessions expire after 30 days.

Search by a player-ID prefix of at least three characters, send a request and accept it once. Accepted friends see online status while the game is visible, updated about every 15 seconds, with status becoming offline after a minute without a heartbeat. Discovery and online status can be disabled independently. Blocks remove friendship and cancel pending challenges. Challenges expire after five minutes; accepting creates a private two-player room and the sender is notified within the next heartbeat. Background tabs pause heartbeats, and there are no push notifications outside the game.

Games draw after three repetitions or 40 sliding moves in total. Placements are excluded, and a winning line on the 40th slide wins.
