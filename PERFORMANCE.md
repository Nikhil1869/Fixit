# Measured performance and limits

Measurements are local Next.js production build reports on Windows, Node 24.16.0,
Yarn 1.22.22 and Next.js 15.5.29. They describe first-load JavaScript estimates,
not request latency, Core Web Vitals or real-user performance.

| Build stage                                               | Landing first-load JS | Service detail first-load JS | Shared JS |
| --------------------------------------------------------- | --------------------- | ---------------------------- | --------- |
| First security-patched build, before UI modernization     | 172 kB                | 171 kB                       | 103 kB    |
| Refreshed dependencies / removed unused animation imports | 166 kB                | 112 kB                       | 103 kB    |
| Final responsive UI build                                 | 113 kB                | 113 kB                       | 103 kB    |

The initial insecure checkout was not executed to produce a performance baseline.
The earliest comparison above is the first patched build. Final build completed
successfully in 150.53 seconds on this machine; build time is not a user-facing
speed metric. Local logs: artifacts/build.log and artifacts/build-final.log;
intermediate logs are ignored verification artifacts, not repository assets.

The landing page is now primarily a server component. Removing the animated
carousel/splash and unused animation dependency reduces browser JavaScript. The
site no longer automatically downloads the original 20–32 MB background videos.
Those team assets remain in public/; they were not destructively removed.
Images use Next.js optimization and explicit sizing. Service cards remain a small
interactive client boundary for search/filter behavior.

Private booking lists fetch 20 rows plus one cursor sentinel and have matching
customer/provider/service indexes. MongoDB connections are cached per server
instance. Public pages no longer require a database connection for anonymous
rendering. Private data and live availability are not publicly cached.

## Remaining measurement work

- No Lighthouse, LCP, INP, throughput or query-explain speedup is claimed.
- Availability currently reads all providers for one service/date; measure realistic
  population sizes before introducing aggregation, cache invalidation or capacity buckets.
- No artificial user-count or scale claim is justified by the small isolated fixtures.
- After approved staging deployment, measure the real network/image waterfall and
  database explain plans, then optimize observed bottlenecks. Keep private responses uncached.
