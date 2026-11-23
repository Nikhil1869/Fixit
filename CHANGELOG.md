# Changelog

## Unreleased — final readiness verification, 2026-11-18

- Extended read-only preflight to identities, ownership, status/history, service aliases,
  hourly alignment, 13 indexes and transaction topology; validated only synthetic staging.
- Added index compatibility/deleted-account regressions (49 unit/integration cases total).
- Repaired provider tab keyboard semantics; ran Chrome/Chromium/Firefox/WebKit workflows
  and focused forms/header checks, with explicit WebKit/Safari/screen-reader limits.
- Verified session persistence and old-cookie rejection after a disposable signing-key rotation.
- Expanded CI browser/migration/full-audit gates and wrote the final release/incident/rollback
  runbook, draft PR text and technical case study. Full audit remains failed on an unpatched
  development-tool advisory; production, provider verification and real migration remain pending.

## Unreleased — technical makeover, 2026-11-17

- Preserved original group-project history, team credits and contribution boundaries.
- Audited and contained exposed environment configuration and plaintext password logging.
  User reports provider-side credential rotation; remote/history/log cleanup remains pending.
- Upgraded compatible Next/React/Auth.js/Mongoose versions and refreshed the lockfile.
- Added server authorization, validation, safe errors, request limits and shared throttles.
- Added idempotent requests, transactional acceptance and unique active one-hour slots.
- Added weekly availability, customer/provider cancellation rules, service start/completion
  and persistent status history. Decline no longer deletes a customer's request.
- Added private cursor pagination, redacted provider queues and profile/settings updates.
- Redesigned responsive public/auth/account pages while retaining the catalog/team content.
  Removed unused animation packages, blocking splash, autoplay video and placeholder controls.
- Added isolated integration/concurrency tests, browser workflows, accessibility checks,
  strict typing for booking policy, CI and deployment/migration documentation.

No production migration or deployment is claimed. Publication/relicensing await team approval.

# 2026-11-18 — Groq generative assistant

- Added responsive session-only chat, follow-up context, accessible modal controls,
  retry/clear states and explicit unconfigured behavior.
- Added `/api/chat` with the official OpenAI-compatible SDK restricted to Groq,
  reviewed model IDs, Free-plan attestation and no live/paid fallback.
- Grounded service links, aggregate slots and opt-in customer booking summaries in
  existing catalog and authorized read APIs; no booking mutations are exposed.
- Added shared request/token budgets, concurrency lease, provider cooldowns,
  bounded context/output, timeouts, safe errors/rendering and mocked regression tests.
- Documented setup, privacy, current Free-plan quota references and 18 manual prompts.
  Live model verification is pending and no deployment/push was performed.
- Fixed a reproduced cold-start model initialization failure by bounding MongoDB
  command buffering at five seconds; added a regression and reran restart checks.
