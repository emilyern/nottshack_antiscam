const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const { sendTransaction } = require("../services/blockchainService");
const db = require("../models/database");
const { v4: uuidv4 } = require("uuid");

// ─── POST /wallet/send ─────────────────────────────────────────
// Sends a transaction from one wallet to another (via Team C)
// 🔒 Protected — user must be logged in
router.post("/send", authMiddleware, async (req, res) => {
  try {
    const { from, to, amount } = req.body;

    // 1. Validate input
    if (!from || !to || !amount) {
      return res.status(400).json({ error: "from, to, and amount are required." });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: "Amount must be greater than 0." });
    }

    // 2. Call Team C to execute the transaction
    const result = await sendTransaction({ from, to, amount });

    // 3. Save transaction to local database
    db.addTransaction({
      id: uuidv4(),
      from,
      to,
      amount,
      status: result.success ? "success" : "fail",
      timestamp: new Date().toISOString(),
    });

    // 4. Return result
    if (result.success) {
      return res.status(200).json({ status: "success", txHash: result.txHash });
    } else {
      return res.status(400).json({ status: "fail", error: result.error });
    }
  } catch (err) {
    console.error("Send transaction error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

module.exports = router;
