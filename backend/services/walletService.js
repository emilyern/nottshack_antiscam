async function createWallet() {
  return {
    mnemonic: 'word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12',
    address: 'testnet_address_' + Math.random().toString(36).slice(2, 10)
  };
}

async function getBalance(mnemonic) {
  return 0;
}

module.exports = { createWallet, getBalance };