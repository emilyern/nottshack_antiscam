const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const authMiddleware = require("../middleware/auth");
const db = require("../models/database");
const { checkRisk } = require("../services/riskService");
const { sendTransaction } = require("../services/blockchainService");

router.post("/send", authMiddleware, async (req, res) => {
  try {
    const { toAddress, amount, note, bypassRisk } = req.body;

    if (!toAddress || !amount || amount <= 0) {
      return res.status(400).json({ error: "toAddress and a valid amount are required." });
    }

    const user = db.findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Check balance BEFORE broadcasting
    const currentBalance = user.balance ?? 10.5;
    if (amount > currentBalance) {
      return res.status(400).json({ error: "Insufficient balance." });
    }

    // Risk check using real address lookup
    const riskLevel = await checkRisk(toAddress);

    if ((riskLevel === "high" || riskLevel === "critical") && !bypassRisk) {
      return res.status(403).json({
        error: `Transaction blocked: ${riskLevel} risk address.`,
        canBypass: true,
      });
    }

    const result = await sendTransaction({
      from: user.mnemonic,
      to: toAddress,
      amount,
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    // Deduct balance after confirmed broadcast
    const newBalance = currentBalance - amount;
    db.updateUserBalance(user.id, newBalance);

    db.addTransaction({
      id: uuidv4(),
      fromAddress: user.walletAddress,
      toAddress,
      amount,
      note: note || "",
      riskLevel,
      txid: result.txHash,
      status: "broadcast",
      timestamp: new Date().toISOString(),
    });

    return res.status(200).json({
      txid: result.txHash,
      explorerUrl: `https://testnet-insight.dashevo.org/insight/tx/${result.txHash}`,
    });

  } catch (err) {
    console.error("Send error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

router.get("/", authMiddleware, (req, res) => {
  try {
    const { wallet } = req.query;

    if (!wallet) {
      return res.status(400).json({ error: "wallet query param is required." });
    }

    const history = db.getTransactionsByWallet(wallet);
    return res.status(200).json({ wallet, transactions: history });

  } catch (err) {
    console.error("Transactions error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

module.exports = router;