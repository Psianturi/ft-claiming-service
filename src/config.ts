let config = {
  networkId: 'testnet',
  nodeUrl: 'https://test.rpc.fastnear.com',
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
    masterAccount: 'master.test.near', 
    ftContract: 'ft.test.near',     
  };
}

export { config };