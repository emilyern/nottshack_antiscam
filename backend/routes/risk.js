const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const { riskScore } = require("../services/riskEngine");
const { getWalletData } = require("../models/walletDataset");

// ─── POST /risk/analyze ────────────────────────────────────────
router.post("/analyze", authMiddleware, async (req, res) => {
  try {
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({ error: "address is required." });
    }

    // Pull from dataset (falls back to unknown wallet defaults if not found)
    const walletData = getWalletData(address);

    // Force critical if blacklisted
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

    const result = riskScore(walletData);
    const cleanLevel = result.level.replace(/^[^\w]+/, "").trim();

    const factors = [];
    if (walletData.new_wallet) {
      factors.push({ code: "NEW_WALLET", description: "This wallet has no prior transaction history.", weight: 1 });
    }
    if (walletData.transaction_count > 10) {
      factors.push({ code: "HIGH_TX_COUNT", description: "Unusually high number of transactions.", weight: 1 });
    }
    if (walletData.total_amount > 1000) {
      factors.push({ code: "HIGH_VOLUME", description: "Large total transaction volume detected.", weight: 2 });
    }

    const recommendations = {
      low:      "This address appears safe. You may proceed with the transaction.",
      medium:   "This address has some risk signals. Proceed with caution.",
      high:     "This address has high risk indicators. We strongly advise against sending.",
      critical: "This address is blacklisted. Transaction is blocked.",
    };

    return res.status(200).json({
      address,
      level: cleanLevel,
      score: result.score,
      recommendation: recommendations[cleanLevel] || "Risk level unknown.",
      factors,
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