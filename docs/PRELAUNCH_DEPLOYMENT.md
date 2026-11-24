# Akye pre-launch deployment gate — existing Cloudflare environment

Decision: use existing Worker `akye-game` and D1 `dotex-akye` for controlled pre-launch UAT. Do not create staging resources. This does not waive security gates.

## Required pre-deployment evidence
1. Verify that `akye-game` is the intended Cloudflare Worker and that its D1 `DB` binding refers to `dotex-akye` (ID `072d92c7-08a8-4807-b6c8-cb9c3044c3e1`).
2. **User-authorised pre-launch exception (24 November 2026):** proceed without an independent D1 export. Rely on the existing 7-day D1 Time Travel recovery window. This is a conscious risk acceptance, not a backup. Record the pre-deployment UTC timestamp and, if available, a Time Travel bookmark before deploying. Restoring overwrites subsequent database changes. Reassess and require durable backups before onboarding real players.
3. Capture the current Cloudflare deployment ID and its rollback availability. A Worker rollback alone will not reverse database migrations.
4. Inspect the live D1 schema and migration journal before applying migrations:
   ```bash
   npx wrangler d1 migrations list dotex-akye --remote --config standalone/wrangler.jsonc
   npx wrangler d1 execute dotex-akye --remote --config standalone/wrangler.jsonc --command "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
   ```
   Review any differences against `drizzle/` and `server/social.mjs`. **Do not blindly run migrations on an existing database.**
5. Verify `RESEND_API_KEY` is a Cloudflare **secret** and `AKYE_MAIL_FROM=games@dotexsolutions.com`. Never print the key. Confirm retention warnings remain disabled.

## Deployment only after all checks
```bash
npm ci --ignore-scripts
npm run check:release
# Only after live migration review, recovery timestamp and acceptance gates:
npm run db:migrate
npm run deploy
```
Deploy only from the reviewed commit on the security branch. Record the commit SHA, deployment ID, Time Travel recovery timestamp and reviewer.

## UAT and release acceptance
Use synthetic adult and child test accounts only. Test guardian registration, approval, revocation, verified-email recovery, deletion/anonymisation, multiplayer, mobile and desktop layouts. Confirm Resend delivery and errors. Run OWASP ASVS L2 control review, remediate findings and retest. Do not enable automated deletion. No merge to main or commercial launch without explicit acceptance.

## Stop conditions
Stop if Time Travel is unavailable, the live schema is incompatible, secrets are absent, live email fails, or security checks fail. Preserve the existing deployment and investigate.

## Live schema comparison — 24 November 2026 (read-only dashboard evidence)
The Cloudflare D1 console showed existing tables: `_cf_KV`, `akye_accounts`, `akye_blocks`, `akye_challenges`, `akye_friends`, `akye_limits`, `akye_presence`, `akye_sessions`, `players`, `results`, `rooms`. The account table columns are `player_id`, `handle`, `key_hash`, `discoverable`, `visible`. The security-branch `socialSchema` retains those columns and creates `akye_recovery`, `akye_guardians`, `akye_account_activity` separately with `CREATE TABLE IF NOT EXISTS`.

**Not yet verified:** indexes/constraints for the existing tables, actual record counts, a durable backup, and safe rollback for new writes. The Cloudflare dashboard displays a 7-day D1 Time Travel window, which is not an independent exported backup.

Read-only follow-up SQL in the D1 console:
```sql
SELECT type, name, tbl_name, sql FROM sqlite_master WHERE type IN ('table','index') AND name NOT LIKE 'sqlite_%' ORDER BY type, name;
```
Review for compatibility; do not paste any account data or secrets. The user has explicitly waived the independent backup for pre-launch UAT; record the Time Travel recovery timestamp before deployment and use synthetic test accounts. This is not yet deployment approval.

## Deployment status
This document records a backup exception only. It does **not** authorise bypassing security acceptance or automatically merge PR #1. Current Cloudflare Git integration deploys `main`, not the security branch. CI success is not evidence of live email delivery, OWASP ASVS L2 acceptance or successful Cloudflare deployment.

## Verified repository configuration — 24 November 2026
- `standalone/wrangler.jsonc` specifies Worker `akye-game`, `DB` binding to D1 `dotex-akye` (`072d92c7-08a8-4807-b6c8-cb9c3044c3e1`), `AKYE_MAIL_FROM=games@dotexsolutions.com` and `AKYE_RETENTION_WARNINGS_ENABLED=false`. This is **source configuration evidence**, not a live binding inspection.
- `package.json` runs `npm test`, `npm audit --audit-level=low` and `wrangler deploy --dry-run --config standalone/wrangler.jsonc` under `check:release`.
- GitHub Actions run `45295788427` passed on commit `7d3f737fa1da8289fdccf5f397d22efca90f39ef`. Any later code change requires a fresh passing run.
- Cloudflare's production branch is `main`; the security branch remains in draft PR #1. Do not merge solely because CI passes. Live email, browser and OWASP ASVS L2 evidence remains outstanding.
