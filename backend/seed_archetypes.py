"""
Seed site archetype clustering results into Supabase.
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

INPUT_PATH = Path(__file__).parent / "analysis" / "output" / "site_archetypes.json"

with open(INPUT_PATH) as f:
    data = json.load(f)

# Map to column names matching the Supabase table
rows = []
for r in data:
    rows.append({
        "site_id": r["site_id"],
        "site_name": r["site_name"],
        "region": r["region"],
        "site_type": r["site_type"],
        "cluster": r["cluster"],
        "archetype": r["archetype"],
        "pca_x": r["pca_x"],
        "pca_y": r["pca_y"],
        "avg_absence_rate": r["avg_absence_rate"],
        "avg_turnover": r["avg_turnover"],
        "avg_agency_ratio": r["avg_agency_ratio"],
        "avg_service_level": r["avg_service_level"],
        "avg_cost_per_hour": r["avg_cost_per_hour"],
        "total_labour_cost": r["total_labour_cost"],
        "weekend_sl_gap": r["weekend_sl_gap"],
        "demand_volatility": r["demand_volatility"],
    })

print(f"Seeding {len(rows)} archetype rows...")

url = f"{SUPABASE_URL}/rest/v1/site_archetypes"
resp = requests.post(url, headers=HEADERS, json=rows)
if resp.status_code in (200, 201):
    print("Done.")
else:
    print(f"Error: {resp.status_code} {resp.text}")
    sys.exit(1)
