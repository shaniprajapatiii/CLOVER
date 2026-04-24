
# 🛡️ CLOVER — AI-Powered Parametric Insurance for India's Gig Economy

<div align="center">
   <img src="frontend/public/Clover.png" alt="Clover 2026" width="100%"/>
</div>

---

A full-stack, production-grade insurance platform protecting India's gig economy delivery workers (Zomato, Swiggy, Zepto, Amazon, etc.) from income loss due to weather, pollution, curfews, and other disruptions.

---

## 🌐 Live Demo Links

- **Clover Worker Web App:** [clover-gigworker.vercel.app](https://clover-gigworker.vercel.app)
- **Clover Partner App (PWA):** [clover-partner.vercel.app](https://clover-partner.vercel.app)

---

## 🏗️ Architecture

```
CLOVER/
├── backend/                # Express.js + MongoDB API
│   ├── src/
│   │   ├── models/         # Mongoose schemas (Worker, Policy, Claim, WeatherEvent, Notification)
│   │   ├── controllers/    # Business logic
│   │   ├── routes/         # API route definitions
│   │   ├── services/       # AI Risk Engine, Fraud Detection, Weather, Cron, Claims
│   │   ├── middleware/     # JWT Auth, Rate Limiting
│   │   ├── config/         # MongoDB connection
│   │   └── utils/          # Winston logger
│   └── scripts/
│       └── seed.js         # Database seeder
│   └── logs/               # Winston log output
│   └── vercel.json         # Vercel deployment config
│   └── package.json        # Backend dependencies
│
├── frontend/               # React 18 + Tailwind CSS (Worker Web App)
│   ├── src/
│   │   ├── pages/          # App pages
│   │   ├── services/       # Axios API layer
│   │   └── store/          # Zustand global state
│   └── public/             # Static assets (Clover2026.png, index.html)
│   └── package.json        # Frontend dependencies
│
├── Clover-Partner-App/     # React 19 PWA (Mobile-first Partner App)
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # App views (Dashboard, Login, Earnings, etc.)
│   │   └── store/          # Zustand state
│   └── public/             # Manifest, icons
│   └── package.json        # Partner app dependencies
│

├── ML-Model-Architecture/  # ML docs and architecture
│   └── ML_Model_Architecture.md
└── ...docs, guides, and reference files
```

---

## 🤖 Machine Learning & AI Engine

Clover's core innovation is its **ML-powered parametric insurance pricing model**. The ML engine computes personalized weekly premiums and fraud risk scores for each worker, using:

- Multi-factor risk scoring (city, platform, hours, season, earnings, etc.)
- ML-driven fraud detection (enrollment timing, earnings spikes, claim patterns, GPS activity)
- Automated parametric triggers (weather, AQI, flood, heat, curfew, etc.)
- Real-time data ingestion from government APIs and platform feeds

> **Status:**
> - The ML model architecture, formulas, and logic are fully documented in [ML_Model_Architecture.md](ML-Model-Architecture/ML_Model_Architecture.md).
> - Core logic (risk scoring, premium calculation, fraud detection) is implemented in the backend and interactive calculator.
> - Some advanced ML features (zone anomaly detection, dynamic disruption frequency, full FDS model) are **partially implemented** and under active development.
>
> See [ML_Model_Architecture.md](ML-Model-Architecture/ML_Model_Architecture.md) for full details, formulas, and worked examples.

---


## ⚙️ Setup & Installation

### 1. Backend (API)

```bash
cd backend
npm install
cp .env.example .env   # Add your MongoDB URI, JWT secret, etc.
npm run seed           # Seed database with demo data
npm run dev            # Start dev server (nodemon)
# or
npm start              # Start in production
```
**Key .env variables:**
| Variable              | Description                                 |
|----------------------|---------------------------------------------|
| MONGODB_URI          | MongoDB connection string                   |
| JWT_SECRET           | JWT token secret                            |
| OPENWEATHER_API_KEY  | (Optional) OpenWeatherMap API key           |
| RAZORPAY_KEY_ID      | Razorpay sandbox key                        |
| FRONTEND_URL         | CORS origin (default: http://localhost:3000)|

---

### 2. Frontend (Worker Web App)

```bash
cd frontend
npm install
npm start         # Start dev server (React 18)
npm run build     # Build for production
```

---

### 3. Clover-Partner-App (Mobile PWA)

```bash
cd Clover-Partner-App
npm install
npm run dev      # Start Vite dev server (React 19)
npm run build    # Build for production
```

---


## 🚀 Features Overview

### Worker Web App (frontend/)
- Multi-step onboarding (platform, earnings, risk)
- AI risk assessment (dynamic premium)
- Policy management (3 plans)
- Claims dashboard (auto/manual, status tracking)
- Analytics (earnings, claims, risk trends)
- Weather alerts (10 cities)
- Notifications (real-time updates)
- KYC (Aadhaar, PAN, bank, UPI)
- Referral & loyalty program

### Clover-Partner-App (Clover-Partner-App/)
- Mobile-first PWA (React 19, Vite)
- Real-time geolocation & delivery state
- Interactive dashboard & order dispatch
- Secure JWT/OTP authentication
- Earnings & profile management
- Fluid UI, micro-interactions (Framer Motion)

### Backend API (backend/)
- Express.js REST API (JWT, CORS, rate limiting)
- AI risk engine & dynamic pricing
- Fraud detection (7-factor analysis)
- Auto-triggered claims (cron jobs)
- Parametric triggers (11 types)
- Admin panel endpoints (analytics, review, simulator)

### Admin Panel
- Platform analytics (workers, policies, revenue, fraud)
- City-wise worker distribution
- Trigger-wise claim breakdown
- Manual claim review (approve/reject)
- Worker management (activate/deactivate)
- Weather event simulator

---


## 🔑 Demo Credentials (after seeding)

| Role   | Phone      | Password    |
|--------|------------|-------------|
| Worker | 9876543210 | Worker@123  |
| Admin  | 9000000000 | Admin@123   |

---


## 📡 API Reference (backend/)

**Auth**
- `POST /api/auth/register` — Register
- `POST /api/auth/login` — Login
- `GET /api/auth/me` — Get profile (protected)
- `PATCH /api/auth/profile` — Update profile (protected)

**Policies**
- `GET /api/policies/plans` — Get plan options
- `POST /api/policies` — Create new policy
- `GET /api/policies` — List my policies
- `POST /api/policies/:id/renew` — Renew policy
- `PATCH /api/policies/:id/cancel` — Cancel policy

**Claims**
- `POST /api/claims` — Submit claim
- `GET /api/claims` — My claims
- `GET /api/claims/stats/summary` — Claim stats
- `GET /api/claims/admin/all` — All claims (admin)
- `PATCH /api/claims/:id/review` — Review claim (admin)
- `PATCH /api/claims/:id/payout` — Payout (admin)

**Weather**
- `GET /api/weather/current?city=Mumbai` — Current weather
- `GET /api/weather/events` — Weather events
- `POST /api/weather/simulate` — Simulate event (admin)

**Analytics**
- `GET /api/analytics/dashboard` — Worker dashboard
- `GET /api/analytics/earnings` — Earnings
- `GET /api/analytics/admin` — Admin analytics

**Other**
- `GET /api/notifications` — Notifications
- `GET /api/risk/assess` — Risk assessment
- `GET /api/workers/leaderboard` — Leaderboard
- `GET /api/workers/referrals` — Referrals
- `POST /api/workers/kyc` — KYC upload

---


## 🔧 Quick Setup Checklist

1. **Add `.env` file:** Copy `backend/.env.example` to `backend/.env` and fill in:
   - `MONGODB_URI` — your MongoDB connection (local or Atlas)
   - `JWT_SECRET` — any long random string
   - `OPENWEATHER_API_KEY` — optional (mock data works without it)
2. **Create logs directory:**
   ```bash
   mkdir -p backend/logs
   ```
3. **Install Tailwind/PostCSS in frontend:**
   ```bash
   cd frontend && npm install -D tailwindcss postcss autoprefixer
   npx tailwindcss init -p
   ```
4. **MongoDB:** Ensure MongoDB is running locally (`mongod`) or use MongoDB Atlas URI.
5. **Razorpay:** Uses mock sandbox. Replace with real keys for production. See `paymentController` for integration.
6. **Font loading:** Requires internet access. Falls back to system fonts offline.

---


## 📦 Tech Stack

| Layer/App            | Technology & Tools                                                                 |
|----------------------|-----------------------------------------------------------------------------------|
| Frontend (Worker)    | React 18, React Router 6, Tailwind CSS, Zustand, Recharts, Framer Motion, Axios   |
| Partner App (PWA)    | React 19, Vite, Zustand, React Router 7, Leaflet, Framer Motion, Lucide, Tailwind |
| Backend API          | Express.js, MongoDB, Mongoose, JWT, Bcrypt, Winston, node-cron, Razorpay (mock)   |
| AI/ML                | Custom risk scoring, fraud detection (rule-based + heuristic)                     |
| Weather              | OpenWeatherMap API (with mock fallback)                                           |
| Jobs                 | node-cron (auto-claim, policy renewal)                                            |
| Fonts                | Plus Jakarta Sans, Syne, JetBrains Mono                                           |

---

> **Note:** If viewing on GitHub, images may not render in Markdown preview. For best results, open in a Markdown viewer or VS Code.
