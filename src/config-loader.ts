// Dynamically loads configuration based on NEAR_ENV environment variable.
// Defaults to testnet config if NEAR_ENV is not set.

import { config as testnetConfig } from './config';
import { config as sandboxConfig } from './config.sandbox';

// Define a common interface for the config objects
interface AppConfig {
    networkId: string;
    nodeUrl: string;
    masterAccount: string;
    ftContract: string;
    helperUrl?: string; // Optional as it's not in sandbox
    explorerUrl?: string; // Optional
    walletUrl?: string; // Optional
    numberOfKeys?: number; // Optional, only in sandbox
}

const env = process.env.NEAR_ENV || 'testnet';

let config: AppConfig;

if (env === 'sandbox') {
    config = sandboxConfig;
    console.log('Using sandbox configuration');
} else {
    config = testnetConfig;
    console.log('Using testnet configuration');
}

export { config, AppConfig };