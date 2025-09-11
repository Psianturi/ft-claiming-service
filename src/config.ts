import { config as sandboxConfig } from './config.sandbox';

const testnetConfig = {
  networkId: "testnet",
  nodeUrl: "https://rpc.testnet.near.org",
  walletUrl: "https://wallet.testnet.near.org",
  helperUrl: "https://helper.testnet.near.org",
  explorerUrl: "https://explorer.testnet.near.org",
  masterAccount: "your-account.testnet", // Replace with your testnet account
  ftContract: "ft.examples.testnet", // Replace with your FT contract
  numberOfKeys: 10, // Number of access keys to use
};

export const config = process.env.NEAR_ENV === 'sandbox' ? sandboxConfig : testnetConfig;