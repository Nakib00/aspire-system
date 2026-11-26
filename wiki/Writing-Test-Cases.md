# Writing Test Cases (Super Admin and Login)

**Written for:** team members who are new to automated testing and need to add or change a test.
This page explains *how* to write a test in this project, walks through the real test code for the
**Login** and **Super Admin** parts, and describes the process we follow. The results are in
[Testing Results](Test-Results).

---

## 1. The tools at a glance

| Layer | Tool | Where the tests live | What they exercise |
|-------|------|----------------------|--------------------|
| Backend (API) | **PHPUnit 12** with Laravel feature tests | `backend/tests/Feature/` | The real HTTP route, controller, validation, database and JWT, against an in-memory SQLite database |
| Frontend (UI) | **Vitest 5**, **React Testing Library**, **user-event**, **jsdom** | `frontend/src/views/pages/*.test.jsx` | A rendered React page: what the user sees and does. The API module is mocked |
| Static analysis and coverage | **SonarQube** (Community Build) with `sonar-project.properties` | repository root | Code smells, bugs, security hotspots, duplication, and coverage imported from `frontend/coverage/lcov.info` |

Each layer answers a different question:

* **Does the API enforce the rule?** (backend test: "a wrong password gets 401")
* **Does the page show the right thing to the user?** (frontend test: "the error message appears")
* **Is the code healthy and how much of it is tested?** (SonarQube and coverage)

---

## 2. The process we follow

Use this order every time. It keeps tests tied to requirements instead of to the code's current shape.

1. **Pick a behaviour from the requirements.** Take a line from a user story or the SRS
   (for example, *"Super Admin can create a Center Admin only when an active center exists"*).
2. **Choose the level.** Behaviour that crosses the API boundary → backend feature test.
   Behaviour the user sees on a screen → frontend component test.
3. **Name the test after the behaviour**, in plain words, so a failure reads like a sentence.
4. **Arrange, Act, Assert** (AAA). Put the setup, the single action, and the expectations in
   three visible blocks.
5. **Run the one test** until it passes, and **make sure it can fail**: break the code on purpose
   once and check the test goes red. A test that cannot fail proves nothing.
6. **Run the whole file, then the whole suite.** Tests must not depend on each other or on order.
7. **Check coverage and Sonar** for the files you touched, and record any new numbers in
   [Testing Results](Test-Results).

### Commands

Backend (run from `backend/`):

```bash
php artisan test --compact tests/Feature/SuperAdminAuthenticationTest.php tests/Feature/SuperAdminManagementTest.php
php artisan test --compact --filter=test_wrong_password_returns_401_without_updating_last_login_time
```

Frontend (run from `frontend/`):

```bash
npm test                                             # all frontend tests
npm test -- --run src/views/pages/Login.test.jsx     # one file
npm run test:coverage                                # coverage table + frontend/coverage/
npm run test:watch                                   # rerun on save while you write the test
```

On Windows PowerShell, use `npx vitest run ...` if `npm test -- ...` does not pass arguments through.

---

## 3. Backend: how the API tests are written

The backend tests send real HTTP requests through Laravel's test client and check the response and the
database. Here is the first test in `SuperAdminAuthenticationTest.php` (lines are shortened for reading):

```php
public function test_valid_credentials_return_a_bearer_token_and_super_admin_details(): void
{
    $this->travelTo('2026-11-27 10:00:00');                       // 1. fix the clock
    $superAdmin = User::factory()->create([                        // 2. ARRANGE: one Super Admin
        'email' => 'owner@example.com',
        'password' => 'password123',
        'role' => 'super_admin',
        'active' => true,
        'center_id' => null,
    ]);

    $response = $this->postJson('/api/v1/login', [                 // 3. ACT: one HTTP request
        'email' => 'OWNER@EXAMPLE.COM',                            // upper case on purpose
        'password' => 'password123',
    ]);

    $response->assertOk()                                          // 4. ASSERT the response
        ->assertJsonPath('token_type', 'Bearer')
        ->assertJsonPath('user.role', 'super_admin')
        ->assertJsonStructure(['token', 'expires_in', 'user']);
    $this->assertCount(3, explode('.', $response->json('token'))); // a JWT has three parts
    $this->assertDatabaseHas('users', [                            // 5. ASSERT the database
        'id' => $superAdmin->id,
        'last_login_at' => '2026-11-27 10:00:00',
    ]);
}
```

What each piece does:

