// services/riskService.js
const { riskScore } = require('./riskEngine');
const { getWalletData } = require('../models/walletdataset');
const db = require('../models/database');

async function checkRisk(walletAddress) {
  // 1. Check the pre-built wallet dataset first (handles blacklisted, known wallets)
  const datasetEntry = getWalletData(walletAddress);

  // If blacklisted, return critical immediately
  if (datasetEntry.blacklisted) {
    return 'critical';
  }

  // 2. Look up real transaction history from the local database
  const realHistory = db.getTransactionsByWallet(walletAddress);
  const realTxCount = realHistory.length;
  const realTotalAmount = realHistory.reduce((sum, tx) => sum + (tx.amount || 0), 0);

  // 3. Merge: prefer real DB data over dataset defaults
  const walletData = {
    transaction_count: realTxCount > 0 ? realTxCount : (datasetEntry.transaction_count || 0),
    total_amount: realTotalAmount > 0 ? realTotalAmount : (datasetEntry.total_amount || 0),
    blacklisted: datasetEntry.blacklisted || false,
    blacklist_reason: datasetEntry.blacklist_reason || null,
  };

  const result = riskScore(walletData);
  return result.level;
}

module.exports = { checkRisk };