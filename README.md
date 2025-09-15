[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

# NEAR Fungible Token API Service

This service provides a simple Express.js API to transfer NEAR Fungible Tokens (FT). It features dynamic configuration to switch between `testnet` and `sandbox` environments and includes robust error handling.

💡 **Note**: For the complete setup, deployment, and end-to-end testing scripts, please see the companion repository: [near-ft-helper](https://github.com/Psianturi/near-ft-helper).

## Features

-   **POST `/send-ft` Endpoint**: Transfers FT to a specified receiver.
-   **Dynamic Configuration**: Switches between `testnet` and `sandbox` using the `NEAR_ENV` environment variable.
-   **Sender Balance Check**: Verifies the `masterAccount`'s FT balance before attempting a transfer to prevent unnecessary failed transactions.
-   **Automatic Storage Registration**: Automatically calls `storage_deposit` for the receiver to ensure they are registered to receive the token.

## Project Structure

-   `src/index.ts`: The main Express.js application, defines the `/send-ft` API endpoint.
-   `src/near.ts`: Handles NEAR connection initialization and account loading.
-   `src/config.ts`: Handles dynamic configuration for both `testnet` and `sandbox`.
-   `src/config.sandbox.ts`: Provides baseline configuration for the `sandbox` environment.

## Prerequisites

-   Node.js 18+
-   A NEAR account with credentials stored locally in `~/.near-credentials/` (for testnet).
-   An already-deployed FT smart contract (for testnet).

## Installation

```bash
# Navigate to the service directory
cd token-claim-service

# Install dependencies
npm install
```

## Configuration

The service uses a dynamic configuration loader based on the `NEAR_ENV` environment variable.

### 1. Testnet Configuration (`src/config.ts`)

Update `src/config.ts` with your testnet account IDs. The `masterAccount` must have funds and be the owner of the FTs you wish to send.

```typescript
// src/config.ts
export const config = {
  networkId: 'testnet',
  nodeUrl: 'https://rpc.testnet.near.org',
  walletUrl: 'https://wallet.testnet.near.org',
  masterAccount: '<your-master-account>.testnet',
  ftContract: '<your-ft-contract>.testnet',
  // ...
};
```

### 2. Sandbox Configuration (`src/config.sandbox.ts`)

These values correspond to the accounts created by the `near-ft-workspaces/deploy.js` script and should not need to be changed.

```typescript
// src/config.sandbox.ts
export const config = {
  networkId: "sandbox",
  nodeUrl: "http://localhost:3030",
  masterAccount: "master.test.near",
  ftContract: "ft.test.near",
  // ...
};
```

## 🚀 How to Run for Sandbox Testing

Testing is performed in the `token-claim-service` folder, but it requires the `near-ft-workspaces` helper to be running simultaneously to provide a local blockchain.

### Step 1: Run the Sandbox Helper

In a **separate terminal**, navigate to the `near-ft-workspaces` directory and start the sandbox environment.

```bash
cd /mnt/d/POSMPROJECT/BLOCKCHAIN/NEAR/NEARN-FT/near-ft-workspaces
node deploy.js
```

→ Leave this terminal **open and running**. It is now serving a local NEAR blockchain.

### Step 2: Run the API Server

In a **new terminal**, navigate to this `token-claim-service` directory and start the server in sandbox mode.

```bash
cd /mnt/d/POSMPROJECT/BLOCKCHAIN/NEAR/NEARN-FT/token-claim-service
NEAR_ENV=sandbox npm start
```

→ The API server is now running on `http://localhost:3000` and is connected to your local sandbox.

### Step 3: Test with `curl`

You can now send requests to the API from any terminal.

```bash
curl -X POST http://localhost:3000/send-ft \
  -H "Content-Type: application/json" \
  -d '{
    "receiverId": "user.test.near",
    "amount": "500000",
    "memo": "Test from API"
  }'
```

A successful request will return a JSON object containing the transaction result.

## Running on Testnet (Default)

If you are not using the local sandbox, you can run the service against the public `testnet`.

```bash
# This is the default mode
npm start
# or
npm run start:testnet
```

## Security & Best Practices

-   **Authentication**: The current API is unauthenticated. For any real-world application, protect this endpoint with an API key, JWT, or other authentication mechanism.
-   **RPC Rate Limits**: The public `testnet` RPC has strict rate limits. For production or heavy testing, use a dedicated RPC provider. The sandbox environment does not have rate limits.
-   **Error Handling**: The service includes basic checks but can be extended with more specific error handling and logging.

## License
MIT