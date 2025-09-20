# NEAR Fungible Token API Service

A high-performance Express.js API service for transferring NEAR Fungible Tokens (FT) with support for both testnet and sandbox environments.

## Features

- **POST `/send-ft` Endpoint**: Transfer NEP-141 tokens to specified receivers
- **Automatic Storage Registration**: Handles NEP-145 storage deposits automatically
- **Dynamic Environment Configuration**: Switch between testnet and sandbox via `NEAR_ENV`
- **High-Performance Signing**: Uses `@eclipseeer/near-api-ts` with optimized nonce management
- **ESM + Modern Node.js**: Built for Node.js 23+ with native crypto support

## Project Structure

```
src/
├── index.ts          # Main Express.js application
├── near.ts           # NEAR blockchain connection and utilities
├── config.ts         # Environment configuration
├── polyfills.ts      # Node.js crypto polyfills
└── config.sandbox.ts # Sandbox-specific configuration
```

## Prerequisites

- Node.js 23+ (24 recommended)
- Environment variable `MASTER_ACCOUNT_PRIVATE_KEY` (format: `ed25519:BASE58...`)
- Deployed NEP-141 FT contract
- For sandbox testing: Local NEAR node running

## FT Contract Deployment

To deploy and test FT contracts, use the companion repository:

**🔗 [near-ft-helper](https://github.com/Psianturi/near-ft-helper)**

This repository provides:
- Automated FT contract deployment scripts
- Local sandbox setup and testing
- End-to-end testing workflows
- Pre-configured accounts for development

### Quick Setup for Sandbox Testing:

```bash
# Clone the helper repository
git clone https://github.com/Psianturi/near-ft-helper.git
cd near-ft-helper

# Start local NEAR sandbox
node deploy.js
```

The sandbox will create test accounts and deploy an FT contract that you can use with this API service.

## Installation

```bash
# Clone the repository
git clone https://github.com/Psianturi/ft-claiming-service.git
cd ft-claiming-service

# Install dependencies
npm install
```

## Configuration

### Environment Variables

Create a `.env` file in the root directory:

```bash
# Required: Your NEAR account private key
MASTER_ACCOUNT_PRIVATE_KEY=ed25519:your_private_key_here

# Optional: Multiple keys for high-load scenarios
MASTER_ACCOUNT_PRIVATE_KEYS=ed25519:key1,ed25519:key2

# Optional: Custom RPC endpoints
RPC_URLS=https://rpc.testnet.fastnear.com
```

### Network Configuration

The service automatically detects the environment via the `NEAR_ENV` variable:

- `NEAR_ENV=testnet` (default): Uses testnet configuration
- `NEAR_ENV=sandbox`: Uses sandbox configuration

## Usage

### Running on Testnet

```bash
# Default mode - runs on testnet
npm start

# Or explicitly
npm run start:testnet
```

### Running on Sandbox

```bash
# Start local NEAR sandbox first (in separate terminal)
# Then run the service
NEAR_ENV=sandbox npm run start:sandbox
```

### API Usage

```bash
curl -X POST http://localhost:3000/send-ft \
  -H "Content-Type: application/json" \
  -d '{
    "receiverId": "receiver.testnet",
    "amount": "1000000",
    "memo": "Token transfer"
  }'
```

**Response:**
```json
{
  "message": "FT transfer initiated successfully",
  "result": {
    "receiptsOutcome": [...],
    "status": {...},
    "transaction": {...}
  }
}
```

## Benchmarking

The service includes Artillery configuration for performance testing:

```bash
# Install Artillery globally
npm install -g artillery

# Run benchmark
RECEIVER_ID=your_receiver_id artillery run benchmark.yml
```

### Benchmark Configuration

The `benchmark.yml` file includes multiple phases for testing different load levels:

- Phase 1: 10 RPS for 30 seconds
- Phase 2: 50 RPS for 30 seconds
- Phase 3: 100 RPS for 60 seconds
- Phase 4: 300 RPS for 60 seconds
- Phase 5: 600 RPS for 60 seconds

## Development

### Building

```bash
npm run build
```

### Testing

```bash
# Run with different environments
NEAR_ENV=testnet npm start
NEAR_ENV=sandbox npm start
```

## Security Considerations

- **Authentication**: Currently unauthenticated - add API keys or JWT for production
- **Private Keys**: Store securely in environment variables, never in code
- **Rate Limiting**: Implement request rate limiting for production use
- **RPC Providers**: Use reliable RPC endpoints (FastNear recommended for testnet)

## Error Handling

The service includes comprehensive error handling for:

- Invalid receiver accounts
- Insufficient storage deposits
- RPC connection issues
- Transaction failures
- Rate limiting

## License

MIT License - see LICENSE file for details
