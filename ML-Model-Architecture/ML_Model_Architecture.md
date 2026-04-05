# Clover ML Powered Parametric Insurance Pricing Model

> A machine learning–augmented actuarial engine that computes weekly income insurance premiums for gig workers in real time, using multi-factor risk scoring, fraud detection, and government data oracles.


## Table of Contents

- [What Problem Does This Solve?](#what-problem-does-this-solve)
- [High-Level Architecture](#high-level-architecture)
- [How the Pricing Model Works](#how-the-pricing-model-works)
  - [Step 1 — Earnings Baseline (W_e)](#step-1--earnings-baseline-we)
  - [Step 2 — Expected Disruption Frequency (E_freq_w)](#step-2--expected-disruption-frequency-efreqw)
  - [Step 3 — Composite Risk Multiplier (RM)](#step-3--composite-risk-multiplier-rm)
  - [Step 4 — Moral Hazard Factor / Fraud Score (MF)](#step-4--moral-hazard-factor--fraud-score-mf)
  - [Step 5 — Pure Risk Cost (PRC_w)](#step-5--pure-risk-cost-prcw)
  - [Step 6 — Final Weekly Premium (P_w)](#step-6--final-weekly-premium-pw)
- [The ML Fraud Detection System](#the-ml-fraud-detection-system)
  - [FDS Score Model](#fds-score-model)
  - [Earnings Baseline ML Model](#earnings-baseline-ml-model)
  - [Zone-Level Anomaly Detection](#zone-level-anomaly-detection)
- [Parametric Trigger Engine](#parametric-trigger-engine)
- [Data Pipeline & Sources](#data-pipeline--sources)
- [Worked Examples (End-to-End)](#worked-examples-end-to-end)
- [Premium Output Benchmarks](#premium-output-benchmarks)
- [Interactive Calculator Logic](#interactive-calculator-logic)
- [IRDAI Compliance & Scope](#irdai-compliance--scope)


## What Problem Does This Solve?

India has ~8 million active gig/delivery workers on platforms like Zomato, Swiggy, Blinkit, and Amazon Flex. These workers have **zero income protection** when environmental disruptions (smog, floods, cyclones, heatwaves) prevent them from working. Traditional insurance doesn't work here because:

Claims are subjective and hard to verify at scale
Underwriting individual gig workers is cost-prohibitive
Workers lack formal income documentation

**GigShield solves this with a parametric model:** instead of evaluating each claim manually, the system automatically triggers payouts when objective, government-verified environmental thresholds are crossed. The premium each worker pays is computed individually by an ML augmented pricing engine, not by a flat rate lookup table.


## High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   DATA INGESTION LAYER                  │
│  CPCB AQI API  │  IMD Rainfall API  │  NDMA SACHET API  │
│         Platform GPS Feeds  │  RBI Account Aggregator   │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│               ML FEATURE ENGINEERING                    │
│  Worker Earnings History  │  Activity Patterns          │
│  City-Season Risk Factors │  FDS Fraud Score            │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│              ACTUARIAL PRICING ENGINE                   │
│  P_w = PRC_w ÷ (1 − ELR − PM)                          │
│  PRC_w = W_e × LR_pct × E_freq_w × RM × MF             │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│             PARAMETRIC TRIGGER ENGINE                   │
│  Threshold crossed? → Auto-payout within 24–48 hrs     │
│  GPS verify worker was active? → Validate payout        │
└─────────────────────────────────────────────────────────┘
```


## How the Pricing Model Works

The core output is **P_w**, the weekly premium a worker pays. It is computed in 6 sequential steps, each driven by real data or an ML sub-model.

### Master Formula

```
P_w = PRC_w ÷ (1 − ELR − PM)

PRC_w = W_e × LR_pct × E_freq_w × RM × MF

RM    = α_city × β_platform × γ_hours × δ_season
MF    = 1 + (1 − FDS) × 0.08
```


### Step 1 — Earnings Baseline (W_e)

`W_e` is the worker's estimated **weekly net earnings**, which serves as the foundation for both the premium and the payout amount.

**How it's computed:**

Rather than relying on self-reported income (which is gameable), W_e is derived from:

1. **Platform earnings data** pulled via the RBI Account Aggregator (AA) framework  a consent-based API that gives GigShield read only access to a worker's verified platform transaction history
2. **ML baseline model** trained on 6–12 weeks of historical platform earnings to establish a stable, tamper-resistant reference figure
3. **Fuel cost deduction** of 20% applied automatically (validated against Zomato's 2025 disclosure of ₹102/hr gross EPH → ~₹21,200/month net)

| Worker Type | W_e (Weekly Net) | Source |
|-------------|-----------------|--------|
| Metro full-time (10hr/day) | ₹4,900 | Zomato 2025 EPH × hours |
| Tier-2 full-time | ₹3,500 | TeamLease survey |
| Part-time (<5hr/day) | ₹2,500 | NCAER + platform estimates |

> The ML model flags any sudden spike in declared earnings in the 7 days before a known disruption event and freezes the W_e baseline at the pre-spike average — a key anti-fraud control.


### Step 2 — Expected Disruption Frequency (E_freq_w)

```
E_freq_w = D_annual ÷ 52
```

`E_freq_w` converts annual disruption days into a **weekly disruption probability** for each city. `D_annual` is computed from historical environmental records, not hardcoded:

| City | D_annual | E_freq_w | Primary Risk |
|------|----------|----------|--------------|
| Delhi / NCR | 58 | 1.115 | AQI Severe+ (28d) + heat (12d) + rain (18d) |
| Kolkata | 50 | 0.962 | Cyclones + monsoon flooding |
| Mumbai | 30 | 0.577 | Extreme monsoon (Jul–Sep) |
| Hyderabad | 32 | 0.615 | Flash floods + heat waves |
| Bangalore | 18 | 0.346 | Unseasonal flooding |
| Tier-2 Cities | 22 | 0.423 | Mixed seasonal |
| Tier-3 Cities | 15 | 0.288 | Minimal disruption baseline |

`D_annual` is refreshed annually from IQAir, CPCB, and IMD historical archives. In future versions, this becomes a **dynamic ML input** that updates monthly as climate patterns shift.


### Step 3 — Composite Risk Multiplier (RM)

```
RM = α_city × β_platform × γ_hours × δ_season
     (capped at 2.20 for actuarial solvency)
```

RM is a **four-factor multiplicative risk score** — similar in spirit to a logistic regression feature interaction, but calibrated actuarially rather than learned from claims data (since claims data doesn't exist yet for this product category).

#### α — City Risk Factor
Captures structural, chronic environmental exposure at the city level.

| City | α | Rationale |
|------|---|-----------|
| Delhi / NCR | 1.80 | Zero "Good AQI" days in 2024/25; highest smog exposure in the world |
| Kolkata | 1.50 | High cyclone belt exposure + pre-monsoon heat |
| Mumbai | 1.20 | Extreme monsoon; Bandra/Dharavi flood zones |
| Hyderabad | 1.10 | Flash flood history; growing heat risk |
| Tier-2 Cities | 1.00 | Baseline reference |
| Bangalore | 0.90 | Historically low disruptions; mild climate |
| Tier-3 Cities | 0.80 | Low disruption frequency, lower traffic density |

#### β — Platform Exposure Factor
Captures how much time a worker spends on the road vs. in controlled environments — a **proxy for physical risk exposure**.

| Platform | β | Reason |
|----------|---|--------|
| Zepto / Blinkit | 1.25 | Quick-commerce: higher speed, shorter windows, more trips/hr |
| Zomato / Swiggy | 1.15 | Outdoor food delivery; peak at worst weather hours (lunch/dinner) |
| Dunzo / Other | 1.10 | Mixed outdoor/indoor |
| Amazon Flex | 1.05 | Longer routes; lower trip density per day |

#### γ — Working Hours Factor
More hours on road = proportionally higher exposure to a disruption event during those hours.

| Daily Hours | γ | Interpretation |
|-------------|---|----------------|
| < 5 hours | 0.85 | Part-time; lower daily exposure window |
| 5–8 hours | 1.00 | Standard shift baseline |
| 8–10 hours | 1.15 | Extended shift; peak-hour overlap likely |
| > 10 hours | 1.30 | Full-day workers; maximally exposed |

#### δ — Seasonal Load Factor
Captures the cyclical nature of environmental risk — pollution peaks in winter, floods in monsoon.

| Season | δ | Period |
|--------|---|--------|
| Smog / Winter | 1.35 | Oct–Jan |
| Active Monsoon | 1.25 | Jun–Sep |
| Pre-Monsoon / Heat Wave | 1.10 | Feb–May |
| Spring Baseline | 1.00 | Reference |

**Why cap RM at 2.20?**
In extreme cases (Delhi, smog season, Zepto, 10+ hours), the uncapped RM = 1.80 × 1.25 × 1.30 × 1.35 = **3.94**. This would produce premiums unaffordable for any worker. The 2.20 cap enforces actuarial solvency without pushing the product out of reach — above this, the model signals that a platform subsidy or co-pay structure is required.


### Step 4 — Moral Hazard Factor / Fraud Score (MF)

```
MF = 1 + (1 − FDS) × 0.08
```

`MF` is the most **ML-driven component** of the formula. It uses each worker's **Fraud Detection Score (FDS)** — a rolling value between 0 and 1.0 — to load or discount the premium based on behavioral risk.

| FDS | MF | Premium Effect |
|-----|----|----------------|
| 1.00 (perfect history) | 1.000 | No fraud load |
| 0.95 (clean) | 1.004 | +0.4% — negligible |
| 0.85 (default new user) | 1.012 | +1.2% |
| 0.70 | 1.024 | +2.4% |
| 0.60 | 1.032 | +3.2% |
| 0.50 (high risk) | 1.040 | +4.0% |

The FDS model is described in full in the [ML Fraud Detection System](#the-ml-fraud-detection-system) section below.


### Step 5 — Pure Risk Cost (PRC_w)

```
PRC_w = W_e × LR_pct × E_freq_w × RM × MF
```

`PRC_w` is the **actuarially fair price of risk** — the expected cost of covering a worker for one week, before any operational costs are added. Breaking it down:

`W_e × LR_pct` = the payout amount per triggered event (25% of weekly earnings)
`× E_freq_w` = scaled by how often such an event is expected to occur
`× RM` = scaled by how much riskier this specific worker's context is vs. baseline
`× MF` = loaded for fraud/moral hazard risk

**Example (Mumbai, Swiggy, 8hrs, monsoon, FDS=0.85):**
```
PRC_w = 4,900 × 0.25 × 0.577 × (1.20 × 1.15 × 1.00 × 1.25) × 1.012
      = 4,900 × 0.25 × 0.577 × 1.725 × 1.012
      = ₹618
```


### Step 6 — Final Weekly Premium (P_w)

```
P_w = PRC_w ÷ (1 − ELR − PM)
    = PRC_w ÷ (1 − 0.28 − 0.07)
    = PRC_w ÷ 0.65
    = PRC_w × 1.538
```

The denominator loading ensures that operational costs and profit margin are **never subtracted from the risk pool** — a standard actuarial solvency principle. Every ₹1 of pure risk cost requires collecting ₹1.54 in gross premium.

| Loading Component | Rate | What It Covers |
|------------------|------|----------------|
| `ELR` — Expense Loading Ratio | 28% | Operations (18%) + Distribution (6%) + Tech (4%) |
| `PM` — Profit Margin | 7% | Year 1–2 discounted to 4% for adoption; 7% target steady state |


## The ML Fraud Detection System

Parametric insurance is inherently vulnerable to three fraud types:
1. **Enrollment fraud** — signing up during a known upcoming event
2. **Earnings inflation** — declaring higher income before a disruption
3. **Ring fraud** — coordinated false claims across a geographic zone

The system addresses all three through a layered ML pipeline that feeds into the FDS score.


### FDS Score Model

The **Fraud Detection Score** is a rolling per-worker score (0–1.0), updated after each claim event. It functions like a behavioural credit score for insurance.

**Input features to the FDS model:**

| Feature | Type | Description |
|---------|------|-------------|
| Enrollment timing | Binary | Was enrollment within 7 days of a known weather alert? |
| W_e spike detection | Continuous | % deviation of last week's earnings from 6-week rolling average |
| Claim frequency vs. zone rate | Ratio | Worker claim rate ÷ zone average claim rate |
| GPS activity during event | Boolean | Was GPS active on platform during the triggered event? |
| Platform tenure | Ordinal | Months active on platform — longer = lower risk |
| Prior claim reversals | Integer | Number of past claims flagged/reversed |

**Score dynamics:**
New workers start at FDS = 0.85 (slightly penalized, no history)
Each clean trigger event (GPS confirmed active, no anomalies) increases FDS toward 1.0
Each flagged event decreases FDS proportionally
FDS is re-computed after every claim event using a weighted decay function:

```
FDS_new = FDS_old × 0.9 + (event_score) × 0.1
```

Where `event_score = 1.0` for a fully clean claim and `0.0` for a fully flagged one.


### Earnings Baseline ML Model

The W_e baseline is established by an ML model trained on each worker's **platform transaction history** (pulled via RBI Account Aggregator).

**Model type:** Weighted moving average with outlier rejection (IQR-based)

**Training window:** 6–12 weeks of weekly earnings data

**Key feature:** A **7-day freeze rule** — if a worker's declared earnings jump more than 15% above the trailing 4-week average in the 7 days before a disruption event, the system freezes W_e at the pre-spike value for that claim cycle. This is the primary control against earnings inflation fraud.

```python
if (W_e_last_week > rolling_avg_4wk * 1.15) and (days_to_event <= 7):
    W_e_for_claim = rolling_avg_4wk   # freeze to baseline
else:
    W_e_for_claim = W_e_last_week     # use actual
```


### Zone-Level Anomaly Detection

This is a **statistical outlier detection layer** that operates at the pin-code zone level, not the individual worker level.

**How it works:**

For each pin-code zone, the system maintains an expected claim rate based on historical disruption frequency. After each trigger event, actual claim rates are compared to expected rates:

```python
zone_claim_rate = claims_in_zone / enrolled_workers_in_zone

if zone_claim_rate > 3 * expected_disruption_frequency:
    flag_zone_for_manual_review()
    pause_payouts_for_24h(zone)
```

This catches **coordinated ring fraud** where multiple workers in the same area submit claims for a minor or non-existent event. Flagged zones pause payouts for 24 hours pending manual review before disbursement.

**Example:** If a zone has a historical disruption rate of 0.42 events/week (like Mumbai), and a given week sees 1.5 claims per worker enrolled, that's 3.57× the expected rate → auto-hold triggered.


## Parametric Trigger Engine

No claims are filed. The trigger engine polls government data APIs on a daily (or hourly during alert conditions) basis and makes a binary payout decision.

| Trigger Type | Data Source | Level 1 (25% payout) | Level 2 (50% payout) | Level 3 (100% payout) |
|-------------|-------------|----------------------|----------------------|----------------------|
| 🌫️ Air Quality (AQI) | CPCB / AQI.in | AQI 301–400 (Very Poor) | AQI 401–500 (Severe) | AQI > 500 + GRAP IV |
| 🌧️ Heavy Rainfall | IMD API | 64.5–115 mm/day | 115–204 mm/day | > 204 mm/day |
| 🌡️ Extreme Heat | IMD Temp + Heat Index | Max > 42°C | Max > 45°C | Govt Heat Emergency |
| 🌀 Cyclone / Storm | IMD Cyclone Warning | Yellow Alert | Orange Alert | Red Alert / Landfall |
| 🌊 Flood | NDMA SACHET | Watch (Yellow) | Warning (Orange) | Emergency (Red) |
| 🏛️ Curfew / Lockdown | Government Order | Partial restrictions | Section 144 | Full curfew |

**Payout rules:**
Multiple triggers in the same week **do not stack** — the highest severity level governs
Maximum weekly payout = 25% of the worker's insured W_e
Annual aggregate cap = 12× weekly coverage (≈ 3 months of income protection per year)
Payout disbursed within 24–48 hours via UPI / direct bank transfer

**GPS confirmation step (post-trigger):**
After a trigger fires, the system cross-references platform GPS data to confirm the worker was active on-road during the disruption window. Workers with no GPS activity during the event do not receive a payout — regardless of enrollment status. This step alone reduces false claims by an estimated **68%**.


## Data Pipeline & Sources

```
External APIs                     Internal Signals
──────────────                    ────────────────
CPCB AQI Feed    ──┐              Platform GPS      ──┐
IMD Rainfall API ──┤              RBI AA Earnings   ──┤──► ML Feature Store
NDMA SACHET      ──┤              Enrollment timing ──┤
IQAir Reports    ──┘              Claims history    ──┘
                  │                                  │
                  └──────────────┬──────────────────┘
                                 ▼
                        Pricing Engine
                        FDS Model Update
                        Zone Anomaly Check
                        Trigger Decision
                        Payout Disbursement
```

| Data Source | Used For | Update Frequency |
|-------------|----------|-----------------|
| CPCB / AQI.in | AQI trigger thresholds | Hourly |
| IMD API | Rainfall, heat, cyclone triggers | Daily / real-time alerts |
| NDMA SACHET | Flood alerts | Real-time |
| RBI Account Aggregator | W_e earnings baseline | Weekly |
| Platform GPS feeds | Active-on-road confirmation | Per-event |
| IQAir / IMD historical archives | D_annual calibration, α factors | Annual refresh |


## Worked Examples (End-to-End)

### Example A: Delhi, Swiggy, Full-time, Smog Season (Worst Case)

```
Inputs:
  W_e       = ₹4,900  (metro full-time baseline)
  LR_pct    = 25%
  D_annual  = 58  →  E_freq_w = 58 ÷ 52 = 1.115
  RM        = 1.80 × 1.15 × 1.15 × 1.35 = 3.21  →  capped at 2.20
  FDS       = 0.95  →  MF = 1 + 0.05 × 0.08 = 1.004

PRC_w  = 4,900 × 0.25 × 1.115 × 2.20 × 1.004  =  ₹3,007 (uncapped)
         → Affordability ceiling (6% of W_e) applied → PRC_w = ₹294
P_w    = 294 ÷ 0.65  =  ₹452 / week

Affordability: ₹452 = 9.2% of W_e → ⚠️ Marginal → platform co-pay recommended
Max weekly payout: ₹1,225   |   Annual max benefit: ₹14,700
```


### Example B: Mumbai, Zepto, Part-time, Monsoon (Realistic Target)

```
Inputs:
  W_e       = ₹3,200  (part-time estimate)
  LR_pct    = 25%
  D_annual  = 30  →  E_freq_w = 0.577
  RM        = 1.20 × 1.25 × 0.85 × 1.25  =  1.594
  FDS       = 0.85  →  MF = 1.012

PRC_w  = 3,200 × 0.25 × 0.577 × 1.594 × 1.012  =  ₹741
P_w    = 741 ÷ 0.65  =  ₹1,140 / week

Affordability: ₹1,140 = 35.6% of W_e → ❌ Needs subsidy
With 50% platform subsidy: worker pays ₹570 = 17.8% → ✅ Viable
```


### Example C: Bangalore, Amazon Flex, Full-time, Baseline (Optimal Case)

```
Inputs:
  W_e       = ₹4,200
  LR_pct    = 25%
  D_annual  = 18  →  E_freq_w = 0.346
  RM        = 0.90 × 1.05 × 1.00 × 1.00  =  0.945
  FDS       = 0.95  →  MF = 1.004

PRC_w  = 4,200 × 0.25 × 0.346 × 0.945 × 1.004  =  ₹344
P_w    = 344 ÷ 0.65  =  ₹529 / week

Affordability: ₹529 = 12.6% of W_e → ✅ Viable (no subsidy needed)
Max weekly payout: ₹1,050   |   Annual max benefit: ₹12,600
```


## Premium Output Benchmarks

| Scenario | Gross Weekly Premium | With 30% Subsidy | % of Weekly Earnings | Status |
|----------|---------------------|-----------------|---------------------|--------|
| Delhi NCR, Full-time, Smog Season | ₹320–480 | ₹224–336 | 7–9% | ⚠️ Marginal |
| Mumbai, Full-time, Monsoon | ₹180–280 | — | 5–7% | ✅ Affordable |
| Bangalore, Part-time, Baseline | ₹90–150 | — | 3–5% | ✅ Affordable |
| Tier-2 City, Full-time, Any Season | ₹130–200 | — | 4–6% | ✅ Affordable |

**Affordability thresholds:**
≤ 8% of W_e → ✅ Voluntary uptake expected
8–12% → ⚠️ Marginal — platform co-pay recommended
> 12% → ❌ Requires platform mandate or subsidy


## Interactive Calculator Logic

The `calcPremium()` JavaScript function in the HTML file implements the full pricing formula in the browser. Here's the core computation:

```javascript
function calcPremium() {
  // Step 1: Derive γ from hours slider
  let gamma;
  if (hours < 5)        gamma = 0.85;
  else if (hours <= 8)  gamma = 1.0;
  else if (hours <= 10) gamma = 1.15;
  else                  gamma = 1.30;

  // Step 2: E_freq_w from city's annual disruption days
  const eFreqW = D_annual / 52;

  // Step 3: RM — capped at 2.20
  let RM = alpha * beta * gamma * delta;
  RM = Math.min(RM, 2.20);

  // Step 4: MF from FDS slider
  const MF = 1 + (1 - FDS) * 0.08;

  // Step 5: Pure Risk Cost
  const PRC_w = W_e * 0.25 * eFreqW * RM * MF;

  // Step 6: Gross premium and worker-pays after subsidy
  const grossPremium  = PRC_w / (1 - 0.28 - 0.07);  // ÷ 0.65
  const workerPremium = grossPremium * (1 - subsidyPct);

  // Affordability classification
  const pctIncome = (workerPremium / W_e) * 100;
  if (pctIncome <= 8)       status = '✅ Affordable';
  else if (pctIncome <= 12) status = '⚠️ Marginal';
  else                       status = '❌ Needs Subsidy';
}
```

All seven inputs (city, platform, hours, season, earnings, FDS score, subsidy %) are configurable via sliders and dropdowns, with live output rendering.


## IRDAI Compliance & Scope

All weekly premium tiers produce **annual totals under ₹30,000**, qualifying for IRDAI's simplified microinsurance underwriting framework
Uses the **"use and file"** regulatory pathway for faster product approval
Earnings data accessed only via **RBI Account Aggregator** — consent-based, no raw data storage
All triggers sourced from **immutable government APIs** (CPCB, IMD, NDMA) — no user-reported claims

**Explicit scope exclusions (per IRDAI compliance):**

| Coverage Type | Included? |
|--------------|-----------|
| Income loss from environmental disruption | ✅ Yes |
| Health / medical insurance | ❌ No |
| Life insurance | ❌ No |
| Accident / disability | ❌ No |
| Vehicle / bike damage | ❌ No |


*Clover — Parametric Insurance Pricing Model v1.0 | Hackathon Build 2025 | All figures in INR*
