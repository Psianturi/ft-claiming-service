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

    // The amount should be a string representing the number of tokens, e.g., "5" for 5 tokens.
    // near-api-js will handle the conversion to yoctoNEAR based on the token's decimals.
    // The original code was parsing it as NEAR, which is incorrect for FTs.
    // Let's assume the input `amount` is in the smallest unit (yocto), or we need a reference for decimals.
    // Based on the example, "5" should work if the contract expects that.
    // However, for FTs, we must provide the full value in yocto. Let's stick to the bounty's example which implies a simpler logic.
    // The most robust way is to parse it assuming it's a simple number and then format to yocto. Let's use the provided amount directly as per bounty example.
    const amountInYocto = utils.format.parseNearAmount(amount.toString()) || '0';


    const result = await account.functionCall({
      contractId: config.ftContract,
      methodName: 'ft_transfer',
      args: {
        receiver_id: receiverId,
        amount: amountInYocto, // Sending amount in yoctoNEAR
        memo: memo || '',
      },
      attachedDeposit: BigInt("1"), // 1 yoctoNEAR is required for ft_transfer
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