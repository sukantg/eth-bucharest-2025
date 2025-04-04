import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getChainConfig } from '@vialabs-io/npm-registry';
import { execSync } from 'child_process';
import { networks, getNetworkNames } from '../network.config.js';
import dotenv from 'dotenv';
import { dirname } from 'path';

// Configure dotenv
dotenv.config();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Check if NODE_PRIVATE_KEY and PREDICTHQ_API_KEY are set
if (!process.env.NODE_PRIVATE_KEY) {
    console.error('ERROR: NODE_PRIVATE_KEY is not set in your .env file.');
    console.error('The NODE_PRIVATE_KEY is required to derive the oracle node public key needed for the contract setup.');
    console.error('This key tells the node that the request is for that contract and lets the network wait for the reply.');
    console.error('Please set NODE_PRIVATE_KEY in your .env file and try again.');
    process.exit(1);
}

if (!process.env.PREDICTHQ_API_KEY) {
    console.error('ERROR: PREDICTHQ_API_KEY is not set in your .env file.');
    console.error('The PREDICTHQ_API_KEY is required to access the PredictHQ API for disaster data.');
    console.error('Please set PREDICTHQ_API_KEY in your .env file and try again.');
    process.exit(1);
}

// Default to avalanche-testnet if no network is specified
const DEFAULT_NETWORK = 'avalanche-testnet';

// ======================================================================
// SECTION 1: CONTRACT COMPILATION
// ======================================================================

/**
 * Compiles the EmergencyFund.sol contract using solcjs
 * @returns {Promise<boolean>} True if compilation was successful, false otherwise
 */
async function compileContract() {
    console.log('=== Compiling Contract ===');
    try {
        // Create build directory if it doesn't exist
        const buildDir = path.join(__dirname, '../build');
        if (!fs.existsSync(buildDir)) {
            fs.mkdirSync(buildDir, { recursive: true });
        }

        // Compile the contract with optimizer enabled
        console.log('Running solcjs compiler with optimizer...');
        execSync('npx solcjs --bin --abi --include-path node_modules/ --base-path . -o ./build --optimize --optimize-runs 200 contracts/EmergencyFund.sol', { // Changed contract name
            cwd: path.join(__dirname, '..'),
            stdio: 'inherit',
        });

        console.log('Compilation successful!');
        return true;
    } catch (error) {
        console.error('Compilation failed:', error.message);
        return false;
    }
}

// ======================================================================
// SECTION 2: DEPLOYMENT MANAGEMENT
// ======================================================================

/**
 * Check if a deployment already exists for a network
 * This prevents redeploying to networks that already have contracts.
 *
 * @param {string} networkName - Network name
 * @returns {Promise<Object|null>} Existing deployment or null if not found
 */
async function checkExistingDeployment(networkName) {
    const network = networks[networkName];
    const deploymentDir = path.join(__dirname, '../deployments', network.name);
    const deploymentFile = path.join(deploymentDir, 'EmergencyFund.json'); // Changed contract name

    if (fs.existsSync(deploymentFile)) {
        try {
            const deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
            console.log(`Existing deployment found for ${network.name}`);

            // Setup provider to get contract instance
            const provider = new ethers.JsonRpcProvider(network.rpcUrl);
            const wallet = new ethers.Wallet(process.env.PRIVATE_KEY || '', provider);

            // Create contract instance
            const contract = new ethers.Contract(
                deploymentInfo.address,
                deploymentInfo.abi,
                wallet
            );

            return {
                address: deploymentInfo.address,
                chainId: deploymentInfo.chainId,
                contract: contract,
                isExisting: true,
            };
        } catch (error) {
            console.warn(`Error reading existing deployment for ${network.name}:`, error.message);
            return null;
        }
    }

    return null;
}

/**
 * Deploy the contract to a specific network if it doesn't already exist
 * This function handles:
 * 1. Checking for existing deployments
 * 2. Deploying the contract if needed
 * 3. Saving deployment information for both backend and frontend
 *
 * @param {string} networkName - Network name from network.config.js
 * @returns {Promise<Object|null>} Deployment information or null if failed
 */
