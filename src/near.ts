import {
  createClient,
  createMemoryKeyService,
  createMemorySigner,
  testnet,
  mainnet,
} from '@eclipseeer/near-api-ts';
import { config } from './config.js';


let client: any;
let keyService: any;
let signer: any;

export const initNear = async () => {
  // Build network from config.nodeUrl when provided (FastNEAR/sandbox), else fallback to presets
  let network: any;
  if (config.nodeUrl) {
    network = {
      rpcs: {
        regular: [{ url: config.nodeUrl }],
        archival: [{ url: config.nodeUrl }],
      },
    };
  } else if (config.networkId === 'testnet') {
    network = testnet;
  } else if (config.networkId === 'mainnet') {
    network = mainnet;
  } else if (config.networkId === 'sandbox') {
    network = {
      rpcs: {
        regular: [{ url: 'http://localhost:3030' }],
        archival: [{ url: 'http://localhost:3030' }],
      },
    };
  } else {
    throw new Error(`Unsupported networkId: ${config.networkId}. Only testnet, mainnet, and sandbox are supported.`);
  }

  // Create client
  client = createClient({ network });

  // Create key service from private key
  // ⚠️ NOTE: In production, keep private key secure
  let privateKey = process.env.MASTER_ACCOUNT_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('MASTER_ACCOUNT_PRIVATE_KEY environment variable is required');
  }
  // Ensure curve prefix for compatibility with library types
  if (!privateKey.startsWith('ed25519:') && !privateKey.startsWith('secp256k1:')) {
    privateKey = `ed25519:${privateKey}`;
  }

  keyService = await createMemoryKeyService({
    keySource: { privateKey } as any,
  } as any);

  // Create signer
  signer = await createMemorySigner({
    signerAccountId: config.masterAccount,
    client,
    keyService,
  } as any);

  console.log('✅ NEAR connection initialized with @eclipseeer/near-api-ts');
};

export const getNear = () => {
  if (!signer) {
    throw new Error('NEAR connection not initialized. Call initNear() first.');
  }
  // Expose signer and client for read/view + tx flows
  return { signer, client };
};