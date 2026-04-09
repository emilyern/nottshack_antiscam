const { riskScore } = require('./riskEngine');

async function checkRisk(walletAddress) {
  // For now use basic scoring — swap with real API later
  const walletData = {
    new_wallet: true,
    transaction_count: 0,
    total_amount: 0,
  };

  const result = riskScore(walletData);
  return result.level;
}

module.exports = { checkRisk };