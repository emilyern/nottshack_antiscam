// ─── database.js ──────────────────────────────────────────────
// Persists users and transactions to JSON files so data
// survives server restarts.

const fs   = require('fs');
const path = require('path');

const USERS_PATH = path.join(__dirname, 'users.json');
const TXS_PATH   = path.join(__dirname, 'transactions.json');

// ─── Helpers ───────────────────────────────────────────────────
function loadUsers() {
  if (!fs.existsSync(USERS_PATH)) return [];
  return JSON.parse(fs.readFileSync(USERS_PATH, 'utf8'));
}

function saveUsers(users) {
  fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 2));
}

function loadTransactions() {
  if (!fs.existsSync(TXS_PATH)) return [];
  return JSON.parse(fs.readFileSync(TXS_PATH, 'utf8'));
}

function saveTransactions(txs) {
  fs.writeFileSync(TXS_PATH, JSON.stringify(txs, null, 2));
}

// ─── User Methods ──────────────────────────────────────────────
const findUserByEmail = (email) =>
  loadUsers().find((u) => u.email === email) || null;

const findUserById = (id) =>
  loadUsers().find((u) => u.id === id) || null;

const createUser = (user) => {
  const users = loadUsers();
  users.push(user);
  saveUsers(users);
  return user;
};

// ─── Transaction Methods ───────────────────────────────────────
const getTransactionsByWallet = (walletAddress) =>
  loadTransactions().filter(
    (tx) => tx.from === walletAddress || tx.to === walletAddress
  );

const addTransaction = (tx) => {
  const txs = loadTransactions();
  txs.push(tx);
  saveTransactions(txs);
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