# Verification

## Automated checks

The final source is checked with:

- TypeScript strict compilation and Vite production build.
- Unit tests for decimal/integer payload handling, nested timestamps, optional defaults, nullable edit clearing, JSON validation, array defaults and UUID fallback.
- Transport tests for external pagination rejection, single-flight JWT rotation, preserving sessions on 403, live connection errors and late-refresh/logout races.
- Event-command tests for a valid default time window, stable form UUIDs, stock acquisition/payment fields and excluding hidden fields from payloads.
- An import-boundary check for isolated feature folders and public entry composition.
- Contract coverage against the supplied source snapshot: 84 resource groups and 39 command names.

These checks validate the frontend, not a live Windows/PostGIS deployment.

## Browser checks

The application was opened through the local preview service. The following were inspected using synthetic preview data:

- Sign-in layout and explicit entry into preview mode.
- Farm overview on a desktop viewport.
- Opening work details, starting sample work and confirming it.
- A 375px viewport: compact overview cards, drawer navigation layout and the work-planning modal.
- A 768px viewport: work table with contained horizontal scrolling and a tablet navigation trigger.
- The phone/tablet document widths matched their available viewport widths during the check; wide tables/tabs scroll within their own containers.

The responsive harness in `public/responsive-check.html` renders the actual app at selected widths. These checks are not a substitute for testing on physical devices and assistive technology.

## Live integration still required

This workspace cannot reach the Django service on the user's Windows laptop. Therefore signup/login against that database, backend permission combinations, actual inventory/cost mutations, PostGIS boundary persistence and real file downloads need local end-to-end verification.

Use the stock/payment walkthrough in `WINDOWS_SETUP.md`, or the previously supplied Postman collection, as the first integration check.

## Preview limits

Synthetic preview mode supports browsing, basic records and selected event transitions. Specialist calculations, uploads, spatial validation and other commands clearly request the live backend. Preview actions are not evidence that an underlying Django business rule passed.

## Contract scope

Coverage is of implemented routes in the backend ZIP, including its existing limitations. It does not claim to finish the original design document's unfinished retention, accounting, reversal, scenario, scheduling, background-job or permission-matrix work. Those behaviours remain server responsibilities.
