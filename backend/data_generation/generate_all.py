"""
Synthetic data generator for Caldwell Operations Group (COG).
Generates 4 tables: site_master, daily_operations, weekly_workforce, shift_pattern_summary.

All 6 engineered patterns from the spec are baked into the data logic.
"""

import numpy as np
import pandas as pd
from faker import Faker
from pathlib import Path
import random

RNG = np.random.default_rng(42)
Faker.seed(42)
fake = Faker("en_GB")

OUTPUT_DIR = Path(__file__).parent.parent / "data"
OUTPUT_DIR.mkdir(exist_ok=True)

# ── Configuration ──────────────────────────────────────────────────────────

REGIONS = {
    "North": {"sites": 12, "base_labour_cost": 120, "demand_vol": 0.15, "name_prefix": ["Glasgow", "Edinburgh", "Newcastle", "Leeds", "Manchester", "Liverpool", "Sheffield", "Bradford", "Hull", "York", "Carlisle", "Preston"]},
    "Midlands": {"sites": 13, "base_labour_cost": 105, "demand_vol": 0.10, "name_prefix": ["Birmingham", "Nottingham", "Leicester", "Derby", "Coventry", "Wolverhampton", "Northampton", "Stoke", "Lincoln", "Milton Keynes", "Peterborough", "Norwich", "Ipswich"]},
    "South": {"sites": 15, "base_labour_cost": 145, "demand_vol": 0.22, "name_prefix": ["London", "Croydon", "Reading", "Southampton", "Portsmouth", "Brighton", "Oxford", "Cambridge", "Bristol", "Cardiff", "Exeter", "Bournemouth", "Swindon", "Dover", "Guildford"]},
}

SITE_TYPES = ["Large", "Standard", "Small", "Express"]
SIZE_BANDS = ["A", "B", "C", "D"]

START_DATE = pd.Timestamp("2024-01-01")
END_DATE = pd.Timestamp("2025-06-30")

# Sites tagged for Pattern 1: concentrated agency dependence
AGENCY_HEAVY_SITES = {2, 5, 8, 11, 14, 17, 20, 23}

# Sites tagged for Pattern 3: quiet-period overstaffing
OVERSTAFFED_SITES = {3, 7, 12, 18, 25, 30}

# Sites tagged for Pattern 5: hidden cost trade-off (look stable, high agency)
HIDDEN_COST_SITES = {1, 6, 10, 15, 19, 22, 28}


# ── Site Master ────────────────────────────────────────────────────────────

def generate_site_master():
    rows = []
    site_id = 1
    for region, config in REGIONS.items():
        for i in range(config["sites"]):
            site_type = RNG.choice(SITE_TYPES, p=[0.15, 0.40, 0.30, 0.15])
            size_map = {"Large": "A", "Standard": "B", "Small": "C", "Express": "D"}
            is_agency = site_id in AGENCY_HEAVY_SITES
            is_overstaffed = site_id in OVERSTAFFED_SITES
            is_hidden = site_id in HIDDEN_COST_SITES

            if site_type == "Large":
                budget_hours = RNG.integers(4200, 5200)
                budget_hc = RNG.integers(90, 120)
                target_sl = 0.95
            elif site_type == "Standard":
                budget_hours = RNG.integers(2500, 3200)
                budget_hc = RNG.integers(50, 75)
                target_sl = 0.92
            elif site_type == "Small":
                budget_hours = RNG.integers(1400, 2000)
                budget_hc = RNG.integers(25, 40)
                target_sl = 0.90
            else:
                budget_hours = RNG.integers(700, 1100)
                budget_hc = RNG.integers(10, 20)
                target_sl = 0.88

            # Agency-heavy sites get more budgeted hours (masking the issue)
            if is_agency:
                budget_hours = int(budget_hours * 1.08)
                budget_hc = int(budget_hc * 1.05)

            # Hidden cost sites look normally budgeted
            if is_hidden:
                budget_hours = int(budget_hours * 0.97)
                budget_hc = int(budget_hc * 0.98)

            rows.append({
                "site_id": site_id,
                "site_name": f"{config['name_prefix'][i]} COG {site_type}",
                "region": region,
                "site_type": site_type,
                "site_size_band": size_map[site_type],
                "opening_date": fake.date_between(start_date="-10y", end_date="-1y"),
                "target_service_level": target_sl,
                "budgeted_weekly_hours": budget_hours,
                "budgeted_headcount": budget_hc,
                "is_agency_heavy": int(is_agency),
                "is_overstaffed_low_demand": int(is_overstaffed),
                "is_hidden_cost": int(is_hidden),
            })
            site_id += 1

    df = pd.DataFrame(rows)
    df.to_csv(OUTPUT_DIR / "site_master.csv", index=False)
    print(f"site_master: {len(df)} sites generated")
    return df


