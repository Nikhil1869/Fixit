# Chatbot implementation and verification report

Date: 2026-11-18. Branch: `feature/fixit-ai-chatbot`, created from the user's committed
production-readiness work (`969214f`). No commit, push, deployment, history rewrite,
production database connection or production migration was performed in this phase.
The existing private `.env.local` was not edited, remains ignored and is not tracked.

## Status and completed functionality

| Area                                                   | Status                                                            |
| ------------------------------------------------------ | ----------------------------------------------------------------- |
| Dynamic Groq-compatible server integration             | IMPLEMENTED; SDK transport tested with mocks                      |
| Free-text UI and bounded multi-turn context            | IMPLEMENTED; browser and unit tested with mocks                   |
| Catalog/availability/owned booking tools               | IMPLEMENTED; real disposable-database integration tests           |
| Booking mutations through AI                           | Prohibited; only three explicit read tools exist                  |
| Missing key, timeout, errors and quota handling        | TESTED WITH MOCKS; missing-key browser path uses real local route |
| Free-tier configuration and hard endpoint restrictions | IMPLEMENTED; unsafe configurations fail closed                    |
| Actual Groq account Free-plan/model eligibility        | NOT VERIFIED; user will check privately                           |
| Actual model inference and semantic quality            | NOT LIVE VERIFIED; no authorized live request was made            |
| Public deployment and hosted CI                        | NOT VERIFIED; no push/deployment authorized                       |
| Production release                                     | BLOCKED by prior release gates and pending live AI verification   |

The assistant generates through a real SDK call when configured. It has no keyword
answer router and no fake AI fallback. Suggested starter questions and a welcome
message are ordinary UI text, not claimed model outputs. No paid API was used.

## Test results

| Command/check                       | Result                                                                                | Evidence                             |
| ----------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------ |
| `yarn test`                         | PASS: 104 tests, 7 files                                                              | `artifacts/chat-tests-final.log`     |
| `yarn lint`                         | PASS, zero warnings                                                                   | `artifacts/chat-lint.log`            |
| `yarn typecheck`                    | PASS                                                                                  | `artifacts/chat-typecheck.log`       |
| `yarn test:migration`               | PASS, isolated synthetic legacy/clean/standalone cases; no production data            | `artifacts/chat-migration.log`       |
| `yarn build`                        | PASS: production build                                                                | `artifacts/chat-build-final.log`     |
| `yarn test:e2e` with Chrome enabled | PASS: 24 across Chrome, Chromium, Firefox, WebKit, 188.99 seconds                     | `artifacts/chat-e2e-release.log`     |
| `yarn test:restart`                 | PASS: persistence and old-session rejection after signing-key rotation, 11.30 seconds | `artifacts/chat-restart-final.log`   |
| `yarn format:check`                 | PASS                                                                                  | `artifacts/chat-format-check.log`    |
| `yarn audit --groups dependencies`  | PASS, zero runtime advisories                                                         | `artifacts/chat-runtime-audit.jsonl` |
| `yarn audit`                        | FAIL, exit 8; existing high Picomatch advisory across 10 development-tool paths       | `artifacts/chat-audit.jsonl`         |
| Live provider                       | NOT RUN, as requested                                                                 | Manual procedure in CHATBOT_SETUP.md |

