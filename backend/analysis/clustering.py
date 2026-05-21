"""
Clustering analysis for COG Workforce Intelligence.
Identifies site archetypes based on operational patterns.
Uses Supabase REST API for data access (psycopg2 unavailable).
"""

import json
import os
import sys
from pathlib import Path

import numpy as np
import pandas as pd
from dotenv import load_dotenv
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
import requests

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://mjsjqdqieyfmsujzhdzl.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_KEY:
    print("ERROR: SUPABASE_SERVICE_ROLE_KEY not set in backend/.env")
    sys.exit(1)

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
}

OUTPUT_DIR = Path(__file__).parent / "output"
OUTPUT_DIR.mkdir(exist_ok=True)


def query_supabase(path: str) -> list:
    """Query Supabase REST API with automatic pagination (5k row limit per page)."""
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


def build_features() -> pd.DataFrame:
    """Build per-site feature matrix from Supabase tables."""
    print("Fetching site_master...")
    sites = query_supabase("site_master?select=*")
    sites_df = pd.DataFrame(sites)

    print("Fetching weekly_workforce...")
    weekly = query_supabase("weekly_workforce?select=*")
    weekly_df = pd.DataFrame(weekly)

    print("Fetching daily_operations...")
    daily = query_supabase(
        "daily_operations?select=site_id,service_level_score,"
        "labour_cost_gbp,actual_hours_worked,day_of_week,"
        "agency_cost_gbp,overtime_cost_gbp,forecast_demand,actual_demand"
    )
    daily_df = pd.DataFrame(daily)

    print("Fetching shift_pattern_summary...")
    shifts = query_supabase("shift_pattern_summary?select=*")
    shifts_df = pd.DataFrame(shifts)

    # ── Numeric conversions ──
    for col in ["labour_cost_gbp", "actual_hours_worked", "service_level_score",
                 "agency_cost_gbp", "overtime_cost_gbp", "forecast_demand", "actual_demand"]:
        if col in daily_df.columns:
            daily_df[col] = pd.to_numeric(daily_df[col], errors="coerce")

    for col in ["absence_rate_pct", "turnover_events", "training_hours",
                 "agency_headcount", "permanent_headcount", "part_time_headcount",
                 "vacancy_count"]:
        if col in weekly_df.columns:
            weekly_df[col] = pd.to_numeric(weekly_df[col], errors="coerce")

    for col in ["service_level_score", "agency_hours", "overtime_hours",
                 "scheduled_hours", "actual_hours", "demand_volume"]:
        if col in shifts_df.columns:
            shifts_df[col] = pd.to_numeric(shifts_df[col], errors="coerce")

    # ── Feature engineering ──
    features = sites_df[["site_id", "site_name", "region", "site_type"]].copy()

    # Weekly workforce aggregations
    wk_agg = weekly_df.groupby("site_id").agg({
        "absence_rate_pct": "mean",
        "turnover_events": "mean",
        "training_hours": "mean",
        "vacancy_count": "mean",
    }).rename(columns={
        "absence_rate_pct": "avg_absence_rate",
        "turnover_events": "avg_turnover",
        "training_hours": "avg_training_hours",
        "vacancy_count": "avg_vacancy",
    })

    weekly_df["total_headcount"] = (
        weekly_df["permanent_headcount"]
        + weekly_df["part_time_headcount"]
        + weekly_df["agency_headcount"]
    )
    weekly_df["agency_ratio"] = np.where(
        weekly_df["total_headcount"] > 0,
        weekly_df["agency_headcount"] / weekly_df["total_headcount"],
        0,
    )
    wk_ratio = weekly_df.groupby("site_id")["agency_ratio"].mean().to_frame("avg_agency_ratio")
    wk_agg = wk_agg.join(wk_ratio)

    features = features.merge(wk_agg, on="site_id", how="left")

    # Daily operations aggregations
    daily_df["cost_per_hour"] = np.where(
        daily_df["actual_hours_worked"] > 0,
        daily_df["labour_cost_gbp"] / daily_df["actual_hours_worked"],
        0,
    )
    daily_df["agency_cost_ratio"] = np.where(
        daily_df["labour_cost_gbp"] > 0,
        daily_df["agency_cost_gbp"] / daily_df["labour_cost_gbp"],
        0,
    )
    daily_df["overtime_cost_ratio"] = np.where(
        daily_df["labour_cost_gbp"] > 0,
        daily_df["overtime_cost_gbp"] / daily_df["labour_cost_gbp"],
        0,
    )
    daily_df["demand_error"] = np.where(
        daily_df["forecast_demand"] > 0,
        abs(daily_df["actual_demand"] - daily_df["forecast_demand"]) / daily_df["forecast_demand"],
        0,
    )

    d_agg = daily_df.groupby("site_id").agg({
        "service_level_score": "mean",
        "cost_per_hour": "mean",
        "agency_cost_ratio": "mean",
        "overtime_cost_ratio": "mean",
        "demand_error": "mean",
        "labour_cost_gbp": "sum",
    }).rename(columns={
        "service_level_score": "avg_service_level",
        "cost_per_hour": "avg_cost_per_hour",
        "agency_cost_ratio": "avg_agency_cost_ratio",
        "overtime_cost_ratio": "avg_overtime_cost_ratio",
        "demand_error": "avg_demand_forecast_error",
        "labour_cost_gbp": "total_labour_cost",
    })

    # Weekend service level gap
    weekend = daily_df[daily_df["day_of_week"].isin([5, 6])].groupby("site_id")["service_level_score"].mean().to_frame("weekend_sl")
    weekday = daily_df[~daily_df["day_of_week"].isin([5, 6])].groupby("site_id")["service_level_score"].mean().to_frame("weekday_sl")
    sl_gap = weekday.join(weekend)
    sl_gap["weekend_sl_gap"] = sl_gap["weekday_sl"] - sl_gap["weekend_sl"]
    sl_gap = sl_gap[["weekend_sl_gap"]]

    d_agg = d_agg.join(sl_gap)

    # Demand volatility
    demand_vol = daily_df.groupby("site_id")["actual_demand"].std().to_frame("demand_volatility")

    d_agg = d_agg.join(demand_vol)

    features = features.merge(d_agg, on="site_id", how="left")

    # Shift pattern aggregations
    sh_agg = shifts_df.groupby("site_id").agg({
        "agency_hours": "mean",
        "overtime_hours": "mean",
    }).rename(columns={
        "agency_hours": "avg_shift_agency_hours",
        "overtime_hours": "avg_shift_overtime",
    })
    features = features.merge(sh_agg, on="site_id", how="left")

    features = features.set_index("site_id")
    return features


