# Super Admin Use Case Narratives

These narratives correspond to `super_admin_use_case.puml` and the existing Aspire frontend and backend. The primary actor is the Super Admin. Except for sign-in and its included use cases, the actor must have a valid session and the `super_admin` role. An expired or invalid session prevents protected requests; the interface clears the local session when a refresh receives a 401 response. An authenticated user without the required role receives a 403 response.

## UC-01: Sign in

**Goal:** Access the Super Admin workspace.

**Preconditions:** An active Super Admin account exists; the sign-in page is open.

**Main flow:**
1. The Super Admin enters an email address and password and selects **Sign in**.
2. The system validates the input and checks the credentials and account status (UC-02).
3. The system records the last login time and issues a bearer token (UC-03).
4. The frontend stores the token and user in session storage and opens the appropriate workspace.

**Alternatives:** Missing or malformed input is rejected. Invalid credentials or an inactive account produce an error and no session. Login requests are throttled to five attempts per minute. A successful login to another role opens that role's workspace instead.

**Postcondition:** The Super Admin has an authenticated session on success; otherwise no new session is created.

## UC-02: Validate credentials and account status

**Goal:** Determine whether a sign-in request can be accepted. This use case is included by UC-01 and is performed by the system.

**Precondition:** The sign-in request contains an email and password.

**Main flow:**
1. The system validates the email and password fields.
2. It finds the user by lowercase email and checks the password against the stored hash.
3. It checks that the account is active and has a supported role. A Super Admin does not need a center assignment.
4. The system returns control to the sign-in flow if the checks pass.

**Alternative:** If a check fails, the system rejects the login with an invalid-credentials-or-inactive-account message.

**Postcondition:** The request is accepted for token issuance or rejected.

## UC-03: Issue bearer token

**Goal:** Establish an authenticated API session. This use case is included by UC-01 and is performed by the system.

**Precondition:** Credential and account checks succeeded.

**Main flow:**
1. The system records the user's last login time.
2. It issues a JWT bearer token and returns the token, expiry information and user details.
3. The frontend saves the token and user for the current browser tab's session.

**Postcondition:** The frontend can use the bearer token for authenticated API requests.

## UC-04: Sign out

**Goal:** End the current session.

**Precondition:** A session exists.

**Main flow:**
1. The Super Admin selects the sign-out control.
2. The frontend requests token revocation from the backend.
3. The backend logs out the token, and the frontend clears the locally stored session.
4. The sign-in screen is displayed.

**Alternative:** If the server cannot be reached, the frontend still clears the local session; server-side revocation is not confirmed.

**Postcondition:** The local session is removed; on successful server response, the token is revoked.

## UC-05: View overview and attention items

**Goal:** Review system-wide center and administrator information.

**Main flow:**
1. The Super Admin opens the overview.
2. The frontend loads centers and center administrators.
3. It displays totals, active and assigned counts, total capacity, recent centers and attention items.
4. The actor may navigate to a list or open a relevant management form.

**Alternatives:** Empty data produces an empty-state message. A loading error is displayed with a retry option.

**Postcondition:** No data is changed by viewing the overview.

## UC-06: View, search and filter centers

**Goal:** Find centers and review their summary information.

**Main flow:**
1. The Super Admin opens **Centers**.
2. The system displays the loaded center list, including location, contact, capacity, administrators and status.
3. The actor may enter a search term or filter by active or inactive status.
4. The frontend displays matching results.

**Alternative:** If no centers match, the frontend displays an empty state.

**Postcondition:** The center data is unchanged.

## UC-07: View center details

**Goal:** Review a center's full profile and assigned administrators.

**Precondition:** The center appears in the center list.

**Main flow:**
1. The Super Admin selects a center row.
2. The frontend displays its contact, location, operations, status, notes and administrators using the loaded data.
3. The actor closes the details panel or chooses an available edit or add-administrator action.

**Postcondition:** Viewing alone does not change data.

## UC-08: Add center

**Goal:** Register a center.

**Main flow:**
1. The Super Admin selects **Add center**.
2. The actor enters a name and address, optionally supplying a code, status, contacts and operational details.
3. The actor submits the form.
4. The backend validates the data and creates the center. If no code is supplied, it generates one.
5. The frontend confirms creation and refreshes the lists.