# ── Daily Operations ──────────────────────────────────────────────────────

def generate_daily_operations(site_master: pd.DataFrame):
    rows = []
    dates = pd.date_range(START_DATE, END_DATE, freq="D")

    # Day-of-week demand multipliers (weekend peaks)
    dow_mult = {0: 0.85, 1: 0.82, 2: 0.88, 3: 0.92, 4: 1.05, 5: 1.30, 6: 1.20}

    # Holiday periods (Christmas, Easter, Summer, Bank Holidays)
    holiday_ranges = [
        ("2024-03-25", "2024-04-08"),  # Easter 2024
        ("2024-07-15", "2024-09-01"),  # Summer 2024
        ("2024-12-16", "2025-01-05"),  # Christmas 2024
        ("2025-03-31", "2025-04-14"),  # Easter 2025
        ("2025-07-01", "2025-06-30"),  # (truncated summer)
    ]

    def is_holiday(d):
        for start, end in holiday_ranges:
            if pd.Timestamp(start) <= d <= pd.Timestamp(end):
                return 1
        return 0

    for _, site in site_master.iterrows():
        sid = site["site_id"]
        region = site["region"]
        site_type = site["site_type"]
        is_agency = bool(site["is_agency_heavy"])
        is_overstaffed = bool(site["is_overstaffed_low_demand"])
        is_hidden = bool(site["is_hidden_cost"])

        base_type_demand = {"Large": 450, "Standard": 280, "Small": 150, "Express": 80}[site_type]
        region_vol = REGIONS[region]["demand_vol"]
        base_cost = REGIONS[region]["base_labour_cost"]

        for d in dates:
            holiday = is_holiday(d)
            dow = d.dayofweek
            month = d.month
            week_num = d.isocalendar().week

            # Base demand with day-of-week pattern
            demand = base_type_demand * dow_mult[dow]

            # Holiday boost
            if holiday:
                demand *= RNG.uniform(1.15, 1.35)

            # Seasonality (summer peak, winter dip for non-christmas)
            if month in [7, 8]:
                demand *= RNG.uniform(1.10, 1.20)
            elif month in [11, 12]:
                demand *= RNG.uniform(1.05, 1.20)
            elif month in [1, 2]:
                demand *= RNG.uniform(0.85, 0.95)

            # Regional demand variability
            demand *= RNG.uniform(1 - region_vol, 1 + region_vol)

            # Agency-heavy sites have higher demand volatility
            if is_agency:
                demand *= RNG.uniform(0.88, 1.15)

            # Demand noise (5-8% typical noise)
            noise_pct = 0.08 if is_agency else 0.05
            actual_demand = demand * RNG.uniform(1 - noise_pct, 1 + noise_pct)

            demand = max(10, round(demand, 1))
            actual_demand = max(10, round(actual_demand, 1))

            # Transactions roughly proportional to demand
            transactions = int(demand * RNG.uniform(2.5, 4.5))

            # ── Staffing logic ──────────────────────────────────────────────
            # Scheduled hours: should track demand but with systematic errors

            # Compute ideal hours needed (roughly demand / throughput per hour)
            throughput_per_hour = {"Large": 18, "Standard": 15, "Small": 12, "Express": 10}[site_type]
            ideal_hours = actual_demand / throughput_per_hour

            # Base scheduled hours track ideal but with inefficiencies
            scheduled_hours = ideal_hours * RNG.uniform(0.92, 1.08)

            # Pattern 3: Overstaffed sites carry extra hours on quiet days (Mon-Wed)
            if is_overstaffed and dow in [0, 1, 2]:
                scheduled_hours *= RNG.uniform(1.12, 1.25)

            # Weekend understaffing (Pattern 2): even well-staffed sites struggle Fri-Sun
            if dow >= 4:
                scheduled_hours *= RNG.uniform(0.85, 0.95)

            scheduled_hours = round(scheduled_hours, 1)

            # Actual hours worked — varies from scheduled due to absenteeism
            base_absence_rate = 0.04 if not is_agency else 0.07
            if is_hidden:
                base_absence_rate = 0.03  # looks stable

            absence_hours = scheduled_hours * RNG.uniform(
                base_absence_rate - 0.01, base_absence_rate + 0.02
            )
            absence_hours = round(absence_hours, 1)

            # Agency hours
            ideal_agency = 0
            if is_agency:
                # Agency-heavy sites use agency to fill gaps chronically
                if RNG.random() < 0.65:
                    ideal_agency = scheduled_hours * RNG.uniform(0.08, 0.20)
                if dow >= 5 and RNG.random() < 0.50:
                    ideal_agency += scheduled_hours * RNG.uniform(0.05, 0.12)
            elif is_hidden:
                # Hidden cost sites: agency fills gaps silently
                if RNG.random() < 0.55:
                    ideal_agency = scheduled_hours * RNG.uniform(0.06, 0.15)
            else:
                # Normal sites: occasional agency use
                if RNG.random() < 0.15:
                    ideal_agency = scheduled_hours * RNG.uniform(0.03, 0.08)

            agency_hours = round(ideal_agency, 1)

            # Overtime hours: spikes on peak days, especially when understaffed
            overtime_hours = 0
            if (dow >= 5 or holiday) and (scheduled_hours < ideal_hours * 0.90):
                overtime_hours = (ideal_hours - scheduled_hours) * RNG.uniform(0.10, 0.30)
            if is_agency:
                overtime_hours += scheduled_hours * RNG.uniform(0.01, 0.03)
            overtime_hours = round(overtime_hours, 1)

            actual_hours_worked = scheduled_hours - absence_hours + overtime_hours + agency_hours
            actual_hours_worked = round(actual_hours_worked, 1)

            # ── Service Level ───────────────────────────────────────────────
            # Staffing adequacy ratio
            staffing_ratio = (scheduled_hours + agency_hours) / max(ideal_hours, 1)
            base_sl = 0.95

            if staffing_ratio < 0.80:
                base_sl = RNG.uniform(0.60, 0.72)
            elif staffing_ratio < 0.90:
                base_sl = RNG.uniform(0.73, 0.82)
            elif staffing_ratio < 1.00:
                base_sl = RNG.uniform(0.83, 0.91)
            elif staffing_ratio < 1.10:
                base_sl = RNG.uniform(0.90, 0.96)
            else:
                base_sl = RNG.uniform(0.92, 0.98)

            # Holiday/weekend pressure reduces SL further
            if holiday and staffing_ratio < 1.0:
                base_sl -= 0.05
            if dow >= 5 and staffing_ratio < 0.95:
                base_sl -= 0.04

            service_score = round(max(0.40, min(1.0, base_sl)), 3)

            # Wait time / delay index (inversely correlated with SL)
            wait_index = round(max(1, (1 - service_score) * RNG.uniform(15, 25) + RNG.uniform(0, 3)), 1)

            # ── Costs ──────────────────────────────────────────────────────
            hourly_rate = base_cost * RNG.uniform(0.95, 1.05)
            agency_rate = hourly_rate * RNG.uniform(1.40, 1.60)
            overtime_rate = hourly_rate * RNG.uniform(1.35, 1.50)

            labour_cost = round(actual_hours_worked * hourly_rate, 2)
            agency_cost = round(agency_hours * agency_rate, 2)
            overtime_cost = round(overtime_hours * overtime_rate, 2)

            rows.append({
                "date": d.date(),
                "site_id": sid,
                "day_of_week": dow,
                "week_number": week_num,
                "month": month,
                "is_holiday_period": holiday,
                "forecast_demand": demand,
                "actual_demand": actual_demand,
                "transactions_or_jobs_completed": transactions,
                "scheduled_hours": scheduled_hours,
                "actual_hours_worked": actual_hours_worked,
                "overtime_hours": overtime_hours,
                "agency_hours": agency_hours,
                "absence_hours": absence_hours,
                "service_level_score": service_score,
                "customer_wait_time_or_delay_index": wait_index,
                "labour_cost_gbp": labour_cost,
                "agency_cost_gbp": agency_cost,
                "overtime_cost_gbp": overtime_cost,
            })

    df = pd.DataFrame(rows)
    df.to_csv(OUTPUT_DIR / "daily_operations.csv", index=False)
    print(f"daily_operations: {len(df):,} rows generated ({len(df)//len(dates) } sites × {len(dates)} days)")
    return df


