import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import { initNear, getNear } from './near';
import { config } from './config';
import { utils } from 'near-api-js';

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

    const result = await account.functionCall({
      contractId: config.ftContract,
      methodName: 'ft_transfer',
      args: {
        receiver_id: receiverId,
        amount: utils.format.parseNearAmount(amount) || '0',
        memo: memo || '',
      },
      gas: BigInt('30000000000000'), // Optional: sesuaikan jika perlu
    });

    res.send({ message: 'FT transfer initiated successfully', result });
  } catch (error) {
    console.error('FT transfer failed:', error);
    res.status(500).send({ error: 'Failed to initiate FT transfer' });
  }
});

const startServer = async () => {
  try {
    await initNear(); // Pastikan koneksi NEAR sudah siap
    app.listen(port, () => {
      console.log(`🚀 Server is running on http://localhost:${port}`);
    });
  } catch (err) {
    console.error('Failed to initialize NEAR connection:', err);
    process.exit(1);
  }
};

startServer();