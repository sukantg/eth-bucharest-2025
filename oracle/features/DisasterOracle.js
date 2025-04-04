import { ethers } from 'ethers';
import axios from 'axios';

/**
 * Disaster Oracle feature that fetches disaster data from PredictHQ API
 */
class DisasterOracle {
    // Feature identification properties
    featureId = 1; 
    featureName = 'DisasterOracle';
    featureDescription = 'Oracle for fetching disaster data from PredictHQ';

    processedRequests = new Set();
    // To be set with the address of the deployed EmergencyFund contract.
    deployedAddress = '';
    // PredictHQ API key
    predictHQApiKey = '';

    constructor() {
        if (this.deployedAddress === '') {
            throw new Error('EmergencyFund contract address not set.');
        }
        if (this.predictHQApiKey === '') {
            throw new Error('PredictHQ API key not set.');
        }
    }

    /**
     * Process a message from the blockchain.
     * @param {object} driver - The blockchain driver.
     * @param {object} message - The message containing disaster request data.
     * @returns {object} The processed message with disaster data from PredictHQ.
     */
    async process(driver, message) {
        const txId = message.values?.txId;
        console.log(`[DisasterOracle] Processing request: ${txId}`);

        if (this.processedRequests.has(txId)) {
            console.log(`[DisasterOracle] Already processed request: ${txId}, skipping`);
            return message;
        }

        this.processedRequests.add(txId);

        try {
            if (!message.featureData) {
                throw new Error("No featureData found in message");
            }

            const abiCoder = new ethers.AbiCoder();
            const decoded = abiCoder.decode(
                ['uint256', 'string', 'string'],
                message.featureData
            );
            const requestId = decoded[0];
            const disasterType = decoded[1];
            const location = decoded[2];

            console.log(`[DisasterOracle] Decoded requestId: ${requestId}, disasterType: ${disasterType}, location: ${location}`);

            // Fetch disaster data from PredictHQ
            const predictHQData = await this.fetchDisasterData(disasterType, location);

            // Encode the PredictHQ data for the smart contract.  MUST match the contract's expected format.
             const featureReply = abiCoder.encode(
                [
                    'uint256', // requestId
                    'string',  // disasterType
                    'string',  // location
                    'bool',    // isConfirmed
                    'string',  // phqId
                    'uint32',  // start
                    'uint32',  // end
                    'string',  // category
                    'string[]' // tags
                ],
                [
                    requestId,
                    disasterType,
                    location,
                    predictHQData.isConfirmed, // Adapt this
                    predictHQData.phqId || "",
                    predictHQData.start || 0,
                    predictHQData.end || 0,
                    predictHQData.category || "",
                    predictHQData.tags || []
                ]
            );

            message.featureReply = featureReply;
            message.featureId = this.featureId; // CRITICAL: Ensure featureId is set
            console.log(`[DisasterOracle] PredictHQ response encoded for requestId: ${requestId}`);
            return message;

        } catch (error) {
            console.error(`[DisasterOracle] Error processing message:`, error);
            return message; // Return even on error, to avoid blocking other messages.  Smart contract will handle missing data.
        }
    }

    /**
     * Validate a message from the blockchain.
     * @param {object} driver - The blockchain driver.
     * @param {object} message - The message to validate.
     * @returns {boolean} Whether the message is valid.
     */
    async isMessageValid(driver, message) {
        if (message.sender && message.sender.toLowerCase() !== this.deployedAddress.toLowerCase()) {
            console.log(`[DisasterOracle] Ignoring request from non-deployed contract: ${message.sender}`);
            return false;
        }

        console.log(`[DisasterOracle] Valid request from deployed contract: ${message.sender}`);
        return true;
    }

    /**
     * Fetch disaster data from PredictHQ API.
     * @param {string} disasterType - The type of disaster.
     * @param {string} location - The location of the disaster.
     * @returns {Promise<object>} -  Disaster data, including a boolean for confirmed, and other PredictHQ data.
     */
    async fetchDisasterData(disasterType, location) {
        try {
            // Construct PredictHQ API query.  Example:
            const query = `q=${disasterType} AND location=${location}`;
            const url = `https://api.predicthq.com/v1/events/?${query}`;

            const response = await axios.get(url, {
                headers: {
                    'Authorization': `Bearer ${this.predictHQApiKey}`,
                    'Accept': 'application/json',
                },
            });

            const results = response.data.results;
            let isConfirmed = results.length > 0; // Treat any results as "confirmed"

            if (results.length > 0) {
                const firstResult = results[0];
                 return {
                    isConfirmed: isConfirmed,
                    phqId: firstResult.id,
                    start: new Date(firstResult.start).getTime() / 1000,  // Convert to Unix timestamp
                    end: firstResult.end ? new Date(firstResult.end).getTime() / 1000 : 0, //convert to unix timestamp
                    category: firstResult.category,
                    tags: firstResult.tags
                };
            }
            else{
                 return {
                    isConfirmed: isConfirmed,
                };
            }

        } catch (error) {
            console.error('[DisasterOracle] Error fetching data from PredictHQ:', error);
            // Return a default object indicating not confirmed.  The smart contract will handle this.
            return {
                isConfirmed: false,
            };
        }
    }
}

export default DisasterOracle;
