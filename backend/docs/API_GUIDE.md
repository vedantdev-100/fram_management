# Local API guide

Base URL: `http://localhost:8000/api/v1`.

Use `Content-Type: application/json` and, after login, `Authorization: Bearer YOUR_ACCESS_TOKEN`. UUID fields take UUID strings. Decimal values should be sent as strings. Timestamps must include an offset, for example `2026-10-30T08:00:00+05:30`.

## Authentication and first farm

`POST /auth/register/`

```json
{"email":"you@example.com","full_name":"Farm Owner","password":"choose-a-long-unique-password"}
```

`POST /auth/token/`

```json
{"email":"you@example.com","password":"choose-a-long-unique-password"}
```

The response contains `access` and `refresh`. Access lasts 15 minutes; refresh lasts 7 days. `POST /auth/refresh/` accepts `{"refresh":"..."}` and rotates the refresh token. Store the new refresh token. `POST /auth/logout/` accepts the same shape and blacklists that refresh token. Existing access tokens remain valid until expiry.

`POST /farms/`

```json
{"name":"Umred Brinjal Farm","slug":"umred-brinjal","region":"Nagpur, Maharashtra","timezone":"Asia/Kolkata","currency_code":"INR"}
```

The response `id` is your `farm_id`. The caller receives an owner membership with all permission codes. Check `GET /auth/me/` to see memberships.

Every resource below is under `/farms/{farm_id}/`.

## Reference data and farm setup

Read the seeded IDs from:

- `GET units/` — `kg`, `L`, `m2`, `acre`, `ha`, `hour`, `piece`, etc.
- `GET crops/` — includes Brinjal.
- `GET types/` — includes `procurement`, `crop_nutrition`, `crop_protection`, `harvest`, `sales`, etc.
- `GET categories/`, `GET purpose-tags/`, `GET ledger-categories/`.

Lists are cursor-paginated: `results`, `next`, `previous`. Follow `next`; do not assume the first page contains all records.

Create a block with `POST blocks/`:

```json
{"code":"B1","name":"Brinjal Block","area_value":"2","area_unit":"ACRE_UNIT_UUID","soil_type":"Black soil"}
```

The server computes canonical `area_m2`. Do not submit it. A geometry must be set through `commands/set_boundary/` so that it creates a boundary revision.

Create a season with `POST seasons/`:

```json
{"name":"Winter 2026","kind":"winter","start_date":"2026-10-01","end_date":"2027-04-30"}
```

Create a crop cycle through `POST commands/create_crop_cycle/`:

```json
{
  "cycle": {
    "season":"SEASON_UUID","crop":"CROP_UUID","code":"BRINJAL-2026","name":"Brinjal 2026",
    "planned_sowing_date":"2026-11-01","expected_harvest_end":"2027-04-15",
    "expected_yield_qty":"10000","expected_yield_unit":"KG_UNIT_UUID","expected_price_per_unit":"20"
  },
  "blocks":[{"block":"BLOCK_UUID","area_value":"2","area_unit":"ACRE_UNIT_UUID"}]
}
```

Use `"draft":true` inside `cycle` when building a scenario. A `ScenarioCropCycle` can only link a draft cycle.

## Assets and details

Create the registry entry first, then its class detail:

`POST assets/`

```json
{"asset_class":"stock","name":"Urea","code":"UREA"}
```

`POST stock-items/`

```json
{"asset":"ASSET_UUID","base_unit":"KG_UNIT_UUID","stock_kind":"input","valuation_method":"weighted_average","reorder_level":"20"}
```

Use `machine-details/`, `person-details/`, `space-details/`, `living-details/` or `flow-details/` for the other classes. The detail's asset class must match the registry entry. Link a farm block to a space asset through `SpaceDetail.block` for rent accrual.

Stock starts at zero. Never PATCH `on_hand_qty`, lot balances, average cost, head count or machine meters. Purchases/counts/use are events.

## Plan → start → confirm

`POST commands/create_event/`