| Code | Why it is there |
|------|-----------------|
| `use LazilyRefreshDatabase;` (class level) | Refreshes the in-memory database only when a test needs it, so each test starts clean |
| `User::factory()->create([...])` | Builds a real user row with only the fields this test cares about (see `database/factories/UserFactory.php`) |
| `travelTo('...')` | Freezes "now" so the `last_login_at` value is predictable |
| `postJson` / `withToken($token)` | Sends a JSON request, optionally with `Authorization: Bearer ...` |
| `assertOk()`, `assertUnauthorized()`, `assertUnprocessable()`, `assertNotFound()` | Check the HTTP status code with a readable name |
| `assertJsonPath('user.role', 'super_admin')` | Checks one value at a path in the JSON response |
| `assertJsonValidationErrors([...])` | Checks that named fields failed validation |
| `assertDatabaseHas` / `assertDatabaseMissing` | Checks the database after the action, which is the real outcome |
| `$user->fresh()` | Reloads a model from the database, so you see what was really saved |

### Negative tests matter as much as happy paths

`test_wrong_password_returns_401_without_updating_last_login_time` proves two things at once: the
server refuses the wrong password, **and** it does not record a login that never happened:

```php
$response->assertUnauthorized()
    ->assertJsonPath('message', 'Invalid credentials or inactive account.');
$this->assertNull($superAdmin->fresh()->last_login_at);
```

The Center Admin password-change test is the strongest example of an **outcome** check. It logs in
with the old password, changes the password as the Super Admin, then calls the API with the **old**
token and expects `401`. This proves that the security rule (old tokens stop working) actually holds,
not just that the endpoint returned `200`.

### Tests that follow the checklist

Every new endpoint should have: a happy path, a validation failure, a permission failure (wrong role
→ `403`), a cross-center or cross-user isolation check (→ `404`), and the business rule from the SRS.
See the checklist in [Testing Guide](Testing-Guide).

---

## 4. Frontend: how the component tests are written

The frontend tests render the page the way a user sees it. We do **not** test React internals or
component state directly. We find elements by their accessible name, act like a user, and assert on the
text, the buttons and the calls made to the API.

### 4.1 Setup that every test file shares

* `frontend/src/test/setup.js` imports the jest-dom matchers (`toBeInTheDocument`, `toBeDisabled`, …)
  and calls `cleanup()` after each test, so one test's DOM never leaks into the next.
* `frontend/vite.config.js` sets `environment: 'jsdom'` (a fake browser in Node) and `clearMocks: true`
  (mock call history is reset before each test).

### 4.2 Walkthrough: the Login page

The page calls `request('/login', …)` from `frontend/src/models/api.js`. The test replaces that module
with a mock, so no network is used:

```jsx
vi.mock('../../models/api', () => ({ request: vi.fn() }))
```

**Test 1: submitting the form sends the credentials and returns the session**

```jsx
it('submits the credentials and returns the authenticated Super Admin session', async () => {
  const user = userEvent.setup()                                   // a realistic user
  const onLogin = vi.fn()                                          // a spy for the callback
  const loginResult = { token: 'header.payload.signature', user: { id: 1, name: 'Nakib Islam', role: 'super_admin' } }
  request.mockResolvedValue(loginResult)                           // ARRANGE the API reply
  render(<Login onLogin={onLogin} />)                              // render the page

  await user.type(screen.getByLabelText('Email address'), 'OWNER@EXAMPLE.COM')   // ACT: type
  await user.type(screen.getByLabelText('Password'), 'password123')
  await user.click(screen.getByRole('button', { name: 'Sign in' }))

  expect(request).toHaveBeenCalledWith('/login', {                 // ASSERT the API call
    method: 'POST',
    body: { email: 'OWNER@EXAMPLE.COM', password: 'password123' },
  })
  expect(onLogin).toHaveBeenCalledWith(loginResult)                // ASSERT the outcome
})
```

Note the mock uses `mockResolvedValue` (the API succeeds). `expect(...).toHaveBeenCalledWith` checks
the **exact** arguments, including the upper-case email, because the page must send what the user typed.

**Test 2: a failed login shows the message and creates no session**

```jsx
request.mockRejectedValue(new Error('Invalid credentials or inactive account.'))
// ... type and click as before ...
expect(await screen.findByRole('alert')).toHaveTextContent('Invalid credentials or inactive account.')
expect(onLogin).not.toHaveBeenCalled()
expect(screen.getByRole('button', { name: 'Sign in' })).toBeEnabled()
```

Three things to notice:

* `findByRole` **waits** for the element to appear. The API reply is asynchronous, so use `find*`
  (or `waitFor`) whenever the page changes after a promise resolves.
* `not.toHaveBeenCalled()` is the negative check: the session must not be created.
* The button is enabled again, so the user can retry.

