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
- [ ] Configure the verified `dotexsolutions.com` sender domain, `RESEND_API_KEY` secret and `AKYE_MAIL_FROM=games@dotexsolutions.com` in the intended deployment environment (never commit secrets)
- [ ] Confirm delivery to guardian and verified recovery mailboxes, including invalid, expired, replayed and undelivered messages
- [ ] Confirm Resend provider domain alignment, SPF/DKIM, suppression handling, quotas and operational monitoring
- [ ] Test on desktop and mobile browsers: registration, child code backup, guardian approval/revocation, recovery, deletion, multiplayer and offline/reconnect states
- [ ] Test game flows with synthetic accounts on the existing `akye-game` Worker and `dotex-akye` D1 database, which the owner has designated as pre-launch UAT. Record the D1 Time Travel recovery timestamp before any changes. Avoid destructive tests on real records.
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
1. Confirm the existing Cloudflare Worker `akye-game`, D1 binding `dotex-akye`, verified sender and D1 Time Travel availability. The owner waived independent D1 export for pre-launch UAT on 24 November 2026; record the recovery timestamp. This is not a durable backup.
2. Run `npm ci --ignore-scripts` then `npm run check:release`.
3. Exercise the pre-launch UAT UI, APIs and live mail flows with synthetic accounts; record evidence.
4. Complete ASVS L2 review, fix findings and rerun CI.
5. Review additive database changes, Time Travel restoration limitations and Worker rollback, then request explicit release approval. The Git integration currently deploys `main`; merging PR #1 will initiate a production-branch build.
