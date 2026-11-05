# Fieldwork — Team controls and UI update

This cumulative frontend includes the previous invitation onboarding, offline drafts, help buttons, dark mode, guide and tab animations. Backend files include invitation onboarding and the new member controls. Back up your current code before merging. Keep your existing .env files.

## Install on Windows

1. Stop Django and Vite.
2. Merge `backend/apps/` into your existing `backend/apps/` and replace `backend/config/urls.py` with the included file. Preserve other backend files, including prior area and boundary fixes.
3. Merge `frontend/src/`, `frontend/public/`, `frontend/docs/`, `frontend/scripts/`, and `frontend/index.html` into your existing frontend. Root project configuration files are included for reference or a complete frontend checkout. There are no new dependencies or migrations for this patch.
4. From your backend directory:

```powershell
.\.venv\Scripts\python.exe manage.py check
.\.venv\Scripts\python.exe manage.py runserver 0.0.0.0:8000
```

5. From your frontend directory, in another terminal:

```powershell
npm run dev -- --host 0.0.0.0
```

If dependencies are absent, first run `npm ci`. Refresh the browser after restarting both servers. Install backend first so member names and invitation codes are available to the new frontend.

## Changes and usage

- Setup guides start collapsed on each page. Existing opening/closing animations remain.
- Team & settings → Members: open a member record, then use **Edit role / access** or **Remove from farm**. These actions are also in the Actions dropdown. Removal asks for confirmation and sets membership to suspended, immediately revoking future farm requests. The user account and historical records remain; the membership stays visible as suspended. An authorized administrator can restore access with Edit role / access. This does not delete a global account, change passwords, or remove access to other farms.
- Member roles and status can be updated by roles holding `identity.member.manage`. Owner changes also require `identity.farm.manage`. A role cannot be assigned if it grants permissions the actor does not hold. The last active owner cannot be removed, suspended, or moved to invited status. Farm row locking serializes membership changes with invitation acceptance.
- Member tables and pickers show full names, falling back to email. Details show the name/email rather than the raw user UUID.
- Team & settings → Invitations: new invitations include a masked code with reveal/hide and copy controls, both in the table and record details. Only roles with `identity.invitation.create` receive recoverable codes. Accepted/expired codes are unavailable. If clipboard access is blocked on LAN HTTP, reveal the code and select/copy it manually.
- Earlier invitations store only one-way hashes. Their original codes cannot be recovered. Their existing codes still work if you kept them; otherwise create a fresh invitation. This update does not silently rotate old invitations. Newly issued codes are derived using a server-secret HMAC and the invitation UUID; only their hash is stored in the database. Keep Django SECRET_KEY stable: changing it makes those codes unavailable for reveal. Treat these codes as credentials; UI masking hides them from casual viewing, not from an authorized administrator’s network tools.
- Sidebar sections expand/collapse independently. The desktop collapsed icon rail keeps its navigation available.
- Sidebar, detail dialogs, information popovers and dropdown menus use compact scrollbars.
- All existing select dropdowns (forms, action menus, reference selectors, attachments and boundary mapping) use a shared theme-aware menu. Supports pointer/touch, arrow keys, Home/End, Enter, Escape and required-field validation. Menus render inside their dialog so modal browser behavior does not block them.

## API additions

Existing command route: `POST /api/v1/farms/{farm_id}/commands/{command}/`

- `change_member`: `{"member_id":"...", "role_id":"...", "status":"active"}`. Both role_id and status are optional server-side.
- `remove_member`: `{"member_id":"..."}`. Revokes farm access via suspension.
- Member responses now include read-only `member_name` and `member_email`.
- Invitation responses include permission-filtered `invitation_code` or null. The token_hash is never returned.

## Validation

- Production frontend build passed.
- 59 frontend tests passed, including themed select keyboard/pointer behavior, dialog containment, Escape, guide collapse and masked codes.
- Architecture and contract checks passed (84 resources, 40 commands).
- 18 backend identity/API tests passed using isolated SQLite fixtures and the real Django models/services. Includes removal, role updates, last-owner protection, invitation reveal permissions, and prior invited registration cases.
- Browser visual checks were not completed in this runtime because a Chromium executable is unavailable. PostgreSQL row-lock concurrency, full PostGIS integration and Windows require local verification.

Optional checks:

```powershell
# Backend
.\.venv\Scripts\python.exe manage.py test apps.identity.test_invitation_onboarding
# Frontend, in its own directory
npm test
npm run build
npm run check:architecture
npm run check:contracts
```
