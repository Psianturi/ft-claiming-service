let config = {
  networkId: 'testnet',
  nodeUrl: 'https://rpc.testnet.fastnear.com',
  walletUrl: 'https://wallet.testnet.near.org',
  masterAccount: 'posm.testnet',
  ftContract: 'posm.testnet',
  helperUrl: 'https://helper.testnet.near.org',
  explorerUrl: 'https://explorer.testnet.near.org',
};

if (process.env.NEAR_ENV === 'sandbox') {
  config = {
    ...config,
    networkId: 'sandbox',
    nodeUrl: 'http://localhost:3030',
    walletUrl: 'http://localhost:4000/wallet',
    helperUrl: 'https://helper.testnet.near.org',
    explorerUrl: 'http://localhost:9001/explorer',
    masterAccount: 'master.test.near',
    ftContract: 'ft.test.near',
  };
}

export { config };