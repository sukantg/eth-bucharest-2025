// SPDX-License-Identifier: MIT
// (c)2025 Your Name/Organization
pragma solidity ^0.8.17;

import "@vialabs-io/npm-contracts/MessageClient.sol";

/**
 * @title EmergencyFund
 * @dev A cross-chain emergency fund that receives disaster data from off-chain nodes
 * and allows users to withdraw funds if they are in an affected area.
 */
contract EmergencyFund is MessageClient {
    // Events for tracking requests and responses
    event DisasterReported(
        uint indexed requestId,
        string disasterType,
        string location
    );
    event FundsDisbursed(address indexed recipient, uint amount);
    event RequestCreated(uint indexed requestId, address indexed requester);

    // Struct to store disaster data
    struct DisasterData {
        string disasterType;
        string location;
        uint timestamp;
        bool reported;
    }

    // Mapping to store disaster reports
    mapping(uint => DisasterData) public disasterReports;

    // Mapping to track request owners
    mapping(uint => address) public requestOwners;

    // Request counter
    uint public nextRequestId;

    // Amount of funds available for disbursement
    uint public fundsAvailable;

    // Mapping to track if a user has already received funds
    mapping(address => bool) public fundsReceived;

    constructor() {
        MESSAGE_OWNER = msg.sender;
        nextRequestId = block.chainid * 10 ** 4;
    }

    /**
     * @dev Report a disaster event
     * @param _disasterType The type of disaster (e.g., "Hurricane", "Earthquake")
     * @param _location The location of the disaster (e.g., "New York, NY")
     * @return requestId The ID of the disaster report
     */
    function reportDisaster(
        string memory _disasterType,
        string memory _location
    ) external returns (uint) {
        uint requestId = nextRequestId;

        // Store the disaster report
        disasterReports[requestId] = DisasterData({
            disasterType: _disasterType,
            location: _location,
            timestamp: block.timestamp,
            reported: false
        });

        // Store the request owner
        requestOwners[requestId] = msg.sender;

        // Increment the request ID
        nextRequestId++;

        // Encode the feature data (requestId, disasterType, location)
        bytes memory featureData = abi.encode(
            requestId,
            _disasterType,
            _location
        );

        // Empty message data since we're using feature data
        bytes memory messageData = "";

        // Check if MESSAGEv3 is set
        require(address(MESSAGEv3) != address(0), "Oracle not configured");

        // Send the message with feature ID 2 (for example) to the current chain
        _sendMessageWithFeature(
            block.chainid, // Send to the current chain
            messageData,
            2, // Feature ID for Disaster Reporting
            featureData
        );

        // Emit event
        emit DisasterReported(requestId, _disasterType, _location);
        emit RequestCreated(requestId, msg.sender);

        return requestId;
    }

    /**
     * @dev Process incoming message from the off-chain node with feature support
     * @param _featureResponse Reply from feature processing off-chain
     */
    function _processMessageWithFeature(
        uint /* _txId */,
        uint /* _sourceChainId */,
        bytes memory /* _messageData */,
        uint32 /* _featureId */,
        bytes memory /* _featureData */,
        bytes memory _featureResponse
    ) internal virtual override {
        // Decode the feature response to get the disaster data
        // The feature response MUST include requestId.  It SHOULD also include a boolean
        // indicating whether the disaster was confirmed, and any additional data.
        (
            uint requestId,
            string memory disasterType,
            string memory location,
            bool isConfirmed
        ) = abi.decode(_featureResponse, (uint, string, string, bool));

        // Update the disaster report
        DisasterData storage data = disasterReports[requestId];
        data.reported = isConfirmed; // Set to true if the off-chain oracle confirms

        // Emit event (You might want a separate event for confirmation)
        emit DisasterReported(requestId, disasterType, location);
    }

    /**
     * @dev Allow a user to withdraw funds if a disaster has been reported in their area.
     * @param _requestId The ID of the disaster report.
     */
    function withdrawFunds(uint _requestId) external {
        require(
            disasterReports[_requestId].reported,
            "Disaster not confirmed for this request."
        );
        require(!fundsReceived[msg.sender], "Funds already received.");
        require(fundsAvailable > 0, "No funds available.");
        //  Implement a check to see if the user is in the reported disaster location.
        //  This would likely involve comparing the user's location (which you would
        //  need to obtain, perhaps in a separate function or as part of the initial
        //  disaster report) with the disaster location.
        //  For simplicity, this example assumes that if a disaster is reported,
        //  all users in the contract are eligible.  YOU MUST CHANGE THIS.
        uint amount = fundsAvailable; // For now, give all available funds.  Change as needed.
        fundsAvailable = 0; // all funds are distributed
        fundsReceived[msg.sender] = true;
        payable(msg.sender).transfer(amount);
        emit FundsDisbursed(msg.sender, amount);
    }

    /**
     * @dev Add funds to the contract.
     */
    function addFunds() external payable {
        fundsAvailable += msg.value;
    }

    /**
     * @dev Get disaster data for a specific request
     * @param _requestId The ID of the disaster request
     * @return disasterType The type of disaster
     * @return location The location of the disaster
     * @return timestamp The timestamp when the data was received
     * @return reported Whether the disaster has been reported
     */
    function getDisasterData(
        uint _requestId
    )
        external
        view
        returns (
            string memory disasterType,
            string memory location,
            uint timestamp,
            bool reported
        )
    {
        DisasterData storage data = disasterReports[_requestId];
        return (
            data.disasterType,
            data.location,
            data.timestamp,
            data.reported
        );
    }

    /**
     * @dev Check if a request has been fulfilled
     * @param _requestId The ID of the disaster request
     * @return Whether the request has been fulfilled
     */
    function isRequestFulfilled(uint _requestId) external view returns (bool) {
        return disasterReports[_requestId].reported;
    }

    /**
     * @dev Get all requests made by a specific address
     * @param _requester The address of the requester
     * @return requestIds Array of request IDs
     */
    function getRequestsByAddress(
        address _requester
    ) external view returns (uint[] memory) {
        // Count the number of requests by this address
        uint count = 0;
        for (uint i = block.chainid * 10 ** 4; i < nextRequestId; i++) {
            if (requestOwners[i] == _requester) {
                count++;
            }
        }
        // Create an array of the right size
        uint[] memory result = new uint[](count);
        // Fill the array
        uint index = 0;
        for (uint i = block.chainid * 10 ** 4; i < nextRequestId; i++) {
            if (requestOwners[i] == _requester) {
                result[index] = i;
                index++;
            }
        }
        return result;
    }
}
