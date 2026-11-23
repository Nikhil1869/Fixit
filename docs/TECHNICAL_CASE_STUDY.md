# FIXIT technical case study

FIXIT is an original group project. Nikhil contributed to the frontend; Vishal and
Santosh retain their original backend and UI/UX credits. This extension was built
with Codex assistance and preserves the team's Git history. It is not a claim of
sole authorship. See [contributions](../CONTRIBUTIONS.md).

## Problem and engineering decisions

The original booking flow copied pending requests into an assignment collection
then deleted the source. Concurrent actions could duplicate assignments or lose
history. Mutation routes trusted callers, and registration logged passwords.

The repair kept Next.js, Auth.js and MongoDB, preserving the static service catalog
and two booking collections. Signed immutable account IDs now define ownership;
runtime schemas validate input; new passwords use bcrypt cost 12. Authentication
is distinct from authorization: every operation reloads the account and verifies
its role and relationship to the booking.

A customer request is pending, not a reservation. Provider acceptance atomically
changes its status/history and inserts an assignment. A unique booking ID settles
competing providers; a partial unique provider/date/time index settles competing
active appointments. A conflict rolls back both writes. Request UUIDs make retries
idempotent, and provider-specific decline preserves the customer's request.

Fixed one-hour, hourly-aligned visits make an exact-slot constraint adequate for
this model. Variable durations, travel buffers and geographic matching need a
new reservation model. Explicit status transitions replace inferred completion.
Changing availability serializes against acceptance, without cancelling existing jobs.

## Evidence and release review

The original 45 unit/integration tests were reproduced. Four added release tests
verify deleted-account rejection and that the preflight's index requirements match
actual models and reject unsafe index definitions. The current suite has 49 cases.
Tests run real MongoDB transactions/indexes with disposable data. Browser tests
use real credentials and cover the full lifecycle, settings, mobile layout and
accessibility semantics. See the final release report for executed browser results,
key rotation/restart evidence and limits; do not infer production verification.

The read-only migration preflight now detects legacy identity, ownership, status,
service-alias, slot and index problems. Synthetic dirty/compatible replica-set
fixtures and an unsupported standalone fixture verify its behavior. Before/after
snapshots confirm it leaves documents and indexes unchanged. Real legacy migration
remains pending, because an approved staging copy has not been supplied.

A fresh full dependency audit found an unresolved Picomatch advisory in development
tooling, despite an earlier clean result. The report preserves both timestamps,
keeps the full CI gate failing, and does not present runtime-only cleanliness as
full dependency remediation. This is a release decision based on current evidence.

The landing page's Next build estimate moved from 172 kB in the first patched
build to 113 kB after component/media cleanup. This is a bundle measurement, not
an invented Lighthouse score, latency reduction or production-user metric.

## Three resume bullets

Use only after reviewing and understanding the AI-assisted implementation:

- Extended a team-built Next.js/MongoDB service platform with server-verified
  ownership, Zod validation, bcrypt hashing and persistent rate limits, supported
  by authorization and concurrency regression tests.
- Implemented idempotent booking requests, transactional provider assignment,
  database-enforced active slots, weekly availability and persisted lifecycle history.
- Built isolated database/browser verification and a read-only migration preflight
  that detects legacy ownership, status, service and index incompatibilities;
  documented release blockers and configured CI without claiming deployment.

[Final readiness evidence and remaining blockers](FINAL_RELEASE_READINESS.md).
