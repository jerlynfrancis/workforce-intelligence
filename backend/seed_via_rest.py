#!/usr/bin/env python3
"""Convert SQL chunk files to REST API POST calls for re-seeding."""
import json, os, re, sys, time, urllib.request, urllib.error
from glob import glob

ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qc2pxZHFpZXlmbXN1anpoZHpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzMDUzNDgsImV4cCI6MjA5NDg4MTM0OH0.rhmQvo6fbUgovgNRsT2fj3jDQx4gaM_j876UnUCd3rE"
BASE_URL = "https://mjsjqdqieyfmsujzhdzl.supabase.co/rest/v1"

TABLES = {
    "daily_operations": "backend/queries/daily_operations/insert_*.sql",
    "weekly_workforce": "backend/queries/weekly_workforce/insert_*.sql",
    "shift_pattern_summary": "backend/queries/shift_pattern_summary/insert_*.sql",
}

def parse_sql_chunk(path):
    """Parse a SQL INSERT file into list of dicts."""
    with open(path) as f:
        content = f.read()
    # Strip ON CONFLICT clause before parsing
    content = re.sub(r"\s+ON CONFLICT.*DO NOTHING;?\s*$", ";", content, flags=re.DOTALL)
    m = re.match(r"INSERT INTO\s+\w+\s+\(([^)]+)\)\s+VALUES\s*\n(.+?);\s*$", content, re.DOTALL)
    if not m:
        print(f"  WARN: could not parse {path}")
        return None, None
    cols = [c.strip() for c in m.group(1).split(",")]
    values_text = m.group(2).strip()
    rows = []
    for line in values_text.strip(";").split("\n"):
        line = line.strip().rstrip(",").strip()
        if not line:
            continue
        vals = parse_values(line)
        if vals and len(vals) == len(cols):
            row = dict(zip(cols, vals))
            rows.append(row)
    return cols, rows

def parse_values(line):
    """Parse a single VALUES row like ('2024-01-01',1,0,1,...)."""
    vals = []
    i = 0
    while i < len(line):
        if line[i] == "(":
            i += 1
            continue
        if line[i] == ")":
            break
        if line[i] in " ,":
            i += 1
            continue
        if line[i] == "'":
            end = line.index("'", i + 1)
            vals.append(line[i + 1 : end])
            i = end + 1
        elif line[i] == "N":
            vals.append(None)
            i += 4  # NULL
        else:
            end = i
            while end < len(line) and line[end] not in ",)":
                end += 1
            raw = line[i:end].strip()
            if "." in raw or "e" in raw.lower():
                vals.append(float(raw))
            else:
                try:
                    vals.append(int(raw))
                except ValueError:
                    vals.append(raw)
            i = end
    return vals

def post_data(table, rows):
    url = f"{BASE_URL}/{table}"
    body = json.dumps(rows).encode()
    req = urllib.request.Request(url, data=body, method="POST")
    req.add_header("apikey", ANON_KEY)
    req.add_header("Authorization", f"Bearer {ANON_KEY}")
    req.add_header("Content-Type", "application/json")
    req.add_header("Prefer", "resolution=merge-duplicates")
    try:
        resp = urllib.request.urlopen(req)
        return resp.status
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()

workdir = os.path.join(os.path.dirname(__file__), "..")

for table, pattern in TABLES.items():
    files = sorted(glob(os.path.join(workdir, pattern)))
    print(f"\n=== {table}: {len(files)} files ===")
    for fpath in files:
        fname = os.path.basename(fpath)
        cols, rows = parse_sql_chunk(fpath)
        if not rows:
            print(f"  {fname}: empty or parse error, skipping")
            continue
        # POST in sub-batches of 1000 rows each
        batch_size = 1000
        total_batches = (len(rows) + batch_size - 1) // batch_size
        for b in range(total_batches):
            batch = rows[b * batch_size : (b + 1) * batch_size]
            ret = post_data(table, batch)
            if isinstance(ret, tuple):
                print(f"  {fname}[b{b}] ERROR: {ret[1][:200]}")
                time.sleep(2)
            elif ret == 201:
                pass  # success, no output
            else:
                print(f"  {fname}[b{b}] status={ret}")
        print(f"  {fname}: {len(rows)} rows OK")
        time.sleep(0.1)

print("\nDone!")
