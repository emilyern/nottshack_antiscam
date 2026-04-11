const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const authMiddleware = require("../middleware/auth");
const db = require("../models/database");

// ─── POST /exchange/topup ──────────────────────────────────────
router.post("/topup", authMiddleware, async (req, res) => {
  try {
    const { myrAmount } = req.body;
    if (!myrAmount || myrAmount <= 0) return res.status(400).json({ error: "Invalid amount." });
    if (myrAmount > 10000) return res.status(400).json({ error: "Maximum top up is RM10,000." });

    const user = db.findUserById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found." });

    const newMyrBalance = (user.myrBalance ?? 0) + myrAmount;
    db.updateUserMyrBalance(user.id, newMyrBalance);

    db.addTransaction({
      id: uuidv4(),
      type: "topup",
      fromAddress: "FPX_BANK",
      toAddress: user.walletAddress,
      amount: 0,
      myrAmount,
      note: `Top up RM${myrAmount.toFixed(2)} via FPX`,
      riskLevel: "low",
      txid: "TOPUP-" + uuidv4().slice(0, 8).toUpperCase(),
      status: "completed",
      timestamp: new Date().toISOString(),
    });

    return res.status(200).json({ success: true, newMyrBalance });
  } catch (err) {
    console.error("Top up error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

// ─── POST /exchange/buy ────────────────────────────────────────
router.post("/buy", authMiddleware, async (req, res) => {
  try {
    const { myrAmount, dashAmount, rate } = req.body;
    if (!myrAmount || !dashAmount || myrAmount <= 0 || dashAmount <= 0)
      return res.status(400).json({ error: "Invalid amount." });

    const user = db.findUserById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found." });

    const currentMyr = user.myrBalance ?? 0;
    if (myrAmount > currentMyr)
      return res.status(400).json({ error: "Insufficient MYR balance. Please top up first." });

    const newMyrBalance  = currentMyr - myrAmount;
    const newDashBalance = (user.balance ?? 0) + dashAmount;

    db.updateUserMyrBalance(user.id, newMyrBalance);
    db.updateUserBalance(user.id, newDashBalance);

    db.addTransaction({
      id: uuidv4(), type: "buy",
      fromAddress: "MYR_WALLET", toAddress: user.walletAddress,
      amount: dashAmount, myrAmount, rate,
      note: `Bought ${dashAmount.toFixed(6)} DASH at RM${rate}/DASH`,
      riskLevel: "low",
      txid: "BUY-" + uuidv4().slice(0, 8).toUpperCase(),
      status: "completed", timestamp: new Date().toISOString(),
    });

    return res.status(200).json({ success: true, newMyrBalance, newDashBalance, dashAmount, myrAmount });
  } catch (err) {
    console.error("Buy error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

// ─── POST /exchange/sell ───────────────────────────────────────
router.post("/sell", authMiddleware, async (req, res) => {
  try {
    const { dashAmount, myrAmount, rate } = req.body;
    if (!dashAmount || !myrAmount || dashAmount <= 0 || myrAmount <= 0)
      return res.status(400).json({ error: "Invalid amount." });

    const user = db.findUserById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found." });

    if (dashAmount > (user.balance ?? 0))
      return res.status(400).json({ error: "Insufficient DASH balance." });

    const newDashBalance = (user.balance ?? 0) - dashAmount;
    const newMyrBalance  = (user.myrBalance ?? 0) + myrAmount;

    db.updateUserBalance(user.id, newDashBalance);
    db.updateUserMyrBalance(user.id, newMyrBalance);

    db.addTransaction({
      id: uuidv4(), type: "sell",
      fromAddress: user.walletAddress, toAddress: "MYR_WALLET",
      amount: dashAmount, myrAmount, rate,
      note: `Sold ${dashAmount.toFixed(6)} DASH at RM${rate}/DASH`,
      riskLevel: "low",
      txid: "SELL-" + uuidv4().slice(0, 8).toUpperCase(),
      status: "completed", timestamp: new Date().toISOString(),
    });

    return res.status(200).json({ success: true, newDashBalance, newMyrBalance, dashAmount, myrAmount });
  } catch (err) {
    console.error("Sell error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

// ─── GET /exchange/balances ────────────────────────────────────
router.get("/balances", authMiddleware, (req, res) => {
  try {
    const user = db.findUserById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found." });
    return res.status(200).json({ dashBalance: user.balance ?? 0, myrBalance: user.myrBalance ?? 0 });
  } catch (err) {
    return res.status(500).json({ error: "Internal server error." });
  }
});

module.exports = router;