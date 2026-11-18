## Problem and resulting behavior

The original team application trusted caller identity in booking mutations, logged
registration passwords and used non-atomic booking acceptance. This branch preserves
team history/credits while adding authenticated ownership, validated idempotent
requests, transactional active-slot assignment, persisted lifecycle/availability
and responsive account workflows.

Release verification adds read-only legacy-data preflight checks and synthetic
staging fixtures, index compatibility/deleted-account tests, key-rotation checks
and cross-browser keyboard/accessibility regressions. See docs/FINAL_RELEASE_READINESS.md
for actual executed results and current blockers; original implementation is credited
in CONTRIBUTIONS.md.

## Release blockers

- Full dependency audit fails on GHSA-fc5q-39xc-vjpf in development tools; no patched
  upstream version was available at review. Runtime-only audit is clean.
- Provider-side rotation/session evidence, historical password-log response,
  real legacy migration, hosted CI, team publication agreement and approved
  deployment remain outstanding.
- Actual Safari and spoken assistive-technology review remain unexecuted.

This is a draft technical review, not approval to publish a demo, relicense,
rewrite history, force push or migrate production. Never paste the historical
env-file deletion values into this description or review comments.
