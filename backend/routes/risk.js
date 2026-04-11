const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const { riskScore } = require("../services/riskEngine");
const { getWalletData } = require("../models/walletdataset");
const db = require("../models/database");

// ─── POST /risk/analyze ────────────────────────────────────────
router.post("/analyze", authMiddleware, async (req, res) => {
  try {
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({ error: "address is required." });
    }

    // 1. Check dataset (handles blacklisted + known wallets)
    const datasetEntry = getWalletData(address);

    if (datasetEntry.blacklisted) {
      return res.status(200).json({
        address,
        level: "critical",
        score: 10,
        recommendation: "This address is blacklisted. Transaction is blocked.",
        factors: [
          {
            code: "BLACKLISTED",
            description: datasetEntry.blacklist_reason || "Address is on the blacklist.",
            weight: 10,
          },
        ],
      });
    }

    // 2. Look up live transaction history from DB for this address
    const liveHistory = db.getTransactionsByWallet(address);
    const liveTxCount = liveHistory.length;
    const liveTotalAmount = liveHistory.reduce((sum, tx) => sum + (tx.amount || 0), 0);

    // 3. Merge: live DB data takes priority over dataset defaults
    const mergedWalletData = {
      transaction_count: liveTxCount > 0 ? liveTxCount : (datasetEntry.transaction_count || 0),
      total_amount: liveTotalAmount > 0 ? liveTotalAmount : (datasetEntry.total_amount || 0),
    };

    const result = riskScore(mergedWalletData);

    const recommendations = {
      low:    "This address appears safe. You may proceed with the transaction.",
      medium: "This address has some risk signals. Proceed with caution.",
      high:   "This address has high risk indicators. We strongly advise against sending.",
    };

    return res.status(200).json({
      address,
      level: result.level,
      score: result.score,
      recommendation: recommendations[result.level] || "Risk level unknown.",
      factors: result.factors,
    });

  } catch (err) {
    console.error("Risk analyze error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

// ─── GET /risk/report/:address ─────────────────────────────────
router.get("/report/:address", authMiddleware, (req, res) => {
  const { address } = req.params;
  const walletData = getWalletData(address);
  return res.status(200).json({
    address,
    label: walletData.label,
    blacklisted: walletData.blacklisted,
    blacklist_reason: walletData.blacklist_reason || null,
  });
});

module.exports = router;