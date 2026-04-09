const Dash = require('dash');

async function sendDash(fromMnemonic, toAddress, amountInDash) {
  const client = new Dash.Client({
    network: 'testnet',
    wallet: {
      mnemonic: fromMnemonic,
      unsafeOptions: {
        skipSynchronizationBeforeHeight: 875000,
      },
    },
  });

  const account = await client.getWalletAccount();

  const transaction = account.createTransaction({
    recipient: toAddress,
    satoshis: Math.round(amountInDash * 1e8),
  });

  const txId = await account.broadcastTransaction(transaction);
  await client.disconnect();

  return txId;
}

module.exports = { sendDash };