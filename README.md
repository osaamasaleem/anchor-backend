# Anchor — Backend API

> Part of the **[Anchor](https://github.com/osaamasaleem)** decentralized academic credential platform.

This repository contains the Node.js/Express backend that powers the Anchor platform — handling credential issuance, JWT-based auth, MongoDB storage, and Trust Anchor governance via a Solidity smart contract on Polygon Amoy Testnet.

---

## Overview

Anchor is a decentralized academic credential system using **W3C Verifiable Credentials** and **blockchain** to let universities issue tamper-proof digital certificates and allow verifiers to instantly authenticate them — without contacting the issuing institution.

This repo is the **API layer** connecting the web portals, the mobile wallet, MongoDB, and the Polygon smart contract.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express.js |
| Database | MongoDB (Mongoose) |
| Blockchain | Polygon Amoy Testnet (Ethers.js) |
| Smart Contract | Solidity (`AnchorRegistry.sol`) |
| Auth | JWT |

---

## Project Structure

```
AnchorBackend/
├── src/
│   ├── models/
│   │   ├── IssuedCredential.js   # Credential schema
│   │   ├── Issuer.js             # University/issuer account schema
│   │   └── User.js               # Student user schema
│   ├── routes/
│   │   └── credentials.js        # Credential issuance & verification routes
│   └── index.js                  # Express app entry point
├── contracts/
│   └── AnchorRegistry.sol        # Solidity smart contract (Trust Anchor governance)
├── .env                          # Environment variables (not committed)
├── .gitignore
└── package.json
```

---

## Smart Contract — AnchorRegistry

The `AnchorRegistry.sol` contract is deployed on **Polygon Amoy Testnet**. It acts as a **Trust Anchor governance registry** — only institutions verified by the trust anchor (contract deployer) are permitted to issue credentials.

```solidity
// Core functions:
verifyInstitution(string _did)      // Trust anchor approves an institution by DID
checkVerification(string _did)      // Returns (isVerified, timestamp) for any DID
```

This means credential issuance on the backend is gated by on-chain verification status — an unverified institution cannot issue credentials even if it has a valid backend account.

---

## Getting Started

### Prerequisites

- Node.js v18+
- MongoDB instance (local or MongoDB Atlas)
- A funded wallet on Polygon Amoy Testnet — get test MATIC from the [Amoy faucet](https://faucet.polygon.technology/)

### Installation

```bash
git clone https://github.com/osaamasaleem/anchor-backend.git
cd anchor-backend
npm install
```

### Environment Variables

Create a `.env` file in the root directory:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
CONTRACT_ADDRESS=your_deployed_contract_address
PRIVATE_KEY=your_wallet_private_key
POLYGON_RPC_URL=https://rpc-amoy.polygon.technology
```

> **Never commit your `.env` file.** It is already listed in `.gitignore`.

### Running the Server

```bash
# Development
npm run dev

# Production
npm start
```

Server runs at `http://localhost:5000` by default.

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register a new issuer account |
| `POST` | `/api/auth/login` | Login — checks on-chain verification status before granting access |

### Credentials
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/credentials/issue` | Issue a W3C Verifiable Credential (verified issuers only) |
| `GET` | `/api/credentials/:id` | Fetch a credential by ID |
| `GET` | `/api/credentials/student/:walletAddress` | Get all credentials for a student |
| `POST` | `/api/credentials/verify` | Verify a Verifiable Presentation |

### Trust Anchor
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/trust-anchor/verify-institution` | Approve an institution on-chain (trust anchor only) |
| `GET` | `/api/trust-anchor/status/:did` | Check on-chain verification status of an institution |

---

## Security Notes

- Issuer login is **blocked at the API level** if the institution's DID is not verified on-chain — role-based status checks enforce `pending` vs `verified` states
- All protected routes use JWT middleware
- Private keys and secrets are stored in `.env` only — never hardcoded in source
- The `.env` file is excluded from version control

---

## Related Repositories

| Repo | Description |
|---|---|
| [`anchor-portals`](https://github.com/osaamasaleem/anchor-portals) | Web portals for issuers (universities) and verifiers (employers) |
| [`anchor-wallet`](https://github.com/osaamasaleem/anchor-wallet) | React Native mobile app — student credential wallet with QR presentation |

---

## Project Context

Anchor is a Final Year Project developed at **Foundation University Islamabad (FUSST Campus)** for the BS Information Technology program. It addresses credential fraud and slow manual verification by leveraging blockchain immutability and decentralized identity standards.

---

## License

This project is for academic purposes. All rights reserved.
