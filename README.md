# Akye / King George

A Ghanaian strategy game by DotEX Solutions. This repository contains the latest approved game, Twi wording, welcome introduction signed Kwadwo Obeng, 3D board entrance, token holders, local and Okyere computer play, server-validated online matches, cultural history and sound illustrations.

The game runs independently of ChatGPT. Its web frontend, multiplayer API and database are deployed together on Cloudflare Workers with D1. No ChatGPT account or OpenAI API key is required.

## Contents

- `public/game/`: playable browser game, app manifest, service worker and assets
- `server/`: authoritative game rules and multiplayer API
- `drizzle/`: database schema/migration
- `standalone/`: Cloudflare Worker and deployment configuration
- `scripts/`: automated gameplay and multiplayer checks
- `PLAY_STORE_ROADMAP.md`: Android release work and current limitations

## Run and deploy

Use Node 22.13 or later. Run `npm install`, then authenticate with `npx wrangler login`. Create the D1 database with `npx wrangler d1 create dotex-akye` and replace the database ID placeholder in `standalone/wrangler.jsonc` with the returned ID.

Apply the schema using `npm run db:migrate`, then publish using `npm run deploy`. Add `games.dotexsolutions.com` as the Worker's custom domain in your Cloudflare account, then link to it from the DotEX website. The placeholder must be replaced before deployment. See `standalone/DEPLOYMENT.md` for details and migration considerations.

For local development, after configuring D1, apply the migration with `npx wrangler d1 migrations apply dotex-akye --local --config standalone/wrangler.jsonc`, then run `npm run dev`. Online guest cookies require HTTPS; use Wrangler's HTTPS local mode for full session testing (`npm run dev -- --local-protocol https`).

## Validation and release status

Run `npm test`. Automated checks cover game rules, online session isolation, room membership, concurrency, results and layout contracts. Browser/device visual and audio checks, load testing and independent security assessment remain outstanding. Passing these tests is not a claim that all release checks are complete.

No monetisation, paid lives, advertising, permanent cross-device accounts or signed Android App Bundle is enabled. Guest identities and statistics do not migrate automatically between origins. The guest leaderboard is provisional and unsuitable for fraud-resistant cash-prize competition.

## Audio and artwork

Kete-inspired music and Atumpan-inspired sound illustrations are original synthesis. The Hurray celebration audio was supplied and approved by the project owner. Cultural source notes and artwork provenance are included in `public/game/assets/heritage-sources.txt` and `docs/`.
