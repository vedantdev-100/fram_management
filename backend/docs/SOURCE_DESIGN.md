# Farm Management System: Django Backend Design

Backend plan and database design · Version 1.0 · 29 October 2026

## 1. Purpose and scope

This document specifies the Django backend for an event-driven farm management system. It defines the apps, every table, the business rules the code must enforce, role-based access control, the API surface, background jobs, testing and deployment. It contains no code. The React frontend consumes the API defined here.

The system has three parts that meet at one point, the event:

- **Asset management:** records what the farm owns and holds, tracks every use of it through events, and computes cost.
- **Crop science:** a stage-driven crop calendar, observations and rules. It creates planned events; it never owns asset data.
- **Decision workbench:** manual allocation support. The farmer builds scenarios and decides. There is no machine learning or optimization engine.

**Out of scope for version 1:** AI or ML, IoT sensor ingestion, payment gateways, tax filing, a marketplace, native mobile apps.

### Glossary

| Term | Meaning |
| --- | --- |
| Farm | The tenant. All business data belongs to exactly one farm. |
| Block | A piece of land. Large land is split into blocks, and blocks into sub-blocks. Only leaf blocks host crops. |
| Crop cycle | One crop on one or more blocks in one season. The enterprise anchor for cost and yield. |
| Asset | Anything the farm holds or uses: land, machines, people, stock, animals and trees, water and energy sources. |
| Event category | A behavioural group by purpose, such as Crop protection or Crop nutrition. |
| Event type | A reusable template, such as Fungicide spray. Belongs to one category. |
| Event | One instance of an event type on specific dates and targets. Planned or done. |
| Sub-event | One atomic asset movement inside an event: machine use, stock consumed, labour hours, space occupied, stock produced, payment. |
| Reservation | A time window that holds an asset for a planned sub-event. |
| Cost record | The computed resource cost of a sub-event. Distinct from the ledger. |
| Ledger | Actual money movements: cash, bank, credit, loans. |
| Holding cost | Time-based cost of keeping an asset committed, such as rent per day. |
| Idle cost | Holding cost of assets not committed to any crop cycle. |
| Scenario | A manual what-if plan made of draft crop cycles and draft events. |

## 2. Design principles

Every rule below must be enforced in the service layer and, where possible, by database constraints.

1. **Sub-events are the only way asset state changes.** No view, serializer or admin action may edit stock quantity, meter readings or asset status directly.
2. **Strict hierarchy.** Category, then event type, then event, then sub-event. Every sub-event has exactly one parent event, and every event has exactly one event type.
3. **Conservation.** Nothing appears or disappears without a sub-event. Losses, spoilage and stock counts are explicit adjustment sub-events.
4. **Enter cost once.** A purchase moves money into an asset. Cost is recognized later, by computation, when the asset is consumed, used or held.
5. **Crop cycle is the enterprise anchor.** Every cost that can be tied to a crop reaches a crop cycle through allocation.
6. **Three separate records, reconciled.** Ledger (cash truth), asset register (value on hand), event cost record (resource cost). A reconciliation identity ties them together.
7. **Plans are events.** A planned event and a done event are the same rows with different status, so plan-to-actual needs no copying.
8. **History is immutable.** Confirmed rows are never edited or deleted. Corrections are reversals plus new rows. Template changes never alter past events.
9. **Farm scoping everywhere.** Every query is filtered by farm, role permission and optional block scope.
10. **Business logic lives in services.** Views and serializers validate and delegate. One command equals one database transaction.
11. **Exception-based capture.** Planned values are the default actual. The client sends only corrections. The server computes everything derived.
12. **Idempotent writes.** Client-generated UUIDs make offline retries safe.

## 3. Technology stack and conventions

| Component | Choice | Reason |
| --- | --- | --- |
| Framework | Django, current LTS release at project start | Stability and long support |
| API | Django REST Framework, django-filter, drf-spectacular | Standard REST, filtering, OpenAPI schema for the React client |
| Database | PostgreSQL | Needs range types, exclusion constraints, JSONB, partial indexes |
| Geometry | PostGIS with GeoDjango (required) | Block boundaries, areas, locations and spatial validation. Enabled from the first migration |
| Background jobs | Celery with Redis, Celery beat | Daily accruals, reminders, reconciliation |
| Auth | Custom User model from day one; JWT with refresh rotation (SimpleJWT) | Works for web and later mobile |
| File storage | S3-compatible via django-storages | Photos and bills; local disk in development |
| Configuration | Environment variables; split settings: base, dev, prod, test | Safe deployments |
| Testing | pytest-django, factory\_boy, hypothesis | Property tests for the conservation rules |
| Quality | ruff, pre-commit, type hints on services | Consistency |
| Observability | Structured logging, Sentry, health and readiness endpoints | Operations |

**Conventions:** URL prefix /api/v1/. snake\_case fields. Primary keys are UUIDs. All timestamps are stored in UTC; each farm has a timezone used for date-based logic. Money is a fixed-point decimal, never a float. Choices use text enums with database CHECK constraints.

## 4. Project layout and app map

```
backend/
  config/        settings (base, dev, prod, test), urls, celery, asgi, wsgi
  apps/
    core/ identity/ catalogue/ land/ assets/ scheduling/
    events/ cropscience/ ledger/ costing/ compliance/
    workbench/ files/ notifications/ audit/ reporting/
  tests/         unit, service, api, scenario (golden) tests
  requirements/  base, dev, prod
  docs/          this document, decision records
```

**Naming note:** the word accounts is avoided. identity holds users and access control. ledger holds money.

| App | Responsibility | Direct dependency |
| --- | --- | --- |
| core | Abstract base models, ID and soft-delete rules, farm-scoped manager, money and quantity helpers, error types | none |
| identity | User, Farm (tenant root), roles, permissions, memberships, invitations | core |
| catalogue | Units, crops, varieties, products and their label data, purpose tags, grades, counterparties | identity |
| land | Blocks and boundaries, seasons, crop cycles, block access scopes | catalogue |
| assets | Asset registry, per-class details, stock items and lots, cost rule assignments, tenure | land |
| scheduling | Reservations, restriction windows, availability calendars | assets |
| events | Event categories and types, events, sub-events, targets, observations, the command pipeline | scheduling |
| cropscience | Stage models, calendar templates, stage records, weather, threshold rules | events |
| ledger | Ledger accounts, entries, loans, receivable and payable tracking | events |
| costing | Cost rules, depreciation framework, cost records, allocations, holding accruals, valuation snapshots, reconciliation | ledger |
| compliance | Treatment records, safety checks and overrides | events |
| workbench | Scenarios, assumptions, metrics, decision journal, investment comparisons | costing, cropscience |
| files | Attachments for any record | core |
| notifications | Reminders and alerts | core |
| audit | Command audit log | core |
| reporting | Read-only query services and database views | all |

**Dependency rules:**

- Model-level dependencies must form a one-way chain with no cycles. The table lists the direct dependency; each app may also use anything below it.
- Higher apps react to events through **domain hooks** (section 9), not by being imported by the events app. For example, ledger and costing register handlers that run when an event is confirmed.
- Only the events app writes sub-events. Other apps request changes by calling events services.
- Observations are events (category Observation) with an extension table in events, which removes any cycle between events and cropscience.

## 5. Cross-cutting model conventions

| Convention | Rule |
| --- | --- |
| Base model | id (UUID), created\_at, updated\_at, created\_by, updated\_by, version (integer for optimistic locking) |
| Farm scoping | Every business table has farm (required, indexed). All unique constraints include farm. A custom manager exposes a for\_farm filter. |
| Soft delete | Configuration rows (types, products, assets, blocks) use is\_active or archived\_at. Confirmed transactional rows are never deleted. |
| Immutable tables | Ledger entries, stock movements, cost records, cost allocations, depreciation entries, treatment records, audit log. Corrections create a reversing row linked by reversal\_of. |
| Money | Decimal, 14 digits, 2 decimals. One currency per farm. Rates use 4 decimals. |
| Quantities | Decimal, 14 digits, 4 decimals. Stored in the unit entered and in the canonical base unit (kg, L, m², hours). Reports use canonical values. |
| Units | Conversion factors live in catalogue Unit. Farms may add local units (for example a regional land unit) with their own factor. |
| Client UUID | client\_uuid on events, sub-events, ledger entries and observations. Unique per farm. A repeat submission returns the original row. |
| Dates | Timestamps in UTC. Date-based logic (accruals, daily reports) uses the farm timezone. |
| Status fields | Text enums with CHECK constraints. Legal transitions are enforced in services (section 8). |
| Flexible attributes | A JSONB column named attributes is allowed for descriptive extras. Never put fields you filter, sum or join on into JSONB. |
| Audit | Every command writes one audit row. Configuration tables also use field-level history (django-simple-history or equivalent). |

## 6. Database model

Notation: FK is a foreign key; nullable means the column may be empty. Every business table also carries the base fields and farm from section 5. Where a table says farm nullable, an empty farm means a system-provided row shared by all farms.

### 6.1 identity

| Table | Key fields | Notes |
| --- | --- | --- |
| User | email (unique login), phone (optional, unique), full\_name, preferred\_language, timezone, is\_active, is\_staff, last\_login, password hash | Custom user model. The staff flag is for platform support only, never for farm roles. |
| Farm | name, slug (unique), country, region, timezone, currency\_code, default\_area\_unit, default\_valuation\_method (weighted average), imputed\_labour\_rate (per hour, for unpaid family labour), shared\_cost\_split (by area, equal, by product cost), require\_supervisor\_confirmation (default true), fiscal\_year\_start\_month, is\_active | Tenant root. The imputed rate lets cost views show results with and without family labour. |
| PermissionCode | code (unique, such as events.event.confirm), module, description | Seeded by migration. The catalogue of every checkable action. |
| Role | farm (nullable), code, name, description, is\_system | System roles are templates copied to a farm on creation. Owners may adjust their copies. |
| RolePermission | role FK, permission FK | Unique together. |
| Membership | user FK, farm FK, role FK, status (invited, active, suspended), joined\_at | Unique on user and farm. One role per membership. |
| Invitation | farm FK, email, role FK, token\_hash, expires\_at, accepted\_at, invited\_by FK | Tokens are stored hashed. |

Block-level access scoping lives in land (6.3) to avoid a dependency cycle.

### 6.2 catalogue

