## Goal
- Build a hosted, shareable Workforce Intelligence dashboard for Caldwell Operations Group (COG) using Next.js + Supabase + Python/R analysis.

## Progress

### Completed
- Project scaffolded: `backend/` (Python) + `web/` (Next.js + TypeScript + Tailwind + Tremor)
- Git repo configured with author = Jerlyn Francis (repo-level)
- 4 synthetic data generators built with 6 engineered patterns (agency concentration, weekend SL gap, overstaffing, regional cost variance, hidden-cost sites, demand volatility)
- All 4 Supabase tables created + fully seeded (40 sites × 79 weeks × 4 shift types):
  - `site_master`: 40 rows
  - `weekly_workforce`: 3,160 rows
  - `shift_pattern_summary`: 12,640 rows
  - `daily_operations`: 21,880 rows
- 6 dashboard page stubs + sidebar navigation + root layout
- Supabase CLI linked, 4 migrations applied via `supabase db push --linked`
- RLS policies + grants for SELECT/INSERT/UPDATE/DELETE on all 4 tables
- PostgREST schema cache refreshed and working
- REST API fully functional with anon, publishable, and secret keys

### In Progress
- Populating dashboard pages with live Supabase queries
- Building clustering analysis (Python)
- Building forecasting model (Python)

### Pending
- Clustering + forecasting scripts
- Dashboard content for all 6 pages
- Deploy to Vercel

### Key Context
- Supabase project: `mjsjqdqieyfmsujzhdzl` (eu-west-2)
- Supabase URL: `https://mjsjqdqieyfmsujzhdzl.supabase.co`
- DB access: `supabase_execute_sql` MCP tool works (connected to this project)
- Direct psycopg2 fails (IPv6 only); pooler fails ("Tenant or user not found")
- REST API on `mjsjqdqieyfmsujzhdzl.supabase.co` works
- Working keys:
  - Anon (read+write via RLS): `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qc2pxZHFpZXlmbXN1anpoZHpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzMDUzNDgsImV4cCI6MjA5NDg4MTM0OH0.rhmQvo6fbUgovgNRsT2fj3jDQx4gaM_j876UnUCd3rE`
  - Publishable (same as anon): `sb_publishable_lQkD6RcflNIVKzEBPLk6Jg_qfFMSVy-`
  - Secret (service_role equivalent): _(set in backend/.env)_
  - Legacy service_role key is DISABLED (returns 401)
- Management API PAT: _(set locally)_
- Migrations applied: `20260521003034_remote_schema` (empty), `20260521004159_portfolio` (original schema, overwritten by fix), `20260522000000_fix_schema` (correct CSV-matching schema), `20260522000001_fix_weekly_and_rls` (weekly_workforce headcount columns + all INSERT/UPDATE/DELETE RLS)
- Table schemas:
  - `site_master`: site_id, site_name, region, site_type, site_size_band, opening_date, target_service_level, budgeted_weekly_hours, budgeted_headcount, is_agency_heavy, is_overstaffed_low_demand, is_hidden_cost
  - `weekly_workforce`: week_start_date, site_id, permanent_headcount, part_time_headcount, agency_headcount, turnover_events, absence_rate_pct, vacancy_count, training_hours
  - `shift_pattern_summary`: site_id, week_start_date, shift_type, scheduled_hours, actual_hours, agency_hours, overtime_hours, demand_volume, service_level_score
  - `daily_operations`: date, site_id, day_of_week, week_number, month, is_holiday_period, forecast_demand, actual_demand, transactions_or_jobs_completed, scheduled_hours, actual_hours_worked, overtime_hours, agency_hours, absence_hours, service_level_score, customer_wait_time_or_delay_index, labour_cost_gbp, agency_cost_gbp, overtime_cost_gbp
- `supabase db push --linked` is the only way to run DDL on correct project
- REST API with `Prefer: resolution=merge-duplicates` enables upsert via INSERT+UPDATE RLS
- Seed strategy: parse SQL chunk files → POST JSON batches via REST API (see `backend/seed_via_rest.py`)
- Env files: `web/.env.local` (publishable key), `backend/.env` (secret key for service_role access)
