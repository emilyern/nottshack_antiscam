const { riskScore } = require('./riskEngine');
const { getWalletData } = require('../models/walletdataset');

async function checkRisk(walletAddress) {
  const walletData = getWalletData(walletAddress);

  if (walletData.blacklisted) {
    return { level: 'critical', score: 10 };
  }

  const result = riskScore(walletData);
  return { level: result.level, score: result.score };
}

module.exports = { checkRisk };