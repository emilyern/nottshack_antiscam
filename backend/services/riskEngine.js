// services/riskEngine.js

/**
 * Calculate risk score based on wallet data
 * @param {Object} walletData - Wallet info
 *   { new_wallet: boolean, transaction_count: number, total_amount: number }
 * @returns {Object} { score: number, level: string }
 */
function riskScore(walletData) {
    let score = 0;

    // Example scoring logic
    if (walletData.new_wallet) score += 1;
    if ((walletData.transaction_count || 0) > 10) score += 1;
    if ((walletData.total_amount || 0) > 1000) score += 2;

    // Determine risk level
    let level;
    if (score <= 1) level = "🟢 low";
    else if (score <= 3) level = "🟡 medium";
    else level = "🔴 high";

    return { score, level };
}

// Example usage
if (require.main === module) {
    const wallet = { new_wallet: true, transaction_count: 12, total_amount: 500 };
    console.log(riskScore(wallet));
}

module.exports = { riskScore };