def run_clustering(df: pd.DataFrame, n_clusters: int = 4) -> pd.DataFrame:
    """Run KMeans clustering on feature matrix."""
    feature_cols = [
        "avg_absence_rate", "avg_turnover", "avg_agency_ratio",
        "avg_service_level", "avg_cost_per_hour", "avg_agency_cost_ratio",
        "avg_overtime_cost_ratio", "avg_demand_forecast_error",
        "weekend_sl_gap", "demand_volatility", "avg_vacancy",
    ]
    available = [c for c in feature_cols if c in df.columns]
    missing = set(feature_cols) - set(available)
    if missing:
        print(f"WARNING: Missing features: {missing}")

    X = df[available].copy()
    print(f"Feature matrix shape: {X.shape}")
    print(f"Features used: {available}")

    # Handle any remaining NaN
    X = X.fillna(X.median())

    # Scale
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # Cluster
    kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    labels = kmeans.fit_predict(X_scaled)

    df["cluster"] = labels
    df["cluster"] = df["cluster"].astype(int)

    # PCA for 2D projection
    pca = PCA(n_components=2, random_state=42)
    coords = pca.fit_transform(X_scaled)
    df["pca_x"] = coords[:, 0]
    df["pca_y"] = coords[:, 1]
    df["pca_variance_ratio"] = pca.explained_variance_ratio_.sum()

    # Cluster descriptions
    cluster_profiles = df.groupby("cluster")[available].mean()
    print("\n── Cluster Profiles ──")
    for c in cluster_profiles.index:
        print(f"\nCluster {c}:")
        for col in available:
            val = cluster_profiles.loc[c, col]
            print(f"  {col}: {val:.4f}")

    # Label clusters by dominant characteristics
    cluster_labels = {}
    for c in cluster_profiles.index:
        profile = cluster_profiles.loc[c]
        traits = []
        if profile.get("avg_agency_ratio", 0) > df["avg_agency_ratio"].median():
            traits.append("Agency-Dependent")
        if profile.get("avg_absence_rate", 0) > df["avg_absence_rate"].median():
            traits.append("High-Absence")
        if profile.get("weekend_sl_gap", 0) > df["weekend_sl_gap"].median():
            traits.append("Weekend-SL-Gap")
        if profile.get("avg_service_level", 1) < df["avg_service_level"].median():
            traits.append("Low-SL")
        if profile.get("avg_cost_per_hour", 0) > df["avg_cost_per_hour"].median():
            traits.append("High-Cost")
        if profile.get("demand_volatility", 0) > df["demand_volatility"].median():
            traits.append("Volatile-Demand")
        if profile.get("avg_demand_forecast_error", 0) > df["avg_demand_forecast_error"].median():
            traits.append("Forecast-Poor")
        cluster_labels[int(c)] = " + ".join(traits) if traits else f"Cluster {c}"

    df["archetype"] = df["cluster"].map(cluster_labels)

    print("\n── Archetype Assignments ──")
    for c in sorted(cluster_labels.keys()):
        count = (df["cluster"] == c).sum()
        print(f"  Cluster {c} ({cluster_labels[c]}): {count} sites")

    return df, scaler, pca, cluster_labels


