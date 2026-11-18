# Database and booking consistency

Use MongoDB Atlas or a local MongoDB replica set. Transactions require a replica
set or sharded cluster. No production database was connected or modified.

| Collection       | Purpose                                                                 | Constraints/indexes                                                                          |
| ---------------- | ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| users            | Credential identity, contact data, provider service and weekly schedule | Unique username/email; service lookup index; password excluded by default                    |
| bookings         | Request, immutable customer/provider IDs, status, event history         | Unique customerId/requestId; customer/provider cursor indexes; service/status queue index    |
| acceptedbookings | Assigned contact snapshot and reservation state                         | Unique bookingId; unique active employeeId/date/time; service/date/active availability index |
| ratelimits       | Shared fixed-window counters                                            | Unique hashed bucket key; TTL cleanup                                                        |

All visits have a fixed 60-minute duration and start on the hour in Asia/Kolkata.
The calendar date is stored as UTC midnight plus HH:mm; policy functions combine
these with +05:30. End-hour is exclusive. Registration explicitly advertises initial
09:00–17:00 daily hours; providers can close days or change whole-hour windows in
Settings. Closing a day prevents new acceptance, but does not cancel existing jobs.

Requests are not reservations until accepted. Customers see current aggregate
availability, but another provider/customer action may change it. Creation checks
availability; acceptance rechecks the provider's schedule and relies on the database
constraint. Since starts are hourly and duration is always 60 minutes, unique active
provider/date/time prevents overlapping active visits in this model. Variable
durations, buffers and travel time would need a different reservation strategy.

Creation is idempotent per customerId/requestId; a changed payload with the same
UUID is a conflict. A transaction changes pending to accepted, assigns providerId,
appends history and inserts the reservation. A losing unique-index conflict rolls
back every write. Same-provider acceptance retries do not duplicate records.
Decline records only that provider's decision and preserves the customer's request.

| Actor             | Allowed transition      | Rule                                                      |
| ----------------- | ----------------------- | --------------------------------------------------------- |
| Matching provider | pending → accepted      | Available schedule, unclaimed request, unique active slot |
| Customer owner    | pending → cancelled     | Before scheduled start                                    |
| Customer owner    | accepted → cancelled    | At least two hours before scheduled start                 |
| Assigned provider | accepted → in_progress  | Explicit provider action; early starts are permitted      |
| Assigned provider | in_progress → completed | Explicit provider action, never inferred from the date    |
| Assigned provider | accepted → cancelled    | Explicit provider cancellation                            |

Cancellation/completion updates request history and reservation active=false in one
transaction. Slots are released; history remains. Terminal states cannot reopen.
Repeated same-target requests are idempotent for the authorized actor.

## Mandatory legacy-data migration before live rollout

The old application used email/name keys and allowed duplicate identities. New
queries deliberately do not expose legacy records solely by matching emails.
Legacy data remains intact but may not appear until ownership is verified.
Do not deploy this code over an existing database without migration.

1. Back up the old database and restore a dedicated staging copy.
2. Run the read-only preflight with a private staging-only environment file:
   `node --env-file=.env.staging.local scripts/migration-preflight.mjs`.
   Set `MIGRATION_PREFLIGHT_TARGET=staging` in that file along with the staging URI.
   It prints counts/index checks, no identities; it creates no documents or indexes.
   Exit 0 means all checks passed, 2 means reviewable data/index/topology blockers,
   and 1 means configuration/read failure. Do not mistake successful execution for
   passing readiness. `yarn test:migration` uses only disposable synthetic staging
   fixtures and verifies the audit itself is read-only. See docs/FINAL_RELEASE_READINESS.md.
3. Resolve duplicate usernames and normalized emails with the team/account owners.
   Do not automatically merge accounts. User.init fails closed if unique indexes fail.
4. Map verified customer/provider IDs and source booking IDs. Normalize reviewed
   catalog aliases: MassageTherapist → MassageTherapy and
   ApplianceRepairTechnician → ApplianceRepair. Investigate unknown services.
5. Reconcile duplicate assignments, histories, statuses and existing time conflicts.
   Old non-hour-aligned appointments must be reconciled explicitly, not silently rounded.
6. Populate schedule, providerId, status/history and active flags. Mark active only
   for accepted/in-progress reservations; honor existing accepted appointments.
7. Review existing indexes. The first repair used an unconditional provider/date/time
   unique index; replace it with unique_active_provider_slot_v2 only after staging
   reconciliation. Do not run syncIndexes blindly against production.
8. Verify counts, history, ownership, indexes, rollback and all tests on staging.
   Obtain separate approval for the production migration.

The preflight is tooling, not proof that migration happened. No data-deleting or
automatic ownership-assignment script was run.
