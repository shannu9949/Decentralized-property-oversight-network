// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract RealEstate {

    struct Entity {
        address[] right_holders;
        uint price;
        uint document_no;
        uint yearOfRegistration;
    }

    struct PurchaseProposal {
        address proposer;
        address[] claimants;
        mapping(address => bool) approvals;
        uint approvalCount;
        bool active;
    }

    event NewRegistration(address indexed registrant, uint document_no, uint year);
    event PurchaseProposalCreated(uint document_no, address proposer, address[] claimants);
    event PurchaseApproved(uint document_no, address right_holder);
    event PurchaseCompleted(uint document_no, address[] new_right_holders);

    mapping(address => mapping(uint => Entity)) public Lands; // Nested mapping to allow multiple lands per address
    mapping(address => uint[]) public ownerDocuments; // Track documents for each owner
    mapping(uint => PurchaseProposal) public purchaseProposals;
    mapping(uint => address) public documentToOwner; // Track owner by document number

    modifier isNotRegistered(address owner, uint document_no) {
        require(Lands[owner][document_no].document_no == 0, "Sorry, this document number is already registered.");
        _;
    }

    modifier onlyRightHolder(uint document_no) {
        address owner = documentToOwner[document_no];
        require(isRightHolder(msg.sender, owner, document_no), "Only a right holder can perform this action.");
        _;
    }

    modifier hasLands() {
        require(ownerDocuments[msg.sender].length > 0, "No lands registered for this address.");
        _;
    }

    modifier notRegistrantOrRightHolder(uint document_no) {
        address owner = documentToOwner[document_no];
        require(owner != msg.sender, "The registrant cannot call this function.");
        require(!isRightHolder(msg.sender, owner, document_no), "A right holder cannot call this function.");
        _;
    }

    function register(address[] memory right_holders, uint price, uint document_no) external isNotRegistered(msg.sender, document_no) {
        uint year = getYear(block.timestamp);
        Entity memory newLand = Entity(right_holders, price, document_no, year);
        for(uint i=0 ; i<right_holders.length;i++){
            Lands[right_holders[i]][document_no] = newLand;
            ownerDocuments[right_holders[i]].push(document_no); // Track the document number for the owner
        }
        documentToOwner[document_no] = msg.sender;
        emit NewRegistration(msg.sender, document_no, year);
    }

    function retrieve() public view hasLands returns (Entity[] memory) {
        uint totalLands = ownerDocuments[msg.sender].length;
        Entity[] memory allLands = new Entity[](totalLands);

        for (uint i = 0; i < totalLands; i++) {
            uint document_no = ownerDocuments[msg.sender][i];
            allLands[i] = Lands[msg.sender][document_no];
        }
        return allLands;
    }

    function getTotalLands() public view hasLands returns (uint) {
        return ownerDocuments[msg.sender].length;
    }

    function Purchase(uint document_no, address[] memory claimants) public notRegistrantOrRightHolder(document_no) {
        address owner = documentToOwner[document_no];
        Entity storage land = Lands[owner][document_no];
        require(land.document_no != 0, "Land not found.");

        PurchaseProposal storage proposal = purchaseProposals[document_no];
        require(!proposal.active, "A purchase proposal is already active.");

        proposal.proposer = msg.sender;
        proposal.claimants = claimants;
        proposal.approvalCount = 0;
        proposal.active = true;

        for (uint i = 0; i < land.right_holders.length; i++) {
            proposal.approvals[land.right_holders[i]] = false;
        }

        emit PurchaseProposalCreated(document_no, msg.sender, claimants);
    }

    function approvePurchase(uint document_no) public onlyRightHolder(document_no) {
        PurchaseProposal storage proposal = purchaseProposals[document_no];
        require(proposal.active, "No active purchase proposal found.");
        require(!proposal.approvals[msg.sender], "You have already approved this purchase.");

        proposal.approvals[msg.sender] = true;
        proposal.approvalCount++;

        emit PurchaseApproved(document_no, msg.sender);

        address owner = documentToOwner[document_no];
        if (proposal.approvalCount == getRightHoldersCount(owner, document_no)) {
            completePurchase(document_no);
        }
    }

    function completePurchase(uint document_no) internal {
        PurchaseProposal storage proposal = purchaseProposals[document_no];
        address oldOwner = documentToOwner[document_no];
        Entity storage land = Lands[oldOwner][document_no];

        require(proposal.approvalCount == land.right_holders.length, "Not all right holders have approved.");

        // Store old right holders
        address[] memory oldRightHolders = land.right_holders;

        // Update the right holders to the claimants
        land.right_holders = proposal.claimants;

        // Transfer land to new owner (proposer)
        address newOwner = proposal.proposer;
        Lands[newOwner][document_no] = land;
        ownerDocuments[newOwner].push(document_no);
        documentToOwner[document_no] = newOwner;

        // Remove land from the old right holders
        for (uint i = 0; i < oldRightHolders.length; i++) {
            delete Lands[oldRightHolders[i]][document_no];
            _removeDocumentFromOwner(oldRightHolders[i], document_no);
        }
        
        // Remove land from the old owner
        delete Lands[oldOwner][document_no];
        _removeDocumentFromOwner(oldOwner, document_no);

        proposal.active = false;

        emit PurchaseCompleted(document_no, proposal.claimants);
    }

    function isRightHolder(address user, address owner, uint document_no) internal view returns (bool) {
        Entity storage land = Lands[owner][document_no];
        for (uint i = 0; i < land.right_holders.length; i++) {
            if (land.right_holders[i] == user) {
                return true;
            }
        }
        return false;
    }

    function getRightHoldersCount(address owner, uint document_no) internal view returns (uint) {
        Entity storage land = Lands[owner][document_no];
        return land.right_holders.length;
    }

    function getYear(uint timestamp) internal pure returns (uint) {
        // Approximate year calculation based on Unix timestamp
        uint SECONDS_IN_YEAR = 31556926; // Average seconds in a year accounting for leap years
        return 1970 + (timestamp / SECONDS_IN_YEAR);
    }

    function _removeDocumentFromOwner(address owner, uint document_no) internal {
        uint[] storage documents = ownerDocuments[owner];
        for (uint i = 0; i < documents.length; i++) {
            if (documents[i] == document_no) {
                documents[i] = documents[documents.length - 1];
                documents.pop();
                break;
            }
        }
    }
}
