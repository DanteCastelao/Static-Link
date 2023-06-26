const { ethers } = require("hardhat");

async function main() {
  const PaymentContract = await ethers.getContractFactory("PaymentContract");
  const paymentContract = await PaymentContract.deploy();

  await paymentContract.deployed();

  console.log("PaymentContract deployed to:", paymentContract.address);

  const PartyTicket = await ethers.getContractFactory("PartyTicket");
  const partyTicket = await PartyTicket.deploy(paymentContract.address);

  await partyTicket.deployed();

  console.log("PartyTicket deployed to:", partyTicket.address);
}

main().then(() => process.exit(0)).catch((error) => {
  console.error(error);
  process.exit(1);
});
