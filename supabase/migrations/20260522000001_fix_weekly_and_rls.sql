DROP TABLE IF EXISTS public.weekly_workforce CASCADE;

CREATE TABLE public.weekly_workforce (
    week_start_date DATE NOT NULL,
    site_id INTEGER NOT NULL REFERENCES public.site_master(site_id),
    permanent_headcount INTEGER NOT NULL,
    part_time_headcount INTEGER NOT NULL,
    agency_headcount INTEGER NOT NULL,
    turnover_events INTEGER NOT NULL,
    absence_rate_pct REAL NOT NULL,
    vacancy_count INTEGER NOT NULL,
    training_hours REAL NOT NULL,
    PRIMARY KEY (week_start_date, site_id)
);

ALTER TABLE public.weekly_workforce ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Allow public read access" ON public.weekly_workforce
        FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Allow public insert access" ON public.weekly_workforce
        FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Allow public update access" ON public.weekly_workforce
        FOR UPDATE USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Allow public delete access" ON public.weekly_workforce
        FOR DELETE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.weekly_workforce TO anon, authenticated, authenticator;

DO $$ BEGIN
    CREATE POLICY "Allow public update access" ON public.daily_operations
        FOR UPDATE USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Allow public delete access" ON public.daily_operations
        FOR DELETE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

GRANT UPDATE, DELETE ON public.daily_operations TO anon, authenticated, authenticator;

DO $$ BEGIN
    CREATE POLICY "Allow public update access" ON public.site_master
        FOR UPDATE USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Allow public delete access" ON public.site_master
        FOR DELETE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

GRANT UPDATE, DELETE ON public.site_master TO anon, authenticated, authenticator;

DO $$ BEGIN
    CREATE POLICY "Allow public update access" ON public.shift_pattern_summary
        FOR UPDATE USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Allow public delete access" ON public.shift_pattern_summary
        FOR DELETE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

GRANT UPDATE, DELETE ON public.shift_pattern_summary TO anon, authenticated, authenticator;

NOTIFY pgrst, 'reload schema';
