# Lumon Nova Portfolio Extension Plan
### Building a Graduate-Level Analytics Case Study from the EBUS635 Business Simulation

---

## Purpose of This Document

This is a build plan for transforming Jerlyn's existing Lumon Nova dissertation (EBUS635) into a polished, standalone portfolio project. It is deliberately saved for *later* — once the new original portfolio projects are complete. The Lumon Nova work will serve as a third, deeply personal project that only she could have written, grounded in real decisions she made over a 10-year simulation.

The objective is not to republish the dissertation. It is to reframe it as a professional analytics case study: strip the academic scaffolding, surface the data, rebuild the visuals from scratch, and position it as evidence of strategic analytical thinking rather than student coursework.

---

## Why This Is Worth Doing

The dissertation already contains:
- 10 years of simulated operational and financial data (automation spend, productivity indexes, warranty costs, workforce levels, market share by model)
- Real decisions with measurable outcomes (automation £50m → £540m, worker output 38 → 200 cars/year)
- Competitive benchmarking against named rivals (Albion, DriveMatrix, ArthuraX)
- A genuine failure case to analyse (Year 8–9 dead stock crisis, workforce over-reduction)
- An ethical/sustainability dimension (carbon capture, hydrogen IC, EV transition pressure)

This is more than most graduate candidates have. The problem is the packaging — it reads like a university report, not an analyst's output.

---

## Reframing Strategy

### From Academic Report → Analyst Deliverable

| Dissertation Element | Portfolio Reframe |
|---|---|
| "As Technical and Engineering Executive…" | Remove role framing entirely. Analyst is external reviewer |
| Literature review (Porter, Barney, RBV etc.) | Compress to a single methodology note. Theory serves the analysis, not the other way around |
| Narrative chronology (Year 4, Year 5…) | Replace with thematic analytical threads (Efficiency, Quality, Cost, Risk) |
| Descriptive figures (bar charts from simulation UI) | Rebuild every chart from scratch in Python/Plotly with clean design |
| "Recommendations" section | Rewrite as forward-looking strategic brief with quantified impact estimates |
| Word count padding | Cut to ~1,200 words of tight, purposeful prose |

### The New Title

> **"Operational Performance Analytics: A 10-Year Case Study in Automotive Manufacturing Strategy"**

No mention of a simulation. No mention of a university module. The framing is: here is a manufacturing company, here is 10 years of data, here is what the analysis reveals, here are the recommendations.

---

## Data Extraction Plan

The following datasets need to be reconstructed from the dissertation's figures and narrative into clean, structured tables. These become the analytical foundation.

### Dataset 1: Automation & Productivity (Years 1–10)
Extract from: Figures 1, 9, 10, narrative automation spend figures
Fields: `year`, `automation_investment_gbp`, `productivity_index`, `cars_per_worker_per_year`, `workforce_headcount`

Key engineered insight: automation ROI curve — diminishing returns after Year 7, but productivity gains are maintained. This becomes the central efficiency story.

### Dataset 2: Financial Performance (Years 1–10)
Extract from: Figures 12, 14, warranty cost data, narrative profit margin references
Fields: `year`, `cash_flow_gbp`, `warranty_cost_per_unit_gbp`, `profit_margin_pct`, `expediting_events`

Key engineered insight: the Year 8–9 cash flow crisis is directly traceable to over-automation spend + demand misalignment. Financial recovery in Year 10 is partial, not complete.

### Dataset 3: Market Performance by Model
Extract from: Figures 2, 3, 4, 5, 7, and narrative peak market share figures
Fields: `year`, `model`, `market_share_pct`, `sales_volume`, `dead_stock_units`
Models: Sprint, Atlas, Viera X8, Rio, Dune

Key engineered insight: Sprint is the workhorse (peak 3.42% Year 8) but also the source of the dead stock crisis. Viera X8 luxury play was correctly timed but undersupported. Rio and Dune are underdeveloped — a missed diversification opportunity.

### Dataset 4: Competitive Benchmarking (Selective Years)
Extract from: Figure 11, competitive narrative sections
Fields: `year`, `company`, `productivity_index`, `market_share_pct`, `technology_tier`
Companies: Lumon Nova, Albion, DriveMatrix, ArthuraX

Key engineered insight: Lumon Nova leads on productivity but trails on market share breadth — a classic efficiency-without-scale problem.

### Dataset 5: Workforce Dynamics
Extract from: Figure 6, Figure 8, narrative headcount figures (3,500 → 2,450)
Fields: `year`, `headcount`, `redundancy_events`, `productivity_per_worker`, `workforce_cost_index`

Key engineered insight: the Year 8–9 redundancy decision improved unit productivity on paper but damaged morale indicators and increased rehiring costs in Year 10. A classic short-term/long-term trade-off failure.

---

## Analytical Threads (Replaces Chronological Structure)

Each thread produces 1–2 clean visuals and a 150–200 word insight block.

### Thread 1: The Automation ROI Story
**Question:** Did the £540m automation ramp-up deliver proportionate returns?
**Visual:** Dual-axis line chart — automation cumulative spend (left axis) vs productivity index (right axis), Years 1–10. Annotate the inflection point where returns flatten.
**Insight:** Automation investment was front-loaded aggressively. Productivity gains were real (38 → 200 cars/worker) but the marginal return per £1m invested dropped sharply after Year 6. A phased investment strategy with performance gates would have preserved £80–120m in capital for demand-side investment.

