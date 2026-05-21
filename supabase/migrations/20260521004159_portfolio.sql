CREATE TABLE IF NOT EXISTS public.site_master (
    site_id INTEGER PRIMARY KEY,
    site_name TEXT NOT NULL,
    region TEXT NOT NULL,
    site_type TEXT NOT NULL,
    opening_date DATE NOT NULL,
    floor_area_sqft INTEGER NOT NULL,
    catchment_population INTEGER NOT NULL,
    cost_band TEXT NOT NULL,
    target_service_level REAL NOT NULL,
    hourly_rate_gbp REAL NOT NULL,
    agency_rate_gbp REAL NOT NULL,
    overtime_rate_gbp REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS public.daily_operations (
    date DATE NOT NULL,
    site_id INTEGER NOT NULL REFERENCES public.site_master(site_id),
    day_of_week INTEGER NOT NULL,
    week_number INTEGER NOT NULL,
    month INTEGER NOT NULL,
    is_holiday_period INTEGER NOT NULL,
    forecast_demand REAL NOT NULL,
    actual_demand REAL NOT NULL,
    transactions_or_jobs_completed INTEGER NOT NULL,
    scheduled_hours REAL NOT NULL,
    actual_hours_worked REAL NOT NULL,
    overtime_hours REAL NOT NULL,
    agency_hours REAL NOT NULL,
    absence_hours REAL NOT NULL,
    service_level_score REAL NOT NULL,
    customer_wait_time_or_delay_index REAL NOT NULL,
    labour_cost_gbp REAL NOT NULL,
    agency_cost_gbp REAL NOT NULL,
    overtime_cost_gbp REAL NOT NULL,
    PRIMARY KEY (date, site_id)
);

CREATE TABLE IF NOT EXISTS public.weekly_workforce (
    site_id INTEGER NOT NULL REFERENCES public.site_master(site_id),
    week_start_date DATE NOT NULL,
    week_number INTEGER NOT NULL,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    total_scheduled_hours REAL NOT NULL,
    total_actual_hours REAL NOT NULL,
    total_agency_hours REAL NOT NULL,
    total_overtime_hours REAL NOT NULL,
    total_absence_hours REAL NOT NULL,
    avg_daily_demand REAL NOT NULL,
    avg_service_level REAL NOT NULL,
    total_labour_cost_gbp REAL NOT NULL,
    total_agency_cost_gbp REAL NOT NULL,
    total_overtime_cost_gbp REAL NOT NULL,
    PRIMARY KEY (site_id, week_start_date)
);

CREATE TABLE IF NOT EXISTS public.shift_pattern_summary (
    site_id INTEGER NOT NULL REFERENCES public.site_master(site_id),
    week_start_date DATE NOT NULL,
    shift_type TEXT NOT NULL,
    scheduled_hours REAL NOT NULL,
    actual_hours REAL NOT NULL,
    agency_hours REAL NOT NULL,
    overtime_hours REAL NOT NULL,
    demand_volume REAL NOT NULL,
    service_level_score REAL NOT NULL,
    PRIMARY KEY (site_id, week_start_date, shift_type)
);

ALTER TABLE public.site_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_workforce ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_pattern_summary ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Allow public read access" ON public.site_master
        FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Allow public read access" ON public.daily_operations
        FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Allow public read access" ON public.weekly_workforce
        FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Allow public read access" ON public.shift_pattern_summary
        FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

GRANT SELECT ON public.site_master TO anon, authenticated, authenticator;
GRANT SELECT ON public.daily_operations TO anon, authenticated, authenticator;
GRANT SELECT ON public.weekly_workforce TO anon, authenticated, authenticator;
GRANT SELECT ON public.shift_pattern_summary TO anon, authenticated, authenticator;
