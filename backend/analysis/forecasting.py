"""
Demand forecasting model for COG Workforce Intelligence.
Uses SARIMA/ETS via statsmodels on daily_operations data.
Outputs per-site forecast for the next 8 weeks.
"""

import json
import os
import sys
import warnings
from pathlib import Path

import numpy as np
import pandas as pd
import requests
from dotenv import load_dotenv
from statsmodels.tsa.holtwinters import ExponentialSmoothing

warnings.filterwarnings("ignore")
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
}

OUTPUT_DIR = Path(__file__).parent / "output"
OUTPUT_DIR.mkdir(exist_ok=True)


def query_supabase(path: str) -> list:
    url = f"{SUPABASE_URL}/rest/v1/{path}"
    all_data = []
    offset = 0
    page_size = 5000
    while True:
        headers = {**HEADERS, "Range": f"{offset}-{offset + page_size - 1}"}
        resp = requests.get(url, headers=headers)
        resp.raise_for_status()
        data = resp.json()
        if not data:
            break
        all_data.extend(data)
        if len(data) < page_size:
            break
        offset += page_size
    return all_data


def forecast_site(series: pd.Series, periods: int = 56) -> dict:
    """Forecast a time series using Holt-Winters ETS."""
    if len(series.dropna()) < 14:
        return {"error": "insufficient data"}

    try:
        model = ExponentialSmoothing(
            series.dropna(),
            seasonal_periods=7,
            trend="add",
            seasonal="add",
            initialization_method="estimated",
        )
        fitted = model.fit()
        forecast = fitted.forecast(periods)
        return {
            "forecast": [round(v, 2) for v in forecast.tolist()],
            "fitted": [round(v, 2) for v in fitted.fittedvalues.tolist()],
            "aic": round(fitted.aic, 2) if hasattr(fitted, "aic") else None,
            "sse": round(fitted.sse, 2) if hasattr(fitted, "sse") else None,
        }
    except Exception as e:
        return {"error": str(e)}


def main():
    print("═══ COG Demand Forecasting ═══\n")

    print("Fetching daily_operations...")
    daily = query_supabase(
        "daily_operations?select=site_id,date,actual_demand,forecast_demand,"
        "service_level_score,labour_cost_gbp"
    )
    df = pd.DataFrame(daily)
    df["date"] = pd.to_datetime(df["date"])
    for col in ["actual_demand", "forecast_demand", "service_level_score", "labour_cost_gbp"]:
        df[col] = pd.to_numeric(df[col], errors="coerce")

    print(f"Total rows: {len(df)}")
    print(f"Date range: {df['date'].min()} to {df['date'].max()}")
    print(f"Unique sites: {df['site_id'].nunique()}\n")

    all_results = {}
    site_ids = sorted(df["site_id"].unique())

    for sid in site_ids:
        site_data = df[df["site_id"] == sid].sort_values("date").set_index("date")
        site_name = f"Site {sid}"

        demand_series = site_data["actual_demand"]
        sl_series = site_data["service_level_score"]
        cost_series = site_data["labour_cost_gbp"]

        demand_result = forecast_site(demand_series)
        sl_result = forecast_site(sl_series)
        cost_result = forecast_site(cost_series)

        last_date = site_data.index.max()
        forecast_dates = pd.date_range(
            start=last_date + pd.Timedelta(days=1), periods=56, freq="D"
        )

        all_results[sid] = {
            "site_id": int(sid),
            "last_observed_date": str(last_date.date()),
            "forecast_dates": [str(d.date()) for d in forecast_dates],
            "demand_forecast": demand_result,
            "service_level_forecast": sl_result,
            "cost_forecast": cost_result,
            "historical_demand": [
                {"date": str(d.date()), "value": round(float(v), 2)}
                for d, v in site_data["actual_demand"].dropna().items()
            ],
        }

        if sid % 10 == 0:
            print(f"  Processed {sid}/{len(site_ids)} sites...")

    print(f"\nProcessed all {len(all_results)} sites.")

    # Convert np.int64 keys to Python ints for JSON serialization
    all_results_serializable = {}
    for k, v in all_results.items():
        all_results_serializable[int(k)] = v

    output_path = OUTPUT_DIR / "demand_forecasts.json"
    with open(output_path, "w") as f:
        json.dump(all_results_serializable, f, indent=2)

    # Also write a lightweight summary for the dashboard
    summary = []
    for sid, result in all_results.items():
        summary.append({
            "site_id": int(sid),
            "has_forecast": "error" not in result["demand_forecast"],
            "forecast_error": result["demand_forecast"].get("error"),
            "last_demand": float(result["historical_demand"][-1]["value"]) if result["historical_demand"] else None,
            "avg_forecast_next_28d": float(round(
                np.mean(result["demand_forecast"]["forecast"][:28]), 2
            )) if "forecast" in result["demand_forecast"] else None,
        })

    summary_path = OUTPUT_DIR / "forecast_summary.json"
    with open(summary_path, "w") as f:
        json.dump(summary, f, indent=2)

    print(f"Full forecasts written to {output_path}")
    print(f"Summary written to {summary_path}")
    print("Done.")


if __name__ == "__main__":
    main()
