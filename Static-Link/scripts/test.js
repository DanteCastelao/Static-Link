const { ethers } = require("hardhat");

async function estimateGas() {
  // Compile your contracts
  const PaymentContract = await ethers.getContractFactory("PaymentContract");
  const PartyTicket = await ethers.getContractFactory("PartyTicket");

  // Deploy the PaymentContract
  const paymentContract = await PaymentContract.deploy();
  await paymentContract.deployed();

  // Deploy the PartyTicket contract with the PaymentContract address as the constructor argument
  const partyTicket = await PartyTicket.deploy(paymentContract.address);
  await partyTicket.deployed();

  // Estimate gas for PaymentContract deployment
  const paymentContractGasEstimate = await ethers.provider.estimateGas(paymentContract.deployTransaction);
  console.log("PaymentContract Gas estimate:", paymentContractGasEstimate.toString());

  // Estimate gas for PartyTicket deployment
  const partyTicketGasEstimate = await ethers.provider.estimateGas(partyTicket.deployTransaction);
  console.log("PartyTicket Gas estimate:", partyTicketGasEstimate.toString());
}

estimateGas()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
