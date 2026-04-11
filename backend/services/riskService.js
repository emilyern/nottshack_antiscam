const { riskScore } = require('./riskEngine');
const { getWalletData } = require('../models/walletdataset');

async function checkRisk(walletAddress) {
  const walletData = getWalletData(walletAddress);

  if (walletData.blacklisted) {
    return 'critical';
  }

  const result = riskScore(walletData);
  return result.level;
}

module.exports = { checkRisk };