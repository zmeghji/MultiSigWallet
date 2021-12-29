const MultiSigWallet = artifacts.require("MultiSigWallet");
const truffleAssert = require('truffle-assertions');
var chai = require("chai");

const BN = web3.utils.BN;
const chaiBN = require('chai-bn')(BN);
chai.use(chaiBN);

var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);

const expect = chai.expect;

contract("MultiSigWallet Test", async accounts => {
    var approver1 = accounts[0];
    var approver2 = accounts[1];
    var approver3 = accounts[2];

    var transferTo = accounts[3];

    async function getBalance(){
        return await web3.eth.getBalance(transferTo);
    }

    it("Should transfer ether upon two approvals", async () => {
        let instance = await MultiSigWallet.deployed();
        console.log(instance.address);
        var balanceBeforeTransfer = await getBalance(transferTo);

        // transfer 10 ether to MultiSigWallet contract
        await web3.eth.sendTransaction({
            from: accounts[4], 
            to:instance.address, 
            value: web3.utils.toWei("10","ether")});

        var transferId;
        
        //create a transfer for 1 ether
        var result = await instance.createTransfer(
            transferTo, web3.utils.toWei("1","ether"),{from: approver1});
        
        //verify that the transfer hasn't gone through yet
        await expect(getBalance(transferTo)).to.eventually.equal(balanceBeforeTransfer);

        //Listen for created event to get transferId
        truffleAssert.eventEmitted(result, 'TransferCreated', (ev) => {
            transferId = ev.id;
            return true;
        });

        //first approval for transfer
        var result = await instance.approveTransfer(transferId, {from: approver2})

        //verify ApprovalReceived event was emitted
        truffleAssert.eventEmitted(result, 'ApprovalReceived', (ev) => {
            return ev.approver === approver2;
        });

        //verify that the transfer hasn't gone through yet
        await expect(getBalance(transferTo)).to.eventually.equal(balanceBeforeTransfer);

        //second approval for transfer
        var result = await instance.approveTransfer(transferId, {from: approver3})

        //verify ApprovalReceived event was emitted
        truffleAssert.eventEmitted(result, 'ApprovalReceived', (ev) => {
            return ev.approver === approver3;
        });

        //verify TransferComplete event was emitted
        truffleAssert.eventEmitted(result, 'TransferComplete', (ev) => {
            return true;
        });
       
        //verify that the transfer has been completed
        await expect(getBalance(transferTo)).to.eventually.equal(
            (new BN(balanceBeforeTransfer)).add(new BN(web3.utils.toWei("1","ether"))).toString());
    })
});