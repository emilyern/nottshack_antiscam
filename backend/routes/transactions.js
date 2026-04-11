const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const authMiddleware = require("../middleware/auth");
const db = require("../models/database");
const { checkRisk } = require("../services/riskService");
const { sendTransaction } = require("../services/blockchainService");
const { riskScore: calcRiskScore } = require("../services/riskEngine");
const { getWalletData } = require("../models/walletdataset");

// ─── POST /transactions/send ───────────────────────────────────
// Sends DASH from logged-in user's wallet to a recipient address.
// Runs a risk check first; blocks high/critical unless bypassRisk=true.
// 🔒 Protected — user must be logged in
router.post("/send", authMiddleware, async (req, res) => {
  try {
    const { toAddress, amount, note, bypassRisk } = req.body;

    // 1. Validate input
    if (!toAddress || !amount || amount <= 0) {
      return res.status(400).json({ error: "toAddress and a valid amount are required." });
    }

    // 2. Look up the logged-in user (we need their mnemonic to sign the tx)
    const user = db.findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // 3. Risk check
    const riskLevel = await checkRisk(toAddress);
    const cleanLevel = riskLevel.replace(/^[^\w]+/, "").trim(); // strip emoji prefix

    if ((cleanLevel === "high" || cleanLevel === "critical") && !bypassRisk) {
      return res.status(403).json({
        error: `Transaction blocked: ${cleanLevel} risk address.`,
        canBypass: true,
      });
    }

    // 4. Broadcast transaction (uses mnemonic to sign)
    const result = await sendTransaction({
      from: user.mnemonic,
      to: toAddress,
      amount,
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    const newBalance = (user.balance ?? 1000) - amount;
    if (newBalance < 0) {
      return res.status(400).json({ error: "Insufficient balance." });
    }
    db.updateUserBalance(user.id, newBalance);

    // 5. Compute the numeric risk score to save alongside the level
    const walletData = getWalletData(toAddress);
    const riskResult = calcRiskScore(walletData);
    const numericScore = cleanLevel === "critical" ? 10 : riskResult.score;

    // 6. Save to local database
    db.addTransaction({
      id: uuidv4(),
      fromAddress: user.walletAddress,
      fromUsername: user.username,       // ← show sender username in history
      toAddress,
      amount,
      note: note || "",
      riskLevel: cleanLevel,
      riskScore: numericScore,           // ← persist the numeric score
      txid: result.txHash,
      status: "broadcast",
      timestamp: new Date().toISOString(),
    });

    // 7. Return success
    return res.status(200).json({
      txid: result.txHash,
      explorerUrl: `https://testnet-insight.dashevo.org/insight/tx/${result.txHash}`,
    });

  } catch (err) {
    console.error("Send error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

// ─── GET /transactions ─────────────────────────────────────────
// Returns transaction history for a given wallet address.
// 🔒 Protected — user must be logged in
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