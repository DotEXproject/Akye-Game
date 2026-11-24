# Akye security release gate — 23 November 2026

This document records the local security continuation checkpoint; it does not assert production readiness.

## Locally verified
- Server syntax checks passed.
- Standalone gameplay, friends, online UI, setup and layout checks passed.
- Retention calendar-month tests passed.
- Recovery and guardian static policy checks passed.

## Not yet verified
- Full backend regression and D1 database integration (miniflare dependency unavailable locally).
- Live email sender and verified recovery end-to-end.
- Guardian identity verification, approval/revocation UI and full child-safety restrictions.
- Browser/mobile testing, notification delivery and controlled retention deletion.
- Complete OWASP ASVS Level 2 assessment.

The complete updated local source ZIP has **not** been transferred to this GitHub branch. Do not merge this branch or deploy on the basis of this document. Main remains unchanged.
