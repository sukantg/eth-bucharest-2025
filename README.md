# eth-bucharest-2025 (VIA Labs)

# Automated Cross-Chain Emergency Fund Disbursement

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

## Step 1: Clone & Setup

```bash
# Clone the repository
git clone [git@github.com:sukantg/eth-bucharest-2025.git](git@github.com:sukantg/eth-bucharest-2025.git) && cd eth-bucharest-2025

# Install dependencies
npm install

# Create a .env file with your private keys
cp .env.example .env

Edit the .env file and add:Your private key for deploying contracts (PRIVATE_KEY)Your node private key for running the oracle node (NODE_PRIVATE_KEY)


Step 2: Deploy Your Contractsnode scripts/deploy.js
This script will:Compile the EmergencyFund.sol and DisasterVerification.sol contracts.

Deploy the contracts to Avalanche Testnet.Configure the oracle for on-chain to off-chain communication.Save deployment information for the frontend.Step 3: Run the Oracle Nodenode oracle/index.js


Step 4: Interact with the ApplicationRegister Recipients (Optional)node scripts/registerRecipients.js <network> <recipients_file_path>

<network>: The name of the network (e.g., avalanche-testnet).<recipients_file_path>: The path to a JSON file containing an array of recipient addresses.Request Disaster Verificationnode scripts/request-verification.js <network> <disaster_type> <location>
<network>: The name of the network (e.g., avalanche-testnet).<disaster_type>: The type of disaster (e.g., 'Hurricane', 'Flood').<location>: The location of the disaster (e.g., 'New York, NY').Step 5: Use the Frontend# Navigate to the frontend directory
cd frontend

# Install frontend dependencies
npm install

# Start the frontend development server
npm run start
```
