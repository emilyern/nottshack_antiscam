const { riskScore } = require('./riskEngine');
const { getWalletData } = require('../models/walletdataset');

async function checkRisk(walletAddress) {
  const walletData = getWalletData(walletAddress);

  // Blacklisted addresses are always critical
  if (walletData.blacklisted) {
    return 'critical';
  }

  const result = riskScore(walletData);
  return result.level || 'low'; // fallback to 'low' if undefined
}

module.exports = { checkRisk };