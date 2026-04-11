const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const authRoutes        = require("./routes/auth");
const walletRoutes      = require("./routes/wallet");
const riskRoutes        = require("./routes/risk");
const transactionRoutes = require("./routes/transactions");

app.use("/auth",         authRoutes);
app.use("/wallet",       walletRoutes);
app.use("/risk",         riskRoutes);
app.use("/transactions", transactionRoutes);

app.get("/", (req, res) => {
  res.json({ status: "Backend is running ✅" });
});

// Added /health route so healthAPI.check() doesn't 404
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});