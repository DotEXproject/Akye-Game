# Akye staging deployment (isolated from production)

Staging configuration: `standalone/wrangler.staging.jsonc`.

## Prerequisites
1. Create a **new** Cloudflare D1 database named `dotex-akye-staging`. Record its database ID.
2. Replace `REPLACE_WITH_STAGING_D1_DATABASE_ID` in the staging configuration with that ID. Never use the production database ID `072d92c7-08a8-4807-b6c8-cb9c3044c3e1`.
3. Provision a staging Worker named `akye-game-staging` using the staging config. Configure its own `RESEND_API_KEY` secret; ideally a dedicated staging sending key. Do not commit secrets.
4. Keep retention warning delivery disabled. The staging config has **no cron triggers**.

## Deployment (from repository root)
```bash
npm ci --ignore-scripts
npm run check:release
cd standalone
npx wrangler d1 migrations apply dotex-akye-staging --remote --config wrangler.staging.jsonc
npx wrangler deploy --config wrangler.staging.jsonc
```

**Do not run migrations or deployment until the staging database ID has been set and verified.** Never use `wrangler.jsonc` for staging: it points to the production database.

## Acceptance evidence
- Check `/api/achi` health and browser UI on the staging Worker.
- Register an adult and a child using test accounts; verify approval email, denial before consent, approval, login, revocation and active-room termination.
- Verify recovery email, expiry, replay rejection, private-code rotation and deletion/anonymisation.
- Test multiplayer, mobile/desktop rendering and reconnect flows.
- Capture the commit SHA, test date, environment, results and security findings.
- Complete OWASP ASVS L2 review before considering production promotion.

## Safety
Do not expose secret values in screenshots, issue logs or GitHub. Avoid using actual children's personal data in staging. Do not merge or deploy production while release gates remain open.