**Test 3: show and hide the password**

```jsx
expect(password).toHaveAttribute('type', 'password')
await user.click(screen.getByRole('button', { name: 'Show' }))
expect(password).toHaveAttribute('type', 'text')
```

This test checks a UI detail that a user relies on. It has no API call at all, which is a good example of
a small, fast test.

### 4.3 Walkthrough: the Super Admin workspace

The workspace loads centers and Center Admins with `getAll` (which follows pagination). The test file
mocks `getAll` and decides the reply based on the path:

```jsx
function mockSuccessfulLoad(nextCenters = centers, nextAdmins = admins) {
  getAll.mockImplementation((path) => Promise.resolve(path === '/centers' ? nextCenters : nextAdmins))
}
```

Small, named **fixtures** (`centers`, `admins`, `session`) describe the data once, and each test changes
only what it needs. For example, the "no active center" test replaces the center list with an inactive
one:

```jsx
mockSuccessfulLoad([{ ...centers[1], status: 'inactive' }], [])
```

Four patterns from `SuperAdmin.test.jsx` are worth copying:

| Pattern | Example in the file | Why |
|---------|---------------------|-----|
| **Find by visible text, then scope** | `within(table).getByText('Aspire Uttara')` | Two tables or lists can show the same name; `within` limits the search |
| **Ask for the stat tile, not the number** | `screen.getByText('Total capacity').closest('.stat')` then `toHaveTextContent('200')` | Checks the label and its value together |
| **Test a rule through the UI** | "Add administrator" stays disabled with *"Create an active center before adding an administrator"* | The business rule from the SRS, seen by the user |
| **Test failure paths** | `getAll.mockRejectedValue({ status: 401 })` → `onLogout(false)`; a loading error shows **Try again** | Users spend time on error paths too |

The `401` test is the frontend half of the expired-token rule: when the API rejects the token, the page
signs the Super Admin out instead of showing a broken screen.

### 4.4 Query priority (which `getBy` to use)

Use the first option that works. Prefer what a user or a screen reader perceives:

1. `getByRole('button', { name: 'Sign in' })`, `getByRole('alert')`, `getByRole('dialog', ...)`
2. `getByLabelText('Email address')` for form fields
3. `getByText(...)` for visible text
4. `getByTestId(...)` only as a last resort (we currently use none)

If a query fails, read the error: Testing Library prints the accessible tree, which usually shows the
name you should use.

### 4.5 Common mistakes

| Mistake | Symptom | Fix |
|---------|---------|-----|
| Using `getBy` for something that appears later | "Unable to find an element" | Use `findBy` or `waitFor` |
| Two elements match the same text | "Found multiple elements" | Use `getAllBy` and pick one, or narrow with `within` or `closest` |
| Testing a private function or state variable | Test breaks on harmless refactors | Assert what the user sees or what the API receives |
| Forgetting `await user.click(...)` | Assertion runs before the click | `userEvent` calls are async; always `await` them |
| Sharing one mock across tests | A test passes only when run after another | `clearMocks: true` is set; still set the return value in each test |

---

## 5. Process for SonarQube

SonarQube reads the code, the tests and the coverage file, and reports issues. How we run it:

1. Generate coverage: `cd frontend && npm run test:coverage` (writes `frontend/coverage/lcov.info`).
2. Start the SonarQube server (see the scan notes in [Testing Results](Test-Results)).
3. From the repository root, run the scanner. It reads `sonar-project.properties`.
4. Open the project dashboard, review **new issues** first, then **coverage on new code**.
5. Record the quality-gate result, the numbers and the screenshot in
   [Testing Results](Test-Results). Do not hide a failed gate; explain it.

A failing quality gate is information, not a reason to write meaningless tests. Fix real bugs, and add
tests for the behaviour that the gate says is untested.

---

## 6. Checklist before you open a pull request

- [ ] The test name says the behaviour in plain words.
- [ ] The test has one clear action and checks the **outcome** (status, screen text, database row, API call).
- [ ] You saw it **fail** once when the code was broken on purpose.
- [ ] `npm test` and `php artisan test` pass locally.
- [ ] No real personal data, passwords or tokens in the test (use `password123`-style fixtures).
- [ ] Coverage and Sonar numbers changed in the results page if the change moved them.

---

## Related pages

* [Testing Guide](Testing-Guide): the overall test strategy and the backend checklist
* [Testing Results](Test-Results): the latest run, screenshots and SonarQube output
* [Authentication and Roles](Authentication-and-Roles): the rules these tests protect
* [API Reference](API-Reference): the endpoints the backend tests call
