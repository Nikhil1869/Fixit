# Testing and verification

Use Node 24 and the Yarn lockfile. Integration/browser fixtures do not use the
local or production database URI. See PHASE_REPORT.md for the final gate results.

The subsequent [release review](docs/FINAL_RELEASE_READINESS.md) supersedes the
original counts below: 49 unit/integration cases passed; 12 core browser checks
and four corrected focused checks passed across Chrome/Chromium/Firefox/WebKit.
Native Safari, WebKit anchor traversal and audible screen-reader checks remain
explicit limitations. Key rotation and synthetic staging preflight now have
separate executed harnesses. The fresh full dependency audit fails on an unpatched
development-tool Picomatch advisory; runtime-only audit passes.

| Command                                         | Purpose                                                                    |
| ----------------------------------------------- | -------------------------------------------------------------------------- |
| yarn format:check                               | Prettier source, configuration and documentation checks                    |
| yarn lint                                       | ESLint across JS/JSX/TS source, zero warnings                              |
| yarn typecheck                                  | Next.js TypeScript surface plus strict booking-domain module               |
| yarn test:unit                                  | Validation, body limits, origins, catalog and lifecycle/availability rules |
| yarn test:integration                           | Real MongoDB indexes, transactions, ownership and failures                 |
| yarn build                                      | Production compilation and route/bundle report                             |
| yarn playwright install chromium firefox webkit | One-time browser installation                                              |
| yarn test:e2e                                   | Actual-login production browser workflows and axe accessibility scans      |
| yarn test:restart                               | Booking/session persistence across an actual Next.js process restart       |
| yarn test:migration                             | Synthetic dirty/compatible/standalone staging and read-only CLI checks     |
| yarn audit                                      | Resolved dependency advisories at the time of execution                    |

## Isolation

Vitest creates MongoMemoryReplSet 7.0.24 and database fixit_security_test. It replaces
MONGODB_URI and guards cleanup by database name. Only the session boundary is
mocked; AsyncLocalStorage isolates identities for concurrent calls. Routes, queries,
indexes, bcrypt and transactions execute against real MongoDB.

Playwright creates its own fixit_browser_test replica set and production Next.js
server at 127.0.0.1:3100, with a generated signing secret. Registration/login use
real application forms; no test authentication bypass exists. The separate restart
script uses fixit_restart_test at port 3101. It creates a booking through a signed
session, kills the app process, starts a new process with the same secret/database,
and verifies the same booking through the API and dashboard. The test database
stays alive across that app restart; this does not simulate database crash recovery.

The first MongoDB/browser download needs internet. Screenshots contain synthetic
accounts. Test cleanup affects only databases created by these harnesses.

## Coverage

The 45 Vitest cases cover strict schemas, byte-bounded passwords, date/time rules,
status transition rules, catalog consistency, role/anonymous/error-session denial,
identity spoofing, customer isolation, concurrent UUID replays, competing provider
acceptance, provider-slot conflict rollback, decline semantics, password hashing
and logging, DB failures, persistent throttles, reconnection persistence, ownership
of status updates, cancellation releasing capacity, schedule/profile validation,
availability and private cursor pagination.

Three Playwright scenarios cover the full customer/provider lifecycle, settings,
schedule closure, real logout and protected-page redirects; public WCAG checks;
and anonymous API rejection/mobile navigation. The lifecycle includes completed
and cancelled visits, conflict responses, persisted profile edits and both account
roles. axe-core scans public pages plus customer/provider dashboards and customer
settings using WCAG 2 A/AA and 2.1 AA rules.

The browser runner initially needed an import-resolution adjustment for Playwright's
CommonJS transform. A later run exposed a test navigation race: it navigated to a
protected page before sign-out's redirect completed. The regression now awaits the
logout landing page, asserts the private API returns 401, then checks the redirect.
No expectation was removed to make the workflow pass.

## Scope limits

No code coverage percentage is claimed. Chromium and a 390px mobile viewport are
not cross-browser/device certification. Automated axe checks cannot prove all
accessibility requirements or replace keyboard/screen-reader review. No hosted CI,
public deployment, production migration, database crash recovery or load test was
executed. Type checking is strict for domain policy, not the entire JavaScript app.

## Dependency override

Next 15.5.29 pins PostCSS 8.4.31. A scoped Yarn resolution selects patched PostCSS
8.5.33 within the same major; Yarn's exact-version mismatch warning is expected.
The production build and final browser suite must pass with this override. Remove
it when Next's dependency catches up. See the official
[PostCSS traversal advisory](https://github.com/postcss/postcss/security/advisories/GHSA-r28c-9q8g-f849)
and [follow-up fix](https://github.com/postcss/postcss/security/advisories/GHSA-fxqj-rqcc-2cmp).
The full local audit on 2026-11-17 returned zero known vulnerabilities and exit 0.
This is a registry snapshot, not a guarantee that no vulnerability exists.

# Chatbot verification addition — 2026-11-18

See [CHATBOT_TEST_REPORT.md](docs/CHATBOT_TEST_REPORT.md) for the current feature's
exact results. Unit tests mock the Groq transport, including provider 429/timeouts,
malformed output and no retry/fallback. Disposable-MongoDB tests cover booking
ownership, tool read-only behavior, token reservations, concurrency and cooldowns.
Browser tests intercept successful AI replies and test the actual missing-key path.
The 18-prompt corpus checks forwarding/follow-up history with mocks; it does not
prove live semantic quality. No paid or live AI requests are part of automated CI.

The user will perform [manual Groq Free-plan verification](docs/CHATBOT_SETUP.md)
later. Existing historical release-test results below retain their original scope.
