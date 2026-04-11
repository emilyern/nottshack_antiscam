const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const db = require("../models/database");
const { createWallet } = require("../services/walletService");

// ─── POST /auth/register ───────────────────────────────────────
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: "All fields are required." });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters." });
    }

    const existing = db.findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: "Email already registered." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const { mnemonic, address } = await createWallet();

    const user = db.createUser({
      id: uuidv4(),
      username,
      email,
      passwordHash,
      walletAddress: address,
      mnemonic,
    });

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || "dev_secret",
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      token,
      mnemonic,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        walletAddress: user.walletAddress,
      },
    });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

// ─── POST /auth/login ──────────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const user = db.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || "dev_secret",
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        walletAddress: user.walletAddress,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

// ─── GET /auth/me ──────────────────────────────────────────────
router.get("/me", require("../middleware/auth"), (req, res) => {
  try {
    const user = db.findUserById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found." });

    return res.status(200).json({
      id: user.id,
      username: user.username,
      email: user.email,
      walletAddress: user.walletAddress,
    });
  } catch (err) {
    return res.status(500).json({ error: "Internal server error." });
  }
});

// Look up a registered user by their wallet address.
// Returns { found: true, username } or { found: false }.
// Used by the Send page to show the receiver's username.
router.get("/lookup", require("../middleware/auth"), (req, res) => {
  const { wallet } = req.query;
  if (!wallet) return res.status(400).json({ error: "wallet query param required." });

  const user = db.findUserByWalletAddress(wallet);
  if (!user) return res.status(200).json({ found: false });

  return res.status(200).json({ found: true, username: user.username });
});

module.exports = router;