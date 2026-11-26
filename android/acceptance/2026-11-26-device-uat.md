# Initial physical Android device UAT

Date: 2026-11-26
Test package: debug APK from GitHub Actions run 45309298648, commit 8876b049f9116e0291c6b82e50022eaa00052b59 (package supplied for testing; installed binary hash not independently confirmed).
Evidence: owner-reported physical-device results in ChatGPT. Device model and OS version not supplied.

| Test | Result |
|---|---|
| Installation | PASS |
| Launcher icon | PASS |
| Launch without crash | PASS |
| Board fits screen | PASS |
| Token placement and movement | PASS |
| Game sounds | PASS |
| Winning and restarting | PASS |
| Back button | PASS |

Initial acceptance: 8/8 passed. Not full release acceptance. Emulator job 138161595814 failed to boot before APK installation. Account, multiplayer, offline/reconnect, guardian, security, signed TWA and Play policy acceptance remain open. No production release authorised.
