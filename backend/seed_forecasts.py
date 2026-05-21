"""
Seed demand forecast results into Supabase.
"""

import json
import os
import sys
from pathlib import Path

import requests
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://mjsjqdqieyfmsujzhdzl.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_KEY:
    print("ERROR: SUPABASE_SERVICE_ROLE_KEY not set")
    sys.exit(1)

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "resolution=merge-duplicates",
}

INPUT_PATH = Path(__file__).parent / "analysis" / "output" / "demand_forecasts.json"

with open(INPUT_PATH) as f:
    data = json.load(f)

rows = []
for site_id_str, site_data in data.items():
    site_id = int(site_id_str)

    demand_fc = site_data.get("demand_forecast", {})
    sl_fc = site_data.get("service_level_forecast", {})
    cost_fc = site_data.get("cost_forecast", {})

    forecast_dates = site_data.get("forecast_dates", [])
    demand_values = demand_fc.get("forecast", [])
    sl_values = sl_fc.get("forecast", [])
    cost_values = cost_fc.get("forecast", [])

    for i, date_str in enumerate(forecast_dates):
        rows.append({
            "site_id": site_id,
            "forecast_date": date_str,
            "demand_forecast": demand_values[i] if i < len(demand_values) else None,
            "service_level_forecast": sl_values[i] if i < len(sl_values) else None,
            "cost_forecast": cost_values[i] if i < len(cost_values) else None,
        })

print(f"Seeding {len(rows)} forecast rows...")

# Batch in chunks of 1000
BATCH = 1000
url = f"{SUPABASE_URL}/rest/v1/demand_forecasts"

for i in range(0, len(rows), BATCH):
    batch = rows[i : i + BATCH]
    resp = requests.post(url, headers=HEADERS, json=batch)
    if resp.status_code not in (200, 201):
        print(f"Error at batch {i}: {resp.status_code} {resp.text[:200]}")
        sys.exit(1)
    print(f"  Batch {i // BATCH + 1}: {len(batch)} rows OK")

print("Done.")