```json
{
  "client_uuid":"NEW_CLIENT_GENERATED_UUID",
  "event_type":"PROCUREMENT_EVENT_TYPE_UUID",
  "planned_start":"2026-10-30T08:00:00+05:30",
  "planned_end":"2026-10-30T09:00:00+05:30",
  "lines":[
    {"kind":"acquire_stock","asset":"STOCK_ASSET_UUID","qty_unit":"KG_UNIT_UUID","planned_qty":"100","unit_price":"30"},
    {"kind":"pay","asset":"STOCK_ASSET_UUID","qty_unit":"PIECE_UNIT_UUID","planned_qty":"1","amount":"3000","account_id":"CASH_ACCOUNT_UUID","ledger_category_id":"ASSET_PURCHASE_CATEGORY_UUID"}
  ]
}
```

Create the account through `POST accounts/` first, with `name`, `kind` (`cash`, `bank`, etc.) and `opening_date`. `unit_price` is price per **entered unit**. Incoming produce uses `produce_stock` and a zero valuation basis, while purchased inputs use `acquire_stock`.

The event response has its `id`, `status` and `version`. Retrying the identical create body with the same `client_uuid` returns the same event. Reusing the UUID with changed content returns 409.

`POST commands/start_event/`

```json
{"event_id":"EVENT_UUID","version":1}
```

Use the returned version for `POST commands/confirm_event/`:

```json
{"event_id":"EVENT_UUID","version":2}
```

The transition is **planned → in_progress → done**. A new draft uses `"draft":true` at creation and must first go through `plan_event`. Status fields cannot be patched.

Actual quantities default to planned values. Send only changes:

```json
{"event_id":"EVENT_UUID","version":2,"corrections":{"SUB_EVENT_UUID":{"actual_qty":"18"}}}
```

Get line IDs with `GET sub-events/?event=EVENT_UUID`. After an identical confirmation retry, the server returns the confirmed event without duplicating movements. Different actuals require an amendment.

Workers use `submit_event` with the same correction shape. With `require_supervisor_confirmation=true` (default), submission stores actuals without moving stock or money; a supervisor/manager confirms later. Assignment is by a person asset linked to the worker's user, used as the line's `asset` or `operator`.

For crop operations add `targets`:

```json
"targets":[{"crop_cycle":"CYCLE_UUID","block":"BLOCK_UUID","area_value":"2","area_unit":"ACRE_UNIT_UUID"}]
```

Each target's cost share is computed from canonical area. Use `consume_stock` for the input line, `use_machine` for machine hours, `use_labour` for person hours, and `produce_stock` for harvested output.

## Cost rules and depreciation

`POST cost-rules/` accepts `code`, `name`, `rule_type`, `params`, `effective_from`, and `version_no`. Example params for an hourly rule: `{"rate":"150"}`. Create a new version rather than editing an old rule. Assign it using `cost-rule-assignments/` with `asset`, `cost_rule`, `role` (`use` or `holding`), `effective_from`, and optional exclusive `effective_to`.

For a capital purchase, a `pay` line includes `capitalize_to_asset` and `capital_terms`:

```json
{"kind":"pay","asset":"TRACTOR_UUID","capitalize_to_asset":"TRACTOR_UUID","qty_unit":"PIECE_UNIT_UUID","planned_qty":"1","amount":"600000","account_id":"ACCOUNT_UUID","ledger_category_id":"ASSET_PURCHASE_CATEGORY_UUID","capital_terms":{"expected_life_hours":"8000","salvage_value":"0"}}
```

This creates the capital profile when the event is confirmed. A payment capitalized to a space asset **without** `capital_terms` creates a prepaid balance for rent. Use capital terms for a depreciable building instead.

`POST commands/change_depreciation_policy/`

```json
{"asset_id":"TRACTOR_UUID","policy_id":"POLICY_UUID","effective_date":"2026-10-30","preview":true}
```

Inspect the preview, then send `preview:false`. Optional remaining-life overrides require `reason`. Dates at or before the latest depreciation entry are refused. The two supplied methods are hours-of-use and straight-line daily.

## Other commands

All are `POST commands/{name}/`. Send UUID strings and the current `version` where listed.

