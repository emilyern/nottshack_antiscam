const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const authMiddleware = require("../middleware/auth");
const db = require("../models/database");
const { checkRisk } = require("../services/riskService");
const { sendTransaction } = require("../services/blockchainService");
const { getBlock, addBlock } = require("../models/blocks");

// ─── POST /transactions/send ───────────────────────────────────
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

    // ── Hard block check — no bypass possible ──────────────────
    const existingBlock = getBlock(toAddress);
    if (existingBlock) {
      return res.status(403).json({
        error: `This address is permanently blocked and cannot receive transactions.`,
        blocked: true,
        blockedAt: existingBlock.blockedAt,
        reason: existingBlock.reason,
      });
    }

    // ── Risk check ─────────────────────────────────────────────
    const risk = await checkRisk(toAddress);
    const cleanLevel = risk.level.replace(/^[^\w]+/, "").trim();

    // If blacklisted, record the block and hard reject
    if (cleanLevel === "critical" && risk.score === 10) {
      addBlock(toAddress, "Blacklisted address — transaction attempt blocked.");
      return res.status(403).json({
        error: "This address is blacklisted and has been permanently blocked.",
        blocked: true,
      });
    }

    // High/critical (non-blacklist) require explicit bypass
    if ((cleanLevel === "high" || cleanLevel === "critical") && !bypassRisk) {
      return res.status(403).json({
        error: `Transaction blocked: ${cleanLevel} risk address.`,
        canBypass: true,
      });
    }

    // ── Broadcast ──────────────────────────────────────────────
    const result = await sendTransaction({ from: user.mnemonic, to: toAddress, amount });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    const newBalance = (user.balance ?? 10.5) - amount;
    if (newBalance < 0) {
      return res.status(400).json({ error: "Insufficient balance." });
    }
    db.updateUserBalance(user.id, newBalance);

    db.addTransaction({
      id:          uuidv4(),
      fromAddress: user.walletAddress,
      toAddress,
      amount,
      note:        note || "",
      riskLevel:   cleanLevel,
      riskScore:   risk.score,
      txid:        result.txHash,
      status:      "broadcast",
      timestamp:   new Date().toISOString(),
    });

    return res.status(200).json({
      txid:        result.txHash,
      explorerUrl: `https://testnet-insight.dashevo.org/insight/tx/${result.txHash}`,
    });

  } catch (err) {
    console.error("Send error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

// ─── GET /transactions ─────────────────────────────────────────
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