# Fieldwork — offline saving mode

## Install locally on Windows

This cumulative frontend patch includes all previous UI updates in this conversation.

1. Stop Vite and back up your frontend folder or commit your changes.
2. Extract this ZIP to a separate directory.
3. Merge `src/`, `public/` and `index.html` from `frontend-update/` into your existing frontend root. Replace included files; preserve `.env` and other files. Merge any local customizations to included files.
4. Restart with `npm run dev`.

No new dependency, backend endpoint, database migration or environment change is needed.

## How to collect and recover data

1. Sign in, select your farm and open the app and required forms while connected. Load the related units/assets/crop choices you will need.
2. If the browser goes offline, shared configuration and Actions forms enter Offline saving mode. Edits are automatically copied to local device storage. The form also has Save offline now and Download this draft buttons. Ordinary submissions are not sent while the browser reports offline.
3. If the browser reports online but a request fails with a network/connection error, that form's current values are also saved as a local draft. Validation, permission and server HTTP errors are not treated as disconnections.
4. To view saved data, close the form and click Drafts/the cloud icon in the top bar, or open Offline sync → Saved offline drafts. Review, download JSON, delete a local draft, or import an earlier Fieldwork draft backup.
5. Once the server is reachable, choose Resume on a draft. It opens the original form with the saved values. Review the record and submit normally; a successful server response removes that form's local draft. There is no automatic resend on reconnect.

Backups are scoped by signed-in user ID, farm ID and live/preview mode. Reuse the same frontend URL when returning, or download/import a backup to move between browser origins/devices. Data is stored in browser local storage, not a separate server or encrypted vault. Clearing site data or changing browser profiles removes local copies. Download a backup if you need an independent copy.

A storage quota/privacy-mode failure is shown explicitly. Download this draft can still create a JSON file directly from the open form even if local persistence fails.

## Important scope

- Supported: shared record create/edit forms (for example blocks, assets and stock items), and the Actions forms (for example planned work, observations or custom roles).
- Not covered: binary file uploads, GeoJSON import/apply tools, sign-in/registration, farm creation, and the separate work-detail Start/Submit/Confirm buttons. They still require a server connection. New related records must be created and synced before a form can reference their server IDs.
- This does not add a service worker or offline app installation. Open the app and relevant forms before going to the field. An initial launch or uncached reload with no frontend/backend connection is not supported. Persisted drafts remain available after reconnecting, loading the app and signing in again.
- Internet is distinct from server connectivity: if Django is reachable over local Wi-Fi, local online submissions can still work without internet. Network/CORS/server-unreachable failures activate backup mode; the UI does not diagnose them as proven internet outages.
- A request whose response was lost might already have been saved on the server. Such drafts retain a check-before-retry notice. They are not automatically replayed. Verify existing records before resubmitting a create/action with no server idempotency guarantee.
- Existing client UUIDs are retained for compatible action retries. Edited records retain the original version so the backend can reject stale edits instead of overwriting someone else's changes. If a conflict occurs, compare against the current record and re-enter reviewed values in a fresh edit.

## Backup format and existing event batches

Download JSON exports `fieldwork.offline-drafts.v1`, containing local form values plus the context and return page. Import this file in Saved offline drafts. The importer accepts 1–100 drafts up to 5 MB and requires the same user, farm and workspace mode. The original event-batch importer remains separate: it expects backend-compatible event payloads in an `events` array. Do not upload a draft backup to Submit an offline event batch.

There is no new backend sync or automatic batch replay. Resume uses existing API validation and permissions.

## Verification

Production build, 45 tests, feature-boundary checks and API-contract checks passed. Offline behavior was tested using simulated browser connectivity and native local storage in the test runtime, not a physical field network. Tests cover offline autosave, no online backup for successful/validation/permission requests, connection-failure backups, no auto-submit on reconnect, successful cleanup, owner/farm/mode isolation, original versions and UUIDs, JSON download, atomic import and storage failures. No live Windows backend or physical offline device test was performed.
