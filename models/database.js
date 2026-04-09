// ─── database.js ──────────────────────────────────────────────
// This is where you connect to your database and define your data.
// For now, we use in-memory arrays as a fake database.
// Swap these out for real DB calls (MongoDB, PostgreSQL, etc.) later.

// ─── Fake In-Memory Database ───────────────────────────────────
const users = [
  // Example:
  // { id: "1", email: "alice@example.com", passwordHash: "...", walletAddress: "0xABC..." }
];

const transactions = [
  // Example:
  // { id: "tx1", from: "0xABC...", to: "0xDEF...", amount: 50, status: "success", timestamp: "2024-01-01T00:00:00Z" }
];

// ─── User Methods ──────────────────────────────────────────────
const findUserByEmail = (email) => {
  return users.find((u) => u.email === email) || null;
};

const findUserById = (id) => {
  return users.find((u) => u.id === id) || null;
};

const createUser = (user) => {
  users.push(user);
  return user;
};

// ─── Transaction Methods ───────────────────────────────────────
const getTransactionsByWallet = (walletAddress) => {
  return transactions.filter(
    (tx) => tx.from === walletAddress || tx.to === walletAddress
  );
};

const addTransaction = (tx) => {
  transactions.push(tx);
  return tx;
};

// ─── Export ───────────────────────────────────────────────────
module.exports = {
  findUserByEmail,
  findUserById,
  createUser,
  getTransactionsByWallet,
  addTransaction,
};
