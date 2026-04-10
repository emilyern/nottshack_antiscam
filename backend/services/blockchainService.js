const { v4: uuidv4 } = require('uuid');

async function sendTransaction({ from, to, amount }) {
  // Simulate a short delay like a real broadcast
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Return a fake but realistic-looking tx hash
  return {
    success: true,
    txHash: uuidv4().replace(/-/g, ''),
  };
}

module.exports = { sendTransaction };