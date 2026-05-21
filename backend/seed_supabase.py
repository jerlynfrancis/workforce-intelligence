"""
Seed synthetic data into Supabase via PostgREST API.
Tables must already exist -- run the CREATE TABLE script first.
"""

import os
import sys
from pathlib import Path
import pandas as pd
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SERVICE_ROLE_KEY:
    print("Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in backend/.env")
    sys.exit(1)

DATA_DIR = Path(__file__).parent / "data"


def bulk_insert(table_name, df):
    """Insert dataframe rows in chunks via PostgREST."""
    chunk_size = 500
    total = len(df)
    print(f"  Inserting {total} rows into {table_name}...")

    supabase = create_client(SUPABASE_URL, SERVICE_ROLE_KEY)

    for i in range(0, total, chunk_size):
        chunk = df.iloc[i : i + chunk_size]
        records = chunk.to_dict(orient="records")

        for row in records:
            for k, v in row.items():
                if pd.isna(v):
                    row[k] = None
                elif hasattr(v, "item"):
                    row[k] = v.item()

        supabase.table(table_name).upsert(records, ignore_duplicates=True).execute()

        pct = min(100, round((i + chunk_size) / total * 100))
        print(f"    {pct}%", end="\r")

    print(f"    Done ({total} rows)")


def main():
    print("=== COG Data Seeder ===\n")

    print("Loading CSV files...")
    site_master = pd.read_csv(DATA_DIR / "site_master.csv")
    daily_ops = pd.read_csv(DATA_DIR / "daily_operations.csv")
    weekly_wf = pd.read_csv(DATA_DIR / "weekly_workforce.csv")
    shift_pattern = pd.read_csv(DATA_DIR / "shift_pattern_summary.csv")

    daily_ops["date"] = pd.to_datetime(daily_ops["date"]).dt.date
    weekly_wf["week_start_date"] = pd.to_datetime(weekly_wf["week_start_date"]).dt.date
    shift_pattern["week_start_date"] = pd.to_datetime(shift_pattern["week_start_date"]).dt.date

    bulk_insert("site_master", site_master)
    bulk_insert("daily_operations", daily_ops)
    bulk_insert("weekly_workforce", weekly_wf)
    bulk_insert("shift_pattern_summary", shift_pattern)

    print("\n=== Seeding complete ===")

    supabase = create_client(SUPABASE_URL, SERVICE_ROLE_KEY)
    for table in ["site_master", "daily_operations", "weekly_workforce", "shift_pattern_summary"]:
        count = supabase.table(table).select("*", count="exact", head=True).execute()
        print(f"  {table}: {count.count if hasattr(count, 'count') and count.count else '?'} rows")


if __name__ == "__main__":
    main()
