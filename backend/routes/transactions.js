const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const db = require("../models/database");

// ─── GET /transactions ─────────────────────────────────────────
// Returns transaction history for a given wallet address
// 🔒 Protected — user must be logged in
// Usage: GET /transactions?wallet=0xABC123...
router.get("/", authMiddleware, (req, res) => {
  try {
    const { wallet } = req.query;

    // 1. Validate input
    if (!wallet) {
      return res.status(400).json({ error: "wallet query param is required." });
    }

    // 2. Get transactions from database
    const history = db.getTransactionsByWallet(wallet);

    // 3. Return the history
    // Note: if no real data yet, this returns the fake data seeded in database.js
    return res.status(200).json({
      wallet,
      transactions: history,
    });
  } catch (err) {
    console.error("Transactions error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

module.exports = router;