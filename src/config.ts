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
    nodeUrl: 'http://localhost:3030', // ✅ Sandbox RPC
    masterAccount: 'master.test.near', // ✅ Ganti dengan nilai dari output script
    ftContract: 'ft.test.near',       // ✅ Ganti dengan nilai dari output script
  };
}

export { config };