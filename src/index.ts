import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import { initNear, getNear } from './near';
import { config } from './config';

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

    if (!receiverId || !amount) {
      return res.status(400).send({ error: 'receiverId and amount are required' });
    }

    const { account } = getNear();

        // Interpret amount as the token's smallest unit (per FT standard).
        const amountStr = amount.toString();
    
       
        const senderBalance: string = await account.viewFunction({
          contractId: config.ftContract,
          methodName: 'ft_balance_of',
          args: { account_id: config.masterAccount },
        });
        if (BigInt(senderBalance) < BigInt(amountStr)) {
          return res.status(400).send({
            error: 'Insufficient FT balance',
            accountId: config.masterAccount,
            have: senderBalance,
            need: amountStr,
          });
        }
    
        console.log('Using contract:', config.ftContract);

    // Ensure receiver is registered for storage. Safe to call repeatedly (refunds if already registered).
    try {
      await account.functionCall({
        contractId: config.ftContract,
        methodName: 'storage_deposit',
        args: {
          account_id: receiverId,
          registration_only: true,
        },
        attachedDeposit: BigInt('1250000000000000000000'),
        gas: BigInt('30000000000000'),
      });
    } catch (e: any) {
      console.warn('storage_deposit failed or not needed:', e?.message || e);
    }

    const result = await account.functionCall({
      contractId: config.ftContract,
      methodName: 'ft_transfer',
      args: {
        receiver_id: receiverId,
        amount: amountStr,
        memo: memo || '',
      },
      attachedDeposit: BigInt('1'),
      gas: BigInt('30000000000000'),
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