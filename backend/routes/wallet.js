const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const { sendDash } = require("../services/dashApiService");
const db = require("../models/database");
const { v4: uuidv4 } = require("uuid");

// ─── POST /wallet/send ─────────────────────────────────────────
router.post("/send", authMiddleware, async (req, res) => {
  try {
    const { toAddress, amount, note } = req.body;

    if (!toAddress || !amount) {
      return res.status(400).json({ error: "toAddress and amount are required." });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: "Amount must be greater than 0." });
    }

    const user = db.findUserById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found." });

    // BUG FIX: Check balance BEFORE attempting to broadcast
    const currentBalance = user.balance ?? 10.5;
    if (currentBalance < amount) {
      return res.status(400).json({ error: "Insufficient balance." });
    }

    let txid = null;
    try {
      txid = await sendDash(user.mnemonic, toAddress, amount);
    } catch (chainErr) {
      console.error("Chain error:", chainErr.message);
      // BUG FIX: Use fromAddress/toAddress to match DB schema and frontend
      db.addTransaction({
        id: uuidv4(),
        fromAddress: user.walletAddress,
        toAddress,
        amount,
        note: note || "",
        status: "failed",
        timestamp: new Date().toISOString(),
      });
      return res.status(400).json({ error: "Blockchain transaction failed: " + chainErr.message });
    }

    // BUG FIX: Deduct balance after successful send
    db.updateUserBalance(user.id, currentBalance - amount);

    // BUG FIX: Use fromAddress/toAddress to match DB schema and frontend
    db.addTransaction({
      id: uuidv4(),
      fromAddress: user.walletAddress,
      toAddress,
      amount,
      note: note || "",
      status: "broadcast",
      txid,
      timestamp: new Date().toISOString(),
    });

    return res.status(200).json({ status: "success", txid });

  } catch (err) {
    console.error("Send transaction error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

// ─── GET /wallet/balance ───────────────────────────────────────
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

// ─── GET /wallet/history ───────────────────────────────────────
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