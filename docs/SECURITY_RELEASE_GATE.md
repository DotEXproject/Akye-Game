# Akye security release gate — 23 November 2026

**Release state: HOLD.** This checklist is a verification record, not an OWASP certification. The security branch must remain unmerged until every mandatory gate has independent evidence.

## Automated gates (CI evidence required on final commit)
- [x] Gameplay and online regression suite
- [x] Guardian registration, pending/approved/revoked states, active-room termination and email-failure rollback
- [x] Verified-email recovery, one-time code replay prevention and private-code rotation
- [x] Account deletion, personal-data removal and historical-result anonymisation
- [x] Inactivity warning selection, dry-run default, verified-address delivery, retries and scheduled execution
- [x] API origin, content-type, payload limits, route allowlist, rate limits and response security headers
- [x] Dependency audit and Cloudflare Worker deployment dry-run
- [ ] Reconfirm all checks on the **final** branch commit, not an earlier commit

## Mandatory external and manual acceptance (not yet passed)
- [ ] Configure a verified sender domain, `RESEND_API_KEY` secret and `AKYE_MAIL_FROM` in the intended deployment environment (never commit secrets)
- [ ] Confirm delivery to guardian and verified recovery mailboxes, including invalid, expired, replayed and undelivered messages
- [ ] Confirm Resend provider domain alignment, SPF/DKIM, suppression handling, quotas and operational monitoring
- [ ] Test on desktop and mobile browsers: registration, child code backup, guardian approval/revocation, recovery, deletion, multiplayer and offline/reconnect states
- [ ] Test game flows against a staging Cloudflare Worker and staging D1 database; do not run destructive tests against production
- [ ] Verify tenant/data access boundaries where applicable, session invalidation, CSRF/origin protections, brute-force controls, API authorisation and sensitive-data leakage
- [ ] Perform a complete OWASP ASVS Level 2 control-by-control assessment with evidence and remediation/retest of all findings
- [ ] Confirm 12-month inactivity policy, user notices, appeals/recovery and legal/child-data retention requirements before enabling any deletion job
- [ ] Obtain release owner acceptance and an independently reviewed rollback plan

## Operational safeguards
- Daily retention review is configured for 08:00 UTC. `AKYE_RETENTION_WARNINGS_ENABLED=false` remains the default.
- Retention expiry is **review only**; no automatic account deletion is enabled.
- Do not merge PR #1 or deploy without the above evidence.
- Capture test environment, commit SHA, date, reviewer, results and remediation links for each final acceptance item.

## Deployment verification
1. Set up staging bindings and secrets, including a separate staging D1 database and verified sender.
2. Run `npm ci --ignore-scripts` then `npm run check:release`.
3. Exercise the staging UI, APIs and live mail flows; record evidence.
4. Complete ASVS L2 review, fix findings and rerun CI.
5. Review database migration and rollback procedures, then request explicit release approval.
