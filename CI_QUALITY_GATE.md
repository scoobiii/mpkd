# CI quality gate

The repository CI enforces these gates on main and pull requests:

- TypeScript typecheck (`npm run lint`)
- automated tests
- V8 coverage thresholds of 100% for lines, functions, branches, and statements in the current VUC verification-core scope
- production build
- coverage report artifact

A change that reduces covered behavior below the threshold fails CI.

Coverage scope is intentionally explicit and expands as executable tests are added to the remaining production modules.


## Performance smoke gate

Pull requests and pushes to `main` also run a k6 performance smoke scenario against the application health endpoint.

The current baseline is intentionally small and deterministic:

- 10 virtual users
- 30 seconds
- HTTP error rate < 1%
- p95 latency < 300 ms
- p99 latency < 800 ms

This is a performance regression smoke test, not a capacity benchmark. Thresholds should be tightened or expanded only when representative workloads and service-level objectives are defined.
