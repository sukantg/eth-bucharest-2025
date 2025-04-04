// SPDX-License-Identifier: MIT
// (c)2024 Atlas (atlas@vialabs.io)
pragma solidity ^0.8.17;

import "../node_modules/@vialabs-io/npm-contracts/MessageClient.sol";

/**
 * @title DisasterVerification
 * @dev A cross-chain contract that requests and receives disaster verification
 * from off-chain nodes using VIA Labs' private oracle.
 */
contract DisasterVerification is MessageClient {
    // Events for tracking verification requests and responses
    event VerificationRequested(
        uint indexed requestId,
        address indexed requester,
        string location,
        string disasterType
    );
    event VerificationReceived(
        uint indexed requestId,
        bool verified,
        string location,
        string disasterType,
        uint timestamp
    );

    // Struct to store disaster verification requests
    struct VerificationRequest {
        string location;
        string disasterType;
        address requester;
        uint timestamp;
        bool verified;
        bool fulfilled;
    }

    // Mapping to store disaster verification requests
    mapping(uint => VerificationRequest) public verificationRequests;

    // Mapping to track request owners
    mapping(uint => address) public requestOwners;

    // Request counter
    uint public nextRequestId;

    constructor() {
        MESSAGE_OWNER = msg.sender;
        nextRequestId = block.chainid * 10 ** 4;
    }

    /**
     * @dev Request disaster verification for a specific location and disaster type
     * @param _location A string describing the location (e.g., "California, USA")
     * @param _disasterType A string describing the type of disaster (e.g., "earthquake", "hurricane")
     * @return requestId The ID of the verification request
     */
    function requestVerification(
        string memory _location,
        string memory _disasterType
    ) external returns (uint) {
        uint requestId = nextRequestId;

        // Store the request
        verificationRequests[requestId] = VerificationRequest({
            location: _location,
            disasterType: _disasterType,
            requester: msg.sender,
            timestamp: block.timestamp,
            verified: false,
            fulfilled: false
        });

        // Store the request owner
        requestOwners[requestId] = msg.sender;

        // Increment the request ID
        nextRequestId++;

        // Encode the feature data (requestId, location, and disasterType)
        bytes memory featureData = abi.encode(
            requestId,
            _location,
            _disasterType
        );

        // Empty message data since we're using feature data
        bytes memory messageData = "";

        // Check if MESSAGEv3 is set
        require(address(MESSAGEv3) != address(0), "Oracle not configured");

        // Send the message with feature ID (e.g., 2 for Disaster Verification) to the current chain
        _sendMessageWithFeature(
            block.chainid, // Send to the current chain
            messageData,
            2, // Feature ID for Disaster Verification (choose a unique ID)
            featureData
        );

        // Emit event
        emit VerificationRequested(
            requestId,
            msg.sender,
            _location,
            _disasterType
        );

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
        // Decode the feature response to get the verification result
        (
            uint requestId,
            bool verified,
            string memory location,
            string memory disasterType
        ) = abi.decode(_featureResponse, (uint, bool, string, string));

        // Update the verification request data
        VerificationRequest storage request = verificationRequests[requestId];
        require(
            keccak256(bytes(request.location)) == keccak256(bytes(location)),
            "Location mismatch in response"
        );
        require(
            keccak256(bytes(request.disasterType)) ==
                keccak256(bytes(disasterType)),
            "Disaster type mismatch in response"
        );

        request.verified = verified;
        request.fulfilled = true;

        // Emit event
        emit VerificationReceived(
            requestId,
            verified,
            location,
            disasterType,
            block.timestamp
        );
    }

    /**
     * @dev Get verification data for a specific request
     * @param _requestId The ID of the verification request
     * @return location The location of the request
     * @return disasterType The type of disaster
     * @return requester The address that made the request
     * @return timestamp The timestamp of the request
     * @return verified Whether the disaster was verified
     * @return fulfilled Whether the request has been fulfilled
     */
    function getVerificationData(
        uint _requestId
    )
        external
        view
        returns (
            string memory location,
            string memory disasterType,
            address requester,
            uint timestamp,
            bool verified,
            bool fulfilled
        )
    {
        VerificationRequest storage request = verificationRequests[_requestId];
        return (
            request.location,
            request.disasterType,
            request.requester,
            request.timestamp,
            request.verified,
            request.fulfilled
        );
    }

    /**
     * @dev Check if a verification request has been fulfilled
     * @param _requestId The ID of the verification request
     * @return Whether the request has been fulfilled
     */
    function isVerificationFulfilled(
        uint _requestId
    ) external view returns (bool) {
        return verificationRequests[_requestId].fulfilled;
    }

    /**
     * @dev Get all verification requests made by a specific address
     * @param _requester The address of the requester
     * @return requestIds Array of request IDs
     */
    function getRequestsByAddress(
        address _requester
    ) external view returns (uint[] memory) {
        uint count = 0;
        for (uint i = block.chainid * 10 ** 4; i < nextRequestId; i++) {
            if (requestOwners[i] == _requester) {
                count++;
            }
        }

        uint[] memory result = new uint[](count);
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