# ── Weekly Workforce ──────────────────────────────────────────────────────

def generate_weekly_workforce(site_master: pd.DataFrame):
    rows = []
    weekly_starts = pd.date_range(START_DATE, END_DATE, freq="W-MON")

    for _, site in site_master.iterrows():
        sid = site["site_id"]
        site_type = site["site_type"]
        is_agency = bool(site["is_agency_heavy"])
        is_overstaffed = bool(site["is_overstaffed_low_demand"])
        is_hidden = bool(site["is_hidden_cost"])

        hc_map = {"Large": (90, 120), "Standard": (50, 75), "Small": (25, 40), "Express": (10, 20)}
        min_hc, max_hc = hc_map[site_type]
        base_hc = RNG.integers(min_hc, max_hc)

        for ws in weekly_starts:
            # Permanent headcount drifts slightly
            perm_hc = max(5, int(base_hc + RNG.normal(0, 2)))

            # Part-time ratio ~20-35%
            pt_ratio = RNG.uniform(0.20, 0.35)
            pt_hc = int(perm_hc * pt_ratio)

            # Agency headcount
            if is_agency:
                agency_hc = int(perm_hc * RNG.uniform(0.08, 0.18))
            elif is_hidden:
                agency_hc = int(perm_hc * RNG.uniform(0.05, 0.12))
            else:
                agency_hc = int(perm_hc * RNG.uniform(0, 0.04))

            # Absence rate
            base_abs = 0.04
            if is_agency:
                base_abs = RNG.uniform(0.055, 0.095)
            elif is_hidden:
                base_abs = RNG.uniform(0.025, 0.045)

            # Seasonal absence (winter higher)
            month = ws.month
            if month in [1, 2, 12]:
                base_abs += 0.015
            elif month in [7, 8]:
                base_abs -= 0.005

            absence_rate = round(max(0.01, base_abs + RNG.uniform(-0.01, 0.01)), 4)

            # Turnover events (annualised ~15-25%)
            annual_turnover_rate = 0.18
            if is_agency:
                annual_turnover_rate = RNG.uniform(0.22, 0.32)
            elif is_hidden:
                annual_turnover_rate = RNG.uniform(0.14, 0.19)

            weekly_turnover_prob = annual_turnover_rate / 52
            turnover_events = int(RNG.binomial(perm_hc, weekly_turnover_prob))

            # Vacancies
            vacancy_rate = 0.04
            if is_agency:
                vacancy_rate = RNG.uniform(0.06, 0.12)
            vacancy_count = int(perm_hc * vacancy_rate * RNG.uniform(0.8, 1.2))

            # Training hours
            training_hours = int(perm_hc * RNG.uniform(0.3, 0.8))

            rows.append({
                "week_start_date": ws.date(),
                "site_id": sid,
                "permanent_headcount": perm_hc,
                "part_time_headcount": pt_hc,
                "agency_headcount": agency_hc,
                "turnover_events": turnover_events,
                "absence_rate_pct": round(absence_rate * 100, 2),
                "vacancy_count": vacancy_count,
                "training_hours": training_hours,
            })

    df = pd.DataFrame(rows)
    df.to_csv(OUTPUT_DIR / "weekly_workforce.csv", index=False)
    print(f"weekly_workforce: {len(df):,} rows generated ({len(df)//len(weekly_starts)} sites × {len(weekly_starts)} weeks)")
    return df


