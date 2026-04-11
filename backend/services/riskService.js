const { riskScore } = require('./riskEngine');
const { getWalletData } = require('../models/walletdataset');
const db = require('../models/database');

async function checkRisk(walletAddress) {
  const datasetEntry = getWalletData(walletAddress);

  if (datasetEntry.blacklisted) {
    return 'critical';
  }

  // Check if this address has any real transactions in the DB
  const liveHistory = db.getTransactionsByWallet(walletAddress);

  // If at least 1 prior transaction exists, use that — don't treat as new wallet
  let transactions;
  if (liveHistory.length > 0) {
    transactions = liveHistory;
  } else {
    transactions = datasetEntry.transactions || [];
  }

  const result = riskScore({ transactions });
  return result.level;
}

module.exports = { checkRisk };