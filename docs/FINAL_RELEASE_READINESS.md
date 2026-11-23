# FIXIT final release readiness

Review date: 2026-11-18. Branch: codex/security-audit. Base commit:
`bcaffc03216352477c01921f6473c057412b0cb8`. The original team history is intact;
implementation remains local and uncommitted. No push, PR, hosting deployment,
history rewrite, relicensing or production database action was performed.

**Release decision: BLOCKED.** Local functionality does not establish production
completion. A full dependency gate currently fails, and provider verification,
real-data migration, hosted CI, team publication agreement and a verified public
URL remain outstanding. The user explicitly authorized disposable synthetic staging
fixtures only, not a connection to production or an unconfirmed legacy database.

## 1. Completed requirements and evidence audit

Read the engineering report, audit, security, database, API, architecture, testing,
deployment, contribution, portfolio and performance documents before changing code.
Inspected authentication, authorization, transactions, schemas/indexes, error handling,
rate limiting, health, Next configuration, CI and the actual logs.

| Previous statement                  | Evidence and current conclusion                                                     |
| ----------------------------------- | ----------------------------------------------------------------------------------- |
| 45 unit/integration tests passed    | Original log agrees; reproduced 45/45, then 49/49 after four release tests          |
| Three Playwright scenarios passed   | Original log agrees; these were Chromium only, not cross-browser proof              |
| Production build passed             | Original log agrees; reproduced with the keyboard fix, exit 0, 231.04 seconds       |
| Restart persistence works           | Original test covered same-key app restart, not key rotation or DB crash recovery   |
| No known dependency advisories      | True of the dated earlier result; current full audit FAILS on Picomatch             |
| Migration preflight prepared        | Old script checked five counts only; insufficient for the requested readiness audit |
| Keyboard/accessibility improvements | Automated scans missed incomplete provider-tab keyboard semantics; repaired         |
| Deleted-account rejection tested    | Guard existed; an explicit deleted-account regression was missing and was added     |
| CI configured, no deployment        | Correct; no hosted run, URL or production state verified                            |

Safe local changes: comprehensive read-only staging preflight and fixture harness;
index compatibility and deleted-account regressions; provider tab keyboard/panel
semantics; cross-browser and form/keyboard/proxy tests; actual key-rotation test;
CI runs migration checks, all three bundled engines and the full audit. No booking
workflow or application framework was rebuilt unnecessarily.

## 2. Remaining P0/P1 release blockers

| Priority       | Blocker                                                                   | Evidence needed to close it                                                                                                                          |
| -------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| P0 operational | Exposed DB/signing credentials and historical plaintext registration logs | Independent provider rotation/revocation metadata, deployment key activation, old-session rejection on every active host, affected-password response |
| P1             | Full dependency security gate fails                                       | Patched compatible upstream Picomatch release/dependency path and fresh full audit; no exception granted                                             |
| P1             | Real legacy migration is unverified                                       | Confirmed isolated staging copy, reviewed owner mapping, data reconciliation, indexes, backup/restore and approved migration plan                    |
| P1             | Hosted CI and release artifact unverified                                 | Approved push/PR; successful checks tied to the exact release commit                                                                                 |
| P1             | Public release lacks approval and runtime evidence                        | Team publication arrangement, explicit deployment approval, HTTPS/hosted smoke and rollback results                                                  |

Actual Safari and spoken screen-reader validation are additional unexecuted QA
checks. They are not silently counted as passing because another engine or an
accessibility snapshot passed.

## 3. Tests executed

Baseline reproduction and added local checks are kept in ignored artifacts/release-\*
logs. These filenames are local evidence, not production telemetry.

