# Testing Results folder

Raw evidence for the Login and Super Admin test run of **2026-11-27**. The readable summary is
[Test Results](../Test-Results.md); how to write the tests is [Writing Test Cases](../Writing-Test-Cases.md).

| Path | What it is | Produced by |
|------|------------|-------------|
| `unit-tests/frontend-junit.xml` | JUnit XML for the 8 Vitest tests | `vitest --reporter=junit` |
| `unit-tests/frontend-vitest-output.txt` | Console output of the Vitest run, with coverage table | `vitest run --coverage` |
| `unit-tests/backend-junit.xml` | JUnit XML for the 15 PHPUnit tests (also imported by SonarQube) | `phpunit --log-junit` |
| `unit-tests/backend-phpunit-output.txt` | PHPUnit `--testdox` output | `phpunit --testdox` |
| `coverage/` | HTML and lcov coverage report for `Login.jsx` and `SuperAdmin.jsx` (open `index.html`) | `vitest --coverage` (v8) |
| `sonarqube/scanner-output.txt` | Full SonarScanner log | `sonar-scanner` |
| `sonarqube/quality-gate.json` | Quality gate status | SonarQube Web API |
| `sonarqube/project-measures.json` | Project-level metrics (coverage, bugs, ratings, tests) | SonarQube Web API |
| `sonarqube/file-measures.json` | Per-file metrics | SonarQube Web API |
| `sonarqube/issues.json` | The 5 open issues (author e-mails redacted) | SonarQube Web API |
| `sonarqube/security-hotspots.json` | Security hotspots (none) | SonarQube Web API |
| `sonarqube/analysis-history.json` | The two analysis runs and their warnings | SonarQube Web API |
| `screenshots/` | PNG screenshots used by the results page | Microsoft Edge, headless |

## Notes on the screenshots

* `terminal-*.png` are the console output files above, rendered as an image so they read like a terminal.
* `coverage-report-*.png` are screenshots of the real HTML coverage report in `coverage/`.
* `sonarqube-*.png` are screenshots of the live SonarQube pages for project `aspire-super-admin-login`.

## Re-running

See section 7 of [Test Results](../Test-Results.md). Do not commit SonarQube tokens or admin passwords.
