# FIXIT development audit

Audit date: 2026-11-16. Initial static audit completed before application changes.
This is the initial audit and security repair phase, not a certification that the
eleven-phase production makeover is complete. Verification updates follow below.

## Baseline and provenance

- Workspace: `C:\Users\HP\Downloads\Fixit-master\Fixit-master`. The application
  root is this directory (contains `package.json`, `yarn.lock`, `src/app`). The inner
  `fixit/` contains only an unused TypeScript configuration and ignore file.
- Initially a ZIP/archive: no `.git`, no `node_modules`, no installed versions to
  report. `git status --short` and `git log -5 --oneline` failed for that reason.
- Yarn Classic lockfile v1 and Render's Yarn commands establish Yarn as the package
  manager. Available runtime: Node 24.16.0, npm 11.13.0, Yarn 1.22.22.
- Manifest/lock baseline: Next 15.1.4, React/React DOM 19.0.0, Auth.js
  5.0.0-beta.25; Mongoose declared `^8.9.4`. No test runner, tests, CI, formatter,
  or typecheck script existed. Existing `lint` command was `next lint`.
- GitHub API reports `Nikhil1869/Fixit` is a fork of `vishalkarnati/Fixit`.
  Comparison of their `master` branches: identical, ahead 0, behind 0. Observed tip:
  `bcaffc03216352477c01921f6473c057412b0cb8`.
- Neither repository declares a license; no LICENSE/COPYING/NOTICE file was found
  in the upstream tree. Do not invent a license or claim ownership of upstream
  work. Obtain permission/license clarification before redistribution/deployment.
- Upstream history includes KARNATI VISHAL and RKarthikSantosh. Existing team
  attribution is retained. Identical tips do not prove that Nikhil did no work;
  contributions may have been merged upstream. Individual authorship needs a
  commit-by-commit review and the user's evidence.
- `.env.local` is in the public tree. Its Git blob hash matches the local file.
  Only variable names and boolean checks were inspected/reported: a non-placeholder
  credential-bearing MongoDB URI and a populated AUTH_SECRET. No credential was
  printed or used to connect. Validity was not tested.
- User subsequently reported rotating both credentials. This is user-confirmed,
  not provider-verified. Existing history and the remote default branch still
  contain the old file until a reviewed change is published.

## Architecture inspected

All source/configuration JavaScript, JSX, TypeScript and CSS files in the initial inventory were reviewed
by directory, including route wrappers, component implementations, static catalog,
models, queries, authentication and actions. Public asset names/sizes were inspected;
image/video visual quality has not yet been reviewed in a browser.

Next.js App Router with React client components and server components; Tailwind;
Auth.js Credentials plus an unfinished GitHub provider; JWT sessions; bcryptjs;
Mongoose; three collections (`users`, `bookings`, `acceptedbookings`). Services
are static JavaScript, despite the original README claiming DB-stored services.
Provider identity is inferred from a stored nonempty `service`, not an explicit
role field. Customers request a time; a matching provider later accepts from a
shared queue. No provider availability calendar or admin domain exists.

Acceptance copies a pending document into another collection and then deletes
the original. Neither step is conditional/transactional. No middleware exists;
the security problem is missing checks at API boundaries, not absence of middleware.

## Five most critical verified problems

| ID       | Severity | File/evidence at baseline                                                                                   | Problem and impact                                                                             | Recommended fix                                                                                                                 | Verification                                                                                     |
| -------- | -------- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| SEC-001  | P0       | `.env.local`; public tree/blob equality; `.gitignore` only ignores `.env`                                   | Public MongoDB credentials and session signing secret; potential DB access/session forgery     | Rotate at providers, invalidate sessions, untrack file, ignore env variants, add placeholders and incident guidance             | User/provider rotation confirmation; `git ls-files`/`git check-ignore`; secret regression checks |
| SEC-002  | P0       | `src/app/api/{booking,accepted-booking,reject-booking}/route.js` have no `auth()` or server identity checks | Anonymous callers can forge bookings, assign providers, or delete customer requests            | Authenticate every mutation, resolve account from immutable session ID, validate input, scope operations to authorized record   | Route tests for anonymous, wrong role, spoofed identity, cross-account actions                   |
| SEC-003  | P0       | `src/app/api/register/route.js:9` logs username, email and plaintext password                               | Passwords leak to deployment logs; DB/hashing errors also occur outside try/catch              | Remove sensitive logs, validate requests, bound hashing input, safe errors; review historical logs and reset affected passwords | Logging-spy regression tests; malformed JSON/DB-failure tests                                    |
| SEC-004  | P0       | `package.json` and `yarn.lock`: Next 15.1.4, App Router                                                     | Published RSC remote-code-execution and subsequent advisories affect baseline                  | Upgrade within supported Next 15 patch line, align React/Auth.js and lint config; install and audit actual lock                 | Frozen clean install, security audit, lint/typecheck/build; current official advisories          |
| BOOK-001 | P1       | `accepted-booking/route.js:24,42`; `queries/bookings.js:21`; no unique indexes in either booking model      | Concurrent accepts can duplicate; copy/delete can diverge; delete key omits time and record ID | Atomic booking state changes or transaction; unique provider/slot reservation and idempotency; preserve history                 | Dedicated DB concurrent accepts/creates, failure injection and restart persistence               |