| Check                            | Current result                                                                                      | Evidence                                             |
| -------------------------------- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Frozen install                   | PASS, existing tree up-to-date; previous fresh clean install log independently inspected            | release-install.log; earlier clean-install-final.log |
| Original tests                   | PASS 45/45                                                                                          | release-baseline-tests.log                           |
| Expanded unit/integration suite  | PASS 49/49, five files                                                                              | release-tests.log                                    |
| Read-only migration CLI/fixtures | PASS; dirty fixture rejected, compatible fixture accepted, standalone rejected, snapshots unchanged | release-migration.log/json                           |
| Production build                 | PASS                                                                                                | release-build.log                                    |
| Lint                             | PASS, zero warnings                                                                                 | release-lint.log                                     |
| Typecheck                        | PASS; strict policy plus existing Next surface, not all JS strict-typed                             | release-typecheck.log                                |
| Formatting                       | PASS, repository-wide Prettier check                                                                | release-format.log                                   |
| Cross-browser workflows          | PASS within documented scope: 12 core checks plus 4 corrected focused checks                        | release-e2e-initial.log; release-keyboard.log        |
| Restart and key rotation         | PASS: same-key persistence, changed-key 401, fresh login and cookie flags                           | release-restart.log                                  |
| Runtime dependencies             | PASS, zero advisories, exit 0                                                                       | release-runtime-audit.jsonl                          |
| Full dependencies                | FAIL, exit 8; one high advisory across ten reported dependency paths                                | release-audit.jsonl                                  |
| Env containment                  | PASS locally; historical exposure remains                                                           | release-secret-containment.json                      |

Regression coverage includes real registration/login/logout, role and owner denial,
concurrent idempotent creates, simultaneous acceptance/slot conflicts and rollback,
provider decline, customer cancellation, completion/history, profile and schedule
updates, DB reconnection, errors, mobile navigation and 50-character usernames.
New browser checks cover required/email validity, keyboard form controls, error
semantics, mobile menu focus, provider arrow/Home navigation, canonical auth URLs
under spoofed forwarding headers and response security headers. No production data
or historical secret was used as a fixture.

| Browser actually executed                  | Version       | Result                                                                                   |
| ------------------------------------------ | ------------- | ---------------------------------------------------------------------------------------- |
| Installed Google Chrome, temporary profile | 157.0.8103.52 | Three core scenarios passed; focused keyboard/forms/header check passed                  |
| Playwright Chromium                        | 159.0.8154.6  | Three core scenarios passed; focused keyboard/forms/header check passed                  |
| Playwright Firefox                         | 159.0         | Three core scenarios passed; focused keyboard/forms/header check passed                  |
| Playwright WebKit on Windows               | 27.2          | Three core scenarios passed; focused check passed with anchor-traversal limitation below |

The initial matrix ran 16 checks: 12 passed, four new focused checks failed.
Chrome/Chromium/Firefox failures were an incorrect test expectation: NextURL
normalizes the loopback IP to localhost. A normal and a spoof-header request both
returned the same trusted localhost origin. The corrected test asserts that exact
origin and response equality. The four focused scenarios were then rerun and passed
(exit 0, 54.2 seconds); application code did not change between these browser runs.
The initial failing log is retained, not relabeled as a completely green run.

