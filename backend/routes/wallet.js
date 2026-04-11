const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const db = require("../models/database");

router.get("/balance", authMiddleware, async (req, res) => {
  try {
    const user = db.findUserById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found." });

    return res.status(200).json({
      address: user.walletAddress,
      balance: user.balance ?? 10.5,
      unconfirmedBalance: 0,
    });
  } catch (err) {
    console.error("Balance error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

router.get("/history", authMiddleware, (req, res) => {
  try {
    const user = db.findUserById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found." });

    const transactions = db.getTransactionsByWallet(user.walletAddress);
    return res.status(200).json({ transactions });
  } catch (err) {
    console.error("History error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

module.exports = router;