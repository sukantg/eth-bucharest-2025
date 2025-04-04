import { ethers } from 'ethers';
const contractAddress = "0xYourContractAddress";

// Replace with the ABI of your EmergencyFund contract.
// You can get this from the compilation output (e.g., EmergencyFund.json)

const contractAbi = [
  "event DisasterReported(address indexed reporter, string disasterType, string location)",
  "event FundsAdded(address indexed from, uint256 amount)",
  "function contributeFunds() external payable",
  "function getVerificationCost() external view returns (uint256)",
  "function registerRecipients(address[] calldata _recipients) external",
  "function reportDisaster(string calldata _disasterType, string calldata _location) external",
  "function getTotalFunds() external view returns (uint256)",
  "function distributeFunds(address[] calldata _recipients, uint256[] calldata _amounts) external",
  "function isVerified(address _recipient) external view returns (bool)",
  "function getRecipients() external view returns (address[])",
  "constructor() payable",
];

const config = {
  contractAddress: contractAddress,
  contractAbi: contractAbi,
};

export default config;
