# Test Screenshots: Login and Super Admin

Screenshots from the 2026-11-27 run. Numbers and explanation: [Test Results](Test-Results).
Raw files: `wiki/Testing-Results/`.

## 1. Unit tests

### Frontend (Vitest): 8 of 8 passed

![Vitest output](Testing-Results/screenshots/terminal-frontend-vitest.png)

### Backend (PHPUnit): 15 of 15 passed, 103 assertions

![PHPUnit output](Testing-Results/screenshots/terminal-backend-phpunit.png)

## 2. Coverage report

### Summary: Login.jsx 100%, SuperAdmin.jsx 56.84% lines

![Coverage summary](Testing-Results/screenshots/coverage-report-summary.png)

### Login.jsx line by line

![Login coverage](Testing-Results/screenshots/coverage-report-login-jsx.png)

## 3. SonarQube

### Dashboard, Overall Code tab: gate passed, coverage 34.6%, Reliability C

![SonarQube overall](Testing-Results/screenshots/sonarqube-01-dashboard-overall.png)

### Dashboard, New Code tab (first analysis, so nothing to compare)

![SonarQube new code](Testing-Results/screenshots/sonarqube-02-dashboard-new-code.png)

### Issues: 5 open (4 bugs, 1 code smell)

![SonarQube issues](Testing-Results/screenshots/sonarqube-03-issues.png)

### Coverage by file

![SonarQube coverage](Testing-Results/screenshots/sonarqube-04-coverage-by-file.png)

### Test measures (15 tests imported)

![SonarQube tests](Testing-Results/screenshots/sonarqube-05-tests.png)