## Additional prioritized findings

| ID        | Severity | File/evidence                                                                                              | Problem / impact                                                                                                | Recommended fix                                                                                                   | Verification                                                         |
| --------- | -------- | ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| AUTH-001  | P1       | `model/user-model.js`; `auth.js`; queries use session email                                                | Duplicate usernames/emails allowed; email is an unsafe authorization key without uniqueness/verification        | Stable DB ID in signed session; unique identity indexes with duplicate-data preflight; do not auto-merge accounts | Duplicate registration and cross-account tests; migration preflight  |
| AUTH-002  | P1       | `auth.js`, registration route                                                                              | No rate limiting; bcrypt cost 5; credential fields unvalidated                                                  | Validate credentials; persistent bounded throttles and stronger new hashes                                        | Rate-limit, malformed input and login tests                          |
| AUTH-003  | P1       | GitHub provider, `SocialSignIn.jsx`                                                                        | OAuth does not persist application profile; Google button references unconfigured provider                      | Complete account onboarding safely or explicitly disable unsupported OAuth                                        | Provider callback and missing-profile tests                          |
| DB-001    | P1       | `app/layout.js:15`; `lib/mongo.js`                                                                         | Every public page connects to DB; missing URI becomes literal `undefined`; failures can expose details          | Lazy explicit connections, timeout, safe errors; build without DB credentials                                     | Offline-DB public-page smoke, connection-retry tests                 |
| BOOK-002  | P1       | booking API only checks workers.length; Booking.jsx validates time only in browser                         | No runtime validation, availability, date bounds, timezone, ownership, idempotency                              | Shared runtime schemas, explicit service timezone, DB constraints, request key                                    | Invalid/past/malformed/replayed booking tests                        |
| BOOK-003  | P1       | reject API calls deleteBooking; provider UI exposes same queue to all                                      | One provider deletes request for every provider/customer                                                        | Provider-specific decline or authorized status transition, retain audit history                                   | Two-provider decline/accept tests                                    |
| BOOK-004  | P1       | CustomerBookings/EmployeeOrders infer Completed from date                                                  | Status is invented from elapsed day; cannot track real completion/cancellation                                  | Persist and validate state transitions                                                                            | Transition matrix and UI tests                                       |
| CAT-001   | P1       | SignUpEmployee service list vs `data/homeservices.js`                                                      | MassageTherapist vs MassageTherapy, ApplianceRepairTechnician vs ApplianceRepair; inconsistent offered services | Single shared catalog, migration aliases for existing records                                                     | Every selectable service can register/book                           |
| UI-001    | P1       | SignUpEmployee.jsx:93                                                                                      | Fetch Response has no error.message; masks actual registration failure                                          | Parse response JSON and show safe actionable error                                                                | Failed registration UI test                                          |
| UI-002    | P1       | DashboardCustomer dereferences user.email; EmployeeOrders user.service                                     | Authenticated OAuth/deleted account can crash pages                                                             | Server account guard and missing-account state                                                                    | Missing DB profile test                                              |
| API-001   | P2       | `/api/me`, `/api/user`, mutations                                                                          | Inconsistent response shape; me returns 500 for unauthenticated; raw error.message leakage                      | Central safe HTTP error contract (400/401/403/404/409/429/503/500)                                                | Route response tests                                                 |
| DB-002    | P2       | all query modules                                                                                          | Unbounded reads and no query indexes; accepted query swallows DB errors as empty list                           | Cursor pagination/indexes; distinguish outage from empty state                                                    | Explain/query tests and failure injection                            |
| BUILD-001 | P2       | service `[name]/page.js` synchronously accesses params                                                     | Next 15 asynchronous request API migration needed                                                               | Await params                                                                                                      | Production build and service detail smoke                            |
| BUILD-002 | P2       | tsconfig include mostly TS, strict false; no checkJs                                                       | Current tsc would not validate most JS; duplicate jsconfig and nested fixit config                              | Explicit scoped checkJs/JSDoc or gradual TS plan; remove redundant config deliberately                            | Typecheck meaningful source coverage                                 |
| UI-003    | P3       | dashboard quick links `/contact`, `/profile_cu/jkl`, provider def/ghi/jkl; MainHome chat button            | Broken links and inert advertised controls                                                                      | Wire supported actions, remove placeholders                                                                       | Route/link browser sweep                                             |
| UI-004    | P2       | ServiceList overlay opacity-0 until hover; SplashScreen click-only div                                     | Touch/keyboard cannot reliably discover services/enter landing page                                             | Always-visible labels, keyboard controls, remove blocking splash                                                  | Mobile and keyboard E2E                                              |
| PERF-001  | P2       | next.config unoptimized; MainHome carousel; public asset sizes                                             | Largest video 31,992,523 bytes; other videos 20,766,196 and 18,643,222 bytes; animation and downloads add load  | Measure waterfall/bundle first; defer videos, optimize assets and image delivery                                  | Record build size, transfer and LCP before/after; no invented scores |
| MAINT-001 | P2       | Header.jsx unused async client component importing server auth; commented signup duplicate; unused imports | Dead/broken alternatives create maintenance risk and lint failures                                              | Remove confirmed dead code or consolidate with active navbar                                                      | Import search and lint                                               |
| DOC-001   | P1       | no license; fork identical to upstream                                                                     | Permission/provenance unresolved; README overstates secure validation                                           | Preserve attribution and document actual changes; seek upstream license clarification                             | Source comparison and permission evidence                            |
| DOC-002   | P3       | README/UI claims #1 platform, verified experts/guarantees                                                  | Unsupported claims; README inaccurately says services stored in DB                                              | Truthful demo descriptions and limitations                                                                        | Compare documentation against implemented behavior                   |
| OPS-001   | P1       | no tests/CI/health route/.env.example; render.yaml uses unfrozen install                                   | No reproducible quality gates or production verification                                                        | Add isolated tests, frozen install, CI, readiness check and deployment runbook                                    | Execute gates; verify public URL only after approval                 |

