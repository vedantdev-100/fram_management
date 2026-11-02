# Fieldwork — farm management frontend

React + TypeScript + Tailwind CSS + Zustand, connected to the Django backend and Postman contract supplied in this conversation. This is a local code project; it has not been published or deployed.

Start with **[WINDOWS_SETUP.md](WINDOWS_SETUP.md)**. The backend remains your existing Django project.

## Stack

- React 19, TypeScript in strict mode, Vite 7.
- Tailwind CSS 4, a restrained green/stone design system, Lucide icons.
- Zustand for session, active farm, mobile navigation, notifications and sync checkpoints.
- TanStack Query for server records, cursor pagination, cache invalidation and request lifecycle.
- React Router with feature-level lazy loading.
- Vitest and Testing Library dependencies; contract and architecture checks.

## Feature-first modular structure

```text
src/
  api/                  Shared authenticated transport and generic resource primitives
  components/           Shared controls, forms, tables, dialogs and shell
  hooks/                Shared server-query helpers
  lib/                  Formatting, UUID and form utilities
  stores/               Global Zustand stores
  types/                Shared contracts and generated backend DTOs
  demo/                 Explicit, isolated preview-data adapter
  test/                 Shared test setup
  features/
    auth/
    farms/
    dashboard/
    land/
    assets/
    events/
    crop-science/
    scheduling/
    ledger/
    costing/
    compliance/
    catalogue/
    workbench/
    files/
    notifications/
    reports/
    settings/
    audit/
    sync/
```

Each domain has its own `api/`, `types/`, `hooks/`, `components/`, `pages/` and public `index.ts`. Features use shared infrastructure; they do not import another feature’s implementation. The application composes features through their public indexes. Domain action definitions and payload builders stay inside the owning feature. See **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**.

## What is wired

- Signup/login, rotating JWT refresh, current user, password reset, signout.
- Farm creation and switching with separate farm query keys.
- Overview built from farm records, upcoming work, review queue and recorded block geometry.
- List/detail views for all **84 implemented resource groups**.
- Create/edit forms for directly writable configuration resources, protecting calculated fields and confirmed history.
- Forms for all **39 command names** in the supplied backend.
- Work planning with structured resource lines and targets. Stock purchases, payments, labour/machines, harvest and transfers use their actual sub-event fields.
- A work-detail workflow: start → edit actual quantities → submit or confirm; cancel unfinished operations.
- Crop cycles, catalogues, stock, money, costing, treatment records, scenarios and team configuration.
- Spatial import preview/save and GeoJSON export; private document upload/download.
- Seven backend reports, CSV export, notification-read commands, sync checkpoints and explicit saved-event batch submission.
- Responsive sidebar/drawer, desktop tables/mobile cards, accessible labels, modal focus handling and reduced-motion support.

## Preview versus live

Sign-in offers **Explore the preview** when `VITE_ENABLE_DEMO=true`. The preview is clearly labelled and stores synthetic records in session storage. It supports browsing, basic record creation and work lifecycle checks; specialist calculations, uploads and spatial validation require the live Django server.

The application never replaces a failed live API call with sample data. Choose **Connect your backend** to end the preview session and sign in to Django. Set `VITE_ENABLE_DEMO=false` to hide the preview entry.

## Checks

```powershell
npm run typecheck
npm test
npm run check:architecture
npm run check:contracts
npm run build
```

`package-lock.json` is included. Use `npm ci` to install the verified dependency tree.

Validation performed and backend limitations are recorded in **[docs/VERIFICATION.md](docs/VERIFICATION.md)**. Source-derived request wiring is implemented; the user's Windows Django server is not accessible from this build workspace and needs local integration testing.
