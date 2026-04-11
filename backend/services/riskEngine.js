function riskScore(walletData) {
  let score = 0;
  const txCount = walletData.transaction_count || 0;
  const isNewWallet = txCount === 0;

  const factors = [];

  if (isNewWallet) {
    score += 1;
    factors.push({ code: "NEW_WALLET", description: "This wallet has no prior transaction history.", weight: 1 });
  } else if (txCount > 10) {
    score += 1;
    factors.push({ code: "HIGH_TX_COUNT", description: "Unusually high number of transactions.", weight: 1 });
  }

  if ((walletData.total_amount || 0) > 1000) {
    score += 2;
    factors.push({ code: "HIGH_VOLUME", description: "Large total transaction volume detected.", weight: 2 });
  }

  let level;
  if (score === 0)      level = "low";
  else if (score === 1) level = "medium";
  else if (score <= 3)  level = "high";
  else                  level = "critical";

  const scoreOutOf10 = Math.round((score / 3) * 10);
  return { score: scoreOutOf10, level, factors };
}

if (require.main === module) {
  const wallet = { new_wallet: true, transaction_count: 12, total_amount: 500 };
  console.log(riskScore(wallet));
}

module.exports = { riskScore };