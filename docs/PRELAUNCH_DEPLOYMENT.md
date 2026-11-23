# Akye pre-launch deployment gate — existing Cloudflare environment

Decision: use existing Worker `akye-game` and D1 `dotex-akye` for controlled pre-launch UAT. Do not create staging resources. This does not waive security gates.

## Required pre-deployment evidence
1. Verify that `akye-game` is the intended Cloudflare Worker and that its D1 `DB` binding refers to `dotex-akye` (ID `072d92c7-08a8-4807-b6c8-cb9c3044c3e1`).
2. Export and securely retain a D1 backup before running migrations. Example from repository root:
   ```bash
   npx wrangler d1 export dotex-akye --remote --output ./akye-prelaunch-backup.sql --config standalone/wrangler.jsonc
   ```
   Confirm the export is non-empty and contains the expected schema. Store it securely outside GitHub.
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
# After reviewed migration plan and verified backup:
npm run db:migrate
npm run deploy
```
Deploy only from the reviewed commit on the security branch. Record the commit SHA, deployment ID, backup location and reviewer.

## UAT and release acceptance
Use synthetic adult and child test accounts only. Test guardian registration, approval, revocation, verified-email recovery, deletion/anonymisation, multiplayer, mobile and desktop layouts. Confirm Resend delivery and errors. Run OWASP ASVS L2 control review, remediate findings and retest. Do not enable automated deletion. No merge to main or commercial launch without explicit acceptance.

## Stop conditions
Stop if the database backup cannot be verified, schema is incompatible, secrets are absent, live email fails, or security checks fail. Preserve the existing deployment and investigate.
