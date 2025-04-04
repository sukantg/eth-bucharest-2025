import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { getChainConfig } from '@vialabs-io/npm-registry';

// Load environment variables
dotenv.config();

// Check for required environment variable
if (!process.env.PRIVATE_KEY) {
    console.error('ERROR: PRIVATE_KEY is not set in your .env file.');
    console.error('This key is required to sign transactions to the smart contract.');
    console.error('Please set PRIVATE_KEY in your .env file and try again.');
    process.exit(1);
}

// Default to avalanche-testnet if no network is specified
const DEFAULT_NETWORK = 'avalanche-testnet';

/**
 * Reads the deployment information from the specified network's deployment file.
 * @param {string} networkName - The name of the network.
 * @returns {object} The deployment information, or null if the file does not exist or cannot be parsed.
 */
function getDeploymentInfo(networkName) {
    const network = networks[networkName];
    if (!network) {
        console.error(`Network ${networkName} not found in network.config.js`);
        return null;
    }
    const deploymentDir = path.join(__dirname, '../deployments', network.name);
    const deploymentFile = path.join(deploymentDir, 'EmergencyFund.json'); // Contract name

    if (!fs.existsSync(deploymentFile)) {
        console.error(`Deployment file not found at ${deploymentFile}`);
        return null;
    }

    try {
        const deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
        return deploymentInfo;
    } catch (error) {
        console.error(`Error parsing deployment file: ${error.message}`);
        return null;
    }
}

/**
 * Reads recipient addresses from a JSON file.
 * @param {string} filePath - The path to the JSON file.
 * @returns {string[]} An array of recipient addresses, or an empty array if the file does not exist or cannot be parsed.
 */
function readRecipientsFile(filePath) {
    if (!fs.existsSync(filePath)) {
        console.error(`Recipients file not found at ${filePath}.  Returning empty array.`);
        return []; // Return empty array so main function does not crash
    }

    try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const recipientsData = JSON.parse(fileContent);
        if (!Array.isArray(recipientsData))
        {
            console.error(`Recipients file at ${filePath} does not contain an array.  Returning empty array.`);
            return [];
        }
        // Basic validation of address format.
        const validAddresses = recipientsData.filter(address => ethers.isAddress(address));
        if (validAddresses.length !== recipientsData.length) {
             console.warn(`Recipients file at ${filePath} contains invalid addresses.  Invalid addresses will be filtered out.`);
        }
        return validAddresses;

    } catch (error) {
        console.error(`Error parsing recipients file: ${error.message}. Returning empty array.`);
        return [];  // Return empty array so main function does not crash
    }
}

/**
 * Registers recipient addresses with the EmergencyFund contract.
 * @param {ethers.Contract} contract - The EmergencyFund contract instance.
 * @param {string[]} recipients - An array of recipient addresses to register.
 * @returns {Promise<void>}
 */
async function registerRecipients(contract, recipients) {
    if (recipients.length === 0) {
        console.warn('No recipients to register.');
        return;
    }
    console.log(`Registering ${recipients.length} recipients...`);

    try {
        // Estimate gas limit.  Important for larger number of recipients.
        const gasEstimate = await contract.getFunction("registerRecipients").estimateGas(recipients);
        const tx = await contract.registerRecipients(recipients, { gasLimit: gasEstimate.mul(120).div(100) }); //add a 20% buffer
        console.log(`Transaction hash: ${tx.hash}`);
        console.log('Waiting for confirmation...');
        await tx.wait();
        console.log('Recipients registered successfully!');
    } catch (error) {
        console.error('Error registering recipients:', error);
        process.exit(1); // Exit on error.  This is critical.
    }
}

async function main() {
    console.log('=== Register Recipients ===');

    // Get the network name from command line arguments or use default
    const networkName = process.argv[2] || DEFAULT_NETWORK;

    // Get deployment information
    const deploymentInfo = getDeploymentInfo(networkName);
    if (!deploymentInfo) {
        console.error(`Failed to get deployment information for ${networkName}.`);
        process.exit(1);
    }

    const network = networks[networkName];

     // Setup provider and wallet
    const provider = new ethers.JsonRpcProvider(network.rpcUrl);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY || '', provider);

    // Create contract instance
    const contract = new ethers.Contract(
        deploymentInfo.address,
        deploymentInfo.abi,
        wallet
    );

    // Get the recipients file path from command line arguments
    const recipientsFilePath = process.argv[3];
    if (!recipientsFilePath) {
        console.error('ERROR: Recipients file path is required as a command line argument.');
        console.error('Usage: node registerRecipients.js <network> <recipients_file_path>');
        console.error('Example: node registerRecipients.js avalanche-testnet ./recipients.json');
        process.exit(1);
    }

    // Read recipient addresses from the specified file
    const recipients = readRecipientsFile(recipientsFilePath);

    // Register the recipients with the contract
    await registerRecipients(contract, recipients);

    console.log('Recipient registration process completed.');
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});
