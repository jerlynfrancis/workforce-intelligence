# Project 1 Specification
## Workforce Intelligence for Multi-Site Operations
### A portfolio project for graduate business, operations, and commercial analyst applications

---

## Project Objective

This project is designed to become a **flagship portfolio piece** that positions the candidate as more than someone who can clean data or build a dashboard. The aim is to demonstrate the ability to take a messy operational problem, structure the business question, build the data model, apply quantitative methods, and convert the analysis into decisions that management could actually act on.

The project should feel like the output of a junior analyst embedded in a real organisation rather than a university assignment. It must therefore combine **operations thinking, people analytics, financial impact estimation, forecasting, SQL-based analysis, dashboarding, and concise business storytelling**.

The central business problem is workforce inefficiency across a multi-site operation: some sites are overstaffed during low-demand periods, some are chronically understaffed during peak demand, and the company is using expensive agency labour to compensate for poor planning. The purpose of the analysis is to identify where staffing is misaligned with demand, quantify the cost of that misalignment, and propose a more intelligent planning model.

---

## Why This Project Is Strong

This is not a generic student project. It stands out because it sits at the intersection of several functions that employers value:

- **Operations:** staffing coverage, shift planning, peak-load performance, service levels.
- **Finance:** labour cost control, variance to budget, agency spend, overtime leakage.
- **People / HR analytics:** absenteeism, turnover pressure, staffing mix, workforce stability.
- **Commercial impact:** service quality deteriorates when staffing does not match demand.
- **Analytics maturity:** combines descriptive analysis, segmentation, forecasting, and scenario modelling.

It also travels well across industries. The same analytical logic works for retail, aviation, logistics, warehousing, manufacturing support functions, and service operations. Even if the fictional company is framed as a retail network, the underlying skills remain relevant to broader analyst roles.

---

## Fictional Company Setup

### Company Name
**Caldwell Operations Group (COG)**

### Company Profile
Caldwell Operations Group is a fictional UK-based multi-site service operator with:
- 40 sites across England, Wales, and Scotland
- approximately 2,800 employees
- a mix of full-time, part-time, and agency workers
- central operations leadership but site-level scheduling autonomy
- increasing labour cost pressure over the last 18 months

The exact industry label can be adjusted later if needed:
- retail stores
- airport service units
- logistics depots
- industrial support sites
- facilities/service operations

For now, the safest framing is **multi-site operations network**, because this keeps the project transferable across job applications.

### Core Business Problem
The company has grown unevenly and staffing decisions are still being made through local heuristics rather than demand-led planning. This has created four visible symptoms:

1. Some sites are consistently over budget on labour.
2. Agency spend is heavily concentrated in a subset of sites.
3. Overtime spikes occur during predictable demand peaks.
4. Customer service / service throughput weakens when staffing does not align with demand.

Senior management wants to know:
- Which sites are structurally inefficient?
- Are staffing problems caused by poor planning, absenteeism, turnover, or demand volatility?
- Which site patterns repeat across the network?
- How much money could be saved by changing staffing strategy rather than just cutting hours?

---

## Stakeholders

The project should be written as if it is serving multiple stakeholders with slightly different priorities.

### 1. Head of Operations
Needs to know which sites are underperforming, when the problems occur, and whether the issue is demand planning or execution failure.

### 2. Finance Business Partner
Needs cost visibility: labour overspend, agency dependency, overtime leakage, and potential savings from intervention.

### 3. Workforce Planning / HR Lead
Needs insight into absenteeism, staffing mix, turnover risk, and whether permanent staffing levels are mismatched to operational reality.

### 4. Regional Managers
Need simple site clusters or archetypes rather than 40 isolated site reports so that action can be standardised.

---

## Business Questions

These questions should drive the analysis. Everything built must answer one or more of them.

1. Which sites are consistently over- or under-staffed relative to operational demand?
2. How much of the labour overspend is due to predictable structural issues rather than random volatility?
3. Which sites rely excessively on overtime or agency labour?
4. Are there identifiable patterns across sites that justify grouping them into operational archetypes?
5. Can short-term demand be forecast accurately enough to improve staffing decisions?
6. What is the estimated annual cost saving if staffing is rebalanced using a more disciplined planning approach?

---

## Data Design

This project should use a synthetic but highly realistic dataset. The data must feel business-shaped rather than machine-generated. The ideal horizon is **18–24 months** so that seasonality, trend, and repeated staffing behaviour can be analysed.

