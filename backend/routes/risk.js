const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const { riskScore } = require("../services/riskEngine");
const { getWalletData } = require("../models/walletdataset");
const { getBlock, addBlock } = require("../models/blocks");

// ─── POST /risk/analyze ────────────────────────────────────────
router.post("/analyze", authMiddleware, async (req, res) => {
  try {
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({ error: "address is required." });
    }

    const walletData = getWalletData(address);

    // ── Blacklisted: force score 10, record block, hard stop ───
    if (walletData.blacklisted) {
      addBlock(address, walletData.blacklist_reason || "Address is on the blacklist.");

      return res.status(200).json({
        address,
        level:          "critical",
        score:          10,
        blocked:        true,
        recommendation: "This address is permanently blocked. No transactions can be made to this address.",
        factors: [
          {
            code:        "BLACKLISTED",
            description: walletData.blacklist_reason || "Address is on the blacklist.",
            weight:      10,
          },
        ],
      });
    }

    // ── Check if address was previously blocked ─────────────────
    const existingBlock = getBlock(address);
    if (existingBlock) {
      return res.status(200).json({
        address,
        level:          "critical",
        score:          10,
        blocked:        true,
        recommendation: `This address is permanently blocked since ${new Date(existingBlock.blockedAt).toLocaleString()}. No transactions can be made.`,
        factors: [
          {
            code:        "BLOCKED",
            description: existingBlock.reason,
            weight:      10,
          },
        ],
      });
    }

    // ── Normal risk scoring ─────────────────────────────────────
    const result = riskScore(walletData);

    const recommendations = {
      low:      "This address appears safe. You may proceed with the transaction.",
      medium:   "This address has some risk signals. Proceed with caution.",
      high:     "This address shows high-risk activity — large amounts or unusual transaction frequency detected in a short period. We strongly advise against sending.",
      critical: "This address shows patterns consistent with fraud or mixing — sudden large volume at very high frequency. Do not send.",
    };

    return res.status(200).json({
      address,
      level:          result.level,
      score:          result.score,
      blocked:        false,
      recommendation: recommendations[result.level] || "Risk level unknown.",
      factors:        result.factors,
    });

  } catch (err) {
    console.error("Risk analyze error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

// ─── GET /risk/report/:address ─────────────────────────────────
router.get("/report/:address", authMiddleware, (req, res) => {
  const { address } = req.params;
  const walletData  = getWalletData(address);
  const block       = getBlock(address);

  return res.status(200).json({
    address,
    label:            walletData.label,
    blacklisted:      walletData.blacklisted,
    blacklist_reason: walletData.blacklist_reason || null,
    blocked:          !!block,
    blockedAt:        block?.blockedAt || null,
  });
});

module.exports = router;