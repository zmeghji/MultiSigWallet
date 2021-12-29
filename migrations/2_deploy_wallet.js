const MultiSigWallet = artifacts.require("MultiSigWallet");

module.exports = async function(deployer) {
  let addr = await web3.eth.getAccounts();

  await deployer.deploy(MultiSigWallet, 2, [addr[0],addr[1], addr[2]]);
};