| Table | Key fields | Notes |
| --- | --- | --- |
| Unit | farm (nullable), code, name, dimension (mass, volume, area, time, count, length, energy), to\_base\_factor, is\_system | Base units: kg, L, m², hour, piece, m, kWh. Farm-defined units cover local land and weight measures. |
| PurposeTag | code, name, sort\_order | System list: nutrition, disease control, weed control, pest control, irrigation, planting, harvest, maintenance, general. Used on sub-events for tank mixes and cost analysis by purpose. |
| Crop | farm (nullable), name, scientific\_name, category, lifecycle (annual, biennial, perennial), default\_yield\_unit FK, is\_active | System crops are a starter list. Farms add their own. |
| Variety | crop FK, name, typical\_duration\_days, attributes | Optional layer under a crop. |
| ProductCategory | code, name, default\_purpose\_tag FK, is\_regulated | Examples: fertiliser, fungicide, herbicide, insecticide, seed, fuel, feed, packaging. Regulated categories trigger compliance records. |
| Product | farm (nullable), name, category FK, default\_unit FK, manufacturer, active\_ingredient, formulation, mode\_of\_action\_group, registration\_no, notes, is\_active | Label values are entered by the farmer from the product label. The system never supplies doses. |
| ProductCropLabel | product FK, crop FK, dose\_min, dose\_max, dose\_unit FK, per\_area\_unit FK, waiting\_period\_days, reentry\_hours, max\_applications\_per\_cycle, min\_interval\_days | Label limits depend on the crop, so they sit here and not on Product. Drives safety checks. |
| ProduceGrade | crop FK, code, name, sort\_order | Quality grades for harvested produce. |
| Counterparty | farm FK, name, kind (supplier, buyer, landlord, lender, labour contractor, government, other), phone, address, notes | Shared by purchases, sales, leases and loans. |

### 6.3 land

| Table | Key fields | Notes |
| --- | --- | --- |
| Block | parent FK (self, nullable), code, name, area\_value, area\_unit FK, area\_m2, geometry (PostGIS polygon, see 6.3a), area\_source, centroid, soil\_type, status (active, fallow, retired), notes | Unique code per farm. Only leaf blocks may host crop cycles. A parent’s area must equal the sum of its children (validated on save). |
| BlockAccess | membership FK, block FK, access\_level (view, record, manage) | Optional scope for workers and supervisors. No rows for a membership means farm-wide access as granted by the role. Rows limit that membership to the listed blocks and their descendants. |
| Season | name, kind (configurable label such as monsoon, winter, summer, annual), start\_date, end\_date, status (planned, active, closed) | Groups crop cycles for reporting. Seasons of different kinds may overlap. |
| CropCycle | season FK, crop FK, variety FK (nullable), code, name, status (draft, planned, active, harvesting, closed, abandoned), planned\_sowing\_date, actual\_sowing\_date, expected\_harvest\_start, expected\_harvest\_end, actual\_harvest\_end, expected\_yield\_qty, expected\_yield\_unit FK, expected\_price\_per\_unit, notes | The enterprise anchor. Draft status is used by workbench scenarios. Unique code per farm. |
| CropCycleBlock | crop\_cycle FK, block FK, area\_value, area\_unit FK, area\_m2, is\_intercrop | Links a cycle to the blocks it uses and the area on each. Validation: on any block, the summed area of overlapping non-draft cycles may not exceed the block area unless is\_intercrop is set. |

A block’s tenure, rent and depreciation belong to its Space asset in the assets app, which points back to the block.

### 6.3a Spatial model (PostGIS)

PostGIS is part of the foundation from the first migration. Blocks are drawn or imported as boundaries, and the server is the authority for area and spatial validity.

**Stack and setup**

- PostgreSQL with the PostGIS extension, enabled in the first migration. GeoDjango (django.contrib.gis) provides geometry fields and spatial queries.
- GDAL, GEOS and PROJ are installed in the container image and in CI. A CI job runs the spatial tests against a PostGIS service.
- Coordinates are stored as WGS 84 longitude and latitude (SRID 4326). Area and length are computed on the geography type (or in a local projected system), never on planar degrees.

**New and changed tables**

| Table | Key fields | Notes |
| --- | --- | --- |
| BlockBoundaryRevision (new, land) | block FK, geometry (polygon or multipolygon, SRID 4326), area\_m2, source (drawn on map, imported file, GPS walk), effective\_from, note, created\_by | Immutable history of boundary changes. Block geometry always equals the latest revision, so reports can show how area changed between seasons. |
| Block (changed) | geometry (current boundary), area\_source (drawn or entered), centroid (derived point) | When area\_source is drawn, area\_m2 is computed from the geometry and area\_value is derived in the farm’s display unit. Entered area is allowed where no boundary exists yet. |
| CropCycleBlock (changed) | geometry (optional polygon) | Used when a crop covers only part of a block. Must lie inside the block; area is derived from it. |
| EventTarget (changed) | covered\_geometry (optional polygon) | Optional proof of the area actually treated. area\_value stays the authoritative number for costing. |
| SpaceDetail (changed) | location (point or polygon) | Sheds, wells, ponds and stores placed on the map. |
| ObservationDetail and Attachment (changed) | geotag as a point | Photos and observations placed on the map. |

**Validation rules (service layer)**

1. Geometry must be valid. Invalid shapes are repaired with a make-valid step, and the user sees the result before saving.
2. A child block must lie inside its parent, within a small tolerance (default 1 meter).
3. Sibling leaf blocks may not overlap beyond a tolerance (default 1 percent of the smaller area). This is a service check, not a database exclusion constraint, because a constraint on bounding boxes would also reject blocks that only touch.
4. A parent’s area equals the sum of its children, within tolerance.
5. The summed area of overlapping non-draft crop cycles on a block may not exceed the block area unless intercrop is set (unchanged from 6.3).
6. Changing a boundary creates a new BlockBoundaryRevision. Existing crop cycles keep the area they were created with.

**Indexes:** GiST indexes on Block geometry, ObservationDetail geotag, SpaceDetail location and EventTarget covered\_geometry.

**Import and export:** GeoJSON, KML and zipped shapefiles are read through GDAL, validated, previewed, then saved as boundary revisions. Export is GeoJSON.

**API:** geometry travels as GeoJSON (RFC 7946). Block endpoints support a bounding-box filter, a contains-point filter, and actions to split and merge blocks. List endpoints return simplified geometry for map display; detail endpoints return full precision.

**Weather link:** the block centroid is the location used to load weather for degree-day calculations.

**Privacy:** boundaries and locations are visible only to farm members with land read permission. They never appear in public endpoints, and exports need the export permission.

**Roles:** drawing or editing boundaries needs the permission land.block.edit\_boundary, granted to Owner and Manager by default.

### 6.4 assets

Design: one registry table (Asset) plus one-to-one detail tables per class. Stock is modelled as an item (what it is) and lots (what you bought, when, at what cost). Quantities and values change only through movement ledgers in the events app (6.6).

| Table | Key fields | Notes |
| --- | --- | --- |
| Asset | asset\_class (space, machine, person, stock, living, flow), name, code, description, status (active, maintenance, retired), acquired\_on, retired\_on, home\_location FK (space asset, nullable), attributes | The registry. One row per thing the farm tracks. Available, reserved and in use are derived from reservations, not stored. Only active, maintenance and retired are stored. |
| SpaceDetail | asset 1:1, block FK (nullable, 1:1), space\_type (land, shed, store, cold store, well, pond, other), capacity\_value, capacity\_unit FK, location (PostGIS point or polygon, optional) | Land spaces link to a Block. Stores and sheds act as storage locations for stock lots. |
| MachineDetail | asset 1:1, machine\_type, make, model, year, meter\_hours (cache), fuel\_stock\_item FK (stock asset), fuel\_rate\_per\_hour, capacity\_note | meter\_hours is a cache of the MeterEntry ledger. Fuel is a separate stock item so cost is never counted twice. |
| PersonDetail | asset 1:1, user FK (nullable), person\_type (family, permanent, seasonal, contract), skills, phone, wage\_basis (hourly, daily, monthly), is\_paid | Links a worker to a login if they have one. Unpaid family labour is costed at the farm’s imputed rate. |
| StockItem | asset 1:1, product FK (nullable), crop FK (nullable, for produce), stock\_kind (input, produce, by-product, consumable, packaging), base\_unit FK, valuation\_method (weighted average by default, FIFO optional), on\_hand\_qty (cache), avg\_unit\_cost (cache), reorder\_level, shelf\_life\_days | Caches are sums of StockMovement and are rebuildable by a maintenance command. |
| StockLot | stock\_item FK, lot\_code, supplier FK (counterparty), received\_on, expiry\_date, initial\_qty, remaining\_qty (cache), unit\_cost, storage\_location FK (space asset), grade FK (nullable), source\_sub\_event FK | Gives traceability. Consumption picks lots by earliest expiry first. Produce lots link to the harvest sub-event and crop cycle. |
| LivingDetail | asset 1:1, living\_type (animal group, single animal, orchard, tree block), species, head\_count (cache), start\_date, lifecycle\_stage, block FK (nullable) | Animals and perennials. Head count changes only through LivingEntry rows. |
| FlowDetail | asset 1:1, flow\_type (water, electricity, diesel feed, solar), source\_description, unit FK, rated\_capacity, is\_metered | Flows are often unmetered. Estimation uses a cost rule and runtime. |
| Tenure | asset FK, owner\_party FK (counterparty, empty means the farm), holder\_party FK, user\_party FK, tenure\_kind (owned, leased in, leased out, shared crop, borrowed, hired), start\_date, end\_date, rent\_amount, rent\_period (day, month, year, season), payment\_terms, notes | Separates legal owner, current holder and user. Many rows per asset over time. Lease terms drive the holding-cost rule for rented assets. |

### 6.5 scheduling

Scheduling holds the inputs that the event planner checks against. Reservations themselves live in events (6.6) because they point at sub-events.

| Table | Key fields | Notes |
| --- | --- | --- |
| AvailabilityWindow | asset FK, kind (shift, downtime, leave, maintenance), window (start and end), capacity\_hours (for people), recurrence\_rule (optional), reason | Defines when an asset can be used. People get shifts with hours per day. Machines get downtime. |
| RestrictionWindow | farm FK, block FK or asset FK, window (start and end), restriction\_kind (re-entry, no spray, no harvest), source\_type, source\_id, reason | Created by compliance when a spray sets a re-entry period. source\_type and source\_id are plain references, not foreign keys, to keep the dependency chain one-way. The planner refuses conflicting events. |

### 6.6 events

This is the core of the system. Everything that changes asset state starts here.

**Configuration tables**

