import DisasterOracle from './DisasterOracle.js';

// Create instances of all features
const disasterOracle = new DisasterOracle();

// Export the array of feature instances as default
// Add new features to this array to make them available for processing
const features = [
  disasterOracle
];

export default features;
