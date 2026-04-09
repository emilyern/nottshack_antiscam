const { sendDash } = require('./dashApiService');

async function sendTransaction({ from, to, amount }) {
  try {
    const txId = await sendDash(from, to, amount);
    return { success: true, txHash: txId };
  } catch (err) {
    console.error('sendTransaction error:', err);
    return { success: false, error: err.message };
  }
}

module.exports = { sendTransaction };