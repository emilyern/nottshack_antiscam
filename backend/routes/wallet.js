const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const { sendDash } = require("../services/dashApiService");
const db = require("../models/database");
const { v4: uuidv4 } = require("uuid");

// ─── POST /wallet/send ─────────────────────────────────────────
router.post("/send", authMiddleware, async (req, res) => {
  try {
    const { toAddress, amount, note, bypassRisk } = req.body;

    if (!toAddress || !amount) {
      return res.status(400).json({ error: "toAddress and amount are required." });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: "Amount must be greater than 0." });
    }

    const user = db.findUserById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found." });

    let txid = null;
    try {
      txid = await sendDash(user.mnemonic, toAddress, amount);
    } catch (chainErr) {
      console.error("Chain error:", chainErr.message);
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
// Balance = starting balance - total sent + total received (from tx history)
router.get("/balance", authMiddleware, async (req, res) => {
  try {
    const user = db.findUserById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found." });

    const allTxs = db.getTransactionsByWallet(user.walletAddress);

    const totalSent = allTxs
      .filter((tx) => tx.fromAddress === user.walletAddress && tx.status !== "failed")
      .reduce((sum, tx) => sum + (tx.amount || 0), 0);

    const totalReceived = allTxs
      .filter((tx) => tx.toAddress === user.walletAddress && tx.status !== "failed")
      .reduce((sum, tx) => sum + (tx.amount || 0), 0);

    const startingBalance = user.balance ?? 1000;
    // user.balance is already deducted on send, so we just add received on top
    const effectiveBalance = startingBalance + totalReceived;

    return res.status(200).json({
      address: user.walletAddress,
      balance: Math.max(0, effectiveBalance),
      unconfirmedBalance: 0,
    });
  } catch (err) {
    console.error("Balance error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

// ─── GET /wallet/history ───────────────────────────────────────
// Returns transactions newest-first, with derived riskScore
router.get("/history", authMiddleware, (req, res) => {
  try {
    const user = db.findUserById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found." });

    const RISK_SCORES = { low: 3, medium: 5, high: 8, critical: 10 };

    const transactions = db.getTransactionsByWallet(user.walletAddress)
      .map((tx) => ({
        ...tx,
        // Derive riskScore from riskLevel if not already stored
        riskScore: tx.riskScore ?? RISK_SCORES[tx.riskLevel] ?? null,
      }))
      // Sort newest first
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return res.status(200).json({ transactions });
  } catch (err) {
    console.error("History error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

module.exports = router;