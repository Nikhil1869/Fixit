# Deployment preparation (not deployed)

Use the current [release runbook](docs/FINAL_RELEASE_READINESS.md) for exact
review/PR/CI/staging/HTTPS/smoke/rollback steps and current blockers. The full audit
now reports an unresolved development-tool advisory; the older clean result below
is historical. No release gate has been waived.

No remote change, database migration or deployment has been performed. No public
demo has been verified during this work. The original README's Render URL is an
upstream link, not evidence of this branch being deployed.

Before publication: obtain the team's publication agreement, migrate legacy records
safely, recheck dependency advisories and quality gates, confirm old
MongoDB/Auth.js secrets are revoked and review exposed registration logs. The user
reported rotating the two secrets. See SECURITY.md and DATABASE_DESIGN.md.

The user confirms they are an original team contributor and explicitly keeps
public deployment and relicensing pending team confirmation. Local development
is authorized. No further permission is needed for the local checks in TESTING.md.
The local full dependency audit on 2026-11-17 returned zero known advisories;
this does not replace checking the release that will actually be deployed.

## Local setup in Windows PowerShell

Use Node 24 LTS and the outer app folder:

```powershell
Set-Location 'C:\Users\HP\Downloads\Fixit-master\Fixit-master'
corepack enable
corepack prepare yarn@1.22.22 --activate
yarn install --frozen-lockfile
# Only on a fresh checkout; do not overwrite an already configured private file.
Copy-Item .env.example .env.local
notepad .env.local
yarn dev
```

Set MONGODB_URI privately to a **development replica set**. The example localhost
URI is a placeholder; a standalone local server will not support acceptance.
Use a dedicated Atlas development database or run MongoDB with `--replSet rs0`
and initialize it with `rs.initiate()` in mongosh. Never point local tests at the
production database. `yarn test` and `yarn test:e2e` create their own isolated
temporary replica sets and ignore user database credentials.

Generate a secret directly into your local file, without printing its value:

```powershell
$devSecret = [Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(48))
$envLines = Get-Content -LiteralPath .env.local
$envLines = $envLines -replace '^AUTH_SECRET=.*$', "AUTH_SECRET=$devSecret"
[System.IO.File]::WriteAllLines((Join-Path (Get-Location) '.env.local'), $envLines)
Remove-Variable devSecret,envLines
```

The repair already generated a new development-only secret locally. Configure your
own development database before manually using that file. Do not share it.

## Vercel + MongoDB Atlas

1. After reviewing this branch, request approval to push/publish it. This task does
   not authorize a push or deployment. Connect the repository in Vercel's dashboard.
2. Select framework Next.js; root directory is the repository root, **not `fixit/`**.
   Node 24; install `yarn install --frozen-lockfile`; build `yarn build`.
3. Use a separate Atlas database with TLS, least-privilege database user, appropriate
   network restrictions and backups. Ensure transactions and index creation work.
4. Add environment variables in the dashboard, separately per preview/production:

| Variable        | Required value                                                        |
| --------------- | --------------------------------------------------------------------- |
| MONGODB_URI     | Private Atlas URI; URL-encode credentials; never NEXT_PUBLIC-prefixed |
| AUTH_SECRET     | Unique cryptographically random secret, at least 32 characters        |
| AUTH_URL        | Exact HTTPS canonical deployment origin                               |
| AUTH_TRUST_HOST | `true` only when trusted hosting/proxy sanitizes Host headers         |

5. Credentials login is enabled. OAuth is disabled; no OAuth callbacks need to be
   configured. If implemented later, configure the provider's callback explicitly
   as `https://your-domain/api/auth/callback/github` and verify account linking.
6. With explicit approval, deploy. Confirm `/api/health` returns 200, then use test
   accounts to register, sign in/out, book, accept as provider and inspect customer
   history. Also complete/cancel visits, change availability and edit profiles.
   Check mobile navigation and cross-account denial on the real host. The health
   endpoint verifies database connectivity, not migration readiness or transactions;
   acceptance tests must verify those separately before opening registration.
7. Verify HTTPS, cookies, DB persistence across a redeploy, rate limits, safe outage
   behavior and rollback. Record the verified URL and date in README only then.

Preview builds must not use production secrets or databases. Never supply production
secrets to fork pull-request CI. GitHub Actions only runs local fixtures and has no
deployment step. Required status checks must pass before approving publication.

## Existing Render alternative

Render's existing node service remains viable with the same replica-set requirements.
Use Node 24, frozen Yarn install/build, `yarn start`, dashboard secrets and `/api/health`.
Do not rely on a local disk for MongoDB persistence. Update AUTH_URL to the exact
Render/custom HTTPS origin. Hosting costs and current plans must be checked in the
provider dashboard; none are assumed or claimed here.
