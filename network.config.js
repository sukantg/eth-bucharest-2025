import dotenv from 'dotenv';
dotenv.config();

// Network configurations - can be extended with more networks as needed
export const networks = {
  'avalanche-testnet': {
    name: 'avalanche-testnet',
    chainId: 43113,
    rpcUrl: process.env.AVALANCHE_TESTNET_RPC || 'https://api.avax-test.network/ext/bc/C/rpc',
    blockExplorer: 'https://testnet.snowtrace.io',
    nativeCurrency: {
      name: 'AVAX',
      symbol: 'AVAX',
      decimals: 18
    }
  },
  'base-testnet': {
    name: 'base-testnet',
    chainId: 84532,
    rpcUrl: process.env.BASE_TESTNET_RPC || 'https://sepolia.base.org',
    blockExplorer: 'https://sepolia.basescan.org/',
    nativeCurrency: {
      name: 'ETH',
      symbol: 'ETH',
      decimals: 18
    }
  }
};

/**
 * Get network configuration by name
 * @param {string} networkName - Network name (e.g., 'avalanche-testnet', 'base-testnet')
 * @returns {Object|null} Network configuration or null if not found
 */
function getNetworkConfig(networkName) {
  return networks[networkName] || null;
}

/**
 * Get all available network names
 * @returns {string[]} Array of network names
 */
function getNetworkNames() {
  return Object.keys(networks);
}

/**
 * Get all network configurations
 * @returns {Object} All network configurations
 */
function getAllNetworks() {
  return networks;
}

export {
  getNetworkConfig,
  getNetworkNames,
  getAllNetworks
};