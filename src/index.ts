// 1. Import and run polyfills FIRST - before ANY other imports
import './polyfills.js';

// 2. Now import dotenv and load environment variables
import * as dotenv from 'dotenv';
dotenv.config();

// 3. Import other modules
import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import { initNear, getNear } from './near.js';
import { config } from './config.js';
import { functionCall, teraGas, yoctoNear } from '@eclipseeer/near-api-ts';

console.log('Config:', config);

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

app.get('/', (req: Request, res: Response) => {
  res.send('NEAR Fungible Token Claiming Service is running!');
});

app.post('/send-ft', async (req: Request, res: Response) => {
  try {
    const { receiverId, amount, memo } = req.body;

    if (!receiverId || amount == null) {
      return res.status(400).send({ error: 'receiverId and amount are required' });
    }

    const amountStr = String(amount);
    if (isNaN(Number(amountStr)) || Number(amountStr) <= 0) {
      return res.status(400).send({ error: 'amount must be a positive number' });
    }

    const { signer, client } = getNear();

    // Helper untuk decode hasil view-call (raw bytes -> JSON)
    const decodeJson = ({ rawResult }: { rawResult: number[] }) => {
      try {
        const text = new TextDecoder().decode(Uint8Array.from(rawResult));
        return JSON.parse(text);
      } catch {
        return null;
      }
    };

    // 1) Cek apakah receiver sudah terdaftar di FT (NEP-145)
    const storage = await client.callContractReadFunction({
      contractAccountId: config.ftContract,
      fnName: 'storage_balance_of',
      fnArgsJson: { account_id: receiverId },
      response: { resultTransformer: decodeJson },
    });

    const registeredAmountStr =
      (storage && (storage.total ?? storage.available)) || '0';
    const isRegistered =
      storage != null && (() => { try { return BigInt(String(registeredAmountStr)) > 0n; } catch { return false; } })();

    // 2) Susun actions: storage_deposit (jika perlu) + ft_transfer
    const actions: any[] = [];

    if (!isRegistered) {
      // Ambil minimal deposit
      const bounds = await client.callContractReadFunction({
        contractAccountId: config.ftContract,
        fnName: 'storage_balance_bounds',
        response: { resultTransformer: decodeJson },
      });
      const min = (bounds && (bounds.min ?? bounds?.min?.yocto)) || '1250000000000000000000'; // fallback heuristik ~0.00125 NEAR

      actions.push(
        functionCall({
          fnName: 'storage_deposit',
          fnArgsJson: { account_id: receiverId, registration_only: true },
          gasLimit: teraGas('30'),
          attachedDeposit: { yoctoNear: String(min) },
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
        gasLimit: teraGas('30'),           // 30 Tgas
        attachedDeposit: { yoctoNear: '1' } // 1 yoctoNEAR
      })
    );

    // 3) Eksekusi transaksi gabungan
    const result = await signer.executeTransaction({
      receiverAccountId: config.ftContract,
      actions,
    });

    res.send({ message: 'FT transfer initiated successfully', result });
  } catch (error: any) {
    console.error('FT transfer failed:', error);
    res.status(500).send({ error: 'Failed to initiate FT transfer', details: error.message });
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