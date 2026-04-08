const { createWallet, getBalance } = require('./services/walletService');
const { sendDash } = require('./services/dashApiService');

createWallet().then(result => {
  console.log('✅ Wallet created!');
  console.log('Address:', result.address);
  console.log('Mnemonic:', result.mnemonic);
}).catch(console.error);