# Fieldwork: invitation onboarding and farm permissions

This is a source update for the Django backend and existing React/TypeScript/Tailwind frontend from this conversation, not a replacement project. Install both sides. The frontend folder includes the preceding theme, detail modal, field help, sidebar, guide/tab motion and offline-draft changes as well as this update.

## What changes

- Signup offers **Join a farm** (default) and **Create my own farm**.
- Joining requires the invitation email, code, name, password and password confirmation. Role and farm come exclusively from the server-side invitation.
- Account creation and invitation acceptance commit together. Invalid, expired, used or wrong-email codes leave no new account behind.
- After successful signup, the worker signs in and opens their assigned farm. Farm creation is optional, never mandatory for a worker.
- Users who already have an account sign in and choose **Join with an invitation** in the workspace picker. Users with no farm see explicit join/create choices.
- Navigation, page access and create/edit/command controls follow effective backend permissions. A worker can start/submit assigned work but cannot plan or confirm it under the existing seeded Worker role. The API remains authoritative.
- The profile dropdown shows the current farm role. Owner setup guides are hidden from ordinary workers.
- Existing active roles cannot be replaced by accepting another invitation, and suspended memberships cannot be reactivated through an invitation.
- If acceptance succeeds but loading the farm list fails, retry refreshes farms without resubmitting the consumed code.

## Install locally on Windows

1. Stop Django and Vite. Back up your existing files or commit them.
2. Copy the contents of `backend` into your existing backend folder, preserving paths. Copy the contents of `frontend` into your existing frontend root, preserving paths. Do not create an extra nested `frontend/frontend` folder.
3. If you customized `config/urls.py`, merge just these additions instead of replacing your custom routes:

```python
# Add to the existing apps.identity.views import:
FarmAccessView,

# Add to urlpatterns, before the farm router include:
path("api/v1/farms/<uuid:farm_id>/access/", FarmAccessView.as_view()),
```

No new packages, models or migrations are introduced. Keep your existing OSGeo4W/GDAL/GEOS/PROJ configuration and `.env`.

From your backend root in PowerShell:

```powershell
.\.venv\Scripts\python.exe manage.py check
.\.venv\Scripts\python.exe manage.py test apps.identity.test_invitation_onboarding
.\.venv\Scripts\python.exe manage.py runserver 0.0.0.0:8000
```

Use the explicit venv Python path so OSGeo4W's Python does not take precedence. The Django test command needs permission to create/use its test database and your existing PostGIS setup.

From your existing frontend root, using its installed dependencies:

```powershell
npm run build
npm test
npm run dev
```

Install the backend before testing this frontend. It now requests `/api/v1/farms/<farm_id>/access/`; an old backend without that route will display an access-loading error. Your existing Vite API URL/proxy and Django CORS settings still apply.

## Admin and worker workflow

1. The farm owner signs in and selects their farm.
2. In Settings, inspect the farm's Roles and choose the seeded **Worker** role, or create a custom role and configure its permissions.
3. Choose the **Invite** action, enter the worker's exact email and the role. Share the returned token privately as the invitation code. Existing invitations expire after seven days and are single use. This update does not automatically send email.
4. The new worker chooses **Create an account → Join a farm**, supplies the same email and code, and creates their password.
5. After signup succeeds, they sign in. Their active membership selects the existing farm automatically.
6. For someone already registered, use sign-in followed by the workspace picker's **Join with an invitation** action; do not register a duplicate account.
7. To change an existing member's role or restore a suspended member, use the administrator's **Change member** action rather than another invitation.

Existing accounts created before this update also use step 6. Creating an owner account does not grant access to another person's farm; it only permits setting up an independent farm through the existing API. Farm roles are separate from Django `is_staff`/`is_superuser`.

## Worker assignment and visibility

Membership gives farm access. For the backend's existing worker event filters, also link the worker's personnel asset/PersonDetail to the user's account and assign that operator asset to the appropriate work. A worker login alone does not assign events. Existing block access scopes and object-level permission checks still apply. Custom roles need the relevant view permissions as well as action permissions.

The server is responsible for authorization even if a user modifies browser code. The frontend's permission response is cached for 30 seconds and refreshed on window focus; permissions are checked again by the backend on requests. Cached controls can remain visible temporarily after an administrator changes access, but cannot override the server.

## Boundaries

Codes are bearer credentials tied to an email string. This project does not currently verify mailbox ownership, so matching an email and possessing a privately shared code is not independent email verification. Email delivery/verification and invitation revocation UI are separate enhancements.

Offline drafts remain local drafts for the signed-in user/farm. Joining and registration require a connection; reconnecting never automatically submits saved work. The demo preview deliberately shows all sample capabilities and is not a test of real worker permissions.

## Validation

- 55 frontend tests pass, including signup modes, farm selection, permission checks and safe invitation retry.
- TypeScript and production build pass; module-boundary and API-contract checks pass.
- 13 isolated Django identity/API tests pass against actual identity models/views/services and JWT login.
- Signup layout inspected in the browser.

The isolated backend run used SQLite. PostgreSQL row-lock concurrency, the complete PostGIS migration graph, and integration on your Windows machine still need the local checks above. See `API_EXAMPLES.md` for request bodies. `FILES.txt` lists every supplied file. No `.env`, credentials, node_modules or database content is included.