### Recommended Granularity
Use **daily site-level data** plus a related **shift-level or weekly planning table**.

### Table 1: `site_master`
One row per site.

Fields:
- `site_id`
- `site_name`
- `region`
- `site_type`
- `opening_date`
- `site_size_band`
- `target_service_level`
- `budgeted_weekly_hours`
- `budgeted_headcount`

Purpose:
Provides context and allows grouping by region, size, and type.

### Table 2: `daily_operations`
One row per site per day.

Fields:
- `date`
- `site_id`
- `day_of_week`
- `week_number`
- `month`
- `is_holiday_period`
- `forecast_demand`
- `actual_demand`
- `transactions_or_jobs_completed`
- `scheduled_hours`
- `actual_hours_worked`
- `overtime_hours`
- `agency_hours`
- `absence_hours`
- `service_level_score`
- `customer_wait_time_or_delay_index`
- `labour_cost_gbp`
- `agency_cost_gbp`
- `overtime_cost_gbp`

Purpose:
This is the core operational fact table.

### Table 3: `weekly_workforce`
One row per site per week.

Fields:
- `week_start_date`
- `site_id`
- `permanent_headcount`
- `part_time_headcount`
- `agency_headcount`
- `turnover_events`
- `absence_rate_pct`
- `vacancy_count`
- `training_hours`

Purpose:
Links workforce stability to performance and cost.

### Table 4: `shift_pattern_summary`
Optional but strong if you want extra detail.

Fields:
- `site_id`
- `week_start_date`
- `shift_type` (Morning / Afternoon / Evening / Weekend)
- `scheduled_hours`
- `actual_hours`
- `agency_hours`
- `overtime_hours`
- `demand_volume`
- `service_level_score`

Purpose:
Lets you identify specific operational pain points like Sunday understaffing or peak-hour overreliance on agency staff.

---

## Engineered Data Patterns

The project becomes powerful when the data is designed with believable internal logic. Build these patterns deliberately.

### Pattern 1: Concentrated Agency Dependence
6–8 sites should account for most agency spend. These sites should have one or more of the following:
- higher absence rates
- higher turnover events
- greater demand volatility
- poorer forecast accuracy

### Pattern 2: Predictable Peak-Time Understaffing
Weekend or late-week demand spikes should repeatedly coincide with higher wait times, lower service scores, and overtime spikes.

### Pattern 3: Quiet-Period Overstaffing
Some sites should be carrying too many scheduled hours on low-demand weekdays. This creates a clear opportunity for labour reallocation.

### Pattern 4: Regional Behaviour Differences
One region should look systematically different, e.g. London / South East sites have higher labour costs and greater demand variability, while Midlands sites are more stable.

### Pattern 5: Hidden Cost Trade-Off
One cluster of sites should appear operationally stable only because they are using high levels of agency labour. This is the central insight: apparent service quality is being bought at an unsustainable cost.

### Pattern 6: Forecastable Demand
Demand should be noisy but forecastable. The forecasting model should be able to achieve a credible error rate, so the portfolio can demonstrate that planning improvement is realistic.

---

## Technical Stack

This project should intentionally use a broad, credible stack because the stack itself signals capability.

### 1. Python
Use Python for:
- synthetic data generation
- data cleaning
- feature engineering
- clustering
- forecasting
- scenario modelling
- static portfolio charts if needed

Suggested libraries:
- `pandas`
- `numpy`
- `faker`
- `scikit-learn`
- `statsmodels` or `prophet`
- `plotly`

### 2. SQL
Load the cleaned data into SQLite or PostgreSQL and run core analyses in SQL.

Use SQL for:
- labour variance by site and week
- rolling averages
- overtime / agency concentration analysis
- ranking sites by overspend
- aggregating cluster-level summary outputs

This matters because many junior analyst roles care less about fancy modelling and more about whether someone can think in tables and write sane SQL.

### 3. Power BI
Build the final business-facing dashboard in Power BI.

Suggested pages:
- Executive summary
- Site variance analysis
- Agency / overtime analysis
- Forecast and staffing alignment page
- Site archetypes / segmentation page
- Scenario savings page

### 4. Markdown / Written Case Study
The project should also exist as a narrative case study, not just a dashboard. Employers hire analysts who explain findings clearly.

