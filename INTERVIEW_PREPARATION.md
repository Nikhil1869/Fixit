# Interview preparation

FIXIT is Nikhil's original group project, extended here with Codex assistance.
Review and understand this work before using these statements. Preserve team
attribution; do not claim sole authorship, production users, revenue or deployment.

## Two-line project description

Extended FIXIT, a team-built Next.js/MongoDB service platform, with authenticated
booking workflows, provider availability and a persisted service lifecycle.
Improved concurrency safety with transactions and unique indexes, supported by
isolated integration tests, browser workflows and CI configuration.

## Three resume bullets

- Hardened customer/provider workflows with Auth.js session-based authorization,
  Zod validation, bcrypt hashing and MongoDB-backed rate limits; removed credential
  logging and prevented client identity spoofing.
- Implemented idempotent booking creation, transactional provider assignment and
  unique active-slot constraints, plus availability, cancellation and status history.
- Added Vitest database concurrency/ownership tests, Playwright login-to-completion
  workflows and accessibility checks; configured reproducible CI gates and
  documented security, migration and deployment procedures.

## Technology stack

Next.js 15, React 19, JavaScript, TypeScript domain logic, Tailwind, Auth.js v5 beta,
MongoDB/Mongoose, Zod, bcryptjs, Vitest, Playwright, axe-core, Yarn Classic and
GitHub Actions configuration. Vercel/Atlas are prepared options, not verified
production results.

## 60-second explanation

“FIXIT began as our team service-booking project; I contributed to its frontend.
This extension focuses on making the workflow reliable from registration through
service completion. The audit found exposed configuration, password logging and
booking APIs that trusted callers. The repair derives identity from signed
sessions, validates requests and enforces ownership on the server. The hardest
part was concurrency: two providers accepting a request or competing requests
claiming one provider's slot. MongoDB transactions keep bookings and assignments
consistent, while unique indexes decide which concurrent write succeeds. I added
weekly availability, explicit history, settings and responsive screens, then
verified them with isolated database tests and real-login browser workflows.
The work is AI-assisted and documented separately from our original team code.
Public deployment awaits team agreement and a reviewed legacy-data migration.”

## Detailed technical walkthrough

1. **Identity.** Auth.js validates bounded credentials, applies an account throttle
   and compares bcrypt hashes. Signed sessions carry immutable account IDs.
   Private routes reload the account and derive permissions from stored data.
2. **Input.** Zod validates catalog service, date, hourly start and request UUID.
   Contact snapshots come from the signed account. Availability returns aggregate
   free capacity; it does not expose provider identities.
3. **Retries.** A customerId/requestId unique index prevents concurrent duplicates.
   A changed payload with the same UUID is a conflict. Validation precedes lookup,
   so an old replay with a past date can fail.
4. **Acceptance.** A transaction conditionally changes a matching pending request
   and inserts an assignment. Unique bookingId prevents two assignments; partial
   unique employeeId/date/time protects active reservations. Conflicts roll back
   both state and history. Touching scheduleVersion serializes schedule edits
   against acceptance, which rechecks current hours.
5. **Lifecycle.** Typed rules allow explicit status transitions. Accepted customer
   cancellation requires two hours' notice. Completion/cancellation releases the
   reservation in the same transaction. Decline affects one provider and does not
   delete customer history. Providers may explicitly start a visit early.
6. **Verification.** Integration tests mock only session identity and use real
   MongoDB indexes and transactions. Browser tests use real login. A restart test
   launches two successive Next.js processes against the same temporary database
   and signing secret, then checks the persisted booking through the signed session.
7. **Limits.** Exact-start uniqueness prevents overlap because all visits are one
   hour and start on the hour. Variable durations need a different reservation
   model. Legacy migration needs verified ownership mapping. CI on GitHub and
   the actual public deployment remain separate gates.

## Five difficult questions

1. **Why both transactions and unique indexes?** Transactions keep two collections
   and history consistent. Unique indexes arbitrate concurrent writers. A frontend
   check or application find-then-insert cannot provide both guarantees.
2. **Can customers submit competing requests?** Yes. Pending requests express
   interest; they are not reservations. Acceptance is the exclusive claim. The UI
   keeps a request pending until a provider successfully claims the slot.
3. **Why not email ownership?** Original accounts could share emails, and emails
   were unverified. Signed immutable IDs prevent contact changes or duplicates
   from exposing another account's history. Legacy ownership must be reviewed.
4. **Does deleting an env file fix exposure?** No. Copies and history survive.
   Provider-side rotation, signing-key replacement and historical password-log
   response are separate. Rotation was user-confirmed; history was not rewritten.
5. **What is required before launch?** Team publication agreement, incident
   follow-through, staging migration and index verification, hosted CI, broader
   browser/accessibility checks, then an approved deployment and real HTTPS
   workflow/rollback tests. Do not put an unverified live URL on a resume.
