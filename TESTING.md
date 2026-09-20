# Regression testing

Run the full safe regression suite from the repository root:

```bash
./scripts/regression_test.sh
```

It does not start the application, connect to PostgreSQL, or modify business data. It runs backend business-rule tests with mocked repositories, Help guide integrity checks, and a production frontend build.

The same command runs automatically on every GitHub push and pull request through [the regression workflow](.github/workflows/regression.yml). Keep it passing before merge or deployment.

## Required checks for every change

| Change | Required check |
|---|---|
| Backend service, scheduler, security, controller, DTO, entity, or migration | `./scripts/regression_test.sh` |
| Frontend page, component, API client, styles, or Help handbook | `./scripts/regression_test.sh` |
| Dependency or build configuration | `./scripts/regression_test.sh` |
| Bug fix | Add or update a test that fails before the fix, then run the full suite. |

For fast feedback during backend work, run the relevant class first, then the full suite:

```bash
mvn test -Dtest=PaymentServiceTest
mvn test -Dtest=BillingSchedulerTest
./scripts/regression_test.sh
```

## Test design rules

- Every billing, payment, authorization, account-status, or scheduler bug must get a regression test.
- Tests use synthetic objects or an isolated test database; never the normal development or production database.
- Tests assert business outcomes, not only a successful HTTP status.
- Time-sensitive rules explicitly use IST and cover grace-period boundaries.
- Database-backed API tests must use a disposable PostgreSQL environment such as Testcontainers.

The initial suite covers payment progression, manual-override validation, pack lookup, employee area access, billing scheduler transitions, closed-account protection, scheduled deactivation, Help guide integrity, and frontend compilation. Next coverage should add isolated PostgreSQL-backed API tests for authentication/session invalidation, customer enrollment, reports/exports, and organisation management.
