// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract AnchorRegistry {
    address public trustAnchor;
    mapping(string => bool) private verifiedIssuers;
    mapping(string => uint256) private verificationTimestamps;

    constructor() {
        trustAnchor = msg.sender; 
    }

    modifier onlyTrustAnchor() {
        require(msg.sender == trustAnchor, "Not authorized");
        _;
    }

    function verifyInstitution(string memory _did) public onlyTrustAnchor {
        verifiedIssuers[_did] = true;
        verificationTimestamps[_did] = block.timestamp;
    }

    function checkVerification(string memory _did) public view returns (bool, uint256) {
        return (verifiedIssuers[_did], verificationTimestamps[_did]);
    }
}