| Command | Body keys |
|---|---|
| `plan_event`, `start_event`, `cancel_event` | `event_id`, `version` |
| `reschedule_event` | `event_id`, `version`, `start`, `end` |
| `amend_event` | `event_id`, `version`, `reason`, `replacement` (complete new event payload) |
| `duplicate_event` | `event_id`, new `client_uuid`, `planned_start`, `planned_end`, optional `draft` |
| `set_execution` | `event_id`, `version`, `execution` (`operator`, weather/wind/equipment notes, `rain_flag`) |
| `record_observation` | event creation payload using an Observation type, plus `observation` fields |
| `adjust_stock` | event creation payload using Stock adjustment, with signed `adjust_stock` lines and notes |
| `save_type` | `type` with category/header/`lines`; optional `type_id` creates a new version |
| `create_category` | `code`, `name`, `maps_to` (system category UUID) |
| `attach_blocks` | `cycle_id`, `blocks` array |
| `close_cycle` | `cycle_id`, `version` |
| `preview_boundary` | `geometry` (GeoJSON); may return a repaired shape for review |
| `set_boundary` | `block_id`, `version`, `geometry`, optional `source` and `note` |
| `split_block` | `block_id`, `version`, `children` with `code`, `name`, `geometry` |
| `generate_calendar` | `cycle_id`, `template_id` |
| `record_stage` | `cycle_id`, `stage_id`, `observed_on`, `event_id` (observation) |
| `recompute_gdd` | `cycle_id` |
| `decide_suggestion` | `suggestion_id`, `accept`; an event payload if accepting |
| `run_reconciliation` | `start`, `end` (`YYYY-MM-DD`) |
| `compute_metrics`, `adopt_scenario`, `archive_scenario` | `scenario_id` |
| `invite` | `email`, `role_id`; response includes a token to pass to the invited user |
| `change_member` | `member_id`, optional `role_id`, optional `status` |
| `create_role` | `code`, `name` |
| `set_role_permissions` | `role_id`, `codes` (permission code strings) |
| `update_farm` | `farm` (editable settings), `version` |
| `duplicate_configuration` | `resource`, `id`, optional `changes` |
| `ledger_transfer` | `source_id`, `destination_id`, `amount`, `client_uuid`, `at` |
| `record_payment` | event payload containing only pay/receive lines |
| `generate_loan_schedule` | `loan_id` |
| `mark_notification_read` | `notification_id` |

Amendment refuses a second reversal, an event outside the configured 30-day window, reversal that makes stock negative, and capital/disposal amendments. It does not silently release safety windows. See the status document for the remaining reversal restrictions.

## Geometry, files, reporting and sync

- `POST boundaries/import-preview/`: multipart `file` (GeoJSON, KML, zipped shapefile), returns reviewed candidate geometries. Save a selected result through `set_boundary`.
- `GET boundaries/export/`: GeoJSON FeatureCollection, requires land read plus export permission.
- `GET blocks/?bbox=west,south,east,north` or `?contains_point=longitude,latitude`.
- `POST files/upload/`: multipart `file`, `target_type` (e.g. `events.Event`), `target_id`, optional `kind`. JPEG, PNG and PDF, maximum 10 MB. Files are accessed only through `GET files/{id}/download/`.
- `GET reports/{name}/`: `stock-status`, `cash-timeline`, `operation-cost`, `plan-versus-actual`, `crop-cycle-profit-loss`, `availability`, `utilisation`. Financial reports require financial permissions.
- For CSV use `?format=csv`. CSV exports require the export permission.
- `GET sync/`: farm changes with a signed cursor. Next call uses `?cursor=...`. Large result sets must use paginated resource reads; the bounded sync endpoint refuses rather than truncating them.
- `POST sync/`: `{"events":[EVENT_PAYLOAD,...]}`; up to 50 independent idempotent event submissions with per-event results.

## Errors and updates

Errors use `{ "code": "...", "message": "...", "fields": ... }`. A stale version, insufficient stock or reservation conflict gives 409; validation errors give 400; missing permission gives 403; a farm without active membership gives 404.

Configuration updates use PATCH and must include `version`. Do not send server-derived fields. Confirmed records have no generic write/delete API. Database triggers reject updates/deletes on the immutable movement, money, cost, treatment and audit tables.

`docs/openapi.yaml` covers resource models. Command request bodies are generic JSON objects in the schema; this guide defines their command-specific shapes. A generated frontend client therefore still needs explicit command types.