### 5. GitHub
Store the project in a clean repo with:
- data-generation script
- SQL scripts
- notebook or analysis script
- dashboard screenshots
- README summary

---

## Recommended Analysis Flow

This is the work sequence. Follow it in order.

### Phase 1: Business Framing
Write a one-page brief:
- company problem
- stakeholders
- business questions
- success definition

This prevents the project from becoming random visual output.

### Phase 2: Data Generation and Structuring
Generate the synthetic data and save to CSV files or a SQLite database. Keep the logic reproducible.

Outputs:
- `site_master.csv`
- `daily_operations.csv`
- `weekly_workforce.csv`
- optional `shift_pattern_summary.csv`

### Phase 3: Data Quality and Exploratory Analysis
Check for:
- missingness
- impossible values
- labour cost consistency
- demand / hours relationships
- outliers that are unrealistic rather than insightful

### Phase 4: SQL Analysis Layer
Build SQL queries for the main business questions.

Examples:
- monthly labour overspend by site
- share of total agency cost by top 10 sites
- demand vs hours mismatch ratio
- rolling 4-week overtime trend by region

### Phase 5: Analytical Modelling
This is where the project stops being generic.

#### A. Site Archetype Clustering
Create 3–5 site archetypes using variables like:
- average labour variance
- average absence rate
- average agency ratio
- demand volatility
- average service level
- overtime frequency

Potential cluster labels:
- Stable Efficient Sites
- Chronic Understaffed Sites
- Agency-Dependent Sites
- Overstaffed Low-Demand Sites
- Volatile High-Pressure Sites

The value of clustering is not technical novelty. It is managerial usability. Regional leaders can act on archetypes.

#### B. Demand Forecasting
Choose a subset of sites or all sites if manageable.

Forecast target:
- daily or weekly demand volume

Compare:
- naive baseline
- moving average baseline
- one proper forecasting model (Prophet / SARIMA / ETS)

Use performance measures such as:
- MAE
- RMSE
- MAPE

The key is not to chase perfect accuracy. The key is to show the model is good enough to support staffing decisions.

#### C. Scenario Modelling
Create one or two practical scenarios, for example:
- reduce agency hours by 15% in high-agency sites through part-time hiring
- reduce scheduled hours by 8% in overstaffed low-demand sites
- shift hours from low-demand weekdays into high-demand weekends

Model the financial effect using conservative assumptions.

---

## Core Analytical Threads

These are the actual storylines of the project. Each should produce visuals and written interpretation.

### Thread 1: Labour Cost Variance
**Question:** Where is labour spend diverging from budget, and is the problem persistent?

Visual ideas:
- site ranking bar chart: labour overspend by site
- monthly trend line: actual vs budgeted labour cost
- heatmap: variance by site and month

Expected insight:
The biggest overspend is concentrated rather than network-wide. A handful of sites drive a disproportionate share of variance.

### Thread 2: Agency and Overtime Dependence
**Question:** Which sites are masking planning problems through expensive staffing solutions?

Visual ideas:
- Pareto chart of agency spend by site
- stacked bar: permanent vs part-time vs overtime vs agency hours
- line chart of overtime and service score over time

Expected insight:
Certain sites preserve service levels only by relying on agency staff and overtime, which hides structural planning weakness.

### Thread 3: Staffing-Demand Mismatch
**Question:** Are sites scheduled for actual demand or for habit?

Visual ideas:
- scatter plot: demand vs hours worked, labelled outliers
- demand-to-hours ratio by site
- weekday / weekend staffing alignment comparison

Expected insight:
Some sites are overstaffed during predictable low-demand periods and understaffed at known peaks. This is not random noise; it is planning discipline failure.

### Thread 4: Site Archetypes
**Question:** Can sites be grouped into repeatable operational patterns?

Visual ideas:
- cluster scatter chart using two dominant dimensions
- table summarising cluster traits
- map or matrix by region and cluster

Expected insight:
The network is not made up of 40 unique problems. It contains 3–5 repeated operating patterns, which means interventions can be standardised.

### Thread 5: Demand Forecasting for Smarter Planning
**Question:** Is demand forecastable enough to improve staffing decisions?

Visual ideas:
- actual vs forecast lines for example sites
- error summary table by site
- forecast confidence band for the next 8–12 weeks

Expected insight:
Forecast accuracy is sufficient to support materially better rota planning, especially in high-volatility sites.

