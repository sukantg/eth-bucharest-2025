import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { Vladiator } from '@vialabs-io/node-core';
import { networks } from '../network.config.js';
import features from './features/index.js';  // Import the features array

// Load environment variables
dotenv.config();

// Check for required environment variables
if (!process.env.NODE_PRIVATE_KEY) {
  console.error('ERROR: NODE_PRIVATE_KEY is not set. Please check your .env file.');
  process.exit(1);
}
if (!process.env.PREDICTHQ_API_KEY) {
  console.error('ERROR: PREDICTHQ_API_KEY is not set. Please check your .env file.');
  process.exit(1);
}

// Determine environment
const isDevelopment = process.env.NODE_ENV !== 'production';
console.log(`Running in ${isDevelopment ? 'DEVELOPMENT' : 'PRODUCTION'} mode`);

// Get network configuration
const networkName = process.argv[2] || 'avalanche-testnet';
const network = networks[networkName];

if (!network) {
  console.error(`Network ${networkName} not found in network.config.js`);
  console.error(`Available networks: ${Object.keys(networks).join(', ')}`);
  process.exit(1);
}

console.log(`Using network: ${network.name} (Chain ID: ${network.chainId})`);

// Initialize the node
console.log('Starting Disaster Oracle Node...');

// Create the configuration object
const config = {};
config[network.chainId] = {
  type: 'EVMMV3',
  id: network.chainId.toString(),
  name: network.name,
  rpc: network.rpcUrl,
};

// Add bootstrap peers if set in environment variables
if (process.env.BOOTSTRAP_PEERS) {
  console.log('Using bootstrap peers for P2P connection');
  config.bootstrapPeers = process.env.BOOTSTRAP_PEERS.split(',');
}

try {
  // Create the Vladiator instance
  const vladiator = new Vladiator(process.env.NODE_PRIVATE_KEY, config);

  // Manually load features since auto-loading might look in a different directory
  if (Array.isArray(features)) {
    features.forEach((feature) => {
      console.log(`Loading feature: ${feature.featureName} (ID: ${feature.featureId})`);
       //Set PredictHQ API Key to the feature.
      if (feature.featureName === 'DisasterOracle') {
        feature.predictHQApiKey = process.env.PREDICTHQ_API_KEY;
      }
      vladiator.loadFeature(feature);
    });
  }

  console.log('Node started successfully!');
  console.log(`Listening for disaster data requests on ${network.name}...`);
  console.log('Press Ctrl+C to stop the node');
} catch (error) {
  console.error('Failed to start the node:', error);
  process.exit(1);
}
