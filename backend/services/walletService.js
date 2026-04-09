const Dash = require('dash');

async function createWallet() {
  const client = new Dash.Client({
    network: 'testnet',
    wallet: {
      mnemonic: null,
      offlineMode: true,
    },
  });

  const account = await client.getWalletAccount();
  const mnemonic = client.wallet.exportWallet();
  const address = account.getUnusedAddress().address;
  await client.disconnect();

  return { mnemonic, address };
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