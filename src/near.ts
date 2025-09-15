import { connect, Near, Account, keyStores } from 'near-api-js';
import { config } from './config-loader';
import * as os from 'os';
import * as path from 'path';

let account: Account;

export const initNear = async () => {
    console.log('Initializing NEAR with config:', config);
    const credentialsPath = path.join(os.homedir(), '.near-credentials');
    // Setup a keystore that reads from the filesystem
    const keyStore = new keyStores.UnencryptedFileSystemKeyStore(credentialsPath);
    
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