| Table | Key fields | Notes |
| --- | --- | --- |
| EventCategory | farm (nullable), code, name, maps\_to FK (self, a system category), is\_system, sort\_order, allowed\_sub\_event\_kinds, requires\_crop\_target, requires\_safety\_record, creates\_stock, involves\_cash, cost\_bucket (operation, holding, overhead, none) | Behaviour sits on the category. System categories are locked: Land preparation, Planting, Crop nutrition, Crop protection, Water management, Crop care, Harvest, Post-harvest, Livestock care, Maintenance, Procurement, Sales, Stock adjustment, Observation, Lease and tenure, System accrual. A farm-defined category must set maps\_to so reports can roll up to a system category. |
| EventType | farm (nullable), category FK, code, name, is\_active, target\_kind (crop cycle, block, asset, none), allows\_multiple\_targets, default\_duration\_minutes, min\_interval\_days, max\_repeats\_per\_cycle, current\_version\_no | The reusable template header. Farmers create and rename types freely. Types are merged, never deleted. |
| EventTypeVersion | event\_type FK, version\_no, created\_at, is\_current | Editing a type creates a new version. Past events keep the version they were made from. |
| EventTypeLine | event\_type\_version FK, line\_no, sub\_event\_kind, asset\_class, default\_asset FK (nullable), product\_category FK (nullable), purpose\_tag FK, quantity\_basis (per area, per machine hour, fixed, per head, derived), default\_qty, qty\_unit FK, is\_required, is\_locked | One template line per sub-event. Locked lines (for example the product and quantity on a regulated spray) cannot be removed from a customised copy. |

**Transaction tables**

| Table | Key fields | Notes |
| --- | --- | --- |
| Event | event\_type FK, event\_type\_version FK, title, status (draft, planned, in progress, done, cancelled), planned\_start, planned\_end, actual\_start, actual\_end, trigger\_kind (calendar, observation, manual, system, scenario), trigger\_event FK (nullable), calendar\_item\_ref, scenario\_ref, sequence\_in\_cycle, planned\_cost\_total (cache), actual\_cost\_total (cache), notes, client\_uuid, submitted\_by FK, submitted\_at, confirmed\_by FK, confirmed\_at, reversal\_of FK (self, nullable) | One instance of a type. calendar\_item\_ref and scenario\_ref are plain UUID references to cropscience and workbench rows, not foreign keys. |
| EventTarget | event FK, crop\_cycle FK (nullable), block FK (nullable), asset FK (nullable), area\_value, area\_unit FK, area\_m2, share\_fraction, covered\_geometry (optional PostGIS polygon) | One row per target. A spray across three crop cycles has three rows. share\_fraction defaults to area share and drives cost splitting. |
| EventExecution | event FK 1:1, operator FK (person asset), weather\_note, wind\_note, rain\_flag, equipment\_note | Captured at completion. Feeds compliance records. |
| SubEvent | event FK, line\_no, kind (use machine, use labour, consume stock, occupy space, produce stock, transfer stock, adjust stock, living gain, living loss, pay, receive, accrue), asset FK, purpose\_tag FK, status (planned, reserved, in use, done, cancelled, void), planned\_qty, actual\_qty, qty\_unit FK, qty\_canonical, planned\_start, planned\_end, actual\_start, actual\_end, counterparty FK (nullable), unit\_price, amount, stock\_lot FK (nullable), capitalize\_to\_asset FK (nullable), operator FK (nullable), notes, client\_uuid | The atomic movement. Unique on event and line\_no. Rules by kind are in section 9. |
| Reservation | sub\_event FK, asset FK, mode (exclusive, shared, capacity share), window (start and end), qty\_reserved, status (active, released, converted, cancelled) | An exclusion constraint forbids two active exclusive reservations on the same asset with overlapping windows. Stock reservations reduce free quantity and need no window rule. |
| ObservationDetail | event FK 1:1, observation\_kind (growth stage, pest, disease, weed, soil moisture, nutrient deficiency, weather damage, general), severity, metric\_name, metric\_value, metric\_unit, stage\_code, location\_note, geotag (PostGIS point), follow\_up\_of FK (event, nullable) | Observations are events in the Observation category. Stage observations feed re-forecasting in cropscience. |

**Immutable movement ledgers** (written only by the confirm pipeline, corrected only by reversal)

| Table | Key fields | Notes |
| --- | --- | --- |
| StockMovement | sub\_event FK, stock\_item FK, lot FK (nullable), movement\_type (in, out, adjust in, adjust out), qty\_canonical, unit\_cost, value, occurred\_at, reversal\_of FK | The source of truth for stock quantity and value. StockItem and StockLot caches are sums of these rows. |
| MeterEntry | sub\_event FK, machine FK, delta\_hours, reading\_after, occurred\_at | The machine hour ledger. Drives usage-based depreciation. |
| LivingEntry | sub\_event FK, living asset FK, delta\_count, reason (birth, purchase, sale, death, transfer), occurred\_at | The head count ledger for animals and tree stands. |

### 6.7 cropscience

| Table | Key fields | Notes |
| --- | --- | --- |
| CropStageModel | farm (nullable), crop FK, variety FK (nullable), name, basis (days after sowing or growing degree days), base\_temp\_c, upper\_temp\_c | Describes how a crop develops. Region and variety specific, so farmers can copy and edit. |
| CropStage | stage\_model FK, code, name, order\_no, start\_threshold, end\_threshold, is\_critical | Examples: germination, vegetative, flowering, fruit set, maturity. Thresholds are days or degree-days from the anchor. |
| CalendarTemplate | farm (nullable), crop FK, variety FK (nullable), name, stage\_model FK, version\_no, region\_note, is\_active | A predefined or farmer-built plan for one crop. |
| CalendarTemplateItem | template FK, event\_type FK, label, anchor (sowing, stage start, stage end, previous item), stage FK (nullable), offset\_days\_min, offset\_days\_max, repeat\_every\_days, repeat\_max, is\_optional, notes | One planned operation. Repeats produce numbered planned events. |
| CropCycleCalendar | crop\_cycle FK 1:1, template FK, template\_version\_no, anchor\_date, generated\_at | Records which template version produced a cycle’s plan. |
| CropStageRecord | crop\_cycle FK, stage FK, observed\_on, source\_event FK (observation), basis (estimated, observed) | A new observed record triggers re-forecasting of later planned events. |
| WeatherDaily | farm FK, block FK (nullable), date, tmin\_c, tmax\_c, rain\_mm, source (manual or service), is\_forecast | Input for degree-day calculation. Optional in version 1. |
| GddDaily | crop\_cycle FK, date, gdd, cumulative\_gdd | Derived and rebuildable. |
| ThresholdRule | farm (nullable), crop FK, observation\_kind, metric\_name, operator, threshold\_value, severity\_min, recommended\_event\_type FK, message, is\_active | Turns an observation into a suggestion, never into an automatic action. |
| Suggestion | farm FK, crop\_cycle FK, source\_event FK (observation), rule FK, recommended\_event\_type FK, status (open, accepted, dismissed), decided\_by FK, decided\_at, resulting\_event FK (nullable) | The farmer accepts or dismisses. Accepting creates a planned event of the recommended type. |

### 6.8 ledger

The ledger records actual money only. It answers where the money is and when it moved. It never computes cost.

| Table | Key fields | Notes |
| --- | --- | --- |
| LedgerAccount | kind (cash, bank, mobile wallet, loan payable, supplier credit payable, buyer credit receivable, advance), name, counterparty FK (nullable), opening\_balance, opening\_date, is\_active | One currency per farm. Balance equals opening plus entries in minus entries out. |
| LedgerCategory | farm (nullable), code, name, kind (asset purchase, operating payment, loan principal, interest, sales receipt, subsidy, other income, transfer), parent FK (self) | Classification for cash reports only. Not the same thing as a cost bucket. |
| LedgerEntry | account FK, entry\_date, direction (in or out), amount (always positive), category FK, counterparty FK, sub\_event FK (nullable), event FK, reference\_no, status (pending or cleared), due\_date, memo, transfer\_group (nullable, links the two sides of an internal transfer), client\_uuid, reversal\_of FK | Immutable. Entries created by pay and receive sub-events carry the sub-event link. Buying an asset creates an entry here but no cost. |
| Loan | lender FK (counterparty), account FK, principal, interest\_rate, rate\_basis (flat or reducing), start\_date, term\_months, purpose, status | Interest paid is later costed as a holding cost on capital. |
| LoanScheduleRow | loan FK, due\_date, principal\_due, interest\_due, status (due, paid, overdue), ledger\_entry FK (nullable) | Drives reminders and the cash timeline. |

### 6.9 costing

Costing turns sub-events into resource cost, allocates it, and reconciles it with the ledger and the asset register.

| Table | Key fields | Notes |
| --- | --- | --- |
| CostRule | farm (nullable), code, name, rule\_type (hourly rate, daily rent, wage per hour, imputed labour, stock average, flow estimate, fixed per event), params (validated per rule type: rate, flow rate, rent basis), version\_no, effective\_from, effective\_to, is\_active | Versioned. Changing parameters creates a new row; old rows stay for audit and repeatability. |
| AssetCostRuleAssignment | asset FK, cost\_rule FK, role (use or holding), effective\_from, effective\_to | Which rule prices the use of an asset and which prices holding it. History is preserved. |
| CostRecord | sub\_event FK, event FK, cost\_nature (consumption, machine use, depreciation, labour, flow, holding, loss), basis\_qty, basis\_unit FK, rate\_used, amount, rule FK, rule\_version\_no, occurred\_on, reversal\_of FK | Immutable computed cost of one sub-event. Stores the rate and rule version so any figure can be audited. |
| CostAllocation | cost\_record FK, bucket (operation, holding, idle, overhead), crop\_cycle FK (nullable), purpose\_tag FK, event\_target FK (nullable), share\_fraction, amount | Splits a cost record across crop cycles, purposes or the idle bucket. Allocations of one record always sum to its amount. Immutable. |
| HoldingAccrualRun | farm FK, accrual\_date, status, started\_at, finished\_at, rows\_created | Unique on farm and date, which makes the daily job safe to repeat. |
| AssetValuation | asset FK, as\_of\_date, value, basis (stock: quantity times average cost; machine: cost less accumulated depreciation; prepaid: remaining amount; living: carrying value), components | Periodic snapshots of the asset register. Derived and rebuildable. |
| EventCostSummary | event FK 1:1, planned\_total, actual\_total, cost\_per\_area, variance, breakdown by cost\_nature | Derived cache for fast operation analysis. Rebuilt from cost records. |
| CropCycleCostSummary | crop\_cycle FK, as\_of\_date, operation\_cost, holding\_cost, revenue, margin, cost\_per\_area, margin\_per\_area, labour\_hours | Derived cache for the crop cycle view. |
| ReconciliationRun | farm FK, period\_start, period\_end, cash\_spent\_on\_assets, change\_in\_register\_value, cost\_recognised, difference, status (balanced or off), tolerance, details, run\_at | Result of the identity check described in section 10. |

### 6.9a Depreciation tables (costing)

Depreciation is a framework, not a cost rule. These four tables let any asset use any registered depreciation method and switch methods later without rewriting history. The strategies themselves are described in 10.3a.

