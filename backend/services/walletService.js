const Dash = require('dash');

async function createWallet() {
  // Fully offline — no network connection needed at all
  const { Mnemonic, HDPrivateKey } = Dash.Core;

  // 1. Generate a random mnemonic (12 words)
  const mnemonic = new Mnemonic();

  // 2. Derive the HD private key from the mnemonic
  const hdKey = HDPrivateKey.fromSeed(mnemonic.toSeed());

  // 3. Derive the first receiving address (m/44'/1'/0'/0/0 — testnet path)
  const derived = hdKey
    .deriveChild(44, true)
    .deriveChild(1, true)   // coin type 1 = testnet
    .deriveChild(0, true)
    .deriveChild(0)
    .deriveChild(0);

  const address = derived.privateKey.toAddress('testnet').toString();

  return {
    mnemonic: mnemonic.toString(),
    address,
  };
}

async function getBalance(mnemonic) {
  const client = new Dash.Client({
    network: 'testnet',
    wallet: {
      mnemonic,
      unsafeOptions: {
        skipSynchronizationBeforeHeight: 875000,
      },
    },
  });

  const account = await client.getWalletAccount();
  const balance = account.getConfirmedBalance();
  await client.disconnect();

  return balance / 1e8;
}

module.exports = { createWallet, getBalance };