def write_results(df: pd.DataFrame, cluster_labels: dict):
    """Write clustering results to JSON for the dashboard."""
    result = []
    for site_id, row in df.iterrows():
        result.append({
            "site_id": int(site_id),
            "site_name": row.get("site_name", f"Site {site_id}"),
            "region": row.get("region", ""),
            "site_type": row.get("site_type", ""),
            "cluster": int(row["cluster"]),
            "archetype": cluster_labels.get(int(row["cluster"]), f"Cluster {int(row['cluster'])}"),
            "pca_x": round(float(row["pca_x"]), 4),
            "pca_y": round(float(row["pca_y"]), 4),
            "avg_absence_rate": round(float(row.get("avg_absence_rate", 0)), 2),
            "avg_turnover": round(float(row.get("avg_turnover", 0)), 2),
            "avg_agency_ratio": round(float(row.get("avg_agency_ratio", 0)), 4),
            "avg_service_level": round(float(row.get("avg_service_level", 0)), 2),
            "avg_cost_per_hour": round(float(row.get("avg_cost_per_hour", 0)), 2),
            "total_labour_cost": round(float(row.get("total_labour_cost", 0)), 0),
            "weekend_sl_gap": round(float(row.get("weekend_sl_gap", 0)), 2),
            "demand_volatility": round(float(row.get("demand_volatility", 0)), 2),
        })

    output_path = OUTPUT_DIR / "site_archetypes.json"
    with open(output_path, "w") as f:
        json.dump(result, f, indent=2)
    print(f"\nResults written to {output_path}")

    # Also write cluster profiles
    profiles = {}
    for c, label in cluster_labels.items():
        members = [r for r in result if r["cluster"] == c]
        profiles[str(c)] = {
            "label": label,
            "count": len(members),
            "sites": [m["site_name"] for m in members],
        }

    profile_path = OUTPUT_DIR / "cluster_profiles.json"
    with open(profile_path, "w") as f:
        json.dump(profiles, f, indent=2)
    print(f"Profiles written to {profile_path}")


def main():
    print("═══ COG Site Archetype Clustering ═══\n")
    df = build_features()
    print(f"\nTotal sites: {len(df)}")
    print(f"Total features: {len(df.columns)}")
    print(f"Columns: {list(df.columns)}\n")

    df_result, scaler, pca, labels = run_clustering(df, n_clusters=4)
    write_results(df_result, labels)

    print("\nDone.")


if __name__ == "__main__":
    main()
