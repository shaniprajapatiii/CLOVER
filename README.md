# 🛡️ CLOVER — AI-Powered Parametric Insurance for India's Gig Economy

A full-stack, production-grade insurance platform protecting delivery workers (Zomato, Swiggy, Zepto, Amazon, etc.) from income loss due to weather, pollution, curfews, and other external disruptions.

---

## 🏗️ Architecture

```
clover/
├── backend/          # Express.js + MongoDB API
│   ├── src/
│   │   ├── models/       # Mongoose schemas (Worker, Policy, Claim, WeatherEvent, Notification)
│   │   ├── controllers/  # Business logic
│   │   ├── routes/       # API route definitions
│   │   ├── services/     # AI Risk Engine, Fraud Detection, Weather, Cron, Claims
│   │   ├── middleware/   # JWT Auth, Rate Limiting
│   │   ├── config/       # MongoDB connection
│   │   └── utils/        # Winston logger
│   └── scripts/
│       └── seed.js       # Database seeder
└── frontend/         # React.js + Tailwind CSS
    └── src/
        ├── pages/        # All app pages
        ├── services/     # Axios API layer
        └── store/        # Zustand global state
```

---

## ⚙️ Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env and add your values (MongoDB URI, JWT secret, etc.)

# Seed the database with sample data
npm run seed

# Start development server
npm run dev

# Production
npm start
```

### Key Environment Variables (.env)
| Variable | Description |
|---|---|
| `MONGODB_URI` | Your MongoDB connection string |
| `JWT_SECRET` | Secret key for JWT tokens (change in production!) |
| `OPENWEATHER_API_KEY` | Free tier from openweathermap.org (optional — uses mock data if not set) |
| `RAZORPAY_KEY_ID` | Razorpay sandbox key for payment simulation |
| `FRONTEND_URL` | Your frontend URL for CORS (default: http://localhost:3000) |

---

## 💻 Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

---

## 🚀 Features

### Worker App
- **Multi-step onboarding** — platform selection, earnings profile, risk calculation
- **AI Risk Assessment** — dynamic weekly premium based on 10+ factors
- **Policy Management** — 3 plans (Basic ₹49/wk, Standard ₹89/wk, Premium ₹139/wk)
- **Claims Dashboard** — auto-triggered + manual claims with status tracking
- **Analytics** — earnings protected, claim history, risk score trends (Recharts)
- **Weather Alerts** — real-time weather monitoring for 10 cities
- **Notifications** — real-time claim and policy updates
- **KYC** — Aadhaar, PAN, bank account, UPI linking
- **Referral Program** — share code, earn loyalty points
- **Loyalty Points** — earn points for renewals, referrals, claim receipts

### AI / Automation
- **AI Risk Engine** — city risk multipliers, platform adjustments, vehicle type, experience
- **Dynamic Pricing** — risk-loaded weekly premiums with loyalty/referral discounts
- **Fraud Detection** — 7-factor analysis: duplicates, location, frequency, amount, history, weather correlation, policy age
- **Auto-triggered Claims** — cron jobs poll weather APIs every 30 mins and auto-trigger claims for affected workers
- **Parametric Triggers** — 11 disruption types with configurable thresholds

### Admin Panel
- Platform analytics (workers, policies, revenue, fraud)
- City-wise worker distribution charts
- Trigger-wise claim breakdown
- Manual claim review (approve/reject)
- Worker management (activate/deactivate)
- **Weather Event Simulator** — test auto-claim triggering in any city

---

## 🔑 Demo Credentials (after seeding)

| Role | Phone | Password |
|---|---|---|
| Worker | 9876543210 | Worker@123 |
| Admin | 9000000000 | Admin@123 |

---

## 📡 API Reference

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me` *(protected)*
- `PATCH /api/auth/profile` *(protected)*

### Policies
- `GET /api/policies/plans` — Get AI-calculated plan options
- `POST /api/policies` — Create new policy
- `GET /api/policies` — Get all my policies
- `POST /api/policies/:id/renew`
- `PATCH /api/policies/:id/cancel`

### Claims
- `POST /api/claims` — Submit claim
- `GET /api/claims` — My claims (filterable)
- `GET /api/claims/stats/summary`
- `GET /api/claims/admin/all` *(admin)*
- `PATCH /api/claims/:id/review` *(admin)*
- `PATCH /api/claims/:id/payout` *(admin)*

### Weather
- `GET /api/weather/current?city=Mumbai`
- `GET /api/weather/events`
- `POST /api/weather/simulate` *(admin)* — Test auto-trigger

### Analytics
- `GET /api/analytics/dashboard`
- `GET /api/analytics/earnings`
- `GET /api/analytics/admin` *(admin)*

### Notifications, Risk, Workers
- `GET /api/notifications`
- `GET /api/risk/assess`
- `GET /api/workers/leaderboard`
- `GET /api/workers/referrals`
- `POST /api/workers/kyc`

---

## 🔧 Corrections Needed

1. **Add `.env` file** — Copy `backend/.env.example` to `backend/.env` and fill in:
   - `MONGODB_URI` — your MongoDB connection (local or Atlas)
   - `JWT_SECRET` — any long random string
   - `OPENWEATHER_API_KEY` — optional (mock data works without it)

2. **Create `backend/logs/` directory** — Winston logger writes here:
   ```bash
   mkdir -p backend/logs
   ```

3. **Install `tailwindcss` PostCSS config** in frontend:
   ```bash
   cd frontend && npm install -D tailwindcss postcss autoprefixer
   npx tailwindcss init -p
   ```

4. **MongoDB** — Ensure MongoDB is running locally (`mongod`) or use MongoDB Atlas URI.

5. **Razorpay** — Uses mock sandbox. Replace with real keys for production. The `paymentController` has a comment showing where to add the Razorpay SDK.

6. **Font loading** — Requires internet access. Falls back to system fonts offline.

---

## 📦 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router 6, Tailwind CSS, Recharts, Zustand, Framer Motion |
| Backend | Express.js, MongoDB, Mongoose, JWT, Bcrypt, Winston |
| AI/ML | Custom risk scoring engine, fraud detection (rule-based + heuristic) |
| Weather | OpenWeatherMap API (free tier) with mock fallback |
| Jobs | node-cron (auto-claim triggering, policy renewal) |
| Payments | Razorpay (sandbox/mock) |
| Fonts | Plus Jakarta Sans, Syne, JetBrains Mono |