| Table | Key fields | Notes |
| --- | --- | --- |
| AssetCapitalProfile | asset FK 1:1, in\_service\_date, acquisition\_cost, capital\_additions\_total (cache), salvage\_value, expected\_life\_hours, expected\_life\_years, notes | Capital facts about a depreciable asset. acquisition\_cost is copied from the acquire sub-event. Each strategy reads whichever life measure it needs. |
| DepreciationPolicy | farm (nullable), code, name, strategy\_code, params (validated against the strategy’s schema), version\_no, is\_active | A named configuration of a strategy, such as Machines per hour or Buildings straight line. Versioned. System rows are templates a farm can copy. |
| AssetDepreciationAssignment | asset FK, policy FK (a specific version), effective\_from, effective\_to (empty while current), base\_book\_value, remaining\_life\_hours, remaining\_life\_years, reason, created\_by | Which policy applies to an asset in which period. A database exclusion constraint forbids overlapping periods for one asset. Book value and remaining life are snapshotted at the start of each period, so a method switch starts from the real book value. |
| DepreciationEntry | asset FK, assignment FK, entry\_date, amount, basis\_kind (hours, days, area, other), basis\_qty, strategy\_code, policy\_version\_no, source\_sub\_event FK (nullable), cost\_record FK, book\_value\_after, reversal\_of FK | The immutable depreciation ledger. Book value on any date equals acquisition cost plus capital additions minus the sum of entries. Entries never take book value below salvage value. |

**Related changes**

- CostRule no longer carries depreciation rule types (see 10.3).
- AssetValuation for machines and other depreciable assets is computed from DepreciationEntry.
- SubEvent gains an optional capitalize\_to\_asset reference, used when an overhaul or major improvement should raise an asset’s depreciable base instead of being expensed.

### 6.10 compliance

| Table | Key fields | Notes |
| --- | --- | --- |
| TreatmentRecord | event FK, crop\_cycle FK, block FK, product FK, stock\_lot FK, qty\_applied, qty\_unit FK, area\_covered\_m2, dose\_per\_area, applied\_at, operator FK, weather\_note, mode\_of\_action\_group, waiting\_period\_ends\_on, reentry\_ends\_at, reversal\_of FK | Immutable. Created for every regulated product sub-event on confirmation. The traceability source from crop cycle back to lot and supplier. |
| ComplianceCheck | event FK, sub\_event FK (nullable), check\_code (waiting period conflict, max applications exceeded, minimum interval not met, dose outside label, re-entry conflict, expired lot, stock insufficient, repeated mode of action), result (pass, warn, block), message, evaluated\_at | Stored results of planning and confirmation checks. |
| ComplianceOverride | check FK, overridden\_by FK, reason, created\_at | A block can be overridden only by a role holding the override permission, and a reason is required. |

### 6.11 workbench

The workbench never decides. It computes arithmetic and shows conflicts so the farmer can choose.

| Table | Key fields | Notes |
| --- | --- | --- |
| Scenario | season FK, name, description, status (draft, compared, adopted, archived), based\_on FK (self, nullable), adopted\_at | A manual what-if plan. Drafts are the same rows as live plans, marked by status. |
| ScenarioAssumption | scenario FK, key (price multiplier, yield multiplier, wage rate, fuel price, rent), crop FK (nullable), value | The what-if switches, for example price down 20 percent. |
| ScenarioCropCycle | scenario FK, crop\_cycle FK | Links draft crop cycles to a scenario. Draft events carry the scenario reference. |
| ScenarioMetric | scenario FK, metric\_code (profit, revenue, operation cost, holding cost, cash low point, cash low date, peak labour hours, peak week, water use, conflict count, margin per area, margin per labour hour), crop\_cycle FK (nullable), value, computed\_at, assumptions\_hash | Stored results for side-by-side comparison. Recomputed on request. |
| DecisionJournal | decided\_on, decided\_by FK, title, decision\_text, reason, assumptions, expected, scenario FK (nullable), crop\_cycle FK (nullable), event FK (nullable), review\_on, outcome\_text, outcome\_logged\_at | The manual learning loop. After review the system shows expected beside actual. |
| InvestmentAnalysis | name, option\_kind (buy, lease, hire, skip), asset\_class, inputs (price, life, hours per year, rent, hire rate, interest), results (annual cost, cost per hour, payback), decision FK (nullable) | Simple calculators for acquisition decisions. |

Adopting a scenario turns its draft crop cycles and draft events into planned ones, creates reservations, and clears the draft marker, all in one transaction.

### 6.12 files, notifications, audit

| Table | Key fields | Notes |
| --- | --- | --- |
| Attachment | file path, original\_name, content\_type, size, kind (photo, bill, certificate, other), uploaded\_by FK, taken\_at, geotag (PostGIS point), target\_type, target\_id | Linked by type and id (no foreign key) so any record can carry files. Access checks follow the target record. |
| Notification | recipient FK (user), kind, title, body, related\_type, related\_id, due\_at, read\_at, status (pending, sent, dismissed), channel (in app, email) | Overdue events, low stock, waiting period ending, reservation conflicts, loan due dates. |
| ReminderRule | kind, lead\_time, channel, is\_active | Per-farm reminder preferences. |
| AuditLog | user FK, command\_name, target\_type, target\_id, payload (redacted), result (success or rejected), ip\_address, user\_agent, created\_at | Append only. One row per command, including rejected ones. |

## 7. Relationship overview

```
Farm
 |-- Membership --> User, Role --> RolePermission --> PermissionCode
 |-- Block (self tree) --> BlockAccess --> Membership
 |-- Season --> CropCycle --> CropCycleBlock --> Block
 |-- Asset --> (Space | Machine | Person | StockItem | Living | Flow) detail
 |              |-- Tenure, AssetCostRuleAssignment --> CostRule
 |              |-- StockItem --> StockLot
 |-- EventCategory --> EventType --> EventTypeVersion --> EventTypeLine
 |-- Event --> EventType (+ version)
 |      |-- EventTarget --> CropCycle / Block / Asset
 |      |-- EventExecution, ObservationDetail
 |      |-- SubEvent --> Asset
 |             |-- Reservation
 |             |-- StockMovement / MeterEntry / LivingEntry
 |             |-- LedgerEntry (pay and receive)
 |             |-- CostRecord --> CostAllocation --> CropCycle / idle
 |             |-- TreatmentRecord, ComplianceCheck
 |-- CalendarTemplate --> CalendarTemplateItem --> EventType
 |-- CropCycleCalendar --> CalendarTemplate ; CropStageRecord ; GddDaily
 |-- Scenario --> ScenarioCropCycle --> CropCycle (draft) ; draft Events
 |-- LedgerAccount --> LedgerEntry ; Loan --> LoanScheduleRow
```

The three records meet at the sub-event: the ledger entry (money), the movement rows (asset register) and the cost record (resource cost) all point back to the same sub-event, which is what makes reconciliation possible.

## 8. State machines

| Entity | States | Transitions and rules |
| --- | --- | --- |
| Event | draft, planned, in progress, done, cancelled | Draft to planned when reservations succeed. Planned to in progress when the first sub-event starts. In progress to done only through the confirm command. Cancel is allowed while no sub-event is done; it releases all reservations. Done is final; changes are made by amendment (reversal plus new event). Awaiting confirmation is a computed flag when planned\_end has passed and the event is not done. |
| SubEvent | planned, reserved, in use, done, cancelled, void | Reserved when its reservation exists. In use when started. Done on confirm. Void only through reversal. Status changes are made by event commands, never directly. |
| Reservation | active, released, converted, cancelled | Converted on confirm. Released or cancelled when the event or sub-event is cancelled or rescheduled. |
| CropCycle | draft, planned, active, harvesting, closed, abandoned | Draft to planned on scenario adoption or direct creation. Active when actual sowing is confirmed. Harvesting at the first harvest sub-event. Closed manually after the last sale or by a close command; closed cycles accept only sales, adjustments and amendments. Abandoned records crop loss. |
| Asset (stored status) | active, maintenance, retired | Maintenance blocks new reservations. Retired blocks new use but keeps history. Reserved and in use are derived from reservations and sub-events. |
| Scenario | draft, compared, adopted, archived | Adopted is one-way and runs the adoption command. |

## 9. Services and the command pipeline

All business logic sits in service modules inside each app. A command validates, locks, applies and records in one database transaction. A failed command changes nothing.

### 9.1 Command list

| Command | Owner | Purpose |
| --- | --- | --- |
| create\_event | events | Build an event from an event type version: copy lines into sub-events, compute planned quantities from target area, estimate planned cost, run planning checks, create reservations. |
| reschedule\_event | events | Shift the event and all sub-event windows, re-run availability and restriction checks, move reservations in one step. |
| cancel\_event | events | Cancel the event and release all reservations. |
| start\_event | events | Mark the event in progress and start its sub-events. |
| confirm\_event | events | The main command. Section 9.2. |
| amend\_event | events | Reverse a confirmed event’s effects and create a corrected one. Restricted by permission and a time window. |
| record\_observation | events | Create an observation event and evaluate threshold rules to create suggestions. |
| adjust\_stock | events | Stock count or loss: creates an adjustment event and sub-events. |
| create\_crop\_cycle | land and cropscience | Create the cycle, attach blocks, optionally generate planned events from a calendar template. |
| record\_stage | cropscience | Store an observed stage and re-forecast later planned events. |
| run\_holding\_accrual | costing | Daily system event creating holding sub-events for rented land, depreciation by day and prepaid use. |
| adopt\_scenario | workbench | Turn drafts into planned crop cycles and events. |
| run\_reconciliation | costing | Section 10. |

### 9.2 confirm\_event, in order

1. **Idempotency.** If the client\_uuid was already processed, return the stored result.
2. **Authorise.** Check the permission and the user’s farm and block scope.
3. **Lock.** Lock the event row and every affected asset row in a fixed order (by id) to prevent deadlocks.
4. **Apply corrections.** Set actual quantities and times per sub-event. Optional lines may be added or removed. Locked lines may not be removed. Convert units to canonical values.
5. **Validate.** Legal status transitions. Stock sufficiency (a shortfall blocks confirmation unless an adjustment is recorded first or the user holds the override permission). Compliance checks: waiting period, maximum applications, minimum interval, dose against label, expired lot, repeated mode of action. Blocks need a recorded override with a reason.
6. **Stock effects.** Consumption writes StockMovement out rows, picking lots by earliest expiry, priced at the stock item’s average cost. Production creates a lot and an in-movement. Transfers and adjustments write their movement. Update the caches.
7. **Machine, people and living effects.** Write MeterEntry rows and update machine meters. Record labour hours. Write LivingEntry rows.
8. **Costing handler.** Compute a CostRecord per sub-event with the rule effective on the event date, write a DepreciationEntry where the asset has a depreciation policy, then allocate it by target share and purpose tag. Roll the totals into EventCostSummary.
9. **Ledger handler.** For pay and receive sub-events, write LedgerEntry rows. Procurement events create ledger entries and assets but no cost.
10. **Compliance handler.** Write TreatmentRecord rows, create the re-entry RestrictionWindow, compute waiting-period end dates, and create a follow-up observation task.
11. **Scheduling handler.** Convert reservations and release the assets.
12. **Finish.** Mark sub-events and the event done, stamp confirmed\_by and confirmed\_at, update crop cycle summaries, create notifications (low stock, next spray due), and write the audit row.
13. **After commit.** Enqueue background jobs such as report refreshes.

