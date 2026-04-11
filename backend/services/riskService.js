// services/riskService.js
// Used by transactions/send to do a quick risk level check before broadcasting.
const { riskScore } = require('./riskEngine');
const { getWalletData } = require('../models/walletdataset');
const db = require('../models/database');

async function checkRisk(walletAddress) {
  // 1. Check dataset for blacklisted / known wallets
  const datasetEntry = getWalletData(walletAddress);

  if (datasetEntry.blacklisted) {
    return 'critical';
  }

  // 2. Look up live transaction history from DB
  const liveHistory = db.getTransactionsByWallet(walletAddress);
  const liveTxCount = liveHistory.length;
  const liveTotalAmount = liveHistory.reduce((sum, tx) => sum + (tx.amount || 0), 0);

  // 3. Merge: live DB data takes priority over dataset defaults
  const walletData = {
    transaction_count: liveTxCount > 0 ? liveTxCount : (datasetEntry.transaction_count || 0),
    total_amount: liveTotalAmount > 0 ? liveTotalAmount : (datasetEntry.total_amount || 0),
  };

  const result = riskScore(walletData);
  return result.level;
}

module.exports = { checkRisk };