async function deployToNetwork(networkName) {
    const network = networks[networkName];
    console.log(`\n=== Processing ${network.name} ===`);

    // Check if deployment already exists
    const existingDeployment = await checkExistingDeployment(networkName);
    if (existingDeployment) {
        console.log(`Using existing deployment at ${existingDeployment.address}`);

        // Update the DisasterOracle.js feature file with the existing contract address  // Changed file name
        const featureFilePath = path.join(__dirname, '../oracle/features/DisasterOracle.js');  // Changed file name
        const featureContent = fs.readFileSync(featureFilePath, 'utf8');
        const updatedContent = featureContent.replace(
            /deployedAddress = ['"].*['"];/,
            `deployedAddress = '${existingDeployment.address}';`
        );
        fs.writeFileSync(featureFilePath, updatedContent);
        console.log(`Updated DisasterOracle feature with existing contract address: ${existingDeployment.address}`); // Changed text

        return existingDeployment;
    }

    console.log(`No existing deployment found. Deploying to ${network.name}...`);

    // Setup provider and wallet
    const provider = new ethers.JsonRpcProvider(network.rpcUrl);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY || '', provider);

    console.log(`Using wallet address: ${wallet.address}`);

    // Get chain ID
    const providerNetwork = await provider.getNetwork();
    const chainId = providerNetwork.chainId;
    console.log(`Chain ID: ${chainId}`);

    // Get chain config
    const chainConfig = getChainConfig(chainId);
    if (!chainConfig) {
        console.error(`Chain configuration not found for chainId: ${chainId}`);
        return null;
    }

    console.log(`Deploying to ${chainConfig.name} (${chainConfig.network})...`);

    // Read contract files
    const contractPath = path.join(__dirname, '../build');

    // Find ABI and bytecode files
    const files = fs.readdirSync(contractPath);
    const abiFile = files.find(file => file.includes('EmergencyFund.abi')); // Changed contract name
    const binFile = files.find(file => file.includes('EmergencyFund.bin')); // Changed contract name

    if (!abiFile || !binFile) {
        console.error('ABI or bytecode files not found after compilation.');
        return null;
    }

    const abi = JSON.parse(fs.readFileSync(path.join(contractPath, abiFile), 'utf8'));
    const bytecode = '0x' + fs.readFileSync(path.join(contractPath, binFile), 'utf8');

    // Deploy contract
    console.log('Deploying EmergencyFund contract...');  // Changed contract name
    const factory = new ethers.ContractFactory(abi, bytecode, wallet);
    const contract = await factory.deploy();

    console.log(`Transaction hash: ${contract.deploymentTransaction().hash}`);
    console.log('Waiting for deployment...');

    await contract.waitForDeployment();
    const contractAddress = await contract.getAddress();

    console.log(`Contract deployed to: ${contractAddress}`);

    // Save deployment info
    const deploymentDir = path.join(__dirname, '../deployments', network.name);
    if (!fs.existsSync(deploymentDir)) {
        fs.mkdirSync(deploymentDir, { recursive: true });
    }

    const deploymentInfo = {
        address: contractAddress,
        abi: abi,
        network: network.name,
        chainId: Number(chainId),
        deployedAt: new Date().toISOString(),
    };

    fs.writeFileSync(
        path.join(deploymentDir, 'EmergencyFund.json'),  // Changed contract name
        JSON.stringify(deploymentInfo, null, 2)
    );

    fs.writeFileSync(
        path.join(deploymentDir, '.chainId'),
        chainId.toString()
    );

    // Also save to a frontend-accessible location
    const frontendConfigDir = path.join(__dirname, '../frontend/src/config');
    if (!fs.existsSync(frontendConfigDir)) {
        fs.mkdirSync(frontendConfigDir, { recursive: true });
    }

    // Update or create the deployments.json file
    const frontendConfigPath = path.join(frontendConfigDir, 'deployments.json');
    let frontendDeployments = {};

    // Read existing deployments if file exists
    if (fs.existsSync(frontendConfigPath)) {
        try {
            const existingConfig = fs.readFileSync(frontendConfigPath, 'utf8');
            frontendDeployments = JSON.parse(existingConfig);
        } catch (error) {
            console.warn('Error reading existing frontend deployments:', error.message);
        }
    }

    // Update with new deployment
    // Use the existing chainConfig for additional information
    const chainIdKey = Number(chainId);
    frontendDeployments[chainIdKey] = {
        address: contractAddress,
        network: network.name,
        chainId: chainIdKey,
        deployedAt: new Date().toISOString(),
        abi: abi, // Include ABI for the frontend and scripts
        rpcUrl: network.rpcUrl, // Include RPC URL for the frontend
        blockExplorer: chainConfig?.explorer || '', // Get block explorer from chain config
    };

    // Write updated deployments
    fs.writeFileSync(
        frontendConfigPath,
        JSON.stringify(frontendDeployments, null, 2)
    );

    console.log(`Deployment information saved to ${deploymentDir}/EmergencyFund.json`); // Changed contract name
    console.log(`Frontend deployment config updated at ${frontendConfigPath}`);

    // Update the DisasterOracle.js feature file with the new contract address // Changed file name
    const featureFilePath = path.join(__dirname, '../oracle/features/DisasterOracle.js');  // Changed file name
    const featureContent = fs.readFileSync(featureFilePath, 'utf8');
    const updatedContent = featureContent.replace(
        /deployedAddress = ['"].*['"];/,
        `deployedAddress = '${contractAddress}';`
    );
    fs.writeFileSync(featureFilePath, updatedContent);
    console.log(`Updated DisasterOracle feature with new contract address: ${contractAddress}`); // Changed text

    return {
        address: contractAddress,
        chainId: Number(chainId),
        contract: contract,
        isExisting: false,
    };
}

// ======================================================================
// SECTION 3: ORACLE CONFIGURATION
// ======================================================================

/**
 * Configure the oracle contract to work with the off-chain node
 * This step is necessary for the contract to send and receive messages
 *
 * @param {Object} deployment - Deployment object
 * @returns {Promise<void>}
 */
async function configureOracle(deployment) {
    console.log('\n=== Configuring Oracle ===');

    // Get chain config
    const chainConfig = getChainConfig(deployment.chainId);
    if (!chainConfig || !chainConfig.message) {
        console.error(`Message contract address not found for chainId: ${deployment.chainId}`);
        return;
    }

    console.log(`Using message contract: ${chainConfig.message}`);

    try {
        // Configure the contract to send messages to itself
        // This is necessary for the on-chain to off-chain communication
        console.log(`Configuring oracle on chain ${deployment.chainId}...`);

        // First, configure the client
        console.log('Configuring message client...');
        const tx = await deployment.contract.configureClient(
            chainConfig.message,
            [deployment.chainId], // The contract will send messages to itself
            [deployment.address], // The contract's own address
            [1] // Default confirmation blocks
        );

        console.log(`Configuration transaction hash: ${tx.hash}`);
        console.log('Waiting for confirmation...');

        await tx.wait();

        // Configure the feature gateway if it exists in the chain config
        if (chainConfig.featureGateway) {
            console.log(`Configuring feature gateway: ${chainConfig.featureGateway}`);
            const featureTx = await deployment.contract.configureFeatureGateway(
                chainConfig.featureGateway
            );
            console.log(`Feature gateway configuration transaction hash: ${featureTx.hash}`);
            console.log('Waiting for confirmation...');
            await featureTx.wait();
            console.log('Feature gateway configured successfully!');
        } else {
            console.log('No feature gateway found in chain config, skipping configuration');
        }

        // Derive the public key and address from NODE_PRIVATE_KEY
        console.log('Deriving public key from NODE_PRIVATE_KEY...');
        const nodeWallet = new ethers.Wallet(process.env.NODE_PRIVATE_KEY);

        // In ethers.js v6, we need to use signingKey to get the public key
        const publicKey = nodeWallet.signingKey.publicKey;
        console.log(`Public key: ${publicKey}`);

        // Set the external signature (exsig) on the contract
        console.log('Setting external signature (exsig) on the contract...');

        // Get the address directly from the wallet
        const nodeAddress = nodeWallet.address;
        console.log(`Derived address from public key: ${nodeAddress}`);

        // Set the external signature through our oracle contract
        // We need to use the same wallet that deployed the contract (MESSAGE_OWNER)
        console.log('Setting external signature through oracle contract...');
        const deployerWallet = new ethers.Wallet(process.env.PRIVATE_KEY || '', deployment.contract.runner.provider);
        const oracleWithDeployer = deployment.contract.connect(deployerWallet);

        const setExsigTx = await oracleWithDeployer.setExsig(nodeAddress);
        console.log(`SetExsig transaction hash: ${setExsigTx.hash}`);
        console.log('Waiting for confirmation...');

        await setExsigTx.wait();
        console.log('External signature (exsig) set successfully!');
        console.log('Oracle configuration completed successfully!');
    } catch (error) {
        console.error(`Error configuring oracle on chain ${deployment.chainId}:`, error.message);
    }
}

// ======================================================================
// SECTION 4: MAIN EXECUTION
// ======================================================================

/**
 * Main execution function that orchestrates the deployment process
 * 1. Compiles the contract
 * 2. Deploys to the specified network
 * 3. Configures the oracle
 */
async function main() {
    console.log('=== EmergencyFund Deployment and Configuration ==='); // Changed title

    // Get the network name from command line arguments or use default
    const networkName = process.argv[2] || DEFAULT_NETWORK;

    if (!networks[networkName]) {
        console.error(`Network ${networkName} not found in network.config.js`);
        console.error(`Available networks: ${Object.keys(networks).join(', ')}`);
        process.exit(1);
    }

    // Compile the contract first
    const compilationSuccess = await compileContract();
    if (!compilationSuccess) {
        console.error('Compilation failed. Aborting deployment.');
        process.exit(1);
    }

    // Deploy to the specified network
    const deployment = await deployToNetwork(networkName);
    if (!deployment) {
        console.error(`Failed to deploy to ${networkName}. Aborting.`);
        process.exit(1);
    }

    // Configure the oracle
    await configureOracle(deployment);

    // Get chain config for contract addresses
    const finalChainConfig = getChainConfig(deployment.chainId);

    // Create contract instance with correct interface
      const messageV3Contract = new ethers.Contract(
        finalChainConfig.message,
        [
          'function exsig(address) external view returns (address)',
          'function chainsig() external view returns (address)',
          'function poslayer() external view returns (address)',
          'function bridgeEnabled() external view returns (bool)'
        ],
        deployment.contract.runner
    );

    console.log('\n=== Deployment and Configuration Completed Successfully! ===');
    console.log(`\nNetwork: ${networks[networkName].name}`);
    console.log(`Chain ID: ${deployment.chainId}`);

    console.log('\nContract Addresses:');
    console.log(`EmergencyFund: ${deployment.address}`); // Changed contract name
    console.log(`MessageV3: ${finalChainConfig.message}`);

      try {
        // Get contract state
        const [chainSigAddress, posLayerAddress, isBridgeEnabled] = await Promise.all([
          messageV3Contract.chainsig(),
          messageV3Contract.poslayer(),
          messageV3Contract.bridgeEnabled()
        ]);

        // Get external signature for our oracle contract
        const oracleExSig = await messageV3Contract.exsig(deployment.address);

        console.log('\nMessageV3 Configuration:');
        console.log(`Bridge Enabled: ${isBridgeEnabled}`);
        console.log(`Chain Signature: ${chainSigAddress}`);
        console.log(`POS Layer: ${posLayerAddress}`);
        console.log('\nOracle Configuration:');
        console.log(`External Signature: ${oracleExSig}`);

      } catch (error) {
        console.log('\nFailed to query some contract values:', error.message);
      }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
