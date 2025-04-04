# eth-bucharest-2025 (VIA Labs)

# Decentralized Emergency Aid Network (DEAN)

## Overview

This project demonstrates an automated system for disbursing emergency funds to affected individuals across different blockchain networks upon verification of a natural disaster. Leveraging VIA Labs' cross-chain messaging and private oracle technology, the system provides transparent, and efficient aid distribution, bypassing traditional bureaucratic delays and geographical limitations.

When a natural disaster occurs in a specific region,a decentralized network of validators (simulated in this project using an off-chain oracle node powered by VIA Labs' protocol) monitors official disaster reporting agencies through secure API calls.

Upon confirmation of the event, the VIA Labs private oracle relays this information to a smart contract deployed on a designated "fund" blockchain.

This smart contract, the `EmergencyFund` automatically triggers cross-chain token transfers (stablecoins in this example) to the pre-registered wallets of individuals located in the affected area.

These recipients can be registered on various supported blockchain networks, and VIA Labs' cross-chain messaging ensures the funds are effectively and natively transferred to their preferred network, potentially a blockchain with lower transaction fees suitable for emergency aid.

## VIA Labs Technology Integration

This project heavily relies on the following VIA Labs technologies:

- **Private Oracles:** A custom oracle feature is implemented using VIA Labs' messaging protocol to securely retrieve and verify disaster data from off-chain APIs without exposing sensitive information on-chain. The oracle node listens for requests from the `DisasterVerification` smart contract and sends back the verification status.

- **Cross-Chain Messaging:** Once a disaster is verified, the `EmergencyFund` smart contract utilizes VIA Labs' cross-chain messaging capabilities to send native stablecoins to recipients registered on different blockchain networks. This ensures seamless and cost-effective fund transfers across the Web3 ecosystem.

It uses PredictHQ’s Natural Disasters API to track disasters around the world:
[https://www.predicthq.com/events/disasters](https://www.predicthq.com/events/disasters)

## For a detailed business plan, please see:

[DEAN Business Plan](https://docs.google.com/document/d/1rm8l5bPxkUoKx6HQg83n_xoJwKEXT5sDiqw05Mk7ncs/edit?usp=sharing)

# Project setup

## Step 1: Clone & Setup

```bash
# Clone the repository
git clone git@github.com:sukantg/eth-bucharest-2025.git && cd eth-bucharest-2025

# Install dependencies
npm install

# Create a .env file with your private keys
cp .env.example .env
```

## Step 2: Deploy Smart Contracts

```bash
# Deploy the smart contracts
node scripts/deploy.js avalanche-testnet
```

This script will deploy the EmergencyFund and DisasterVerification contracts to the Avalanche Testnet. Ensure you have sufficient AVAX tokens in the account associated with your PRIVATE_KEY.

## Step 3: Run the Oracle Node

```bash
# Start the oracle node
node oracle/index.js avalanche-testnet
```

This will start the off-chain oracle node, which listens for disaster verification requests from the DisasterVerification contract. The node uses the NODE_PRIVATE_KEY to sign messages.

## Step 4: Register Recipients

If you have a list of recipient addresses, you can register them using the following script:

```bash
node scripts/registerRecipients.js avalanche-testnet recipients.json
```

recipients.json: A JSON file containing an array of recipient addresses.
Example: ["0xRecipient1", "0xRecipient2", ...]

## Step 5: Request Disaster Verification

To simulate a disaster event and trigger the verification process, use the following script:

```
node scripts/request-verification.js avalanche-testnet <disaster_type> "<disaster_location>"
```

<disaster_type>: The type of disaster (e.g., "Hurricane", "Earthquake", "Flood").

<disaster_location> : The location of the disaster (e.g., "Miami, FL", "Tokyo, Japan"). Enclose the location in quotes if it contains spaces.

Example:

```
node scripts/request-verification.js avalanche-testnet Hurricane "Miami, FL"
```

This will submit a request to the DisasterVerification contract, and the oracle node will attempt to verify the event.

## Step 6: Frontend Setup and Usage

Navigate to the frontend directory:

```bash
cd frontend
```

Install frontend dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run start
```

The frontend provides a user interface to:

- View the total funds in the EmergencyFund contract.

- Report a disaster (which triggers the oracle).

- Check the verification status of a reported disaster.