Handlers register with the events app and run in this fixed order inside the same transaction. That is how higher apps react without the events app importing them.

### 9.3 Rules by sub-event kind

| Kind | Required fields | Effect | Cost | Ledger |
| --- | --- | --- | --- | --- |
| use machine | machine, hours | Meter entry, reservation | Operating rate plus depreciation from the asset’s active depreciation policy | none |
| use labour | person, hours | Capacity use | Wage rate or imputed rate | none |
| consume stock | stock item, quantity | Stock movement out | Average cost times quantity | none |
| occupy space | space, window | Occupancy, optional restriction | Holding only, never operation cost | none |
| produce stock | stock item, quantity, grade, location | New lot and in-movement. Produce starts with zero cost basis; profit is recognised on sale | none | none |
| transfer stock | stock item, quantity, destination | Movement out, for example a sale or a loan | Average cost of goods moved | Followed by a receive sub-event |
| adjust stock | stock item, signed quantity, reason | Adjustment movement | Loss costed at average cost | none |
| living gain or loss | living asset, count, reason | Living entry | Per-head carrying value for losses | none |
| pay or receive | account, amount, counterparty | none | none | Ledger entry |
| accrue | system only | none | Holding rule | none |

## 10. Costing and reconciliation rules

### 10.1 What counts as cost

A purchase is not a cost. It moves money into an asset. Cost is recognised only when an asset is consumed, used, lost, or held for a period of time. Direct expenses with no lasting asset (a wage paid, a hire charge) are modelled as a payment plus an immediate cost.

### 10.2 Stock valuation

- **Method:** moving weighted average per stock item. On a purchase, new average cost equals value on hand plus purchase value, divided by quantity on hand plus quantity bought.
- **Consumption** is priced at the current average cost. Lots track quantity, expiry and traceability; the average prices the cost.
- **Back-dated entries** do not automatically re-price past consumption. Differences are absorbed by stock count adjustments.
- **Produce** enters stock at zero cost basis. Profit is recognised when it is sold. A separate report may show produce at market value for information only.

### 10.3 Cost rule types

| Rule type | Formula | Notes |
| --- | --- | --- |
| Hourly rate | hours used times rate | Rate excludes fuel, because fuel is its own stock line. |
| Daily rent | rent amount divided by days in the rent period | From the Tenure record. Accrues daily. Prepaid rent reduces the prepaid register value day by day. |
| Wage per hour | hours times wage rate | Daily and monthly wages are converted to an hourly rate. |
| Imputed labour | hours times the farm’s imputed rate | For unpaid family labour. Flagged so views can show cost with and without it. |
| Flow estimate | runtime hours times flow rate times unit cost | For unmetered water and electricity, for example pump hours times litres per hour. Correctable. |
| Fixed per event | flat amount | For custom hire or contract charges. |

Depreciation is handled by the framework in 10.3a, not by cost rules. Cost rules are versioned, and a change never rewrites past cost records.

### 10.3a Depreciation framework

Depreciation method is a setting you can change, not a hard-coded rule. Each method is a **strategy**: a small unit of code registered under a code, with a declared timing and a parameter schema. A policy picks a strategy and its parameters. An assignment applies a policy to an asset for a period.

**What every strategy declares**

- **Timing:** on use (runs when a sub-event is confirmed), daily (runs in the daily accrual job), or periodic (monthly or yearly).
- **Basis:** hours, days, area or another measure.
- **Parameters:** the required values and their validation, for example a rate.
- **Preview:** a function returning the expected cost per hour or per day, used for planned cost and for comparing methods.
- **Floor rule:** never depreciate below salvage value.

**Strategies shipped in version 1**

| Strategy code | Timing | Formula | Typical use |
| --- | --- | --- | --- |
| units\_of\_production\_hours | On use | (acquisition cost + capital additions − salvage value) ÷ expected life in hours × hours used | Tractors, sprayers, pumps, where wear follows use. Default for machines. |
| straight\_line\_daily | Daily | (acquisition cost + capital additions − salvage value) ÷ (expected life in years × 365), per day | Buildings, solar panels, irrigation fixtures |

**Reserved for later, with no schema change:** declining balance (daily or yearly), units of production by area worked, a fixed amount per use, and a hybrid that accrues daily and then splits cost between crop cycles and idle time by monthly utilization.

**Adding a strategy:** write the strategy class, register its code with its parameter schema, add tests, and create a DepreciationPolicy row that uses it. Tables and migrations stay unchanged because parameters live in validated JSON.

**Switching a method (change\_depreciation\_policy command)**

1. Authorize: needs the costing.depreciation.manage permission.
2. Choose the new policy and an effective date. Dates before the last confirmed entry are refused; back-dated corrections use reversals.
3. Show a preview: projected annual cost and cost per hour or per day under the current and the new policy.
4. Compute book value at the effective date from DepreciationEntry.
5. Close the current assignment and open a new one with base\_book\_value and remaining life snapshotted. Remaining life defaults to expected life minus life consumed, and may be overridden with a reason.
6. Past entries are never changed. The switch is prospective only.
7. Write an audit row and notify the Owner and Accountant roles.

**Capital additions and disposal**

- An overhaul or major improvement is recorded as a procurement sub-event with capitalize\_to\_asset set. It raises capital\_additions\_total from that date, and later entries use the higher base.
- Selling or retiring an asset ends its assignment. The remaining book value is recognized as a loss cost on the disposal date. Sale proceeds are a ledger receipt, and reports show gain or loss as proceeds minus remaining book value.

**Where the cost goes:** on-use strategies write cost records inside the event (operation bucket), allocated by target share. Daily strategies write cost records from the daily accrual job (holding bucket). For machines, daily cost lands in overhead until the hybrid strategy exists, and the utilization view shows how idle a machine was.

**Reporting:** depreciation schedule per asset, current book value, effective cost per hour or per day, and the history of method changes.

### 10.4 Allocation

Each cost record is split into allocations. Buckets:

- **Operation:** direct cost of doing work (consumption, machine use, labour, flows).
- **Holding:** time-based cost of an asset while it is committed to a crop cycle, such as rent for the days a crop occupies the land.
- **Idle:** holding cost of assets not committed to any crop cycle.
- **Overhead:** costs that cannot be tied to a crop.

**Keys:** the split follows EventTarget share\_fraction (area by default). In a tank mix, product costs follow each sub-event’s purpose tag, and shared costs (machine, labour) are split by product cost share. The shared-cost split rule is a farm setting. Rounding remainders go to the largest share so allocations always sum exactly to the cost record.

### 10.5 Daily holding accrual

For each farm and each date (in the farm timezone), the job runs once, guarded by HoldingAccrualRun:

1. For every active rented or leased space, compute the daily rent from its Tenure record.
2. Decide whether the land was occupied that day: an occupy-space sub-event or an active CropCycleBlock covers the date.
3. If occupied, allocate the rent to the crop cycle or cycles by area share (holding bucket). If not, allocate it to the idle bucket.
4. Reduce the prepaid register value by the same amount.
5. Record everything as a system event with accrue sub-events, so it follows the same rules as everything else.

**Machine depreciation:** machines default to the units\_of\_production\_hours strategy, so machine cost reaches crop cycles through events. The method can be changed later through a depreciation policy (10.3a). Machine idle time is shown as a utilization view (hours used against hours available) until the hybrid strategy is added.

### 10.6 Reconciliation identity

For any period:

**Cash paid for asset acquisitions and direct expenses = change in asset register value + cost recognised**

where cost recognised is operation plus holding plus idle plus overhead plus losses. Sales receipts are excluded, because produce enters stock at zero basis.

Worked check using the earlier example: cash paid was 6,39,500. Register value ended at 6,36,810 (tractor 5,99,850, urea 2,460, prepaid lease 34,500). Cost recognised was 2,690 (operation 690, holding 1,600, idle 400). 6,36,810 plus 2,690 equals 6,39,500.

**Run:** nightly and on demand. A difference beyond tolerance marks the run as off, creates a notification, and lists likely causes: stock movements without a cost record, ledger entries without a sub-event, sub-events without allocations, caches that disagree with ledgers.

### 10.7 Planned cost and variance

Planned cost is the template quantity times current average cost or rule rate. It is stored on the event and compared with actual cost on confirmation. Variance is shown per event type and per crop cycle.

## 11. Role-based access control

### 11.1 Layers of protection

1. **Authentication.** Valid token.
2. **Farm tenancy.** The user must hold an active Membership in the farm named by the request. Nothing is ever returned across farms.
3. **Role permission.** The membership’s role must hold the permission code the action needs.
4. **Block scope.** If the membership has BlockAccess rows, results and writes are limited to those blocks and their descendants.
5. **Field visibility.** Rates, wages, prices and margins are removed from responses for roles without the cost-view permission.
6. **Object rules.** For example a worker may act only on events assigned to them.

The service layer repeats checks 2 to 4, so a bug in a view cannot bypass them.

### 11.2 Roles

| Role | Intended user |
| --- | --- |
| Owner | Farm owner. Everything, including settings and member roles. |
| Manager | Runs the farm day to day. Everything except farm deletion and owner changes. |
| Supervisor | Leads work on assigned blocks. Plans and confirms events there. |
| Worker | Does the work. Sees assigned events, starts them, submits actuals, records observations. |
| Accountant | Money records and financial reports. No operational edits. |
| Advisor | External agronomist. Edits crop calendars, adds observations, views reports. |
| Viewer | Read-only, non-financial. |

System roles are templates copied into each farm. Owners can adjust the copies and create custom roles from the same permission catalogue.

### 11.3 Capability matrix (defaults)

Values: Full, Scoped (assigned blocks only), View, None.