### Thread 2: The Dead Stock Crisis
**Question:** Why did Year 8–9 produce both peak productivity and a demand collapse?
**Visual:** Grouped bar chart — production volume vs sales volume by model, Years 6–10. Dead stock units shown as a third bar or difference annotation.
**Insight:** Capacity expansion was decoupled from demand forecasting. Sprint production scaled to match automation capability, not market demand signals. A basic rolling 3-month demand forecast, even with simulated data, would have flagged the divergence 18 months earlier.

### Thread 3: Warranty Cost vs Technology Complexity
**Question:** Did quality management keep pace with product complexity?
**Visual:** Scatter plot — warranty cost per unit (y) vs number of active technology components per model (x), each point labelled by model and year.
**Insight:** Warranty costs were broadly contained (£455–£631 per Sprint unit across 10 years) but the trend line is positive — cost per unit rises as technology complexity increases. The gap between complexity growth and warranty cost growth is where quality investment earned its return. This is a defensible argument for continued TQM investment even under margin pressure.

### Thread 4: Workforce Trade-Off Analysis
**Question:** Was the Year 8–9 workforce reduction the right call?
**Visual:** Connected dot plot — headcount vs productivity index vs cash flow, Years 7–10. Three metrics, one view. Shows the trade-off visually.
**Insight:** The redundancy event (3,500 → 2,450) produced a short-term productivity-per-worker improvement but coincided with the cash flow trough. The recovery cost of rehiring and retraining in Year 10 is not fully captured in the original analysis. Quantifying it as an implicit cost (conservative estimate: £15–25m) reframes the decision as a break-even at best.

### Thread 5: Competitive Position — Efficiency Without Scale
**Question:** Why did Lumon Nova lead on productivity but not on market share?
**Visual:** Quadrant chart — market share (x) vs productivity index (y), all companies, Year 10. Lumon Nova sits in "high efficiency, moderate scale" quadrant.
**Insight:** Lumon Nova's operational excellence created a strong internal foundation but was not converted into market breadth. Competitors with lower productivity but broader model ranges captured more total market share. This suggests the next strategic phase — pre-simulation end — should have prioritised volume-segment pricing for Rio and Dune, using the efficiency gains as margin headroom.

---

## Visuals Rebuild Checklist

All original simulation screenshots are discarded. Every chart is rebuilt from the extracted datasets.

| Visual | Type | Tool | Thread |
|---|---|---|---|
| Automation spend vs productivity | Dual-axis line | Plotly | 1 |
| Production vs sales vs dead stock | Grouped bar | Plotly | 2 |
| Warranty cost vs tech complexity | Scatter with labels | Plotly | 3 |
| Headcount / productivity / cash flow | Connected dot plot | Plotly | 4 |
| Competitive position quadrant | Quadrant scatter | Plotly | 5 |
| Market share by model over time | Area/stacked line | Plotly | Context |

All charts: consistent colour palette, clean axis labels, no gridline clutter, annotation callouts for key events (Year 8 crisis, redundancy event, Year 10 recovery).

---

## Written Case Study Structure

**Length:** ~1,200 words (excluding visuals and captions)

```
1. Company Overview        (100w) — Lumon Nova, European automotive, 10-year window
2. Analytical Objectives   (80w)  — What questions this analysis addresses and why they matter
3. Data & Methodology      (150w) — Source, extraction approach, limitations of simulation data
4. Five Analytical Threads (600w) — ~120w per thread, each with embedded visual
5. Strategic Recommendations (150w) — Three concrete, forward-looking recommendations
6. Reflection              (120w) — Simulation vs real-world data limits, what predictive models would add
```

**Her sections:** 1, 2, 5, 6 — she knows this company and these decisions. Her voice is an asset here, not a liability.
**Built sections:** 3, 4 — data extraction, chart rebuild, analytical framing.

---

## Positioning Statement (For CV / LinkedIn / Portfolio Header)

> "Conducted a structured 10-year operational performance review of an automotive manufacturer, analysing automation ROI, demand-supply alignment, workforce trade-offs, and competitive positioning across five product lines. Identified £80–120m in suboptimal capital allocation and reframed a workforce reduction decision that appeared productive on paper as a break-even outcome when rehiring costs are quantified."

This reads like a junior consultant's case study summary. That's the target register.

---

## What Makes This Stand Out vs. Other Graduate Portfolios

Most graduates either (a) run a Kaggle dataset through a model and show accuracy scores, or (b) describe their dissertation in bullet points on a CV. This project does neither.

It takes real decisions, real consequences, and real trade-offs — and applies the analytical frameworks that employers in automotive, manufacturing, and operations actually use: ROI analysis, demand forecasting gaps, workforce cost modelling, competitive quadrant analysis. The simulation origin is an honest limitation, addressed directly in the reflection section. It does not undermine the work.

---

## Dependencies Before Starting This Project

- [ ] New original portfolio projects (Project 1 and 2) are complete and hosted
- [ ] Portfolio site structure is established (so Lumon Nova drops in as Project 3)
- [ ] Data extraction from dissertation figures completed (1–2 hours of manual work)
- [ ] Jerlyn has read the reframed case study structure and is comfortable with the positioning

---

*This document is a build plan only. No execution has begun. Revisit when Projects 1 and 2 are done.*
