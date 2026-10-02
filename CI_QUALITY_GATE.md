# CI quality gate

The repository CI enforces these gates on main and pull requests:

- TypeScript typecheck (`npm run lint`)
- automated tests
- V8 coverage thresholds of 100% for lines, functions, branches, and statements in the current VUC verification-core scope
- production build
- coverage report artifact

A change that reduces covered behavior below the threshold fails CI.

Coverage scope is intentionally explicit and expands as executable tests are added to the remaining production modules.