## Existing feature and route checklist

Static inspection is not a passing runtime test. Each row needs browser/API verification.

| Routes / feature                                               | Baseline finding                                                                                      |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `/`, `/aboutus`                                                | Landing splash, catalog links and team attribution exist; inert chat and unsupported marketing claims |
| `/homeservices`, `/homeservices/category/services`             | Static catalog; hover-only labels; invalid category handling incomplete                               |
| `/homeservices/service/[name]`                                 | Details and booking link; params migration; fake guarantees and broken contact link                   |
| `/signin`, `/signup`, `/signupCustomer`, `/signupEmployee`     | Credential forms; registration error bug and divergent service lists                                  |
| `/booking`                                                     | Date/time form and POST; client identity trusted; success says confirmed before provider accepts      |
| `/profile_cu`, `/profile_cu/my-bookings`                       | Pending and accepted views; missing-account crash; status inferred                                    |
| `/profile_em`, `/profile_em/my-orders`                         | Service queue and accepted orders; unsafe mutations and no working completion                         |
| `/navbar`, `/footer`                                           | Component implementations unnecessarily exposed as pages                                              |
| `/api/auth/[...nextauth]`                                      | Auth.js handlers; credentials supported, OAuth incomplete                                             |
| `/api/register`                                                | Hash + create, no validation/uniqueness, plaintext logging                                            |
| `/api/user`, `/api/me`                                         | Session-based reads with password exclusion; inconsistent errors                                      |
| `/api/booking`, `/api/accepted-booking`, `/api/reject-booking` | Unauthenticated writes; no safe record state management                                               |
| server actions sign-in/sign-out/social                         | Fixed redirect destinations; arbitrary social provider input; generic exception wrapping              |
| admin/profile editing/reviews/availability                     | Not implemented; no evidence requiring admin scope yet                                                |

## Previously reported issues rechecked

Tracked `.env.local`: confirmed in public Git tree (not merely assumed from local file).
Outdated Next: confirmed. Dependency incompatibility: no installed tree initially,
so compatibility must be established by install/build, not asserted. Build/lint
failure: not yet executed at baseline. Root: outer app is correct, inner folder
redundant. Missing environment: local values exist, safe example and deployment
validation missing. Booking, input validation and missing API authorization:
confirmed by code paths above.

## Sources and reproducible inspection