| Capability | Owner | Manager | Supervisor | Worker | Accountant | Advisor | Viewer |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Farm settings | Full | None | None | None | None | None | None |
| Members and roles | Full | Full (not owners) | None | None | None | None | None |
| Blocks, seasons, crop cycles | Full | Full | View | View | View | View | View |
| Catalogue, event types, products | Full | Full | View | View | View | Full (crop science only) | View |
| Crop calendars and stage models | Full | Full | View | View | None | Full | View |
| Assets (create, edit, retire) | Full | Full | None | None | View | View | View |
| Plan, reschedule, cancel events | Full | Full | Scoped | None | None | None | None |
| Start events and submit actuals | Full | Full | Scoped | Scoped (own) | None | None | None |
| Confirm events | Full | Full | Scoped | None by default | None | None | None |
| Amend or reverse confirmed events | Full | Full | None | None | None | None | None |
| Record observations | Full | Full | Scoped | Scoped | None | Full | None |
| Stock counts and adjustments | Full | Full | Scoped | None | View | None | None |
| Ledger (view, record, reverse) | Full | Full | None | None | Full | None | None |
| Cost records, rates, margins | Full | Full | View (operation cost, no wages) | None | Full | View | None |
| Workbench scenarios and decisions | Full | Full | View | None | View | View | None |
| Compliance override | Full | Full | None | None | None | None | None |
| Reports and exports | Full | Full | Scoped | None | Full (financial) | View | View |
| Audit log | Full | View | None | None | None | None | None |
| Block boundaries (draw, edit, import) | Full | Full | None | None | None | None | None |
| Depreciation policies and capital profiles | Full | Full | None | None | Full | None | None |

### 11.4 Worker confirmation setting

Farms choose whether worker-submitted actuals need supervisor confirmation. When required (the default), a worker’s submit command stores actual quantities and marks the event as submitted. A supervisor or manager then reviews and confirms, so asset states and costs change only after review.

### 11.5 Implementation approach

- **Permission catalogue:** codes follow module.resource.action, for example events.event.confirm or ledger.entry.view. They are seeded by migration and are the only thing code checks against, never role names.
- **Request context:** farm is read from the URL (/api/v1/farms/farm\_id/...). A DRF permission class resolves the membership, loads the role’s permissions into a request cache, and checks the code the view declares.
- **Query filtering:** a shared queryset mixin applies farm and block scope to every list and detail query.
- **Serializers:** choose a field set by permission, so hidden fields never leave the server.
- **Django admin:** staff only, for platform support. Farm roles never grant admin access.
- **Tests:** a generated test iterates every endpoint against every system role using the matrix above and asserts the expected status code, including cross-farm and out-of-scope attempts.

## 12. API design

Base path /api/v1. Farm-scoped resources live under /farms/farm\_id/. JSON only. Cursor pagination, django-filter query parameters, explicit ordering. Errors use one consistent envelope with a code, message and field errors. Writes accept an Idempotency key (the client\_uuid). Updates use the version field for optimistic locking and return a conflict error when stale.

| Group | Resources | Custom actions |
| --- | --- | --- |
| Auth | token, refresh, logout, me | password reset, invitation accept |
| Identity | farms, members, roles, permissions, invitations | assign role, suspend member |
| Catalogue | units, crops, varieties, products, product crop labels, grades, counterparties | duplicate system row for editing |
| Land | blocks, block boundaries, block access, seasons, crop cycles | attach blocks, close cycle, generate plan from calendar, import boundary, split block, merge blocks |
| Assets | assets, stock items, stock lots, tenures | retire, set maintenance, stock count |
| Events | categories, types, type versions, events, sub-events, targets | plan, reschedule, cancel, start, submit, confirm, amend, duplicate |
| Observations | observations (events of that category) | create suggestion check |
| Scheduling | availability windows, restriction windows | availability search, conflict check |
| Crop science | stage models, calendar templates, stage records, thresholds, suggestions | accept or dismiss suggestion, recompute forecast |
| Ledger | accounts, entries, categories, loans | reverse entry, transfer between accounts |
| Costing | cost rules, depreciation policies, capital profiles, depreciation assignments and entries, cost records, summaries | run reconciliation, rebuild summaries, preview and apply a depreciation change |
| Compliance | checks, overrides, treatment records | export treatment register |
| Workbench | scenarios, assumptions, metrics, decisions, investment analyses | compute metrics, compare, adopt, archive |
| Reporting | crop cycle profit and loss, operation cost, plan versus actual, availability view, stock status, cash timeline, utilisation | export (CSV, PDF) |
| Files | attachments | request upload, confirm upload |
| Notifications | list, mark read | reminder preferences |
| Sync | changes since cursor, batch submit of events | for offline clients |

The OpenAPI schema is generated and versioned. The React app uses a generated client from it.

## 13. Background jobs

| Job | Schedule | Purpose |
| --- | --- | --- |
| Holding accrual | Daily after midnight, per farm timezone | Section 10.5, plus daily depreciation strategies (10.3a) |
| Awaiting-confirmation check | Hourly | Flag overdue events and notify |
| Reservation auto-release | Daily morning | Free assets held by unconfirmed overdue events; the event stays awaiting confirmation |
| Low stock and expiry alerts | Daily | Reorder and expiry notifications |
| Waiting and re-entry end alerts | Hourly | Tell the team when a plot is safe to enter or harvest |
| Weather load and degree-day update | Daily | Update GddDaily and re-forecast planned events |
| Reconciliation | Nightly | Section 10.6 |
| Summary rebuild | Nightly, plus incremental after commit | Refresh the derived cost summaries |
| Loan due reminders | Daily | Upcoming repayments |
| Cache integrity check | Weekly | Rebuild stock, lot and meter caches from ledgers and report mismatches |
| Backups and restore test | Per infrastructure | Section 16 |
| Retention and purge | Daily | Section 16.1: apply retention periods, purge in batches, process farms past their grace period, expire orphaned uploads |

All jobs are idempotent and safe to repeat.

## 14. Integrity constraints and indexes

**Database constraints**

- Exclusion constraint on Reservation: no overlapping active exclusive reservations per asset. A second exclusion constraint on AssetDepreciationAssignment forbids overlapping periods for one asset.
- Check constraints: quantities and amounts greater than zero where required, share\_fraction between 0 and 1, valid status values.
- Unique constraints: farm with code on configuration tables, farm with client\_uuid on transactional tables, event with line\_no on SubEvent, farm with accrual\_date on HoldingAccrualRun.
- Immutability: the application’s database role has no update or delete privilege on ledger entries, stock movements, meter and living entries, cost records, allocations, depreciation entries, treatment records and audit logs. Only the purge role in 16.1 may delete them. Corrections are new rows.
- Allocation sums: a deferred constraint (or an assertion in the same transaction) checks that allocations of one cost record equal its amount.

**Indexes**

| Table | Index |
| --- | --- |
| Event | farm, status, planned\_start; farm, event\_type, sequence |
| SubEvent | event; asset, status |
| Reservation | GiST on asset and window |
| StockMovement | stock\_item, occurred\_at; sub\_event |
| LedgerEntry | account, entry\_date; sub\_event |
| CostRecord | event; sub\_event |
| CostAllocation | crop\_cycle; bucket |
| AuditLog | farm, created\_at (BRIN) |
| Notification | recipient, status, due\_at |
| Block | GiST on geometry |
| DepreciationEntry | asset, entry\_date |
| AssetDepreciationAssignment | GiST on asset and effective period (backs the exclusion constraint) |

## 15. Testing strategy

- **Golden scenario test:** reproduce the worked example (owned tractor, rented plot, urea, one fertilising event) and assert every number: cash balance, register values, event cost 690, crop cycle cost 2,290, idle cost 400, and a balanced reconciliation. A variant switches a machine’s depreciation method mid-life and checks that past entries are unchanged.
- **Property tests:** conservation (quantities and value are never created or lost), allocations always sum to the cost record, and a reversal restores the prior state.
- **Service tests:** each command, including failure paths that must change nothing.
- **Concurrency tests:** two users reserving the same tractor, two events consuming the last stock.
- **RBAC matrix test:** every endpoint against every role, scope and farm.
- **API contract tests:** responses match the OpenAPI schema.
- **Migration tests:** forward migration on a copy of production-like data.
- **Performance check:** load five years of synthetic data for a large farm and time the reports.

## 16. Deployment and security

**Runtime:** containers for web (Gunicorn), Celery worker, Celery beat, PostgreSQL and Redis, behind a TLS reverse proxy. Object storage for files. Separate configuration per environment from environment variables and a secrets manager.

**CI/CD:** lint, tests, migration check, image build, deploy. Migrations are additive and safe to run while the old version is live; backfills run as jobs.

**Operations:** structured logs with redaction, error tracking, uptime and queue monitoring, daily encrypted backups, and a quarterly restore drill.

**Security checklist:** Argon2 password hashing, short-lived access tokens with refresh rotation, throttling on auth and write endpoints, strict CORS for the React origin, HTTPS only, upload type and size validation, ORM queries only, dependency scanning, data export and delete on request, no secrets in logs.

### 16.1 Data retention and deletion policy

The defaults below are configurable per deployment. Legal retention periods for financial and agricultural records differ by country and by whether the farm operates as a business, so confirm them against local requirements before launch.

| Data class | Default retention | After that |
| --- | --- | --- |
| Ledger entries, cost records, allocations, depreciation entries, asset valuations | 8 years after the end of the fiscal year | Purged by the retention job |
| Events, sub-events, stock, meter and living movements | 8 years after the crop cycle closes, so they outlive the money records they explain | Purged with their crop cycle |
| Treatment records and compliance checks | 8 years, and never shorter than the certification scheme the farm follows | Purged |
| Observations, photos and attachments | 3 years after the related crop cycle closes. Bills linked to ledger entries follow the ledger | Purged, files removed from storage |
| Weather and degree-day data | 3 years | Purged |
| Notifications | 90 days after being read | Deleted |
| Audit log | 8 years | Purged |
| Authentication logs | 12 months | Deleted |
| Archived configuration (types, products, assets) | Kept while any retained record references them | Purged once unreferenced |
| Backups | Daily for 35 days, monthly for 12 months | Aged out. Restoring a backup re-applies the purge log so deleted data does not return |

**Member removal:** access is revoked immediately. If the person deletes their account, their name and contact details in farm records are replaced by Former member. Business records stay.

**Farm deletion (Owner only):**

1. A full export is offered first: tables as CSV and JSON, plus a zip of files.
2. The farm is marked pending deletion for a 30-day grace period. Only the Owner can cancel or export during it.
3. After the grace period, the purge job deletes every farm-scoped row and file, unless platform staff have set a legal hold.
4. A purge receipt (farm id, date, row counts per table, no content) is kept for audit.

**Personal data requests:** a user can export their profile and the records they authored, correct their profile, and delete their account. Requests are fulfilled within 30 days.

**Purge mechanism**

- The normal application database role cannot update or delete immutable tables. A separate purge role, used only by the purge command, can delete.
- Purge is a command with a dry run that lists counts, then execution in batches, children before parents, each batch audited.
- A purge log stores the ids that were purged, so a restore can re-apply deletions.
- Files are deleted from object storage in the same job. Storage lifecycle rules also expire orphaned uploads.

**Undo and holds:** archived configuration can be restored for 30 days. Confirmed transactions are never soft-deleted, only reversed. A legal hold pauses purge for a farm, for example during a dispute.

