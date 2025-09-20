// 1. Import and run polyfills FIRST - before ANY other imports
import './polyfills.js';

// 2. Now import dotenv and load environment variables
import * as dotenv from 'dotenv';
dotenv.config();

// Prevent server crash on unexpected library exceptions/rejections
process.on('uncaughtException', (err: any) => {
  console.error('UncaughtException:', err?.message || err);
});
process.on('unhandledRejection', (reason: any) => {
  console.error('UnhandledRejection:', reason);
});

// 3. Import other modules
import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import { initNear, getNear } from './near.js';
import { config } from './config.js';
import { functionCall, teraGas, yoctoNear } from '@eclipseeer/near-api-ts';

console.log('Config:', config);

const app = express();
const port = process.env.PORT || 3000;

// Simple bounded concurrency limiter
const CONCURRENCY_LIMIT = parseInt(process.env.CONCURRENCY_LIMIT || '100', 10);
let active = 0;
const waitQueue: Array<() => void> = [];
const acquire = async () => {
  if (active < CONCURRENCY_LIMIT) {
    active += 1;
    return;
  }
  await new Promise<void>((resolve) => waitQueue.push(resolve));
  active += 1;
};
const release = () => {
  active = Math.max(0, active - 1);
  const next = waitQueue.shift();
  if (next) next();
};

// Retry helper with exponential backoff for view RPC calls
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const withRetry = async <T>(fn: () => Promise<T>, attempts = 3) => {
  let delay = 200;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e: any) {
      const code = e?.cause?.code ?? e?.code;
      const retriable =
        code === -429 || code === 'ETIMEDOUT' || code === 'ECONNRESET';
      if (!retriable || i === attempts - 1) throw e;
      await sleep(delay);
      delay *= 2;
    }
  }
  throw new Error('unreachable');
};

app.use(bodyParser.json());

app.get('/', (req: Request, res: Response) => {
  res.send('NEAR Fungible Token Claiming Service is running!');
});

app.post('/send-ft', async (req: Request, res: Response) => {
  await acquire();
  try {
    const { receiverId, amount, memo } = req.body;

    if (!receiverId || amount == null) {
      return res
        .status(400)
        .send({ error: 'receiverId and amount are required' });
    }

    const amountStr = String(amount);
    if (isNaN(Number(amountStr)) || Number(amountStr) <= 0) {
      return res
        .status(400)
        .send({ error: 'amount must be a positive number' });
    }

    const nearInterface = getNear();

    // Handle hybrid approach: different interfaces for different libraries
    let signer: any;
    let client: any;
    let account: any;

    if (nearInterface.signer) {
      // Using @eclipseeer/near-api-ts (testnet/mainnet)
      signer = nearInterface.signer;
      client = nearInterface.client;
    } else if (nearInterface.account) {
      // Using near-api-js (sandbox)
      account = nearInterface.account;
      client = nearInterface.near; // For view calls
    } else {
      throw new Error('Invalid NEAR interface returned from getNear()');
    }

    // Helper untuk decode hasil view-call (raw bytes -> JSON)
    const decodeJson = ({ rawResult }: { rawResult: number[] }) => {
      try {
        const text = new TextDecoder().decode(Uint8Array.from(rawResult));
        return JSON.parse(text);
      } catch {
        return null;
      }
    };

    // 1) Cek apakah receiver sudah terdaftar di FT (NEP-145), with retries
    const storage = await withRetry(() =>
      client.callContractReadFunction({
        contractAccountId: config.ftContract,
        fnName: 'storage_balance_of',
        fnArgsJson: { account_id: receiverId },
        response: { resultTransformer: decodeJson },
      })
    );

    const storageJson: any = storage ?? {};
    const registeredAmountStr = String(
      storageJson.total ?? storageJson.available ?? '0'
    );
    const isRegistered =
      storageJson != null &&
      (() => {
        try {
          return BigInt(registeredAmountStr) > 0n;
        } catch {
          return false;
        }
      })();

    // 2) Susun actions: storage_deposit (jika perlu) + ft_transfer
    const actions: any[] = [];

    // Env flag to skip view-calls and always send storage_deposit (reduces read RPC pressure)
    const skipStorageCheck =
      (process.env.SKIP_STORAGE_CHECK || '').toLowerCase() === 'true';

    if (skipStorageCheck) {
      const min = String(
        process.env.STORAGE_MIN_DEPOSIT || '1250000000000000000000'
      ); // ~0.00125 NEAR
      actions.push(
        functionCall({
          fnName: 'storage_deposit',
          fnArgsJson: { account_id: receiverId, registration_only: true },
          gasLimit: teraGas('30'),
          attachedDeposit: { yoctoNear: min },
        })
      );
    } else if (!isRegistered) {
      // Ambil minimal deposit (with retries)
      const bounds = await withRetry(() =>
        client.callContractReadFunction({
          contractAccountId: config.ftContract,
          fnName: 'storage_balance_bounds',
          response: { resultTransformer: decodeJson },
        })
      );
      const b: any = bounds ?? {};
      const min = String(
        b.min ?? b?.min?.yocto ?? '1250000000000000000000'
      ); // fallback heuristik ~0.00125 NEAR
      actions.push(
        functionCall({
          fnName: 'storage_deposit',
          fnArgsJson: { account_id: receiverId, registration_only: true },
          gasLimit: teraGas('30'),
          attachedDeposit: { yoctoNear: min },
        })
      );
    }

    actions.push(
      functionCall({
        fnName: 'ft_transfer',
        fnArgsJson: {
          receiver_id: receiverId,
          amount: amountStr, // amount dalam string, sesuai standar FT
          memo: memo || '',
        },
        gasLimit: teraGas('30'), // 30 Tgas
        attachedDeposit: { yoctoNear: '1' }, // 1 yoctoNEAR
      })
    );

    // 3) Execute transaction based on which library is being used
    let result: any;

    if (account) {
      // Using near-api-js (sandbox) - use account.functionCall
      const actionsForNearApiJs = actions.map((action: any) => ({
        contractId: config.ftContract,
        methodName: action.params.fnName,
        args: action.params.fnArgsJson,
        gas: action.params.gasLimit?.gas || 30000000000000n,
        deposit: action.params.attachedDeposit?.yoctoNear ? BigInt(action.params.attachedDeposit.yoctoNear) : 1n,
      }));

      // Execute all actions in sequence
      for (const action of actionsForNearApiJs) {
        result = await account.functionCall(action);
      }
    } else {
      // Using @eclipseeer/near-api-ts (testnet/mainnet) - use signer
      const tx = await signer.signTransaction({
        receiverAccountId: config.ftContract,
        actions,
      });
      const WAIT_UNTIL =
        (process.env.WAIT_UNTIL as
          | 'None'
          | 'Included'
          | 'ExecutedOptimistic'
          | 'IncludedFinal'
          | 'Executed'
          | 'Final') || 'Included';

      result = await client.sendSignedTransaction({
        signedTransaction: tx,
        waitUntil: WAIT_UNTIL,
      });
    }

    res.send({ message: 'FT transfer initiated successfully', result });
  } catch (error: any) {
    console.error('FT transfer failed:', error);
    res
      .status(500)
      .send({ error: 'Failed to initiate FT transfer', details: error.message });
  } finally {
    release();
  }
});

const startServer = async () => {
  try {
    await initNear();
    app.listen(port, () => {
      console.log(`🚀 Server is running on http://localhost:${port}`);
    });
  } catch (err) {
    console.error('Failed to initialize NEAR connection:', err);
    process.exit(1);
  }
};

startServer();