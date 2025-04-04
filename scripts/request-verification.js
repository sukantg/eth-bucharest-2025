import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { getChainConfig } from '@vialabs-io/npm-registry';

// Load environment variables
dotenv.config();

// Default to avalanche-testnet if no network is specified
const DEFAULT_NETWORK = 'avalanche-testnet';

/**
 * Retrieves the EmergencyFund contract ABI and address from the specified network.
 * @param {string} networkName - The name of the network (e.g., 'avalanche-testnet').
 * @returns {Promise<{abi: any[], address: string} | null>} - The ABI and address, or null on error.
 */
async function getContractInfo(networkName) {
    const network = networks[networkName];
    if (!network) {
        console.error(`Network ${networkName} not found in network.config.js`);
        return null;
    }

    // Use npm-registry to get the contract information.
    const chainConfig = getChainConfig(network.chainId);
     if (!chainConfig || !chainConfig.contracts || !chainConfig.contracts.EmergencyFund) {
        console.error(`EmergencyFund contract information not found for network: ${networkName} (Chain ID: ${network.chainId})`);
        return null;
    }
    const contractAddress = chainConfig.contracts.EmergencyFund.address;
    const contractAbi = chainConfig.contracts.EmergencyFund.abi;

    return { abi: contractAbi, address: contractAddress };
}

/**
 * Requests verification for a user, which triggers the oracle to fetch disaster data.
 * @param {ethers.Contract} contract - The EmergencyFund contract instance.
 * @param {string} disasterType - The type of disaster (e.g., 'Hurricane').
 * @param {string} location - The location of the disaster (e.g., 'New York, NY').
 * @returns {Promise<void>}
 */
async function requestVerification(contract, disasterType, location) {
    console.log(`Requesting verification for disaster: ${disasterType} at ${location}`);
    try {
        const tx = await contract.reportDisaster(disasterType, location);
        console.log(`Transaction hash: ${tx.hash}`);
        console.log('Waiting for confirmation...');
        await tx.wait();
        console.log('Verification request submitted successfully.');
    } catch (error) {
        console.error('Error requesting verification:', error);
        process.exit(1); // Exit on error
    }
}

async function main() {
    console.log('=== Request Verification ===');

    // Get the network name from command line arguments or use default
    const networkName = process.argv[2] || DEFAULT_NETWORK;

    // Get contract ABI and address
    const contractInfo = await getContractInfo(networkName);
    if (!contractInfo) {
        console.error(`Failed to get contract information for ${networkName}.`);
        process.exit(1);
    }
      const network = networks[networkName];

    // Setup provider and wallet
    const provider = new ethers.JsonRpcProvider(network.rpcUrl);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY || '', provider);

    // Create contract instance
    const contract = new ethers.Contract(contractInfo.address, contractInfo.abi, wallet);

    // Get disaster type and location from command line arguments
    const disasterType = process.argv[3];
    const location = process.argv[4];

    if (!disasterType || !location) {
        console.error('ERROR: Disaster type and location are required as command line arguments.');
        console.error('Usage: node request-verification.js <network> <disaster_type> <location>');
        console.error('Example: node request-verification.js avalanche-testnet Hurricane "New York, NY"');
        process.exit(1);
    }

    // Request verification
    await requestVerification(contract, disasterType, location);

    console.log('Verification process completed.');
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});