# ── Shift Pattern Summary ─────────────────────────────────────────────────

def generate_shift_patterns(site_master: pd.DataFrame):
    rows = []
    weekly_starts = pd.date_range(START_DATE, END_DATE, freq="W-MON")
    shift_types = ["Morning", "Afternoon", "Evening", "Weekend"]

    for _, site in site_master.iterrows():
        sid = site["site_id"]
        site_type = site["site_type"]
        is_agency = bool(site["is_agency_heavy"])
        is_hidden = bool(site["is_hidden_cost"])

        for ws in weekly_starts:
            for shift in shift_types:
                shift_hours_base = {
                    "Large": [280, 320, 180, 140],
                    "Standard": [170, 200, 110, 85],
                    "Small": [95, 110, 60, 45],
                    "Express": [50, 60, 30, 25],
                }[site_type]
                idx = shift_types.index(shift)
                base_hours = shift_hours_base[idx]

                # Demand volume by shift
                demand_volumes = [300, 400, 200, 350]  # Afternoon busiest
                demand_vol = int(demand_volumes[idx] * (
                    {"North": 0.90, "Midlands": 1.00, "South": 1.15}[site["region"]]
                ))

                scheduled = int(base_hours * RNG.uniform(0.92, 1.08))

                # Agency hours concentrated in Weekend + Evening shifts for agency-heavy sites
                agency_h = 0
                if is_agency and shift in ["Evening", "Weekend"]:
                    agency_h = int(scheduled * RNG.uniform(0.10, 0.22))
                elif is_hidden and shift == "Weekend":
                    agency_h = int(scheduled * RNG.uniform(0.06, 0.14))
                elif RNG.random() < 0.08:
                    agency_h = int(scheduled * RNG.uniform(0.03, 0.06))

                # Overtime spikes on Weekend for understaffed
                ot_h = 0
                if shift == "Weekend" and ((is_agency or is_hidden) or RNG.random() < 0.3):
                    ot_h = int(scheduled * RNG.uniform(0.03, 0.10))

                actual = scheduled + agency_h + ot_h
                actual = int(actual * RNG.uniform(0.95, 1.02))

                # Service level by shift (Weekend and Evening generally lower)
                sl_base = 0.93
                if shift in ["Evening", "Weekend"]:
                    sl_base -= 0.04
                if is_agency and shift == "Weekend":
                    sl_base -= 0.06
                sl = round(max(0.50, sl_base + RNG.uniform(-0.03, 0.03)), 3)

                rows.append({
                    "site_id": sid,
                    "week_start_date": ws.date(),
                    "shift_type": shift,
                    "scheduled_hours": scheduled,
                    "actual_hours": actual,
                    "agency_hours": agency_h,
                    "overtime_hours": ot_h,
                    "demand_volume": demand_vol,
                    "service_level_score": sl,
                })

    df = pd.DataFrame(rows)
    df.to_csv(OUTPUT_DIR / "shift_pattern_summary.csv", index=False)
    print(f"shift_pattern_summary: {len(df):,} rows generated")
    return df


# ── Run ───────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("=== COG Data Generator ===")
    site_master = generate_site_master()

    print("\n-- Site distribution --")
    print(site_master["region"].value_counts())
    print(site_master["site_type"].value_counts())

    print("\n-- Engineered patterns --")
    print(f"Agency-heavy sites: {site_master['is_agency_heavy'].sum()}")
    print(f"Overstaffed sites: {site_master['is_overstaffed_low_demand'].sum()}")
    print(f"Hidden-cost sites: {site_master['is_hidden_cost'].sum()}")

    print("\n--- Generating daily_operations (this takes a moment) ---")
    daily = generate_daily_operations(site_master)

    print("\n--- Generating weekly_workforce ---")
    weekly = generate_weekly_workforce(site_master)

    print("\n--- Generating shift_pattern_summary ---")
    shifts = generate_shift_patterns(site_master)

    print("\n=== All data generated successfully ===")
    print(f"\nOutput directory: {OUTPUT_DIR}")
    for f in sorted(OUTPUT_DIR.glob("*.csv")):
        print(f"  {f.name}: {f.stat().st_size / 1024:.1f} KB")
