import { connect, Near, Account, keyStores } from 'near-api-js';
import { config } from './config';

let account: Account;

export const initNear = async () => {
    // Setup a keystore for the account
    const keyStore = new keyStores.InMemoryKeyStore();
    
    // Konfigurasi untuk koneksi NEAR
    const nearConfig = {
        keyStore,
        networkId: config.networkId,
        nodeUrl: config.nodeUrl,
        walletUrl: config.walletUrl,
        helperUrl: config.helperUrl,
        explorerUrl: config.explorerUrl,
    };

    // Connect to NEAR
    const near = await connect(nearConfig);
    
    // Get the account object
    account = await near.account(config.masterAccount);

    console.log('✅ NEAR connection initialized');

    return { account };
};

export const getNear = () => {
  if (!account) {
    throw new Error('NEAR connection not initialized. Call initNear() first.');
  }
  return { account };
};