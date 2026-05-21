import csv
import os

def generate_inserts(csv_path, table_name, pk_cols, output_dir, chunk_size=250):
    rows = []
    with open(csv_path) as f:
        reader = csv.DictReader(f)
        cols = reader.fieldnames
        for row in reader:
            rows.append(row)

    print(f"{table_name}: {len(rows)} rows, {len(cols)} cols: {cols}")

    os.makedirs(output_dir, exist_ok=True)

    for chunk_idx in range(0, len(rows), chunk_size):
        chunk = rows[chunk_idx:chunk_idx + chunk_size]
        fname = f'{output_dir}/insert_{chunk_idx:04d}.sql'
        with open(fname, 'w') as f:
            f.write(f"INSERT INTO {table_name} ({','.join(cols)}) VALUES\n")
            lines = []
            for r in chunk:
                vals = ','.join(
                    f"'{r[c]}'" if c in ('week_start_date', 'date', 'shift_type') else str(r[c])
                    for c in cols
                )
                lines.append(f"({vals})")
            f.write(',\n'.join(lines))
            f.write(f'\nON CONFLICT ({", ".join(pk_cols)}) DO NOTHING;\n')
        print(f"  Wrote {fname} ({len(chunk)} rows)")

generate_inserts('data/shift_pattern_summary.csv', 'shift_pattern_summary', ['site_id', 'week_start_date', 'shift_type'], 'queries/shift_pattern_summary')