## 17. Build roadmap

| Phase | Build | Exit criteria |
| --- | --- | --- |
| 0. Setup | Repository, settings, CI, core, identity with roles and permissions, audit | A user logs in, joins a farm and is correctly allowed or denied by role |
| 1. Foundation and core | catalogue, land, assets, events with all commands, ledger basics, costing with allocation and reconciliation | The golden scenario passes. Cost per crop cycle and per event is correct and reconciles |
| 2. Crop science | Stage models, calendar templates, observations, thresholds and suggestions, compliance checks | A calendar generates planned events that re-forecast when a stage is observed. Safety checks block unsafe harvests |
| 3. Workbench | Availability view, economics view, scenarios with metrics, conflict flags, decision journal, investment calculators | A scenario can be built, compared and adopted into planned events |
| 4. Hardening | Offline sync, exports, notifications, performance, security review | Works offline for a week and syncs without duplicates |

Build order inside phase 1: catalogue and land first, then assets, then events (configuration, then commands), then ledger, then costing. The detailed sprint plan is in sections 19 to 21.

## 18. Open decisions, risks and schema addenda

**Decisions and their status**

1. Single currency per farm. Confirmed.
2. Produce valued at zero cost basis. Confirmed.
3. Machine depreciation is dynamic and upgradable through the depreciation framework (6.9a, 10.3a). Version 1 ships per-hour and straight-line daily strategies, with machines defaulting to per-hour. Confirmed.
4. Worker confirmations need supervisor review by default. Not yet confirmed.
5. PostGIS for block geometry from the start (6.3a). Confirmed.
6. JWT authentication. Confirmed.
7. Data retention and deletion policy accepted. Defaults are in 16.1 and must be checked against local requirements before launch (sprint 14). Confirmed.

**Risks**

- **Event templates:** good defaults decide whether farmers adopt the system. Plan time to author and test templates for the first crops.
- **Reconciliation drift:** most mismatches come from missing back-dated entries. Keep the catch-up and stock count flows simple.
- **Complexity creep:** resist adding module-specific records. Anything that changes asset state must be a sub-event.

**Change log, revision 2**

- **Added:** spatial model with PostGIS (6.3a), depreciation tables (6.9a), depreciation framework (10.3a), data retention and deletion policy (16.1), implementation plan (sections 19 to 21).
- **Changed:** block boundaries are PostGIS polygons, and observations, attachments and storage locations carry map points. Depreciation moved out of cost rules into the framework, so a machine defaults to per-hour but can switch method later.
- **Applied from the earlier addenda:** Farm shared\_cost\_split and require\_supervisor\_confirmation, Event submitted\_by and submitted\_at.
- **New fields and permissions:** SubEvent capitalize\_to\_asset, land.block.edit\_boundary, costing.depreciation.manage.

## 19. Implementation plan

The backend ships in five phases over about 15 two-week sprints. Each phase ends with a working, testable slice, and the golden scenario from section 15 is the gate for phase 1. This section sets the approach and the sequence; section 20 breaks each phase into tasks.

### 19.1 Working agreements

- **Vertical slices.** Each sprint delivers model, service, API, tests and seed data for one capability, never a whole layer on its own.
- **Contract first.** Update the OpenAPI schema before building an endpoint, so React work can start against a mock server.
- **Definition of done.** Migrations reviewed, service tests written, permission tests for every new endpoint, schema updated, an audit row for every command, a short decision record for any design choice, and a demo of the slice.
- **Branching.** Trunk-based development with short branches. CI must pass lint, tests (including PostGIS) and a migration check before merge.
- **Always-on checks.** The golden scenario and the conservation property tests run on every commit from phase 1 onward.

### 19.2 Phases at a glance

| Phase | Sprints | Goal | Gate to exit |
| --- | --- | --- | --- |
| 0. Setup | 1 | Skeleton, auth, tenancy, roles, audit | A user signs in, joins a farm, and the role matrix test passes |
| 1. Foundation and core | 2 to 6 | Land with PostGIS, assets, events, ledger, costing with depreciation | Golden scenario passes, reconciliation balances, a depreciation method switch works |
| 2. Crop science | 7 to 9 | Stage-driven calendar, observations, thresholds, compliance | Calendar generates and re-forecasts, an unsafe harvest is blocked |
| 3. Workbench | 10 to 12 | Availability, economics, scenarios, decision journal | A scenario is built, compared and adopted into planned events |
| 4. Hardening | 13 to 15 | Offline sync, retention, exports, performance, security, release | Offline week syncs without duplicates, restore drill and load test pass |

**Effort note:** one sprint is two weeks. The estimates assume a developer experienced with Django working full time. A solo build is roughly 30 weeks. Two developers can overlap phases 2 and 3 and finish in roughly 20 weeks. Treat these as planning figures and re-forecast after sprint 3, when real velocity is known.

### 19.3 Sprint sequence

| Sprint | Theme | Main deliverables |
| --- | --- | --- |
| 1 | Setup and identity | Repository, containers, CI, custom user, JWT, farms, memberships, roles, permission catalogue, audit log |
| 2 | Catalogue and land | Units, crops, products with label data, counterparties, blocks with PostGIS boundaries, seasons, crop cycles |
| 3 | Assets | Asset registry and details, stock items and lots, tenure, capital profiles |
| 4 | Event configuration | Categories, types, versions, lines, seeded starter templates |
| 5 | Event commands and stock | Create, plan, reschedule, cancel, start, submit, confirm, amend. Reservations, stock, meter and living movements |
| 6 | Money and cost | Ledger, cost rules, cost records, allocation, depreciation framework, holding accrual, reconciliation |
| 7 | Calendar | Stage models, calendar templates, plan generation for a crop cycle |
| 8 | Observation to action | Observations, stage records, re-forecasting, weather and degree days, thresholds, suggestions |
| 9 | Compliance and alerts | Treatment records, safety checks and overrides, restriction windows, notifications |
| 10 | Workbench views | Availability view, economics view, plan versus actual, utilization |
| 11 | Scenarios | Scenarios, assumptions, metrics, conflict flags, adoption |
| 12 | Decisions and reports | Decision journal, investment calculators, reporting views and exports |
| 13 | Sync and files | Change feed, batch submit, attachments with signed uploads |
| 14 | Retention and scale | Retention jobs, purge, farm export and deletion, performance tuning |
| 15 | Release | Security review, load test, restore drill, documentation, release candidate |

### 19.4 What can run in parallel

- The React map and boundary drawing can start in sprint 2 against the block endpoints.
- Authoring starter event templates and calendars (agronomy content) can run alongside sprints 4 to 7 without blocking code.
- Reporting views can be built incrementally from sprint 10 as the underlying data becomes available.
- Infrastructure work (staging, monitoring, backups) can proceed alongside sprints 2 to 6 and must be ready before sprint 13.

## 20. Work breakdown by phase

Each row is a work package (WP) with an acceptance check that must pass before it counts as done.

### 20.1 Phase 0: setup (sprint 1)

| WP | Task | Acceptance check |
| --- | --- | --- |
| 0.1 | Repository layout, requirement files, pre-commit hooks, commit conventions | Fresh clone installs and lints cleanly |
| 0.2 | Containers for web, worker, beat, PostgreSQL with PostGIS, Redis and S3-compatible storage. Split settings for dev, test and prod | One command starts everything. The health endpoint checks database and Redis |
| 0.3 | core app: base models, farm-scoped manager, money and quantity helpers, error types | Unit tests for rounding, units and the farm filter |
| 0.4 | identity app: custom User, Farm, Role, PermissionCode, RolePermission, Membership, Invitation. Migration that seeds permission codes and the seven system roles | Seed is idempotent. New farm gets role copies |
| 0.5 | JWT login, refresh rotation, logout with token blacklist, password reset, invitation accept | Expired and reused refresh tokens are rejected |
| 0.6 | RBAC building blocks: permission class, farm resolution from the URL, queryset mixin, serializer field-set helper | Cross-farm access always returns not found |
| 0.7 | Audit log and command decorator. Field history on configuration tables | Every command writes one audit row, rejected ones included |
| 0.8 | API foundation: pagination, error envelope, filtering, OpenAPI generation, idempotency handling | Schema builds in CI. A contract test compares responses to it |
| 0.9 | CI pipeline: lint, tests against a PostGIS service, migration check, coverage gate, image build | A failing check blocks merge |
| 0.10 | Test harness: factories, golden-scenario fixture skeleton, RBAC matrix test generator | Matrix test runs for the identity endpoints |

### 20.2 Phase 1: foundation and core (sprints 2 to 6)

**Sprint 2: catalogue and land**

| WP | Task | Acceptance check |
| --- | --- | --- |
| 1.1 | catalogue: units with conversions, purpose tags, crops, varieties, product categories, products with crop label limits, grades, counterparties. System rows are read-only; a duplicate action creates an editable farm copy | Conversion round-trips are exact. Farm copies never alter system rows |
| 1.2 | land: blocks as a tree, BlockBoundaryRevision, BlockAccess. PostGIS enabled in the first land migration | Drawn boundary yields the expected area. Overlap and containment violations are rejected |
| 1.3 | Boundary import (GeoJSON, KML, zipped shapefile), split and merge actions, GeoJSON serializers, bounding-box filter | Import preview matches saved result. Split areas add up to the original |
| 1.4 | Seasons, crop cycles, crop cycle blocks with the area and intercrop rules | Over-allocation of a block is refused unless intercrop is set |

**Sprint 3: assets**

| WP | Task | Acceptance check |
| --- | --- | --- |
| 1.5 | Asset registry and the six detail tables, with class-specific validation | A machine cannot be saved without its detail row. Detail fields match class |
| 1.6 | Stock items and lots (creation only; quantities change later through movements). Reorder levels and storage locations | Direct edits to quantity caches are rejected |
| 1.7 | Tenure, plus an automatic Space asset for every block | Creating a block creates its space asset. Tenure periods cannot contradict each other |
| 1.8 | AssetCapitalProfile model and API (in the costing app skeleton) | Profile requires in-service date and cost basis |

**Sprint 4: event configuration**

| WP | Task | Acceptance check |
| --- | --- | --- |
| 1.9 | Seed system event categories with behavior flags. Custom categories must map to a system category | Reports roll custom categories up to system ones |
| 1.10 | EventType, EventTypeVersion and EventTypeLine. Editing creates a new version. Archive and merge instead of delete | Editing a type never changes an existing event |
| 1.11 | Seed starter types: purchase stock, purchase machine, land preparation, sowing, irrigation, top-dressing, fungicide spray, herbicide spray, harvest, sale, stock count, observation, lease start | Each type creates the expected sub-events for a sample target |
| 1.12 | Configuration APIs with permission checks | Matrix test passes for all new endpoints |

**Sprint 5: event commands and stock**

