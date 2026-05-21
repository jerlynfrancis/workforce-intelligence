
```
   ╔═══════════════════════════════════════════════════════════════╗
   ║                                                               ║
   ║   Caldwell Operations Group — Workforce Intelligence          ║
   ║                                                               ║
   ╚═══════════════════════════════════════════════════════════════╝
```

**Live dashboard → [cog-workforce-intelligence.vercel.app](https://cog-workforce-intell.vercel.app)**

---

### what this is

Multi-site ops are messy. COG runs 40 sites across the UK — 3 regions, 4 site types, 79 weeks of data — and this dashboard is where it all lands. Labour costs, agency dependency, service levels, absence patterns, demand volatility. The works.

Built because spreadsheets stop scaling somewhere around site #8.

---

### the numbers (live from supabase)

| metric | value |
|---|---|
| sites managed | 40 |
| data span | Jan 2024 – Jun 2025 (18 months) |
| total labour cost | £44,397,324 |
| agency spend | £2,299,563 |
| overtime spend | £603,829 |
| average service level | 87.5% |
| db rows analysed | 40,920 |
| site archetypes identified | 4 |

---

### the stack

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  next.js 16  │────▶│  supabase    │◀────│  python     │
│  + tremor    │     │  postgrest   │     │  sklearn    │
│  + recharts  │     │  + rls       │     │  statsmodels│
└─────────────┘     └──────────────┘     └─────────────┘
       │                    │                     │
       │                    ▼                     │
       │           ┌──────────────┐              │
       └──────────▶│  vercel      │◀─────────────┘
                   │  (edge)      │
                   └──────────────┘
```

**frontend** — Next.js 16, Tailwind v4, Tremor 3.18, Recharts · served via Vercel, edge-cached.

**backend** — Supabase Postgres with RLS, 7 migrations, 7 RPC functions, REST API with pagination (5k row cap per page, learned the hard way).

**analysis** — Python 3.12, scikit-learn KMeans clustering (4 archetypes), Holt-Winters ETS forecasting (56-day horizon), Supabase REST pagination loop.

---

### pages at a glance

| route | what it does |
|---|---|
| `/` | kpi cards + monthly cost & SL trends + regional breakdown + site ranking table |
| `/workforce` | absence rate over time, turnover events, agency ratio, shift-type SL gap (weekend is brutal), site absence leaderboard |
| `/site-performance` | per-site cost & hours variance table with regional filter, monthly trend charts |
| `/archetypes` | KMeans cluster distribution, PCA scatter, archetype descriptions & intervention recommendations, all 40 sites classified |
| `/scenarios` | "what if" cost modelling — cut agency 50%, cut overtime 33%, combined — with site-level breakdown |
| `/forecasting` | per-site 56-day demand forecast (Holt-Winters ETS), site selector, daily chart + kpi cards |

---

### what the analysis found

**4 site archetypes** emerged from the clustering:

| cluster | label | sites | key characteristic |
|---|---|---|---|
| 0 | Agency-Dependent + High-Cost + Volatile | 4 | Big sites, big problems. Highest cost and demand swings. |
| 1 | Agency-Dependent + High-Absence + Forecast-Poor | 8 | Agency heavy, people keep leaving, forecasts miss the mark. |
| 2 | High-Absence + Weekend-SL-Gap + Low-SL + High-Cost | 21 | The largest group. Decent on paper but weekend SL collapses and absence drags everything. |
| 3 | Agency-Dependent + Volatile | 7 | Agency as a crutch for unpredictable demand. |

**Weekend service level gap** is the most consistent pattern across clusters — weekday SL averages 6–11 points higher than weekend across every region.

**Agency spend** isn't evenly distributed. 5 sites account for nearly 60% of total agency costs.

---

### running locally

```sh
# frontend
cd web
npm install
npm run dev

# backend analysis (requires SUPABASE_SERVICE_ROLE_KEY in backend/.env)
cd backend
source venv/bin/activate
python analysis/clustering.py   # outputs to analysis/output/
python analysis/forecasting.py  # outputs to analysis/output/
```

---

### what's in the repo

```
web/                        next.js app (all 6 pages live)
├── src/app/                page components + layout
├── src/components/         sidebar nav
├── src/lib/                supabase clients (anon + admin)
└── .env.local              supabase pub key (gitignored)

backend/                    python analysis pipeline
├── analysis/
│   ├── clustering.py       KMeans + PCA
│   ├── forecasting.py      Holt-Winters ETS
│   └── output/             generated JSON results
├── data_generation/        synthetic data generator
├── seed_via_rest.py        REST API seeder
└── .env                    service role key (gitignored)

supabase/                   db migrations + config
└── migrations/             7 migration files
```

---

**built by jerlyn francis · university of liverpool · 2026**
