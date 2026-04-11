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
        blocked: true,
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

    // 2. Check if this address has any real transactions in the DB
    const liveHistory = db.getTransactionsByWallet(address);

    // 3. If at least 1 prior transaction exists in the DB, use that history.
    //    Otherwise fall back to the static dataset profile (demo addresses).
    let transactions;
    if (liveHistory.length > 0) {
      transactions = liveHistory;
    } else {
      transactions = datasetEntry.transactions || [];
    }

    // 4. Run the risk engine with the full transactions array so time-window
    //    checks work correctly and NEW_WALLET is not falsely triggered.
    const result = riskScore({ transactions });

    const recommendations = {
      low:      "This address appears safe. You may proceed with the transaction.",
      medium:   "This address has some risk signals. Proceed with caution.",
      high:     "This address has high risk indicators. We strongly advise against sending.",
      critical: "This address is extremely high risk. Transaction is strongly discouraged.",
    };

    return res.status(200).json({
      address,
      blocked: false,
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