Artifacts are ignored local evidence, not committed secrets or permanent hosted CI
records. The production dependency audit and full audit cover different dependency
sets. The full audit remains enabled in GitHub Actions; it was not waived.
[GHSA-fc5q-39xc-vjpf](https://github.com/advisories/GHSA-fc5q-39xc-vjpf) remains
unresolved; the audit reports no patched version. No new runtime advisory was found.

The original 49 unit/integration tests remain, with 55 additional cases. New checks
cover input/role/history validation, secret-paste rejection, 18 freely worded prompts
and multiple follow-up conversations, tool bounds, safe errors, budgets, concurrency,
known quota headroom, provider cooldowns, malformed responses, no retry/fallback,
customer ownership, provider/anonymous denial and unchanged bookings after a
mutation-tool attempt. The real SDK is exercised against mocked HTTP responses;
the transport URL is asserted to be Groq, and private keys never enter request bodies.

Browser scenarios cover open/close, focus, Enter/Escape, clear, retry, sharing-change
reset, safe literal HTML rendering, verified service link, follow-up history, mobile
geometry, axe accessibility and unavailable mode. Existing registration, sign-in,
booking acceptance/rejection/cancellation/history, mobile navigation and keyboard
tests run alongside them. WebKit on Windows is not native Safari. No audible
screen-reader session or actual live model behavior was tested.

After the full 24-scenario run, the privacy copy was clarified to name Groq and
the unavailable notice simplified. The final production rebuild passed (67.03
seconds), and all eight chat scenarios passed again across the four engines
(`artifacts/chat-e2e-copy.log`, 36.5 seconds). Desktop unavailable-state screenshots
are in `artifacts/chat-screenshots/`; the Chromium screenshot was visually reviewed.
Client bundle inspection found no Groq key variable, provider endpoint or tokenizer
implementation in browser JavaScript (`artifacts/chat-client-boundary.json`).

Initial failures were retained: empty-history validation caused a TypeError and was
fixed with guarded access plus regression coverage; the new Playwright file initially
used `import.meta` in this repository's CommonJS-transformed test context and was
changed to the established `createRequire(process.cwd() + '/package.json')` pattern.
Neither failure was hidden by weakening application acceptance checks.

The restart test also exposed a reproducible cold-start booking-creation failure
(the initial progress update incorrectly described it as registration; registration
and sign-in had succeeded). A safe diagnostic traced the error to Mongoose's
`createCollection` accessing the driver database before connection completed.
Disabled command buffering allowed model auto-initialization to cache that failure.
The fix enables buffering with an explicit five-second timeout while retaining
five-second server selection and pool size 10. A fresh-Mongoose cold-model test
now checks collection/index readiness during connection. The unchanged restart
workflow passes after the fix. Temporary diagnostics were removed; failed logs
remain in `artifacts/chat-restart.log` and `artifacts/chat-restart-diagnostic.log`.
Booking transaction and ownership logic was not rewritten.

## Files created

- `src/app/api/chat/route.js`
- `src/components/Chatbot.jsx`
- `src/components/ChatbotShell.jsx`
- `src/lib/chat/assistant.js`
- `src/lib/chat/budget.js`
- `src/lib/chat/knowledge.js`
- `src/lib/chat/provider.js`
- `src/lib/chat/tools.js`
- `tests/e2e/chat.spec.js`
- `tests/fixtures/chat-conversations.json`
- `tests/unit/chat.test.js`
- `tests/unit/chat-provider.test.js`
- `docs/CHATBOT_ARCHITECTURE.md`
- `docs/CHATBOT_SETUP.md`
- `docs/CHATBOT_TEST_REPORT.md`

## Files modified

- `.env.example` — blank Groq key and configuration examples only.
- `.github/workflows/ci.yml` — explicitly disables live Groq credentials in CI.
- `package.json`, `yarn.lock` — locked SDK, server boundary and tokenizer dependencies.
- `src/app/layout.js`, `src/app/globals.css` — reusable shell and responsive chat styles.
- `src/lib/rate-limit.js` — optional weighted reservations; default existing behavior preserved.
- `src/lib/mongo.js` — bounded buffering fixes the verified cold model-initialization race.
- `scripts/start-test-server.mjs`, `scripts/verify-restart.mjs` — disable live Groq keys in harnesses.
- `tests/integration/security-booking.test.js` — real isolated database/tool/quota regression cases.
- `README.md`, `API.md`, `SECURITY.md`, `TESTING.md`, `CHANGELOG.md` — feature documentation.
- `CONTRIBUTIONS.md` — distinguish Nikhil's AI-assisted extension from original team work.
- `docs/FINAL_RELEASE_READINESS.md` — links the later feature report without rewriting historical results.

## Dependencies and endpoints

Added exact production dependencies: `openai@7.59.0`, `server-only@0.0.1`,
`gpt-tokenizer@4.1.2`. The OpenAI SDK is used only as the documented compatible client
for Groq; no OpenAI service or key is required. No new paid service is integrated.

New route: GET `/api/chat` (configuration status only) and POST `/api/chat`
(validated generation with optional read tools). Existing read APIs are reused;
booking transaction architecture is unchanged.

## Private environment and run commands

Required to enable generation: `AI_PROVIDER=groq`, private `GROQ_API_KEY`,
`AI_MODEL=openai/gpt-oss-20b`,
`AI_BASE_URL=https://api.groq.com/openai/v1`, and
`AI_FREE_PLAN_CONFIRMED=true` after the user's actual Free-plan/model check.
No `NEXT_PUBLIC_` key, no `OPENAI_API_KEY`, no modifications to existing database/auth
settings. The confirmation flag is an operator attestation, not independent billing
verification. A key belonging to a paid account cannot be made free by this flag.

```powershell
# Repository root, Node 24, existing private local replica-set configuration
yarn install --frozen-lockfile
notepad .env.local
# Add only the private Groq settings described in CHATBOT_SETUP.md.
yarn dev
```

Use the origin in `AUTH_URL`, normally `http://localhost:3000`. For production-mode
local verification use `yarn build` then `yarn start`. Never deploy until authorized.

## Security, free-tier safeguards and limitations

Server-only configuration, fixed Groq HTTPS destination, reviewed models, strict
payload/tool schemas, real session authorization, contact-free opt-in summaries,
plain text rendering, no arbitrary code/queries and no mutation tools constrain
the model. Shared request/token budgets and a single lease fail closed on database
failure. Timeouts, output caps, observed provider cooldowns and zero automatic retries
protect the quota. Exact limits are in [CHATBOT_ARCHITECTURE.md](CHATBOT_ARCHITECTURE.md).

Chat is session-only React memory and resets on refresh, clear, sharing change or
auth-identity remount; it is not permanent memory. No messages are logged/stored by
the application. Provider retention is outside this guarantee. User text may still
contain personal information despite the warning/limited secret detector.

Generated prose can be inaccurate. Live Groq tool compatibility, safety and semantic
quality remain pending. Owned-booking results are limited to the latest 20 by creation;
availability is a snapshot. Fixed-window estimates are not guaranteed exact provider
accounting. There is no automatic provider/model substitution, billing activation or
unlimited free use. Native Safari, human assistive technology, hosted CI, team-approved
publication, real legacy staging migration and public deployment remain unverified.

The user-executed [manual guide](CHATBOT_SETUP.md) includes private setup, account
and model verification, actual documented quotas, 18 diverse prompts with follow-ups,
booking privacy checks, missing-key/quota checks and evidence recording. **Live AI
verification must remain pending until those real authorized checks succeed.**