### Thread 6: Savings Scenario
**Question:** What happens financially if the company shifts from reactive staffing to planned staffing?

Visual ideas:
- waterfall chart: current labour leakage to proposed savings
- scenario table: current vs proposed cost structure
- estimated annual saving by intervention type

Expected insight:
A relatively modest planning improvement could release meaningful annual savings without blunt headcount reduction.

---

## Final Dashboard Design

The final dashboard should look executive and operational, not academic.

### Page 1: Executive Summary
Include:
- total labour cost
- variance to budget
- agency spend
- overtime hours
- service level average
- top 5 worst sites
- headline estimated savings

### Page 2: Site Performance
Include:
- variance by site
- filters for region and site type
- monthly trend views

### Page 3: Workforce Instability
Include:
- absence rate
- turnover events
- vacancy count
- relation to agency/overtime use

### Page 4: Demand Forecasting
Include:
- actual vs forecast
- forecast accuracy metrics
- planning implications

### Page 5: Site Archetypes
Include:
- cluster assignment per site
- cluster definitions
- suggested actions by cluster

### Page 6: Scenario Model
Include:
- current labour leakage
- intervention assumptions
- annual savings estimate
- operational risk notes

---

## Written Portfolio Structure

The final project should also be written up as a clean case study.

### Suggested structure
1. Business Context
2. Stakeholders and Objectives
3. Data Model and Methodology
4. Key Findings
5. Forecasting and Segmentation Approach
6. Recommendations
7. Estimated Business Impact
8. Limitations and Reflection

### Tone
The writing should sound like internal strategy support, not like a student essay. Avoid overexplaining basic methods. Keep the focus on what the analysis changes.

---

## Recommendations the Analysis Should Support

The project should ideally support recommendations such as:

1. Introduce demand-led staffing templates for the most volatile sites.
2. Convert a portion of repeat agency dependence into planned part-time capacity.
3. Use site archetypes to standardise interventions instead of solving each site separately.
4. Build weekly demand forecast reviews into rota planning.
5. Escalate sites where service quality is being maintained only through unsustainable labour cost.

These are strong because they sound realistic and managerially useful.

---

## Estimated Impact Narrative

The final project should produce a quantified but conservative impact statement. Example structure:

- X% of agency spend is concentrated in Y sites.
- Replacing part of this with planned flexible staffing could save £A annually.
- Correcting overstaffing in low-demand sites could save £B annually.
- Reallocating hours into peak windows could improve service scores while reducing overtime cost.
- Combined opportunity: £C annual labour efficiency gain, subject to implementation assumptions.

Do not make the saving absurdly high. A believable estimate is more impressive than a dramatic one.

---

## Deliverables Checklist

The complete project should eventually contain:

- [ ] Business framing brief
- [ ] Synthetic dataset files
- [ ] Python data generation script
- [ ] Python analysis notebook or script
- [ ] SQL query file(s)
- [ ] Power BI dashboard
- [ ] Rebuilt visuals for portfolio write-up
- [ ] Final markdown case study
- [ ] GitHub README

---

## Execution Priority

If you want the fastest route into building, do it in this order:

1. Finalise fictional company framing
2. Design the data schema
3. Generate the synthetic data
4. Run EDA and check realism
5. Write the core SQL analyses
6. Build cluster model
7. Build forecast model
8. Create savings scenario
9. Build Power BI dashboard
10. Write the final case study

---

## Practical Warning

Do not let the project become a technical circus. The reason to use multiple tools is to show range, not to impress with random complexity. Every model, query, and visual must answer a business question.

If a method does not change a decision, cut it.

---

## Positioning for Applications

This project can be described on a CV or LinkedIn in a way that adapts to different roles:

### For Business Analyst roles
Emphasise stakeholder framing, process inefficiency, KPI design, and recommendations.

### For Operations Analyst roles
Emphasise labour variance, demand alignment, service levels, and operational interventions.

### For Commercial Analyst roles
Emphasise budget variance, cost leakage, financial impact, and scenario modelling.

### For HR / Workforce Analyst roles
Emphasise absence, turnover, staffing mix, workforce stability, and planning effectiveness.

This flexibility is one of the main reasons this project is worth doing.

---

## Final Standard

The finished project should make a reviewer think:

> This candidate understands how operations actually work, can structure a problem properly, can use multiple analytical tools without showing off, and can explain the financial and managerial consequences of the analysis.

That is the benchmark.
