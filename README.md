# Brand Connect Hub (BCH)

> A two-sided web marketplace connecting brands with verified creative service vendors.
> **Stack:** React + Tailwind CSS | Node.js + Express | PostgreSQL | JWT Auth

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ LTS
- PostgreSQL 14+
- npm or yarn

---

### 1. Database Setup

```bash
# Create the database
psql -U postgres -c "CREATE DATABASE brand_connect_hub;"

# Run the schema
psql -U postgres -d brand_connect_hub -f database/schema.sql
```

---

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your DB credentials and JWT secret

npm install
npm run dev
# API runs at http://localhost:5000
```

---

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
# App runs at http://localhost:3000
```

---

## 🔐 Default Login

| Role  | Email                          | Password       |
|-------|-------------------------------|----------------|
| Admin | admin@brandconnecthub.com     | Admin@BCH2024! |

---

## 📁 Project Structure

```
brand-connect-hub/
├── backend/
│   ├── config/db.js              # PostgreSQL pool
│   ├── middleware/auth.js         # JWT middleware
│   ├── routes/
│   │   ├── auth.js               # Register, Login, /me
│   │   ├── projects.js           # CRUD + vendor matching
│   │   ├── bids.js               # Submit & accept bids
│   │   ├── vendors.js            # Browse & profile update
│   │   ├── messages.js           # In-platform chat
│   │   ├── transactions.js       # Escrow & payments
│   │   ├── notifications.js      # Alerts
│   │   └── admin.js              # Admin controls
│   ├── utils/matchingAlgorithm.js # Weighted vendor scoring
│   └── server.js                 # Express app entry
│
├── frontend/
│   └── src/
│       ├── App.jsx               # Routing (role-based guards)
│       ├── context/AuthContext.jsx
│       ├── utils/api.js          # Axios + all API calls
│       ├── components/common/    # Sidebar, StatCard, etc.
│       └── pages/                # Dashboard, Projects, etc.
│
└── database/schema.sql           # PostgreSQL schema + seeds
```

---

## 🔌 API Reference

### Auth
| Method | Endpoint            | Description         |
|--------|---------------------|---------------------|
| POST   | /api/auth/register  | Register brand/vendor|
| POST   | /api/auth/login     | Login               |
| GET    | /api/auth/me        | Get current user    |

### Projects
| Method | Endpoint                    | Description              |
|--------|-----------------------------|--------------------------|
| GET    | /api/projects               | Browse open projects     |
| GET    | /api/projects/my            | Brand's own projects     |
| POST   | /api/projects               | Create project           |
| GET    | /api/projects/:id           | Project detail + bids    |
| GET    | /api/projects/:id/matches   | AI-ranked vendor matches |
| PATCH  | /api/projects/:id/status    | Update project status    |

### Bids
| Method | Endpoint            | Description         |
|--------|---------------------|---------------------|
| POST   | /api/bids           | Submit bid          |
| PATCH  | /api/bids/:id/accept| Accept bid          |
| GET    | /api/bids/my        | Vendor's bids       |

### Transactions (Escrow)
| Method | Endpoint                       | Description         |
|--------|--------------------------------|---------------------|
| POST   | /api/transactions              | Create escrow hold  |
| PATCH  | /api/transactions/:tid/release | Release to vendor   |
| GET    | /api/transactions/my           | Transaction history |

---

## 🧠 Vendor Matching Algorithm

```
Score = (0.4 × ServiceMatch) + (0.3 × NormalizedRating) + (0.2 × BudgetAlignment) + (0.1 × IndustryMatch)
```

Triggered automatically when a brand posts a project — top 10 matched vendors receive a notification.

---

## 🔒 Security Features

- bcrypt password hashing (12 rounds)
- JWT stateless authentication (7-day expiry)
- Role-based access control (Brand / Vendor / Admin)
- Helmet.js security headers
- Rate limiting (200 req/15min; 20 auth req/15min)
- Input validation via express-validator
- PostgreSQL parameterized queries (SQL injection safe)

---

## 🗓 Development Roadmap (from proposal)

| Week  | Task                                      | Status      |
|-------|-------------------------------------------|-------------|
| 1–2   | Requirements & Proposal                   | ✅ Done      |
| 3–4   | Literature Review & Analysis              | ✅ Done      |
| 5–7   | System Design & Database Schema           | ✅ Done      |
| 8–10  | Frontend (Brand/Vendor Dashboards)        | ✅ Done      |
| 10–12 | Backend API & Authentication              | ✅ Done      |
| 13–14 | Integrated Testing & Bug Fixes            | 🔄 In Progress |
| 15–16 | Documentation & Final Submission          | 📋 To Do    |

---

*Brand Connect Hub — Chuka University COMP 465 Project*
