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

// Normalize private key strings copied from env/files:
// - trim spaces
// - strip surrounding quotes
// - ensure curve prefix (default ed25519)
// - remove any whitespace from base58 body to avoid “Unknown letter: ' '” errors
const normalizeKey = (pk: string): string => {
 let s = (pk || '').trim();
 if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
   s = s.slice(1, -1);
 }
 if (!s.startsWith('ed25519:') && !s.startsWith('secp256k1:')) {
   s = `ed25519:${s}`;
 }
 const idx = s.indexOf(':');
 if (idx === -1) return s;
 const curve = s.slice(0, idx);
 // Remove all whitespace/newlines from the base58 body
 let body = s.slice(idx + 1).replace(/\s+/g, '');
 return `${curve}:${body}`;
};

export const initNear = async () => {
  // Build network with optional round-robin RPCs via env RPC_URLS (comma-separated),
  // and optional headers (FASTNEAR_API_KEY or RPC_HEADERS as JSON).
  let network: any;
  const rpcUrlsEnv = process.env.RPC_URLS;

  // Build common headers if provided
  const headers: Record<string, string> = {};
  const fastnearKey = process.env.FASTNEAR_API_KEY;
  if (fastnearKey) headers['x-api-key'] = fastnearKey;
  const rpcHeadersEnv = process.env.RPC_HEADERS; // e.g. {"x-api-key":"...","authorization":"Bearer ..."}
  if (rpcHeadersEnv) {
    try {
      const extra = JSON.parse(rpcHeadersEnv);
      if (extra && typeof extra === 'object') {
        Object.assign(headers, extra as Record<string, string>);
      }
    } catch {
      console.warn('Invalid RPC_HEADERS JSON, ignoring');
    }
  }
  const maybeWithHeaders = (url: string) =>
    Object.keys(headers).length > 0 ? { url, headers } : { url };

  if (rpcUrlsEnv) {
    const urls = rpcUrlsEnv
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (urls.length === 0) {
      throw new Error('RPC_URLS provided but no valid URLs found');
    }
    network = {
      rpcs: {
        regular: urls.map((url) => maybeWithHeaders(url)),
        archival: urls.map((url) => maybeWithHeaders(url)),
      },
    };
  } else if (config.nodeUrl) {
    network = {
      rpcs: {
        regular: [maybeWithHeaders(config.nodeUrl)],
        archival: [maybeWithHeaders(config.nodeUrl)],
      },
    };
  } else if (config.networkId === 'testnet') {
    network = testnet;
  } else if (config.networkId === 'mainnet') {
    network = mainnet;
  } else if (config.networkId === 'sandbox') {
    network = {
      rpcs: {
        // Local sandbox typically doesn't need headers
        regular: [{ url: 'http://localhost:3030' }],
        archival: [{ url: 'http://localhost:3030' }],
      },
    };
  } else {
    throw new Error(
      `Unsupported networkId: ${config.networkId}. Only testnet, mainnet, and sandbox are supported.`
    );
  }

  // Create client
  client = createClient({ network });

  // Create key service from one or more private keys
  // Env:
  //  - MASTER_ACCOUNT_PRIVATE_KEYS="ed25519:...,ed25519:...,..." (preferred for high-load)
  //  - MASTER_ACCOUNT_PRIVATE_KEY="ed25519:..." (single-key fallback)
  const keysEnv = process.env.MASTER_ACCOUNT_PRIVATE_KEYS;
  let privateKeys: string[] = [];
  if (keysEnv && keysEnv.trim().length > 0) {
    privateKeys = keysEnv
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  } else {
    const single = process.env.MASTER_ACCOUNT_PRIVATE_KEY;
    if (!single) {
      throw new Error(
        'MASTER_ACCOUNT_PRIVATE_KEY or MASTER_ACCOUNT_PRIVATE_KEYS environment variable is required'
      );
    }
    privateKeys = [single];
  }

  // Sanitize and normalize all keys from env to avoid base58 errors
  privateKeys = privateKeys.map(normalizeKey);

  // Build key sources
  const keySources = privateKeys.map((privateKey) => ({ privateKey }));

  keyService = await createMemoryKeyService({
    keySources,
  } as any);

  // Derive public keys for key pool, if available
  let signingKeys: string[] = [];
  try {
    const keyPairs = (keyService as any).getKeyPairs
      ? (keyService as any).getKeyPairs()
      : {};
    signingKeys = Object.keys(keyPairs);
  } catch {
    // ignore, fallback to library's internal selection if not available
    signingKeys = [];
  }

  // Create signer with optional key pool for load distribution
  signer = await createMemorySigner({
    signerAccountId: config.masterAccount,
    client,
    keyService,
    ...(signingKeys.length > 0 ? { keyPool: { signingKeys } } : {}),
  } as any);

  console.log(
    `✅ NEAR init: @eclipseeer/near-api-ts (keys=${privateKeys.length}, rpcUrls=${rpcUrlsEnv ? rpcUrlsEnv.split(',').length : 1}, headers=${Object.keys(headers).length})`
  );
};

export const getNear = () => {
  if (!signer) {
    throw new Error('NEAR connection not initialized. Call initNear() first.');
  }
  // Expose signer and client for read/view + tx flows
  return { signer, client };
};