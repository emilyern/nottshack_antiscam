# DashGuard — Anti-Fraud Dash Payment Platform

DashGuard is a full-stack web app that lets users send Dash (DASH) on the **testnet** with built-in fraud detection. Every outgoing transaction is risk-analyzed before it is broadcast, and high/critical-risk addresses can be blocked automatically.

---

## Project Structure

```
nottshack_antiscam/
├── backend/          # Node.js + Express API server
│   ├── middleware/   # JWT auth middleware
│   ├── models/       # JSON file database + wallet dataset
│   ├── routes/       # auth, wallet, risk, transactions
│   ├── services/     # wallet, risk engine, blockchain
│   └── server.js
└── Frontend/         # React app (Create React App)
    └── src/
        ├── pages/    # Login, Register, Dashboard, Send, History
        └── api.js    # Centralized API client
```

---

## Prerequisites

- **Node.js** v18 or later
- **npm** v9 or later

Check your versions:
```bash
node -v
npm -v
```

---

## Running the App

You need to run the **backend** and **frontend** in two separate terminals.

### 1. Backend

```bash
cd backend
npm install
```

Optionally, create a `.env` file (the app runs without one, but setting `JWT_SECRET` is recommended):

```bash
# backend/.env
PORT=4000
JWT_SECRET=change_this_to_a_long_random_string
```

Start the server:

```bash
npm start
```

The backend will be available at `http://localhost:4000`. You should see:

```
Server running on port 4000
```

You can verify it is working by visiting `http://localhost:4000/` in your browser — it should return `{ "status": "Backend is running ✅" }`.

---

### 2. Frontend

Open a **new terminal**:

```bash
cd Frontend
npm install
npm start
```

This starts the React dev server at `http://localhost:3000`. The frontend is pre-configured to proxy API requests to `http://localhost:4000`, so both must be running.

---

## Using the App

### Register

1. Go to `http://localhost:3000/register`
2. Fill in username, email, and password
3. A Dash testnet wallet is automatically generated for you

### Send DASH

1. Navigate to **Send DASH**
2. Enter a recipient address — use the quick-test buttons to try safe, medium, and blacklisted addresses
3. Review the risk report before proceeding
4. Enter the amount and confirm

### Risk Levels

| Level    | Meaning                                              |
|----------|------------------------------------------------------|
| 🟢 Low    | Safe to proceed                                      |
| 🟡 Medium | Some signals — proceed with caution                  |
| 🔴 High   | Strong risk indicators — sending is discouraged      |
| ⛔ Critical | Blacklisted address — blocked by default           |

High and critical transactions can be bypassed if the user explicitly accepts responsibility.

---

## Test Addresses

These addresses are pre-loaded in the risk dataset for demo purposes:

| Address | Label | Expected Risk |
|---------|-------|---------------|
| `yNsWkgPLN1u84oBrigDPQ5NgNYEDxQ9rjS` | Trusted Merchant | 🟢 Low |
| `ySampleSuspiciousAddress1111111111` | Suspicious New Wallet | 🟡 Medium |
| `yHighRiskBurnerWallet33333333333333` | Likely Burner Wallet | 🔴 High |
| `yXkHXoFjmQMHZ3J2rkVhiMpnMmNiPkBMzE` | Known Scam Wallet | ⛔ Critical |
| `yMixerTumblerCritical555555555555555` | Suspected Mixer | ⛔ Critical |

Any address not in the dataset is treated as an unknown new wallet (Low risk by default).

---

## API Endpoints

All protected routes require a `Bearer <token>` header (the frontend handles this automatically).

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | No | Create account + wallet |
| POST | `/auth/login` | No | Login, receive JWT |
| GET | `/auth/me` | Yes | Get current user info |
| GET | `/wallet/balance` | Yes | Get wallet balance |
| GET | `/wallet/history` | Yes | Get transaction history |
| POST | `/risk/analyze` | Yes | Analyze an address for risk |
| GET | `/risk/report/:address` | Yes | Get wallet label/blacklist info |
| POST | `/transactions/send` | Yes | Send DASH (with risk check) |
| GET | `/transactions` | Yes | Get transactions by wallet |

---

## Architecture Notes

- **Database**: Users and transactions are persisted to `backend/models/users.json` and `backend/models/transactions.json` (created automatically, excluded from git).
- **Blockchain**: In the default flow, transactions use a simulated broadcast (`blockchainService.js`) that returns a fake transaction hash. A real Dash SDK integration exists in `dashApiService.js` but requires a funded testnet wallet and network sync time.
- **Risk Engine**: Scoring is rule-based (`riskEngine.js`) and augmented by a pre-built wallet dataset (`walletDataset.js`). Blacklisted addresses are always forced to Critical regardless of score.

---

## Security Notes (Hackathon Context)

This project was built for a hackathon and has intentional simplifications:

- **Mnemonics are stored in plaintext** in the JSON database. In production, these must be encrypted at rest.
- The default `JWT_SECRET` falls back to `"dev_secret"` if no `.env` is set — always override this in any shared or deployed environment.
- No rate limiting or brute-force protection is implemented on auth routes.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6, Recharts, Lucide React |
| Backend | Node.js, Express 5, bcryptjs, jsonwebtoken |
| Wallet | Dash JS SDK (testnet) |
| Storage | JSON flat files (no external DB required) |
