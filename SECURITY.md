# Security and incident response

Local security fixes are verified in PHASE_REPORT.md. Production and incident
follow-through remain separate gates; see DEVELOPMENT_AUDIT.md for the original
findings and their remediation status.

The latest security and provider-verification status is in
[FINAL_RELEASE_READINESS.md](docs/FINAL_RELEASE_READINESS.md). A local key-rotation
test is separate from proof that every deployed instance uses the replacement key.
The 2026-11-18 full audit reports GHSA-fc5q-39xc-vjpf in development tooling;
the production-dependency-only audit is clean. No audit failure is suppressed.

## Exposed credentials (2026-11-16)

The public fork and upstream contain `.env.local`. The local copy matched its
public Git blob. It contained MongoDB credentials and an Auth.js signing secret.
No secret values are included here. The user reports rotating both credentials;
provider-side revocation was not independently verified.

1. In MongoDB Atlas, Database Access, rotate/remove the exposed database user's
   password and give the replacement only the required database permissions.
   Review Atlas access/network settings and access logs. Update the URI privately
   in your hosting dashboard. Verify the old credential is rejected yourself.
2. Replace AUTH_SECRET in every hosting environment with a new cryptographically
   random secret. Remove old fallback secrets and restart/redeploy instances to
   invalidate JWT cookies signed with the old value. Do not paste it into chat.
3. Review application log retention/access: the original registration route logged
   plaintext passwords. Restrict access, remove exposed logs according to your
   incident process, and require password changes for affected accounts. Rotating
   MongoDB/Auth.js secrets does not repair exposed customer passwords.
4. The local file was replaced with a localhost database URI and a fresh random
   development secret. This does not update hosting and must not be reused there.
5. Review and publish the staged removal of `.env.local` through a normal PR.
   Local untracking does not remove it from the remote branch or previous commits.

## History cleanup

Rotation is mandatory even if history is later cleaned. A normal removal commit
prevents future accidental exposure but leaves older objects. A coordinated
`git filter-repo` cleanup can remove the path from history, followed by an approved
force push, collaborator re-clones and GitHub cache/pull-request cleanup requests.
Forks/copies may retain it. No history rewrite, force push or remote update has
been performed. Obtain explicit approval and coordinate with upstream first.

Do not display `git diff --cached` without excluding `.env.local`: the deletion
diff contains the old credentials. Use `git diff --cached --stat` for inspection.
Never commit local `.env*` files; only `.env.example` is allowed.

## Runtime rules

- Derive identity from the signed session and database, never request-body roles.
- Validate input before querying; do not send raw database exceptions to clients.
- Keep deployment secrets in hosting settings. Use a separate local/test database.
- Auth.js supplies HttpOnly/SameSite cookies and CSRF checks for auth actions.
  Application JSON mutation routes additionally require same-origin requests.
- Only trust forwarded Host/IP headers when the deployment proxy sanitizes them.
- No public demo should be called secure until remaining audit gates are verified.

Report suspected issues privately to the repository maintainer; do not include
secrets, personal customer data or exploit payloads in public issues.

# Chatbot security addition — 2026-11-18

The Groq assistant is read-only. Server auth and existing owned-booking reads are
enforced independently of prompts. Model tools cannot mutate bookings or execute
arbitrary queries/code. Opt-in summaries exclude IDs and contact details. User text
and summaries are sent externally; avoid secrets and review provider data controls.
React escapes output, with only server-created links rendered. Session chat is not
persisted or logged. Shared MongoDB request/token budgets, a singleton lease, quota
cooldowns and no automatic retries/fallback constrain abuse. Configuration accepts
only Groq's fixed HTTPS endpoint and reviewed model IDs, plus a manual Free-plan
attestation. The attestation does not independently prove the account's billing tier.

No live requests were authorized or executed. No actual API key was added, and
existing `.env.local` settings were not edited. CI uses mocks and clears Groq keys
in browser/restart harnesses. Existing credential-incident and deployment blockers
remain. See [chatbot security boundaries](docs/CHATBOT_ARCHITECTURE.md) and
[verification guide](docs/CHATBOT_SETUP.md).
