const jwt = require("jsonwebtoken");

// ─── Auth Middleware ───────────────────────────────────────────
// Attach this to any route that requires a logged-in user.
// Usage: router.post("/send", authMiddleware, (req, res) => { ... })

const authMiddleware = (req, res, next) => {
  // 1. Get the token from the request header
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Format: "Bearer <token>"

  if (!token) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  // 2. Verify the token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // attach user info to the request
    next();             // move on to the actual route handler
  } catch (err) {
    return res.status(403).json({ error: "Invalid or expired token." });
  }
};

module.exports = authMiddleware;