**Alternatives:** Invalid data, including a duplicate name or code, is reported for correction. The actor may cancel before submitting. A request failure is displayed.

**Postcondition:** A new center exists after a successful submission.

## UC-09: Edit center

**Goal:** Update an existing center's information.

**Precondition:** The center exists.

**Main flow:**
1. The Super Admin selects **Edit** for a center.
2. The system displays its existing details.
3. The actor changes the desired fields and saves.
4. The backend validates and updates the center; the frontend refreshes the lists.

**Alternatives:** Invalid or duplicate values are reported. The actor may cancel. If the center no longer exists or the request fails, the update does not complete.

**Postcondition:** Valid submitted changes are saved.

## UC-10: Activate or deactivate center

**Goal:** Change a center's status.

**Precondition:** The center exists.

**Main flow:**
1. The Super Admin selects **Activate** or **Deactivate** for the center.
2. The frontend asks for confirmation.
3. The actor confirms; the backend updates the status.
4. The frontend refreshes the lists and reports success.

**Alternatives:** The actor cancels, or the request fails and an error is shown. Status can also be changed through the edit form.

**Postcondition:** The center has the selected status. An inactive center cannot be selected for a new administrator assignment.

## UC-11: View, search and filter center administrators

**Goal:** Find center administrator accounts and review their status and assignment.

**Main flow:**
1. The Super Admin opens **Center admins**.
2. The system displays administrator names, contact information, centers, last sign-in and account status.
3. The actor may search by name, email or center and filter by account status.
4. The frontend shows matching results.

**Alternative:** If no accounts match, an empty state is displayed.

**Postcondition:** Administrator data is unchanged.

## UC-12: Add center administrator

**Goal:** Create an administrator account assigned to an active center.

**Precondition:** At least one active center exists.

**Main flow:**
1. The Super Admin selects **Add administrator**.
2. The actor enters a name, email and password, selects an active center, and optionally supplies contact details and designation.
3. The actor submits the form.
4. The backend validates the data and creates an active center administrator account.
5. The frontend confirms creation and refreshes the lists.

**Alternatives:** The interface prevents creation when there is no active center. Invalid data, a duplicate email, a password shorter than eight characters or an invalid/inactive center is rejected. The actor may cancel.

**Postcondition:** A new active administrator is assigned to the selected center.

## UC-13: Edit administrator details and access

**Goal:** Update an administrator account or its access status.

**Precondition:** The center administrator exists.

**Main flow:**
1. The Super Admin selects **Edit** for an administrator.
2. The actor changes the relevant details, optional password or active status and saves.
3. The backend validates and saves the changes.
4. The frontend confirms the update and refreshes the lists.

**Alternatives:** Invalid input or a duplicate email is rejected; the actor may correct it or cancel. Changing the password or deactivating the account invalidates existing tokens. Changing the assigned center is described in UC-14.

**Postcondition:** Valid changes are saved; affected sessions are invalidated when applicable.

## UC-14: Assign or change administrator's center

**Goal:** Assign an administrator to an active center or move the administrator to another active center.

**Preconditions:** An active destination center exists. An administrator is being created or edited.

**Main flow:**
1. The Super Admin opens the add or edit administrator form.
2. The actor selects an active center and saves the form.
3. The backend validates the selected center and saves the assignment.
4. The frontend refreshes the lists.

**Alternatives:** An inactive or nonexistent destination is rejected. The actor may cancel. When an existing administrator's center changes, existing tokens are invalidated.

**Postcondition:** The administrator is assigned to the selected active center.

## UC-15: Unassign administrator from center

**Goal:** Remove an administrator's current center assignment.

**Precondition:** The administrator is currently assigned to a center.

**Main flow:**
1. The Super Admin selects **Unassign** for the administrator.
2. The frontend asks for confirmation.
3. The actor confirms.
4. The backend removes the assignment and invalidates the administrator's existing tokens.
5. The frontend reports success and refreshes the lists.

**Alternatives:** The actor cancels, or the request fails and an error is shown.

**Postcondition:** The administrator is unassigned and cannot sign in until assigned to a center again.
