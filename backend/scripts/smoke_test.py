"""Exercise a running LOCAL API. Creates one isolated demonstration farm per run."""

import json
import os
import uuid
from datetime import datetime, timedelta, timezone
from urllib.request import Request, urlopen
from urllib.error import HTTPError

BASE = os.environ.get("API_URL", "http://127.0.0.1:8000/api/v1").rstrip("/")
TOKEN = ""


def call(method, path, data=None):
    headers = {"Content-Type": "application/json"}
    if TOKEN:
        headers["Authorization"] = "Bearer " + TOKEN
    request = Request(
        BASE + path,
        data=json.dumps(data).encode() if data is not None else None,
        headers=headers,
        method=method,
    )
    try:
        with urlopen(request, timeout=30) as response:
            return json.loads(response.read())
    except HTTPError as exc:
        raise SystemExit(f"{method} {path}: {exc.code}\n{exc.read().decode()}") from exc


suffix = uuid.uuid4().hex[:12]
email = f"local-{suffix}@example.test"
password = uuid.uuid4().hex + "!aA9"
call("POST", "/auth/register/", {"email": email, "password": password, "full_name": "Local Test"})
TOKEN = call("POST", "/auth/token/", {"email": email, "password": password})["access"]
farm = call("POST", "/farms/", {"name": "Local Test Farm", "slug": "local-" + suffix})
root = "/farms/" + farm["id"]


def resource(name):
    return call("GET", root + "/" + name + "/")["results"]


units = {u["code"]: u for u in resource("units")}
types = {t["code"]: t for t in resource("types")}
categories = {c["code"]: c for c in resource("ledger-categories")}
asset = call("POST", root + "/assets/", {"name": "Urea", "code": "UREA", "asset_class": "stock"})
stock = call("POST", root + "/stock-items/", {"asset": asset["id"], "base_unit": units["kg"]["id"]})
account = call(
    "POST",
    root + "/accounts/",
    {"name": "Cash", "kind": "cash", "opening_date": datetime.now().date().isoformat()},
)
start = datetime.now(timezone.utc)


def complete(code, lines):
    event_data = {
        "client_uuid": str(uuid.uuid4()),
        "event_type": types[code]["id"],
        "planned_start": start.isoformat(),
        "planned_end": (start + timedelta(hours=1)).isoformat(),
        "lines": lines,
    }
    event = call("POST", root + "/commands/create_event/", event_data)
    retry = call("POST", root + "/commands/create_event/", event_data)
    assert retry["id"] == event["id"], "Idempotency failed"
    event = call(
        "POST", root + "/commands/start_event/", {"event_id": event["id"], "version": event["version"]}
    )
    return call(
        "POST", root + "/commands/confirm_event/", {"event_id": event["id"], "version": event["version"]}
    )


complete(
    "procurement",
    [
        {
            "kind": "acquire_stock",
            "asset": asset["id"],
            "qty_unit": units["kg"]["id"],
            "planned_qty": "100",
            "unit_price": "30",
        },
        {
            "kind": "pay",
            "asset": asset["id"],
            "qty_unit": units["piece"]["id"],
            "planned_qty": "1",
            "amount": "3000",
            "account_id": account["id"],
            "ledger_category_id": categories["asset_purchase"]["id"],
        },
    ],
)
used = complete(
    "crop_nutrition",
    [{"kind": "consume_stock", "asset": asset["id"], "qty_unit": units["kg"]["id"], "planned_qty": "18"}],
)
stock = call("GET", root + "/stock-items/" + stock["id"] + "/")
assert stock["on_hand_qty"] == "82.0000", stock
assert used["actual_cost_total"] == "540.00", used
print("PASS: signup, JWT, farm, asset, purchase, payment, idempotency, consume, valuation and cost.")
print("Farm:", farm["id"])
print("User:", email)
print("This test farm remains available for inspection. No existing farm was changed.")
