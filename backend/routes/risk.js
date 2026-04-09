const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const { riskScore } = require("../services/riskEngine");

// ─── POST /risk/analyze ────────────────────────────────────────
router.post("/analyze", authMiddleware, async (req, res) => {
  try {
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({ error: "address is required." });
    }

    const walletData = {
      new_wallet: true,
      transaction_count: 0,
      total_amount: 0,
    };

    const result = riskScore(walletData);

    // Clean level string (remove emoji prefix from riskEngine e.g. "🟢 low" -> "low")
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
  return res.status(200).json({
    address,
    level: "low",
    score: 0,
    recommendation: "No prior report found. Run an analysis first.",
    factors: [],
  });
});

module.exports = router;