- [Fork metadata](https://api.github.com/repos/Nikhil1869/Fixit)
- [Upstream metadata](https://api.github.com/repos/vishalkarnati/Fixit)
- [Branch comparison](https://api.github.com/repos/vishalkarnati/Fixit/compare/master...Nikhil1869:master)
- [Next RSC advisory](https://nextjs.org/blog/CVE-2025-66478)
- [Next subsequent RSC update](https://nextjs.org/blog/security-update-2025-12-11)
- [November 2026 patch notice: 15.5.29](https://nextjs.org/blog/upcoming-nextjs-security-release-november-2026)
- [Next 15 compatibility/migration](https://nextjs.org/docs/app/guides/upgrading/version-15)

Commands: `rg --files --hidden -g '!.git' -g '!node_modules' -g '!.next'`, targeted
`Get-Content` of all source/config files, `rg -n` for auth/mutations/environment
references, `Get-ChildItem public -File | Sort-Object Length -Descending`,
`git status --short`, `git log -5 --oneline`, `git hash-object -- .env.local`,
GitHub REST metadata/tree/compare/commit requests, `node --version`, `npm --version`,
`yarn --version`, `npm view next@15 version --json`. Never run `Get-Content .env.local`
unfiltered in a shared terminal or print a diff of the removed secret file.

## Order of work and quality gates

1. Preserve history on a local repair branch. Contain secrets and logging first.
2. Establish dependency baseline, patched compatible versions and runnable checks.
3. Add server identity/validation and regression tests; then atomic booking lifecycle.
4. Complete core booking E2E before UI redesign or new domain features.
5. Measure performance, finish docs/CI and prepare deployment review.
6. Obtain explicit deployment approval; verify real hosted flows before claiming ready.

No install/build/test/performance/deployment pass is claimed by this initial report.
Production remains blocked by unresolved P0/P1 items, license clarification, and
unverified quality gates. User reports credential rotation complete; remote secret
removal/history cleanup and affected-user password response still require follow-up.

## Remediation update — 2026-11-17

The sections above preserve the initial evidence; they are not a description of
current behavior. The user confirms FIXIT is their original team project and they
are a contributor. Public deployment and relicensing explicitly await team agreement.
The original history was recovered on codex/security-audit without rewriting it.

| Finding                        | Current local result                                                                                                                  | Remaining boundary                                                            |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| SEC-001                        | Local env untracked/ignored; example added; local secret replaced; user reports both provider rotations                               | Remote/history copies and historical logs require incident follow-through     |
| SEC-002, AUTH-001, AUTH-002    | Signed immutable-ID checks, role/ownership guards, validated registration, unique identities, bcrypt cost 12 and persistent throttles | Legacy identity migration; verification/reset flows not implemented           |
| SEC-003                        | Removed credential/error logging; regression tests cover hash and logging                                                             | Historical exposed passwords require account-owner response                   |
| SEC-004                        | Patched compatible dependencies and resolved lock; full audit returned zero known advisories                                          | Reaudit at release; Auth.js v5 remains beta                                   |
| AUTH-003                       | Disabled unsupported OAuth and removed misleading buttons                                                                             | Future account-linking/onboarding design                                      |
| DB-001, API-001                | Lazy cached DB, safe errors, bounded bodies, private account guards and health endpoint                                               | Health ping does not validate migration/replica-set readiness                 |
| BOOK-001/002/003/004           | Transactions, unique active slots, idempotency, availability, provider-specific decline and explicit persisted lifecycle              | Fixed hourly visits; legacy reconciliation required                           |
| CAT-001, UI-001/002, BUILD-001 | Shared catalog, parsed form errors, server profile guards, awaited route params                                                       | Old service aliases require reviewed migration                                |
| DB-002                         | Indexed cursor-paginated private lists, safe outage responses                                                                         | Production query plans and large provider availability populations unmeasured |
| BUILD-002                      | Removed redundant configs; strict typed policy module plus Next typecheck                                                             | Full JS-to-TypeScript conversion not claimed                                  |
| UI-003/004, MAINT-001          | Real navigation/actions, accessible forms, mobile layouts; removed confirmed dead UI                                                  | Broader browser/assistive-technology review remains                           |
| PERF-001                       | Measured smaller landing JS, removed automatic video/carousel, enabled image optimization                                             | No Lighthouse/load-test claim; see PERFORMANCE.md                             |
| DOC-001/002                    | Team provenance, truthful copy, contribution/resume documentation                                                                     | Formal license and deployment terms remain pending                            |
| OPS-001                        | Isolated tests, frozen install, CI workflow, health route and deployment runbook                                                      | Hosted CI/public URL cannot be verified without approved publication          |

The current functionality checklist and executed checks are in PHASE_REPORT.md
and TESTING.md. Browser tests cover registration/login, catalog/detail/booking,
customer/provider dashboards, completion, cancellation, settings, closed schedules,
logout and mobile navigation. Integration tests cover ownership, simultaneous
requests and transaction rollback. A separate real-process restart check verifies
booking/session persistence. No production database or public host was accessed.
