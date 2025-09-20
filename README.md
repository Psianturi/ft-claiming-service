# NEAR Fungible Token API Service

This service provides a simple Express.js API to transfer NEAR Fungible Tokens (FT). It features dynamic configuration to switch between `testnet` and `sandbox` environments and includes robust error handling.

💡 **Note**: For the complete setup, deployment, and end-to-end testing scripts, please see the companion repository: [near-ft-helper](https://github.com/Psianturi/near-ft-helper).

## Features

-   **POST `/send-ft` Endpoint**: Transfers NEP-141 tokens to a specified receiver.
-   **Automatic Storage Registration (NEP-145)**: Checks `storage_balance_of` and prepends `storage_deposit` when needed so the receiver can accept tokens.
-   **Dynamic Configuration**: Switches between `testnet` and `sandbox` using the `NEAR_ENV` environment variable.
-   **High-throughput Signing**: Uses `@eclipseeer/near-api-ts` MemorySigner with automatic nonce management.
-   **ESM + Node 23+**: Works on modern Node with native `crypto`; a small polyfill guard is included.

## Project Structure

-   `src/index.ts`: The main Express.js application, defines the `/send-ft` API endpoint.
-   `src/near.ts`: Handles NEAR connection initialization and account loading.
-   `src/config.ts`: Handles dynamic configuration for both `testnet` and `sandbox`.
-   `src/config.sandbox.ts`: Provides baseline configuration for the `sandbox` environment.

## Library & Compatibility

-   This service uses the community package `@eclipseeer/near-api-ts` (v0.1.x), which is under active development.
-   Automatic nonce handling is implemented and works under normal conditions; RPC error handling is still limited upstream.
-   The codebase is ESM-first. Relative imports use explicit `.js` extensions. Node 23/24 is recommended.
-   References:
    -   npm: https://www.npmjs.com/package/@eclipseeer/near-api-ts
    -   DevHub thread: https://nearn.io/devhub/36/
 
## Prerequisites

-   Node.js 23+ (24 recommended). A guard polyfill for `crypto` is included but not required on Node ≥ 23.
-   Environment variable `MASTER_ACCOUNT_PRIVATE_KEY` set for `config.masterAccount` (format `ed25519:BASE58...`).
-   A deployed NEP-141 FT contract; set `config.ftContract` to that contract account.
-   For sandbox testing, run a local node (e.g., the companion `near-ft-helper`).

## Installation

```bash
# Navigate to the service directory
cd ft-claiming-service

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
  nodeUrl: 'https://test.rpc.fastnear.com',
  walletUrl: 'https://wallet.testnet.near.org',
  masterAccount: '<your-master-account>.testnet',
  ftContract: '<your-ft-contract>.testnet',
  // ...
};
```

### 2. Sandbox Configuration (`src/config.sandbox.ts`)

These values correspond to the accounts created by the `near-ft-helper/deploy.js` script and should not need to be changed.

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

Testing is performed in the `ft-claiming-service` folder, but it requires a local NEAR blockchain to be running. The easiest way to set this up is by using the `near-ft-helper` script, which automates the entire process.

### Step 1: Start the Local Blockchain (via `near-ft-helper`)

In a **separate terminal**, navigate to the `near-ft-helper` directory and run the setup script.

```bash
cd /near-ft-helper
node deploy.js
```

→ Leave this terminal **open and running**. It is now serving a local NEAR blockchain.

### Step 2: Run the API Server

In a **new terminal**, navigate to this `ft-claiming-service` directory and start the server in sandbox mode.

```bash
cd /ft-claiming-service
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
-   **RPC Rate Limits**: The public testnet RPC (rpc.testnet.near.org) is deprecated and has strict rate limits. Always use https://test.rpc.fastnear.com for testing and development. The sandbox environment does not have rate limits.
-   **Error Handling**: The service includes basic checks but can be extended with more specific error handling and logging.


## High-load (Sandbox) Setup

To push 100+ RPS without public RPC limits, run on Sandbox and enable high-load settings.

Environment variables:
- NEAR_ENV=sandbox
- RPC_URLS=http://localhost:3030
- MASTER_ACCOUNT_PRIVATE_KEYS=ed25519:...,ed25519:...   (comma-separated Function-Call keys)
- CONCURRENCY_LIMIT=200                                 (tune: 100–400)
- WAIT_UNTIL=Included                                   (lower request latency)

Provision multiple Function-Call access keys on Sandbox (examples):
- Allowlist FT methods for the contract:
  - storage_deposit, storage_balance_of, storage_balance_bounds, ft_transfer
- Example near-cli commands (adjust paths/accounts):
  near add-key master.test.near <PUBLIC_KEY_1> --contract-id ft.test.near --method-names "ft_transfer,storage_deposit,storage_balance_of,storage_balance_bounds" --allowance "1 NEAR"
  near add-key master.test.near <PUBLIC_KEY_2> --contract-id ft.test.near --method-names "ft_transfer,storage_deposit,storage_balance_of,storage_balance_bounds" --allowance "1 NEAR"
  # extract matching private keys and set MASTER_ACCOUNT_PRIVATE_KEYS

Run server:
- NEAR_ENV=sandbox npm start
- The service uses round-robin RPCs via RPC_URLS and a multi-key pool signer.

## Benchmarking

-   Tool: Artillery. Scenario file is `benchmark.yml` targeting `http://localhost:3000/send-ft`.
-   Steps:
    1. Start the server: `NEAR_ENV=testnet npm start`
    2. Baseline at 10 RPS: set `arrivalRate: 10` in `benchmark.yml`, then run `artillery run benchmark.yml`
    3. Increase to 50 RPS, then 100 RPS, repeating the run
-   Client tuning (recommended for high-load):
    -   In `benchmark.yml`, add client timeout to reduce client-side ETIMEDOUT:
        ```
        config:
          http:
            timeout: 30000
        ```
-   Optional: High-load 600 RPS test (requires multi access keys + sandbox/testnet headroom):
    -   Prereq: multiple Function-Call access keys on `masterAccount`, set `MASTER_ACCOUNT_PRIVATE_KEYS` (comma-separated `ed25519:...`), and keep FT contract allowlist methods.
    -   Example phases:
        ```
        config:
          phases:
            - duration: 30
              arrivalRate: 100
            - duration: 60
              arrivalRate: 300
            - duration: 60
              arrivalRate: 600
        ```
-   Report:
    -   Include requests/sec, error rate, latency p95/p99, and notable errors.
    -   Paste the Artillery summary output below this section once runs are completed.


## License
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
