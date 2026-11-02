# Implementation and verification status

Prepared 30 October 2026 from the supplied design. This is a substantial, runnable backend implementation for local testing. **It is not yet a complete implementation of every requirement in the design.** The list below is explicit so that missing behaviour is not mistaken for a tested feature.

## Implemented source

- Every named domain app and model table in section 6, with typed model fields, UUIDs, decimal amounts, farm relationships, enums and migrations.
- JWT signup/login/refresh/logout/me, password reset, memberships, invitations, role grants, farm settings, permission checks and block-descendant scope filtering.
- Configuration resource API with optimistic versions, field history, protected server-computed fields, and restrictions on transactional writes.
- Event type versions, explicit/template event creation, planning/reservations, start/submit/confirm, reschedule/cancel/duplicate, observations and stock adjustments.
- Atomic asset locks, event creation and confirmation retries, stock purchase/produce/consume/transfer/count movements, weighted-average or FIFO valuation, lot tracking, machine meters and living counts.
- Event cost records and target allocations with exact cent conservation; payments/receipts and internal money transfer; loan schedule calculation.
- Hours-of-use and daily straight-line depreciation, policy switching, capital purchase/additions, prepaid balances, rent accrual, idle allocation and a cash/register/cost reconciliation calculation.
- Compliance checks for entered label dose, application count, interval, expired lots, waiting/re-entry periods and repeated mode of action; permissioned reasoned overrides and treatment records.
- Geography area, boundary revision, split, spatial import preview, crop-block area checks, GeoJSON export, bbox/point filters.
- Days-based calendar generation, observed stage records/reforecast, manual weather, GDD recomputation and threshold suggestions.
- Basic scenario arithmetic/adoption, investment arithmetic, financial/stock/utilisation query reports and CSV export.
- Authenticated attachment upload/download, notifications, hourly overdue checks, daily rent/depreciation and reconciliation tasks, bounded sync and batch event creation.
- Database exclusion constraints for exclusive reservations/depreciation periods; immutability triggers; seed and cache-rebuild commands.
- Local WSL2/PostGIS setup, separate Docker environment, CI definition, API smoke script and tests.

## Known specification gaps — do not assume these work

1. **Retention/privacy lifecycle:** the design's automated eight-year/three-year purge policy, separate restricted purge role, farm-deletion grace workflow, legal holds, personal-data export/anonymization and restore purge-log replay are not implemented. Related farm flags and purge-receipt schema alone do not supply those workflows. No automatic financial-data deletion is enabled.
2. **Comprehensive accounting:** unpaid-credit/receivable reconciliation, general direct-expense recognition, living carrying-value costing, disposal gain/loss, fully prospective capital-addition repricing and all capital/disposal reversal paths are incomplete. The reconciliation implemented is scoped to stock, depreciable capital and prepaid balances; imputed labour is excluded from its cash identity.
3. **Cost detail:** shared machine/labour cost splitting by tank-mix product purpose, full planned depreciation estimates and complete crop-cycle cached summaries remain incomplete. Basic target-area splitting is implemented.
4. **Depreciation extension framework:** the two named methods are implemented; an independently extensible strategy registry with arbitrary registered methods is not yet provided.
5. **Scenario analysis:** revenue, operation cost, profit and margin/area are computed. Cash low point/date, weekly labour/water constraints, holding forecasts, full assumption propagation and the full compare endpoint are not implemented.
6. **Scheduling/calendar completeness:** recurring windows must be expanded before entry; full capacity-sharing calendars, all event-type minimum-interval/repeat checks, automatic optional-line add/remove at completion, all derived template quantity bases, GDD-based future calendar generation and a weather-provider adapter remain incomplete. GDD calendar generation refuses to guess threshold dates.
7. **Spatial completeness:** merge-block workflow and simplified list geometry are not implemented. Import preview is implemented; saving a chosen imported shape uses `set_boundary`.
8. **Background operations:** low-stock/expiry/safety-end/loan reminder jobs, automatic overdue reservation release, weekly cache integrity scheduling, full report refresh jobs and infrastructure backups/restore drills are not all wired. Cache comparison/rebuild is available as a management command.
9. **Reports/files/schema:** PDF reporting, direct-to-S3 upload intents/finalization, treatment-specific export and a fully typed schema for every command body remain incomplete. Authenticated server-upload and CSV reports are available.
10. **Reversal completeness:** amendments cover ordinary stock/meter/living/cost/ledger effects, but capital additions/disposal are refused; crop-stage/status effects are not comprehensively reversed. Safety windows remain conservative. Reversed treatments are retained, and subsequent compliance counting needs additional reversal-aware reconciliation.
11. **Access-control hardening:** the full endpoint × role × block-scope × financial-field matrix, supervisor wage visibility across aggregate summaries, and large-farm query performance need further verification. Current tests do not prove the full matrix.
12. **Operational hardening:** PostgreSQL triggers enforce immutable updates/deletes, but the supplied local role owns its tables; production separation of migration/runtime/purge roles is not supplied. Stock/meter changes are service-only at the API layer; arbitrary direct SQL by the database owner can still alter caches. The independent concurrency/property/reversal/performance/migration-upgrade test programme is not complete.

## Verified in the generation environment

- Django `check`: no issues.
- Ruff lint: passes after formatting.
- Python syntax compilation: passes.
- Migration graph: acyclic, with PostGIS/`btree_gist` foundation dependencies.
- Generated OpenAPI schema: generation succeeds.
- **173 database-free tests passed**, covering decimal allocation/GDD/depreciation arithmetic, Hypothesis allocation cases, serializer construction for all registered resources and authentication rejection on each resource.

## Included, but not executed here

The PostgreSQL-dependent tests cover the golden numerical scenario (₹6,39,500 paid, ₹6,36,810 register, ₹690 event cost, ₹2,290 cycle cost, ₹400 idle), purchase/consumption/retry/shortage rollback, cross-farm asset rejection, immutable movement updates, registration/JWT, resource write roles, and a geodesic boundary revision.

This workspace exposes only a root user and cannot run PostgreSQL under its required non-root user. Therefore **database migrations, integration tests, the smoke script, Celery execution and Docker startup have not been runtime-verified here**. They must be run on the local setup. A provided test is not evidence that it passed.

Run `bash scripts/test_local.sh`, then `python scripts/smoke_test.py` against your running API. Use test data until the remaining features relevant to your workflow have been completed and verified.