| WP | Task | Acceptance check |
| --- | --- | --- |
| 1.13 | Event, EventTarget, SubEvent models with client\_uuid idempotency | A repeated submission returns the original row |
| 1.14 | create\_event: expand lines, compute quantities from target area, estimate planned cost | Planned quantities equal rate times area for every basis type |
| 1.15 | Reservations with the exclusion constraint, availability and restriction checks | Two overlapping exclusive reservations cannot both succeed under concurrency |
| 1.16 | reschedule, cancel, start and submit commands | Rescheduling moves every sub-event window and re-checks conflicts in one step |
| 1.17 | confirm pipeline with ordered handlers. Stock handler (earliest expiry first, average cost), machine meter, labour hours, living entries | A failure in any handler rolls everything back |
| 1.18 | amend\_event by reversal. adjust\_stock for counts and losses. Basic observations | Reversal restores quantities and values exactly |
| 1.19 | Conservation property tests and concurrency tests for stock | Hundreds of random event sequences never create or lose quantity |

**Sprint 6: money and cost**

| WP | Task | Acceptance check |
| --- | --- | --- |
| 1.20 | ledger: accounts, categories, entries from pay and receive sub-events, transfers, loans with schedules | Account balances equal opening plus entries. Purchases create no cost |
| 1.21 | CostRule and assignments. Cost records for consumption, labour, flow and rent. Allocation by target share and purpose tag. Summary tables | Allocations always sum to the cost record. Tank-mix splits follow the farm setting |
| 1.22 | Depreciation framework: strategy registry, the two version 1 strategies, policies, assignments, entries, capital additions, disposal | Book value never falls below salvage value |
| 1.23 | change\_depreciation\_policy with preview, rebasing and permission check | After a switch, past entries are unchanged and the new method starts from the real book value |
| 1.24 | Holding accrual job with idempotent run records, prepaid rent, idle bucket | Running the job twice for one date creates no duplicates |
| 1.25 | Asset valuation snapshots and run\_reconciliation with notifications | The worked example balances to the unit. A deliberate fault is detected |
| 1.26 | Golden scenario tests: the tractor, rented plot and urea example, plus a mid-life depreciation method switch | All expected figures match section 10.6 |

**Phase 1 exit gate:** the golden scenarios pass, reconciliation balances on the sample farm, the RBAC matrix is green, and a React client can draw a block, buy stock, plan an event and confirm it.

### 20.3 Phase 2: crop science (sprints 7 to 9)

| WP | Task | Acceptance check |
| --- | --- | --- |
| 2.1 | CropStageModel and CropStage | Stage thresholds validate in order |
| 2.2 | CalendarTemplate and items, with anchors and repeats | Repeats number themselves and respect the maximum |
| 2.3 | Generate a plan for a crop cycle as ordinary planned events with reservations. Store the template version used | Generated events behave exactly like hand-made ones |
| 2.4 | Author starter stage models and calendars for the first crops (content task, with an advisor) | Reviewed by a person who farms the crop |
| 2.5 | record\_stage and re-forecasting of later planned events | An observed early flowering moves later events, and reservations follow |
| 2.6 | WeatherDaily (manual entry plus an optional service adapter) and GddDaily | Degree-day totals match a hand calculation |
| 2.7 | ThresholdRule, Suggestion, accept and dismiss | Accepting creates a planned event. Nothing happens automatically |
| 2.8 | Follow-up observation created after treatment events | Follow-up appears at the label interval |
| 2.9 | compliance: TreatmentRecord, ComplianceCheck, ComplianceOverride, restriction windows | A confirmed spray writes an immutable record and a re-entry window |
| 2.10 | Checks: waiting period, maximum applications, minimum interval, dose against label, expired lot, repeated mode of action | An unsafe harvest is blocked. Override needs permission and a reason |
| 2.11 | notifications app and jobs for low stock, expiry, overdue events, waiting and re-entry end | Each job is idempotent |
| 2.12 | Treatment register export | Export lists every treatment with lot and operator |

**Phase 2 exit gate:** a calendar generates a season plan, an observed stage re-forecasts it, and unsafe work is blocked.

### 20.4 Phase 3: workbench (sprints 10 to 12)

| WP | Task | Acceptance check |
| --- | --- | --- |
| 3.1 | Availability view: assets against time with reservations, restrictions, shifts and a cash timeline | Known conflicts appear in the right week |
| 3.2 | Economics view: margin per area, per labour hour and per unit of water, and break-even price | Figures equal a spreadsheet check on sample data |
| 3.3 | Plan versus actual by event type and crop cycle | Variance equals actual minus planned |
| 3.4 | Machine utilization view | Hours used over hours available |
| 3.5 | Scenario, ScenarioAssumption, ScenarioCropCycle and draft events | Drafts never affect live reservations or costs |
| 3.6 | Metric computation: profit, costs, cash low point, peak labour week, water use, conflicts | Metrics equal a manual calculation. Changing an assumption changes only that scenario |
| 3.7 | Conflict flag rules | Demand above supply is flagged with the week and asset |
| 3.8 | adopt\_scenario | Adoption is atomic and leaves no drafts behind |
| 3.9 | DecisionJournal with review prompts | Expected versus actual appears after the review date |
| 3.10 | InvestmentAnalysis calculators for buy, lease, hire and skip, using depreciation previews | Results match hand calculations |
| 3.11 | Reporting endpoints with CSV and PDF export, and summary rebuild jobs | Rebuilt summaries equal incremental ones |

**Phase 3 exit gate:** a scenario can be built, compared and adopted into planned events.

### 20.5 Phase 4: hardening (sprints 13 to 15)

| WP | Task | Acceptance check |
| --- | --- | --- |
| 4.1 | Sync: change feed with a cursor per farm and tombstones, batch submit with idempotency, conflict policy | A week of offline events syncs with no duplicates and no lost edits |
| 4.2 | Attachments with signed uploads and type, size and malware checks | Oversized or disallowed files are refused |
| 4.3 | Retention jobs, purge command with dry run, purge log, re-apply after restore | A restored backup does not bring purged data back |
| 4.4 | Farm export and deletion flow, member removal anonymization, personal data export | Deleting a farm removes rows and files and leaves only the purge receipt |
| 4.5 | Performance: query review, indexes, summary caching, a five-year synthetic farm | Reports meet the agreed response times |
| 4.6 | Security review: dependency scan, permission audit, throttling, token lifetimes | No high findings open |
| 4.7 | Load and soak tests | Stable at the agreed concurrent user count |
| 4.8 | Backup and restore drill | Restore completes within the agreed time |
| 4.9 | Documentation: API guide, runbook, administrator guide, decision records | A new developer can run and deploy from the docs alone |
| 4.10 | Release candidate, rollback plan, post-release checks | Rollback rehearsed on staging |

**Phase 4 exit gate:** offline week syncs cleanly, the restore drill and load test pass, and the security review is closed.

## 21. Delivery management

### 21.1 Critical path

Identity and RBAC (sprint 1), then land and assets (sprints 2 and 3), then event configuration (sprint 4), then event commands and stock (sprint 5), then ledger and cost with depreciation (sprint 6). Phases 2 and 3 depend on the confirm pipeline from sprint 5 and the cost engine from sprint 6, so neither can start in earnest before them. Crop-science content authoring and the React map work sit off the critical path and should start early.

### 21.2 Risk register

| Risk | Impact | Mitigation | Trigger to act |
| --- | --- | --- | --- |
| The confirm pipeline is complex (many handlers, locking) | High | Build the pipeline skeleton first, add handlers one at a time with rollback tests and property tests, second-person code review | Any failed conservation test |
| Starter templates and calendars are wrong or missing | High | Start authoring in sprint 4 with someone who farms the crop, and test each on a real task | A template is rejected in a field test |
| Costing and depreciation numbers are not trusted | Medium | Preview screens that show the formula, golden tests, versioned rules | Reconciliation difference above tolerance |
| Poor spatial data (bad boundaries, messy imports) | Medium | Repair preview, configurable tolerances, boundary history | Many import rejections |
| Scope creep through new modules | High | Anything that changes asset state must be a sub-event. New tables need a decision record | A proposal for a table outside the model |
| Velocity below plan | Medium | Re-forecast after sprint 3. Cut phase 3 extras first (investment calculators, PDF export) | Two sprints under plan |
| Offline conflicts | Medium | Idempotent commands, server validation, tombstones, conflict tests | A duplicate or lost event in testing |
| Backup or restore failure | High | Restore drills in sprints 8 and 15 | A drill fails |
| A permission leak across farms | High | Matrix tests on every endpoint, farm filter in the manager, review checklist | Any cross-farm test failure |
| Retention rules do not match local law | Medium | Confirm periods locally before sprint 14. Periods are configuration | Feedback from legal or tax advice |

### 21.3 Testing gates

| Gate | When | Content |
| --- | --- | --- |
| Every commit | Continuous | Unit and service tests, golden scenarios, conservation properties, RBAC matrix |
| Sprint end | Every 2 weeks | Demo of the slice, API contract check, migration dry run on a copy of staging data |
| Phase end | After sprints 1, 6, 9, 12, 15 | Full regression, performance baseline, security checklist for new endpoints, documentation review |
| Release | Before production | Load test, restore drill, rollback rehearsal |

### 21.4 Environments and releases

- **Environments:** local, CI, staging (production-like, with an anonymized sample farm) and production.
- **Cadence:** tag each sprint to staging. Promote to production after each phase gate. Unfinished modules sit behind feature flags.
- **Migrations:** additive and safe while the old version is live. Rollback means redeploying the previous image and fixing forward with a new migration.
- **API stability:** version 1 stays stable. Breaking changes use new fields or a new version. A schema comparison in CI blocks accidental breaking changes, so the React app is never surprised.

### 21.5 Roles and readiness

- **Roles:** a backend lead (architecture, pipeline, reviews), developers, an agronomy advisor (templates, calendars, thresholds), and a tester who runs field checks. A solo builder covers the technical roles and uses an advisor for reviews.
- **Definition of ready for a task:** the acceptance check is written, sample data exists, and the permission codes it needs are named.

### 21.6 The first two weeks

| Days | Work |
| --- | --- |
| 1 to 2 | Repository, containers with PostGIS, CI pipeline |
| 3 to 4 | core base models, custom user, settings split, health endpoint |
| 5 to 6 | Farm, memberships, roles, permission seed migration |
| 7 to 8 | JWT login and refresh rotation, invitations, password reset |
| 9 | RBAC building blocks and the matrix test generator |
| 10 | Audit log, OpenAPI schema, demo, retrospective, and a velocity measurement to re-forecast the plan |

### 21.7 Measures of progress

Golden scenarios passing, reconciliation balanced on the sample farm, share of endpoints covered by the matrix test, test suite run time under ten minutes, and defects found in field tests per sprint.