Windows WebKit skipped native anchor links with both Tab and Alt+Tab, moving from
the expanded mobile-menu button to the next form input. The focused test records
this observed behavior and a limitation annotation; it does not pretend programmatic
focus proves keyboard traversal. Native Safari/full-keyboard-access navigation must
still be tested. Provider arrow/Home tab navigation and form controls did pass in
WebKit. See [Apple's keyboard settings](https://support.apple.com/en-ie/guide/safari/ibrw1075/mac)
for actual Safari; Playwright WebKit is a distinct test build, not Safari certification.

Apple Safari is unavailable on this Windows host. Windows Narrator exists, but no
audible screen-reader session was executed or observed. ARIA snapshots and axe checks
verify exposed semantics, not spoken output or human usability. No violations were
detected by the selected WCAG 2 A/AA and 2.1 AA scans on the pages exercised.

## 4. Security status and incident remediation

Local containment checks returned: .env.local present locally, ignored, not in the
Git index, and staged for removal. HEAD still contains its historical path. The
check used path/existence metadata only and emitted no secret values. Do not print
an unrestricted staged diff: its removed lines contain historical credentials.

Rotation remains **user-reported**. No authenticated Atlas/hosting connector or
configured provider CLI is available, no provider dashboard was exposed by the
connected browser inventory, and no deployed target was supplied. Local
key-rotation behavior cannot independently verify provider state. No old credential
was extracted from history, replayed against a remote service, or printed.

Incident closure plan:

1. The database owner records Atlas database-user update/revocation time, scope and
   audit-event reference privately. Review least privilege, network access and
   suspicious access. Verify retired credentials cannot authenticate in an approved
   provider workflow without putting values in a command line, report or chat.
2. The hosting owner records signing-key replacement time and active deployment IDs
   for every production/preview environment. Remove obsolete fallback secrets and
   old deployments still reachable with the compromised configuration. Restart all
   affected instances. Keep only nonsecret verification metadata in this report.
3. On each approved HTTPS target, use an existing pre-rotation browser session to
   request a private API: expect 401 and a protected-page sign-in redirect. Sign in
   freshly and verify access. Do not export cookies into tickets or shell history.
4. Review who could access old registration logs, retention/backups, and affected
   accounts. Restrict access and perform the team's approved password-reset and
   notification response. MongoDB/signing-key rotation does not repair leaked user
   passwords. No password-recovery feature is claimed by this app.
5. Publish the local env-file removal only in an approved review. Normal removal
   leaves historical objects. Any filter-repo rewrite, force push, cache removal
   or collaborator re-clone plan needs separate explicit approval and team coordination.
6. Record owner, timestamp, evidence reference and status for each action; keep
   incident details private. Do not mark the incident closed from a screenshot of
   an environment-variable name or this local test alone.

Auth.js uses eight-hour encrypted/signed JWT sessions. Server operations reload the
account ID. Logout removes the browser cookie; there is no per-session revocation
store, so a copied current-key token is not globally invalidated by browser logout.
Key rotation and account deletion are independently tested boundaries. HttpOnly and
SameSite are checked locally; Secure cookies and TLS must be verified on HTTPS.

The unresolved advisory is
[GHSA-fc5q-39xc-vjpf](https://github.com/advisories/GHSA-fc5q-39xc-vjpf), affecting
Picomatch <=4.0.7. The current registry version is 4.0.7 and the advisory lists no
patched release. Paths are development/build tooling (including ESLint, Tailwind,
Vite/Vitest); the runtime-only audit is clean. No app endpoint accepts glob patterns,
but that limited exposure assessment does not turn the full gate green. No unreviewed
fork, global incompatible override, audit suppression or dependency removal was used.

## 5. Database migration status

Only owned local databases were used: fixit_staging_legacy_fixture,
fixit_staging_ready_fixture and fixit_staging_standalone_fixture. No external URI
was consumed by the harness. It starts its own MongoDB processes and disposes only
those fixtures. This is **synthetic migration-readiness verification**, not a real
legacy-data migration or an approved production migration.

Dirty fixture: 3 users, 2 bookings, 2 assignments and 2 service records. Findings
include one duplicate username group, one normalized-email duplicate group, three
invalid/missing hashes, two invalid customer ownership links, one legacy booking
status, one incompatible booking slot, service aliases/unknown services, one orphan
assignment, one duplicate active provider slot and 13 missing required indexes.
Additional cases verify obsolete unconditional slot indexes and mismatched provider
ownership. Clean fixture: 2 users, 1 accepted booking and 1 matching assignment,
with all 13 required indexes; readiness passed.

Preflight checks identity canonicalization/hash compatibility, provider schedules,
customer/provider references, assignment links/status/active flags, history, request
UUIDs, aliases, calendar/time alignment, duplicate reservations, index key order,
uniqueness, partial filters, hidden/sparse/collation options and TTL. It detects a
replica set/sharded topology and executes an aborted **read-only snapshot transaction**.
No transaction writes are made by preflight. Separate application integration tests
exercise actual transaction writes and rollback against their own replica set.

Before/after fixture snapshots prove the CLI leaves documents and indexes unchanged.
It exits 0 for compatible data, 2 for data/index/topology blockers, 1 for unavailable
configuration/permissions. MIGRATION_PREFLIGHT_TARGET=staging is an explicit operator
label, not a magical guarantee the URI is staging; verify the database independently.
Use a read-only staging account. It reads identity/hash fields in memory but outputs
counts only; large datasets need a resource review before running this offline audit.

Real migration remains pending: restore an approved backup into a separately named,
access-restricted staging environment; resolve ambiguous identity and booking owner
mapping with the team; reconcile aliases, hours, statuses, assignments and history;
review indexes and a reversible migration; validate counts, conflicts and restores.
Never auto-merge users by email or silently round legacy appointments. No automatic
production migration is included.

## 6. CI status

Configured, **not executed on GitHub**. Current workflow uses commit-pinned checkout
and setup-node actions, read-only contents permission and synthetic credentials.
It runs frozen install, formatting, lint, types, unit/integration, migration fixtures,
build, Chromium/Firefox/WebKit workflows, restart/rotation, full audit and env guard.
It has no deploy job and no production secrets. The full audit will currently fail;
do not disable it or merge with an invented green status. Push events cover main/master;
PR events trigger branch checks. GitHub CLI was not installed/authenticated here.

## 7. Production configuration and hosting assessment

The architecture is suitable in principle: Next.js Node runtime on Vercel or a
Render Node service, with persistent MongoDB Atlas replica-set storage. MongoDB
standalone does not support the required multi-document transactions. Local
single-node replica sets demonstrate correctness, not production high availability.
[MongoDB transaction requirements](https://www.mongodb.com/docs/manual/core/transactions-production-consideration/)
provide the deployment constraints.

Node 24 is pinned through engines/hosting configuration; check the selected platform's
[Node support](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions)
and [Render settings](https://render.com/docs/node-version). The database is external,
not a serverless filesystem. The app caches Mongoose connections per process with
maxPoolSize=10 and a five-second server-selection timeout. Pools multiply across
instances, so measure Atlas connection capacity under staging load. Check function
and transaction duration limits rather than relying on a local timing result.
[Vercel function limits](https://vercel.com/docs/functions/limitations).

| Configuration   | Required release setting / verification                                                                                                        |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| MONGODB_URI     | Private TLS Atlas URI; dedicated environment DB/user; transaction-capable topology and validated indexes                                       |
| AUTH_SECRET     | Fresh high-entropy secret per environment; no legacy fallback; restart all instances after replacement                                         |
| AUTH_URL        | Exact stable HTTPS origin; no path, query or wildcard preview hostname                                                                         |
| AUTH_TRUST_HOST | true only behind a trusted proxy that sanitizes Host/forwarded headers; direct origin must not accept arbitrary proxy claims                   |
| Runtime         | Node 24, repository root, frozen Yarn install, yarn build / yarn start where applicable                                                        |
| Health          | /api/health checks DB ping only; 200 is not proof of indexes, migrations, transactions or incident closure                                     |
| Rate limiting   | Shared Mongo fixed windows; login 10/account/15m, signup 100 globally/hour + 5/email/hour, bookings 30/account/min                             |
| Headers/cookies | nosniff, frame DENY, referrer/permissions policy locally checked; verify HTTPS redirect, certificate and Secure/HttpOnly/SameSite on real host |
| Storage/backups | Durable Atlas storage, backup retention and restore rehearsal; no Mongo process on ephemeral hosting disk                                      |

Global signup throttling is conservative and can affect unrelated users. Review
trusted-ingress abuse controls and capacity before broad public registration. OAuth,
email verification, recovery, provider vetting and payments are not implemented.
No real proxy, DNS, certificate, provider account, backup or deployed health status
was verified in this phase.

## 8. Exact release instructions — not executed

These are ordered instructions for the team after the relevant approvals. They
are not authorization to push, create a PR, deploy or migrate now. The audit blocker
must be resolved; real-data and provider evidence must be attached privately.

### A. Review and prepare a commit

Run from the repository root in Windows PowerShell:

```powershell
git switch codex/security-audit
git status --short
git diff --stat
git diff -- . ':(exclude).env.local'
git diff --cached -- . ':(exclude).env.local'
git ls-files -- .env.local
git check-ignore .env.local
```

The tracked-env query must be empty and the ignore query must name .env.local.
Review new files as well as tracked diffs. Do not paste the env deletion into a
PR description or terminal transcript. Confirm your own Git author identity and
retain original team history/credits; do not squash/rewrite existing team commits.

```powershell
yarn install --frozen-lockfile
yarn format:check
yarn lint
yarn typecheck
yarn test
yarn test:migration
yarn build
yarn playwright install chromium firefox webkit
yarn test:e2e
yarn test:restart
yarn audit
```

For an additional installed-Chrome check:

```powershell
$env:FIXIT_TEST_CHROME = 'true'
yarn test:e2e --project=chrome
Remove-Item Env:\FIXIT_TEST_CHROME
```

Only after local review, fix completion and publication approval:

```powershell
git add -A
git diff --cached --stat
git ls-files -- .env.local
# Inspect staged source with the same env exclusion before committing.
git diff --cached -- . ':(exclude).env.local'
git commit -m "Harden FIXIT booking workflows and add release verification"
```

A normal removal commit still has historical credentials in its parent/diff.
Coordinate containment before approving publication. No history rewrite is implied.

### B. Approved push, draft PR and GitHub validation

Install/authenticate GitHub CLI privately if using these commands, or use GitHub's
web PR flow. No token belongs in this repository or the command history.

```powershell
git push -u origin codex/security-audit
gh pr create --repo Nikhil1869/Fixit --base master --head codex/security-audit --draft --title "Harden booking security and verify release readiness" --body-file docs/RELEASE_PR_BODY.md
gh pr checks codex/security-audit --repo Nikhil1869/Fixit --watch
```

Record the commit SHA, PR URL and Actions run URL. Review action logs, not merely
whether a job was queued. Make the checks job required before merge. The current
full audit is expected to fail until the Picomatch blocker is resolved. Do not
supply production credentials to PR jobs, use pull_request_target for this build,
or enable auto-deployment before explicit team approval. Creating/pushing this PR
has not occurred in this task.

### C. Staging database preparation

The synthetic fixture verification is safe to rerun now with `yarn test:migration`.
For real legacy data, first obtain an explicitly confirmed isolated copy:

1. Database owner takes a backup, records its timestamp/ID and proves restore into
   a separate staging database. Restrict access and handle copied customer data privately.
2. Create separate read-only preflight credentials and a separate app test user
   with only staging read/write privileges. Do not reuse production credentials.
3. Prepare ignored .env.staging.local privately. Set MONGODB_URI to that isolated
   database, and MIGRATION_PREFLIGHT_TARGET=staging. Keep secrets out of transcripts.
4. Run the read-only CLI; inspect its counts, index options and transaction result:

```powershell
node --env-file=.env.staging.local scripts/migration-preflight.mjs
$preflightExit = $LASTEXITCODE
# 0: checks pass; 2: data/index/topology blockers; 1: unavailable/configuration error.
```

5. On any finding, stop rollout. Obtain verified identity/owner mappings from the
   team and prepare a reviewed migration for that staging copy. Back up before any
   approved writes. This task supplies no automatic ownership assignment or production
   syncIndexes operation. Legacy weak/invalid password hashes need an approved
   account recovery process; do not fabricate replacement passwords for real users.
6. Re-run preflight after reviewed staging changes, then run staging acceptance,
   concurrency, lifecycle and persistence tests. Verify counts and restore/rollback.
   Production migration requires a separate approval and controlled maintenance window.

### D. Protected staging deployment

After team agreement and explicit staging deployment approval, create a separate
Vercel project or Render service with access protection. Choose the reviewed commit,
Next.js, repository root, Node 24, install `yarn install --frozen-lockfile`, build
`yarn build`; Render starts `yarn start` with health path `/api/health`.

Use a stable staging hostname. Configure MONGODB_URI, AUTH_SECRET, AUTH_URL and
AUTH_TRUST_HOST in the hosting dashboard, scoped only to that staging environment.
AUTH_URL must match the final HTTPS staging origin. Use the staging database and
an independently generated staging key. Disable automatic production promotion.
Do not point preview builds at production. Do not make a public portfolio demo
before the publication arrangement is agreed.

### E. Production environment and HTTPS verification

Only after staging, incident, dependency, CI and team gates pass, approve production
migration/deployment separately. Provision production Atlas backups, network access,
least-privilege user and validated indexes. Configure fresh production secrets in
the hosting dashboard, canonical HTTPS AUTH_URL and trusted proxy settings. Deploy
the exact reviewed release commit; record deployment ID and its rollback candidate.

Set the approved real hostname locally (the value below is deliberately non-routable):

```powershell
$releaseOrigin = 'https://approved-host.example.invalid'
$health = Invoke-WebRequest -Uri "$releaseOrigin/api/health" -MaximumRedirection 0
$health.StatusCode
$health.Content
curl.exe --head --max-redirs 0 "$releaseOrigin/"
# Verify the HTTP origin redirects to the canonical HTTPS host.
$httpOrigin = $releaseOrigin -replace '^https:', 'http:'
curl.exe --head --max-redirs 0 "$httpOrigin/"
```

Do not use -k/--insecure. Confirm valid certificate/hostname, canonical redirects,
security headers and platform TLS policy. In browser DevTools, verify session
cookies have Secure, HttpOnly and SameSite=Lax without copying their values. Test
that foreign Origin requests and untrusted forwarded hosts cannot change auth URLs
or bypass application checks. A local spoof-header check is only partial proxy evidence.

### F. Hosted booking smoke test

Use two customers and two providers with clearly synthetic contacts. Do not execute
the destructive local database harness against a hosted production URI.

1. Register, log in/out and test a wrong password. Verify role-specific dashboards.
2. Set provider hours, browse services and request a future available hour.
3. Retry the same request UUID: one record; changed payload with same UUID: conflict.
4. Concurrently accept one request with two providers: one assignment. Accept two
   requests for the same provider/hour: one active slot; the losing request remains pending.
5. Decline as one provider: the customer's request remains, and another provider can accept.
6. Check contact privacy before/after assignment, other-customer/provider denial,
   start/completion history and cancellation cutoff/slot release.
7. Save profiles/hours, reload, restart/redeploy the app without changing the DB/key,
   and verify persistence. Separately validate pre-rotation-session rejection.
8. Repeat on mobile and supported browsers; complete the manual screen-reader checklist.
   Record only statuses and synthetic record references, not credentials/cookies.

### G. Rollback

Before release, record a **security-fixed, schema-compatible** last-known-good
application deployment, backup/restore evidence, index plan, incident keys and an
operator contact. The original pre-security commit is not an acceptable rollback.
For a first release with no safe prior version, the fallback is maintenance/access
restriction and stopping writes while repairing forward, not exposing the old app.

If errors or conflicts increase, restrict writes/traffic, preserve diagnostic evidence,
and revert/promote the approved compatible application version in the hosting dashboard.
A [Vercel application rollback](https://vercel.com/docs/instant-rollback) does not
undo database writes or restore old settings automatically. Keep rotated keys; never
restore exposed secrets. Do not drop indexes or restore a database blindly while
new writes continue. Any data rollback requires a separately reviewed restore or
forward-repair plan, ownership reconciliation and explicit approval. Re-run health,
auth, ownership, concurrency and persistence smoke checks before reopening traffic.

### H. Manual accessibility checks still required

On a Mac/iPhone, run actual Safari and VoiceOver; on Windows, run Narrator or NVDA
with Chrome/Firefox. Navigate landmarks/headings and all controls using only the
keyboard. Check names, required/invalid field announcements, error/status live
announcements, focus after tab changes, mobile menu state and 200% zoom/reflow.
Confirm no keyboard trap and that modal confirmation can be accepted/cancelled.
Record browser/OS/reader version and observations. Do not replace this with an axe
score or an ARIA snapshot. These audible/human checks were not executed here.

## 9. Portfolio review and final checklist

README, architecture, API, original screenshots and contribution records were
reviewed. The original screenshots are retained; new browser-specific synthetic
captures live in artifacts/release-screenshots. The technical case study is in
[TECHNICAL_CASE_STUDY.md](TECHNICAL_CASE_STUDY.md), with three truthful resume bullets.
It separates Nikhil's original group contribution and the subsequent AI-assisted
engineering work from the original team's implementation. No live-demo, user-count,
revenue, coverage-percent or hosted-CI success claim is made.

PASS means executed evidence; FAIL means a check ran and failed; BLOCKED means
required external evidence/approval/platform is missing. Passing automation does
not imply that an explicitly limited or unexecuted manual check passed.

| Requirement                                         | Status  | Reason                                                                                   |
| --------------------------------------------------- | ------- | ---------------------------------------------------------------------------------------- |
| Audit/report evidence reproduced                    | PASS    | Original logs matched; discrepancies documented                                          |
| Local secret containment                            | PASS    | Untracked/ignored private file, staged removal, metadata-only verification               |
| Provider rotation and real old-session invalidation | BLOCKED | User-reported only; no authenticated provider/host evidence                              |
| Historical password-log incident closure            | BLOCKED | Account-owner/log review not supplied                                                    |
| Full dependency security gate                       | FAIL    | Unpatched development-tool Picomatch advisory                                            |
| Runtime dependency security gate                    | PASS    | Zero advisories in runtime-only audit                                                    |
| Unit/integration regression                         | PASS    | 49 cases; real isolated MongoDB                                                          |
| Production compilation, lint and types              | PASS    | Reproduced commands exited 0                                                             |
| Cross-browser/keyboard/mobile automation            | PASS    | 12 core checks plus 4 corrected focused checks; WebKit link traversal explicitly limited |
| Same-key restart and changed-key invalidation       | PASS    | Old-key session rejected, new login works; local only                                    |
| Formatting                                          | PASS    | Repository-wide Prettier check passed                                                    |
| Synthetic staging preflight                         | PASS    | Dirty/clean/standalone fixtures and no-mutation snapshots                                |
| Real legacy-data migration                          | BLOCKED | No confirmed isolated real-data copy; no migration approved                              |
| Actual Safari and spoken screen reader              | BLOCKED | No Apple browser platform / audible assistive-technology run                             |
| Hosted GitHub CI                                    | BLOCKED | No approved push/run; audit would currently fail                                         |
| Hosting configuration/runbook                       | PASS    | Reviewed and prepared; target values remain unverified                                   |
| Team publication/relicensing arrangement            | BLOCKED | Explicitly pending team confirmation                                                     |
| Approved public HTTPS deployment                    | BLOCKED | No deployment performed or URL verified                                                  |
| Production completion                               | BLOCKED | Release must not be declared complete                                                    |

# Subsequent chatbot feature

The later `feature/fixit-ai-chatbot` extension is documented separately in
[CHATBOT_TEST_REPORT.md](CHATBOT_TEST_REPORT.md), with
[Free-plan setup and pending live verification](CHATBOT_SETUP.md). The release
evidence below describes the preceding production-readiness phase and is not a
claim that the chatbot has been live verified or deployed. Existing blockers remain.
