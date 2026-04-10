const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const { riskScore } = require("../services/riskEngine");
const { getWalletData } = require("../models/walletdataset");

// ─── POST /risk/analyze ────────────────────────────────────────
router.post("/analyze", authMiddleware, async (req, res) => {
  try {
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({ error: "address is required." });
    }

    const walletData = getWalletData(address);

    if (walletData.blacklisted) {
      return res.status(200).json({
        address,
        level: "critical",
        score: 10,
        recommendation: "This address is blacklisted. Transaction is blocked.",
        factors: [
          {
            code: "BLACKLISTED",
            description: walletData.blacklist_reason || "Address is on the blacklist.",
            weight: 10,
          },
        ],
      });
    }

    const result = riskScore(walletData);  // factors now come from here

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
      factors: result.factors,  // use directly, don't rebuild
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