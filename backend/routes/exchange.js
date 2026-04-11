const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const authMiddleware = require("../middleware/auth");
const db = require("../models/database");

// ─── POST /exchange/buy ────────────────────────────────────────
// User spends MYR to buy DASH (simulated)
// Body: { myrAmount, dashAmount, rate }
router.post("/buy", authMiddleware, async (req, res) => {
  try {
    const { myrAmount, dashAmount, rate } = req.body;

    if (!myrAmount || !dashAmount || myrAmount <= 0 || dashAmount <= 0) {
      return res.status(400).json({ error: "Invalid amount." });
    }

    const user = db.findUserById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found." });

    // Add DASH to user balance
    const newBalance = (user.balance ?? 0) + dashAmount;
    db.updateUserBalance(user.id, newBalance);

    // Record transaction
    db.addTransaction({
      id: uuidv4(),
      type: "buy",
      fromAddress: "MYR_FIAT",
      toAddress: user.walletAddress,
      amount: dashAmount,
      myrAmount: myrAmount,
      rate: rate,
      note: `Bought ${dashAmount.toFixed(4)} DASH at RM${rate}/DASH`,
      riskLevel: "low",
      txid: "BUY-" + uuidv4().slice(0, 8).toUpperCase(),
      status: "completed",
      timestamp: new Date().toISOString(),
    });

    return res.status(200).json({
      success: true,
      newBalance,
      dashAmount,
      myrAmount,
      message: `Successfully bought ${dashAmount.toFixed(4)} DASH`,
    });
  } catch (err) {
    console.error("Buy error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

// ─── POST /exchange/sell ───────────────────────────────────────
// User sells DASH to get MYR (simulated)
// Body: { dashAmount, myrAmount, rate }
router.post("/sell", authMiddleware, async (req, res) => {
  try {
    const { dashAmount, myrAmount, rate } = req.body;

    if (!dashAmount || !myrAmount || dashAmount <= 0 || myrAmount <= 0) {
      return res.status(400).json({ error: "Invalid amount." });
    }

    const user = db.findUserById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found." });

    // Check sufficient balance
    const currentBalance = user.balance ?? 0;
    if (dashAmount > currentBalance) {
      return res.status(400).json({ error: "Insufficient DASH balance." });
    }

    // Deduct DASH from balance
    const newBalance = currentBalance - dashAmount;
    db.updateUserBalance(user.id, newBalance);

    // Record transaction
    db.addTransaction({
      id: uuidv4(),
      type: "sell",
      fromAddress: user.walletAddress,
      toAddress: "MYR_FIAT",
      amount: dashAmount,
      myrAmount: myrAmount,
      rate: rate,
      note: `Sold ${dashAmount.toFixed(4)} DASH at RM${rate}/DASH`,
      riskLevel: "low",
      txid: "SELL-" + uuidv4().slice(0, 8).toUpperCase(),
      status: "completed",
      timestamp: new Date().toISOString(),
    });

    return res.status(200).json({
      success: true,
      newBalance,
      dashAmount,
      myrAmount,
      message: `Successfully sold ${dashAmount.toFixed(4)} DASH for RM${myrAmount.toFixed(2)}`,
    });
  } catch (err) {
    console.error("Sell error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

module.exports = router;