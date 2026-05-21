import csv
import subprocess

csv_path = 'data/weekly_workforce.csv'
rows = []
with open(csv_path) as f:
    reader = csv.DictReader(f)
    for row in reader:
        row['site_id'] = int(row['site_id'])
        rows.append(row)

# Get existing (site_id, week_start_date) pairs from DB
result = subprocess.run([
    'psql',
    'postgresql://postgres.mjsjqdqieyfmsujzhdzl:296731%40Jerlyn@aws-0-eu-west-2.pooler.supabase.com:6543/postgres',
    '-c', "SELECT site_id, week_start_date::text FROM weekly_workforce ORDER BY site_id, week_start_date",
    '-t', '-A'
], capture_output=True, text=True, timeout=30)

existing = set()
for line in result.stdout.strip().split('\n'):
    if '|' in line:
        sid, date = line.split('|')
        existing.add((int(sid.strip()), date.strip()))

# Find what's missing from CSV
cols = ['week_start_date','site_id','permanent_headcount','part_time_headcount','agency_headcount','turnover_events','absence_rate_pct','vacancy_count','training_hours']

missing = [r for r in rows if (r['site_id'], r['week_start_date']) not in existing]
missing.sort(key=lambda r: (r['site_id'], r['week_start_date']))

print(f"Total missing: {len(missing)}")
print("Sites with gaps:", sorted(set(r['site_id'] for r in missing)))

for chunk_idx in range(0, len(missing), 250):
    chunk = missing[chunk_idx:chunk_idx + 250]
    fname = f'queries/weekly_workforce/precise_{chunk_idx:03d}.sql'
    with open(fname, 'w') as f:
        f.write(f"INSERT INTO weekly_workforce ({','.join(cols)}) VALUES\n")
        lines = []
        for r in chunk:
            vals = ','.join(
                f"'{r['week_start_date']}'" if c == 'week_start_date' else str(r[c])
                for c in cols
            )
            lines.append(f"({vals})")
        f.write(',\n'.join(lines))
        f.write('\nON CONFLICT (week_start_date, site_id) DO NOTHING;\n')
    print(f"Wrote {fname} with {len(chunk)} rows")
