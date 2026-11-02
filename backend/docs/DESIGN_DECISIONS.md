# Implementation decisions

1. The design describes purchased stock but does not include an incoming purchase sub-event kind. `acquire_stock` is added. `produce_stock` remains zero-basis harvest output.
2. `pay`/`receive` need account/category references not listed among the original SubEvent fields. `account_id` and `ledger_category_id` are UUID references validated by the ledger handler, preserving the events → ledger dependency direction.
3. `StockLot.source_sub_event_id` is a UUID reference rather than a database foreign key, avoiding the assets → events → assets model cycle. The event service sets it.
4. Asset status changes use an `asset_status` sub-event. The status field is read-only in the resource serializer.
5. `capital_terms` carries validated acquisition-life input for a capital-purchase payment. The facts are stored as explicit fields on `AssetCapitalProfile` after confirmation.
6. The design mentions prepaid register value without a backing table. `PrepaidEntry` supplies an immutable signed-value ledger for advance rent and its daily release.
7. Stock movements store signed canonical quantity/value. An outgoing 18 kg movement is `-18`, so summing the movement ledger rebuilds on-hand quantity. A reversal has the opposite sign.
8. Local runtime uses the app role as table owner to keep installation simple. Immutability triggers are supplied, but production separation of migration/runtime/purge roles requires additional deployment work.
9. The original `ComplianceOverride.check` field conflicts with Django's model `check()` API. It is named `compliance_check`.
10. Human-readable enum values are represented with snake_case, e.g. `in_progress`, `consume_stock`, `leased_in`.
11. `per_area` template quantities mean quantity per canonical square metre. For example, 10 kg/acre is `10 / 4046.8564` kg per m². For other derived bases, this implementation asks for explicit quantities rather than making an unsafe assumption.
12. Effective assignment date intervals are half-open: `[effective_from, effective_to)`. Event/reservation timestamp ranges are also half-open, permitting back-to-back bookings.
13. Named background jobs and service commands use database transactions. A failed command writes a rejected audit entry outside its failed transaction when possible; detailed compliance rows inside the failed transaction are rolled back and the error response carries the blocking reason.
14. No frontend, external weather subscription, AI, IoT, payment gateway, Kubernetes or public deployment is included.
