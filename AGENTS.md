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
- Supabase CLI linked, 7 migrations applied via `supabase db push --linked`
- RLS policies + grants for SELECT/INSERT/UPDATE/DELETE on all 4 tables
- PostgREST schema cache refreshed and working
- REST API fully functional with anon, publishable, and secret keys
- **All 6 dashboard pages populated with live Supabase queries + Tremor charts:**
  - `executive-summary` (`/`): KPI cards (labour cost, agency, overtime, SL), monthly trend charts, regional breakdown, site ranking table
  - `workforce` (`/workforce`): Absence rate trends, turnover events, agency ratio, shift-type SL gap, site absence ranking
  - `site-performance` (`/site-performance`): Site cost/variance table with regional filter, monthly cost/SL trends
  - `archetypes` (`/archetypes`): KMeans cluster distribution, PCA scatter plot, archetype descriptions + intervention recommendations, site classification table
  - `scenarios` (`/scenarios`): Cost-savings scenario modelling (agency 50% reduction, overtime 33% reduction, combined), site cost breakdown table
  - `forecasting` (`/forecasting`): Historical demand trend, per-site 56-day Holt-Winters ETS forecast, KPI cards + daily forecast chart with site selector
- **Python analysis scripts:**
  - `backend/analysis/clustering.py`: KMeans clustering (4 archetypes) with PCA projection, REST API pagination, outputs JSON results
  - `backend/analysis/forecasting.py`: Holt-Winters ETS per-site time series forecasting (56-day horizon), outputs full + summary JSON
- **Analysis results seeded to Supabase:**
  - `site_archetypes` table: 40 rows with cluster assignments, archetype labels, PCA coordinates, feature values
  - `demand_forecasts` table: 2,240 rows (40 sites × 56 days) with demand/SL/cost forecasts
- **RPC functions created:** `monthly_trends`, `regional_summary`, `site_performance_ranking`, `workforce_monthly_trends`, `workforce_site_summary`, `shift_type_summary`, `site_performance_regional_trends`
- Initial commit pushed to `github.com/jerlynfrancis/workforce-intelligence.git`

### In Progress
- Deploy to Vercel

### Pending
- None

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
- Migrations applied:
  - `20260521003034_remote_schema` (empty)
  - `20260521004159_portfolio` (original schema)
  - `20260522000000_fix_schema` (correct CSV-matching schema)
  - `20260522000001_fix_weekly_and_rls` (weekly_workforce headcount columns + INSERT/UPDATE/DELETE RLS)
  - `20260522000002_dashboard_functions` (monthly_trends, regional_summary, site_performance_ranking)
  - `20260522000003_workforce_functions` (workforce_monthly_trends, workforce_site_summary, shift_type_summary, site_performance_regional_trends)
  - `20260522000004_site_archetypes` (site_archetypes table + RLS)
  - `20260522000005_demand_forecasts` (demand_forecasts table + RLS)
- Table schemas:
  - `site_master`: site_id, site_name, region, site_type, site_size_band, opening_date, target_service_level, budgeted_weekly_hours, budgeted_headcount, is_agency_heavy, is_overstaffed_low_demand, is_hidden_cost
  - `weekly_workforce`: week_start_date, site_id, permanent_headcount, part_time_headcount, agency_headcount, turnover_events, absence_rate_pct, vacancy_count, training_hours
  - `shift_pattern_summary`: site_id, week_start_date, shift_type, scheduled_hours, actual_hours, agency_hours, overtime_hours, demand_volume, service_level_score
  - `daily_operations`: date, site_id, day_of_week, week_number, month, is_holiday_period, forecast_demand, actual_demand, transactions_or_jobs_completed, scheduled_hours, actual_hours_worked, overtime_hours, agency_hours, absence_hours, service_level_score, customer_wait_time_or_delay_index, labour_cost_gbp, agency_cost_gbp, overtime_cost_gbp
  - `site_archetypes`: site_id, site_name, region, site_type, cluster, archetype, pca_x, pca_y, avg_absence_rate, avg_turnover, avg_agency_ratio, avg_service_level, avg_cost_per_hour, total_labour_cost, weekend_sl_gap, demand_volatility
  - `demand_forecasts`: site_id, forecast_date, demand_forecast, service_level_forecast, cost_forecast
- `supabase db push --linked` is the only way to run DDL on correct project
- REST API with `Prefer: resolution=merge-duplicates` enables upsert via INSERT+UPDATE RLS
- Seed strategy: parse SQL chunk files → POST JSON batches via REST API (see `backend/seed_via_rest.py`)
- REST API pagination: 5,000 row limit per page; use `Range` header with offset loops (see `backend/analysis/clustering.py`)
- Env files: `web/.env.local` (publishable key), `backend/.env` (secret key for service_role access)
