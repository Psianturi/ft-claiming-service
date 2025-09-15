# NEAR Fungible Token API Service

This service provides a simple Express.js API to transfer NEAR Fungible Tokens (FT). It features dynamic configuration to switch between `testnet` and `sandbox` environments and includes robust error handling.

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
-   A NEAR account with credentials stored locally in `~/.near-credentials/`.
-   An already-deployed FT smart contract.

## Installation

```bash
# Navigate to the service directory
cd token-claim-service

# Install dependencies
npm install
```

## Configuration

The service uses a dynamic configuration loader.

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

These values should correspond to the accounts created by the `near-ft-workspaces/deploy.js` script.

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

## How to Run

You can start the server in either `testnet` or `sandbox` mode.

### Running on Testnet

This is the default mode.

```bash
npm start
# or
npm run start:testnet
```

### Running in Sandbox Mode

First, ensure your local sandbox and contracts are deployed. See the "Sandbox Testing Environment" section below for instructions.

After the sandbox is running, start the server with the `NEAR_ENV` variable set to `sandbox`.

```bash
npm run start:sandbox
```

The server will start on `http://localhost:3000`.

## API Usage

Send a `POST` request to the `/send-ft` endpoint.

**Endpoint**: `POST /send-ft`

**Body**:
```json
{
  "receiverId": "recipient.test.near",
  "amount": "500000000000000000000",
  "memo": "API transfer"
}
```

-   **`amount`**: The amount of tokens to send, specified in the token's smallest unit (yocto).

**Example with `curl`**:
```bash
curl -X POST http://localhost:3000/send-ft \
  -H "Content-Type: application/json" \
  -d '{
    "receiverId": "user.test.near",
    "amount": "500",
    "memo": "Test from API"
  }'
```

A successful request will return a JSON object containing the transaction result.

## Sandbox Testing Environment

For local development and testing, this service is designed to connect to a local NEAR sandbox environment. We have prepared a separate repository containing all the necessary scripts to start a sandbox and deploy the required FT contract.

-   **Repository**: [near-ft-sandbox](https://github.com/near-examples/near-ft-sandbox)

Please follow the instructions in that repository's `README.md` to set up your local testing environment before running this service in `sandbox` mode.

## Security & Best Practices

-   **Authentication**: The current API is unauthenticated. For any real-world application, protect this endpoint with an API key, JWT, or other authentication mechanism to prevent unauthorized use.
-   **RPC Rate Limits**: The public `testnet` RPC has strict rate limits. For production or heavy testing, use a dedicated RPC provider. The sandbox environment does not have rate limits.
-   **Error Handling**: The service includes basic checks, but can be extended with more specific error handling and logging.

## License
MIT