import csv
from collections import defaultdict

csv_path = 'data/weekly_workforce.csv'
rows = []
with open(csv_path) as f:
    reader = csv.DictReader(f)
    for row in reader:
        row['site_id'] = int(row['site_id'])
        rows.append(row)

site_rows = defaultdict(list)
for r in rows:
    site_rows[r['site_id']].append(r)

# Missing weeks ranges based on DB query
# 23: 2024-01-01 through 2024-03-18
# 26: 2024-01-01 through 2024-06-17
# 29: 2024-01-01 through 2024-09-16
# 32: 2024-01-01 through 2024-07-08
# 36: 2025-03-24 through 2025-05-05
# 38: 2024-01-01 and 2024-01-08

missing_cutoffs = {
    23: '2024-03-18',
    26: '2024-06-17',
    29: '2024-09-16',
    32: '2024-07-08',
}

missing_36 = {'2025-03-24', '2025-03-31', '2025-04-07', '2025-04-14', '2025-04-21', '2025-04-28', '2025-05-05'}
missing_38 = {'2024-01-01', '2024-01-08'}

missing = []
for site_id, cutoff in missing_cutoffs.items():
    for r in site_rows[site_id]:
        if r['week_start_date'] <= cutoff:
            missing.append(r)

for site_id, weeks in [(36, missing_36), (38, missing_38)]:
    for r in site_rows[site_id]:
        if r['week_start_date'] in weeks:
            missing.append(r)

missing.sort(key=lambda r: (r['site_id'], r['week_start_date']))
print(f"Total missing: {len(missing)}")

cols = ['week_start_date','site_id','permanent_headcount','part_time_headcount','agency_headcount','turnover_events','absence_rate_pct','vacancy_count','training_hours']

fname = 'queries/weekly_workforce/final.sql'
with open(fname, 'w') as f:
    f.write(f"INSERT INTO weekly_workforce ({','.join(cols)}) VALUES\n")
    lines = []
    for r in missing:
        vals = ','.join(
            f"'{r['week_start_date']}'" if c == 'week_start_date' else str(r[c])
            for c in cols
        )
        lines.append(f"({vals})")
    f.write(',\n'.join(lines))
    f.write('\nON CONFLICT (week_start_date, site_id) DO NOTHING;\n')
print(f"Wrote {fname}")
