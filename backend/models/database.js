const fs   = require('fs');
const path = require('path');

const USERS_PATH = path.join(__dirname, 'users.json');
const TXS_PATH   = path.join(__dirname, 'transactions.json');

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

const findUserByEmail = (email) => loadUsers().find((u) => u.email === email) || null;
const findUserById    = (id)    => loadUsers().find((u) => u.id === id)    || null;

const createUser = (user) => {
  const users = loadUsers();
  users.push({ ...user, balance: 10.5, myrBalance: 0 }); // start with 0 DASH, 0 MYR
  saveUsers(users);
  return user;
};

const updateUserBalance = (id, newBalance) => {
  const users = loadUsers();
  const idx = users.findIndex(u => u.id === id);
  if (idx !== -1) { users[idx].balance = newBalance; saveUsers(users); }
};

const updateUserMyrBalance = (id, newMyrBalance) => {
  const users = loadUsers();
  const idx = users.findIndex(u => u.id === id);
  if (idx !== -1) { users[idx].myrBalance = newMyrBalance; saveUsers(users); }
};

// ─── NEW: update editable profile fields ──────────────────────
// Only whitelisted fields can be changed (username, email).
// Returns the updated user object, or null if not found.
const updateUser = (id, updates) => {
  const users = loadUsers();
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) return null;

  const allowed = ['username', 'email'];
  for (const key of allowed) {
    if (updates[key] !== undefined && updates[key] !== null) {
      users[idx][key] = updates[key];
    }
  }
  saveUsers(users);
  return users[idx];
};

const getTransactionsByWallet = (walletAddress) =>
  loadTransactions().filter(
    (tx) => tx.fromAddress === walletAddress || tx.toAddress === walletAddress
  );

const addTransaction = (tx) => {
  const txs = loadTransactions();
  txs.push(tx);
  saveTransactions(txs);
  return tx;
};

module.exports = {
  findUserByEmail,
  findUserById,
  createUser,
  getTransactionsByWallet,
  addTransaction,
  updateUserBalance,
  updateUserMyrBalance,
  updateUser, // ← NEW export
};