const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

// ─── Middleware ───────────────────────────────────────────────
app.use(cors());
app.use(express.json()); // parse incoming JSON bodies

// ─── Routes ──────────────────────────────────────────────────
const authRoutes         = require("./routes/auth");
const walletRoutes       = require("./routes/wallet");
const riskRoutes         = require("./routes/risk");
const transactionRoutes  = require("./routes/transactions");

app.use("/auth",         authRoutes);
app.use("/wallet",       walletRoutes);
app.use("/risk",         riskRoutes);
app.use("/transactions", transactionRoutes);

// ─── Health Check ─────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ status: "Backend is running ✅" });
});

// ─── Start Server ─────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
