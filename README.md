# eth-bucharest-2025

# Automated Cross-Chain Emergency Fund Disbursement

## Overview

This project demonstrates an automated system for disbursing emergency funds to affected individuals across different blockchain networks upon verification of a natural disaster. Leveraging VIA Labs' cross-chain messaging and private oracle technology, the system provides transparent, and efficient aid distribution, bypassing traditional bureaucratic delays and geographical limitations.

When a natural disaster occurs in a specific region,

a decentralized network of validators (simulated in this project using an off-chain oracle node powered by VIA Labs' protocol) monitors official disaster reporting agencies through secure API calls.

Upon confirmation of the event, the VIA Labs private oracle relays this information to a smart contract deployed on a designated "fund" blockchain.

This smart contract, the `EmergencyFund`

automatically triggers cross-chain token transfers (stablecoins in this example)

to the pre-registered wallets of individuals located in the affected area.

These recipients can be registered on various supported blockchain networks, and VIA Labs' cross-chain messaging ensures the funds are effectively and natively transferred to their preferred network, potentially a blockchain with lower transaction fees suitable for emergency aid.

## VIA Labs Technology Integration

This project heavily relies on the following VIA Labs technologies:

- **Private Oracles:** A custom oracle feature is implemented using VIA Labs' messaging protocol to securely retrieve and verify disaster data from off-chain APIs without exposing sensitive information on-chain. The oracle node listens for requests from the `DisasterVerification` smart contract and sends back the verification status.

- **Cross-Chain Messaging:** Once a disaster is verified, the `EmergencyFund` smart contract utilizes VIA Labs' cross-chain messaging capabilities to send native stablecoins to recipients registered on different blockchain networks. This ensures seamless and cost-effective fund transfers across the Web3 ecosystem.
