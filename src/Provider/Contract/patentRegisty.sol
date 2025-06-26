// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract PatentRegistry {
    struct Patent {
        address owner;
        string title;
        string description;
        string[] ipfsHashes;
        uint256 timestamp;
        bool isDeleted;
    }

    mapping(uint256 => Patent) public patents;
    uint256 public patentCount;

    event PatentCreated(uint256 indexed id, address indexed owner);
    event HashAdded(uint256 indexed id, string ipfsHash);
    event MetadataUpdated(uint256 indexed id);
    event PatentDeleted(uint256 indexed id);

    modifier onlyOwner(uint256 _id) {
         require(_id < patentCount, "Invalid patent ID");
        require(patents[_id].owner == msg.sender, "Not the owner");
        _;
    }

    function createPatent(
        string memory _title,
        string memory _description,
        string[] memory _ipfsHashes
    ) external {
        patents[patentCount] = Patent({
            owner: msg.sender,
            title: _title,
            description: _description,
            ipfsHashes: _ipfsHashes,
            timestamp: block.timestamp,
            isDeleted: false
        });

        emit PatentCreated(patentCount, msg.sender);
        patentCount++;
    }

   function getActivePatentCount() public view returns (uint256 count) {
    for (uint i = 0; i < patentCount; i++) {
        if (!patents[i].isDeleted) {
            count++;
        }
    }
    return count; 
}



    function addIPFSHash(uint256 _id, string memory _newHash) external onlyOwner(_id) {
        require(!patents[_id].isDeleted, "Patent is deleted");
        patents[_id].ipfsHashes.push(_newHash);
        emit HashAdded(_id, _newHash);
    }

    function updateDescription(uint256 _id, string memory _newDescription) external onlyOwner(_id) {
        require(!patents[_id].isDeleted, "Patent is deleted");
        patents[_id].description = _newDescription;
        emit MetadataUpdated(_id);
    }

    function getPatent(uint256 _id) external view returns (Patent memory) {
        require(_id < patentCount, "Invalid patent ID");
        require(!patents[_id].isDeleted, "Patent is deleted");
        return patents[_id];
    }

    function getAllPatents() external view returns (Patent[] memory) {
        uint count = 0;
        for (uint i = 0; i < patentCount; i++) {
            if (!patents[i].isDeleted) {
                count++;
            }
        }

        Patent[] memory allPatents = new Patent[](count);
        uint j = 0;
        for (uint i = 0; i < patentCount; i++) {
            if (!patents[i].isDeleted) {
                allPatents[j] = patents[i];
                j++;
            }
        }

        return allPatents;
    }

    function getMyPatents() external view returns (uint256[] memory) {
        uint256[] memory result = new uint256[](patentCount);
        uint count = 0;
        for (uint i = 0; i < patentCount; i++) {
            if (patents[i].owner == msg.sender && !patents[i].isDeleted) {
                result[count] = i;
                count++;
            }
        }

        uint256[] memory finalResult = new uint256[](count);
        for (uint j = 0; j < count; j++) {
            finalResult[j] = result[j];
        }

        return finalResult;
    }

    function deletePatent(uint256 _id) external onlyOwner(_id) {
       
        require(!patents[_id].isDeleted, "Patent already deleted");
        patents[_id].isDeleted = true;
        emit PatentDeleted(_id);
    }
}
