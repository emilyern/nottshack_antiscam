const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const { checkRisk } = require("../services/riskService");

// ─── POST /risk/check ──────────────────────────────────────────
// Checks the risk level of a wallet address (via Team D)
// 🔒 Protected — user must be logged in
router.post("/check", authMiddleware, async (req, res) => {
  try {
    const { walletAddress } = req.body;

    // 1. Validate input
    if (!walletAddress) {
      return res.status(400).json({ error: "walletAddress is required." });
    }

    // 2. Call Team D to get risk level
    const riskLevel = await checkRisk(walletAddress);

    // 3. Return the risk level
    // riskLevel will be: "low" | "medium" | "high"
    return res.status(200).json({
      walletAddress,
      riskLevel,
    });
  } catch (err) {
    console.error("Risk check error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

module.exports = router;
