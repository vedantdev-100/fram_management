# Architecture and extension guide

The application is a feature-first modular frontend shipped as one SPA. There is one entry point, router, dependency graph and build. It does not require microfrontends, separate deployments or a runtime federation layer.

## Boundary rules

1. A feature owns its domain API adapter, query hooks, typed interfaces/exports, record descriptors, commands and pages.
2. Features may import shared primitives from `src/api`, `src/components`, `src/hooks`, `src/lib`, `src/types` and global stores.
3. A feature must not import another feature's files. Cross-domain navigation uses routes; composition happens in `App.tsx`/the application shell through public `index.ts` exports.
4. Shared components implement presentation and transport conventions. Work-line definitions, capital/payment fields, scenario actions, boundary handling and attachment behaviour live in feature folders.
5. Server quantities, costs, reservations, compliance and confirmations remain Django service responsibilities. The UI never patches cached stock or pretends a browser calculation is a confirmed cost.

`npm run check:architecture` checks imports, including relative paths, for feature-to-feature access and private entry access from application-level code.

## One feature

```text
features/events/
  api/index.ts                 Adapter limited to event-domain resources
  types/index.ts               Public domain types from the backend DTO snapshot
  hooks/useModule.ts           Feature query entry
  components/resources.ts      Resource columns, fields and creation commands
  components/commands.ts       Work commands, nested line editor and payload builders
  components/EventDetail.tsx   Work lifecycle and actual-quantity workflow
  pages/ModulePage.tsx         Domain composition
  index.ts                     Public entry
```

Record tables and forms are metadata-driven to avoid duplicating pagination, loading, validation, optimistic version handling and error rendering 84 times. They are reusable UI infrastructure, while their schemas, field conditions and payload rules belong to each feature.

Some operational views use bespoke components: overview, work detail, boundary import, file upload, reports and sync. New domain-specific screens can replace the generic view while retaining the same transport and query primitives.

## State ownership

| State | Owner | Persistence |
|---|---|---|
| Access token | Zustand session store | Memory |
| Refresh token | Zustand session store | Session storage for page reloads |
| Current user | Zustand session store | Fetched from Django; preview user separately persisted |
| Active farm | Zustand workspace store | Local storage; checked against the current user's farm list |
| Mobile drawer | Zustand workspace store | Memory |
| Toasts | Zustand notification store | Memory |
| Sync cursors | Sync feature Zustand store | Local storage, keyed by farm |
| Server records | TanStack Query | In-memory cache keyed by farm/resource/filter |
| Unsaved form values | Owning component | Memory |
| Synthetic preview records | Separate demo adapter | Session storage |

Tokens are never stored in local storage. Session storage is still JavaScript-readable; this follows the supplied bearer-token API. A future hardened cookie session requires backend work rather than a frontend-only setting change.

## Transport and authentication

- `src/api/client.ts` normalises the configured API base URL, including relative same-origin bases.
- Private JSON/FormData requests attach the access token.
- A shared refresh promise prevents concurrent 401 responses from racing token rotation.
- Session generation checks prevent a late refresh response from restoring a logged-out session.
- 403 preserves the session and shows an access error. Network errors stay network errors; no preview fallback occurs.
- Pagination links must match the configured backend origin and API path before a bearer token is attached.
- Writes are not automatically retried. Forms retain a UUID for supported event/payment submissions during the current dialog. Generic configuration writes and some commands have no backend idempotency key and are not presented as idempotent.

## Data and versions

`src/types/api.generated.ts` is a TypeScript DTO snapshot of the supplied OpenAPI schema. The metadata-driven layer uses `Row`/`unknown` values because it renders different schemas without weakening the TypeScript compiler to `any`.

Farm/resource-specific query keys keep caches separate. Farm switches discard existing farm queries. Mutations invalidate farm records to refresh dependent quantities and reports.

Configuration edits send the current `version`. A conflict requires reviewing the latest record; the application does not repeatedly replay stale writes. Existing cost rules/depreciation policies are versioned by creating a new row, so their edit buttons are omitted.

## Adding a feature

1. Create the feature folders and a public `index.ts`.
2. Configure its resource adapter with `createModuleApi`.
3. Add local resource descriptors and structured command definitions, or implement a dedicated screen.
4. Keep payload transformations in the feature.
5. Add a lazy route and navigation entry at application level.
6. Update the backend contract snapshot only after the backend actually exposes the route.
7. Run typecheck, tests, boundary checks, contract coverage and the production build.

## Backend constraints that affect the UI

The supplied backend has no effective-permissions endpoint. This frontend does not invent one or assume that role names reveal custom grants. Actions are validated by the backend; a 403 is shown as an access restriction. The full server-side RBAC verification requirements still apply.

The API also lacks a general users directory. Member records may contain user identifiers without another person's name; the frontend cannot retrieve private profile data through a nonexistent endpoint.

The block view uses recorded GeoJSON or entered-area records. Its local schematic is not a basemap, survey tool or accurate geodesic area calculator. The backend remains the authority for area.

Offline sync explicitly imports/sends event batches and saves checkpoints. It is not a full offline-first application or automatic queue for every form edit. No unsupported background job, retention workflow or advanced scenario calculation is implemented in the browser.
