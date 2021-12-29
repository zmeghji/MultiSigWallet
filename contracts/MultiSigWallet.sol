pragma solidity 0.7.5; 
pragma abicoder v2;

contract MultiSigWallet
{
    struct Transfer{
        address payable to;
        uint256 amount;
        int256 numberOfApprovals;
        bool completed;
    }
    event TransferCreated(uint256 id);
    event ApprovalReceived(uint256 id, address approver);
    event TransferComplete(uint256 id);
    
    Transfer[] transfers;

    uint8 requiredApprovals;
    mapping (address => bool) owners;
    
    mapping (uint => mapping(address => bool)) transferApprovals;

    modifier onlyOwner(){
        require(owners[msg.sender], "only an owner can execute this function");
        _;
    }

    constructor(uint8 _requiredApprovals, address[] memory _approvingAddresses){
        require(_requiredApprovals>=2, 
            "Number of required approvals must be greater than 2");
        require(_approvingAddresses.length >= _requiredApprovals, 
            "Must have at least as many owners as the number of approvals required");

        requiredApprovals = _requiredApprovals;

        for (uint i =0; i< _approvingAddresses.length; i++){
            owners[_approvingAddresses[i]] = true;
        }
    }

    function createTransfer(address payable _to, uint256 amount) public onlyOwner {
        require(address(this).balance > amount, "not enough ether in account for transfer");
        Transfer memory transfer = Transfer(_to, amount, 0, false);

        transfers.push(transfer);

        emit TransferCreated(transfers.length-1);
    }

    function getTransfer(uint _id) public view returns (Transfer memory){
        require(transfers.length!=0, "no transfers exist right now");
        require( _id <= (transfers.length-1), "No transfer exists with that id");
        return transfers[_id];
    }

    function approveTransfer(uint _id) public onlyOwner {
        Transfer storage transfer = transfers[_id];
        require(!transfer.completed, "transfer has already been completed");
        require(!transferApprovals[_id][msg.sender], 
            "This address has already approved the transfer");

        transferApprovals[_id][msg.sender] = true;
        transfer.numberOfApprovals++;

        emit ApprovalReceived(_id, msg.sender);

        if (transfer.numberOfApprovals >= requiredApprovals){
            transfer.completed = true;
            transfer.to.transfer(transfer.amount);
            emit TransferComplete(_id);
        }
    }

    receive() external payable {}

    function getWalletBalance() public view returns(uint256){
        return address(this).balance;
    }

}