const { riskScore } = require('./riskEngine');
const { getWalletData } = require('../models/walletdataset');

async function checkRisk(walletAddress) {
  // BUG FIX: Actually look up the wallet in the dataset instead of
  // hardcoding a dummy object — previously every address returned "medium"
  // and blacklisted addresses were never caught here.
  const walletData = getWalletData(walletAddress);

  // Blacklisted addresses are always critical
  if (walletData.blacklisted) {
    return 'critical';
  }

  const result = riskScore(walletData);
  return result.level;
}

module.exports = { checkRisk };