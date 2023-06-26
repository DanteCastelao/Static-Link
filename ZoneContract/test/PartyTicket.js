// SPDX-License-Identifier: MIT
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PartyTicket", function () {
  let PartyTicket;
  let partyTicket;
  let paymentContract;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    PartyTicket = await ethers.getContractFactory("PartyTicket");
    [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy PaymentContract
    const PaymentContract = await ethers.getContractFactory("PaymentContract");
    paymentContract = await PaymentContract.deploy();
    await paymentContract.deployed();

    // Deploy PartyTicket with PaymentContract address
    partyTicket = await PartyTicket.deploy(paymentContract.address);
    await partyTicket.deployed();
  });

  describe("createParty", function () {
    it("should create a new party", async function () {
      const uri = "https://example.com/party/1";
      const ticketPrice = 100;
      const maxCapacity = 1000;

      const tx = await partyTicket.createParty(uri, ticketPrice, maxCapacity);

      expect(tx).to.emit(partyTicket, "PartyCreated").withArgs(owner.address, 0);

      const partyInfo = await partyTicket.partyInfo(0);

      expect(partyInfo).to.deep.equal([uri, ticketPrice, 0, maxCapacity]);
    });
  });

  describe("mint", function () {
    beforeEach(async function () {
      await partyTicket.createParty("https://example.com/party/1", 100, 1000);
    });

    it("should mint tickets to an address", async function () {
      const tokenId = 0;
      const amount = 5;
      const data = "0x";

      // Mint tickets and make payment
      await expect(() =>
        partyTicket.connect(addr1).mint(addr1.address, tokenId, amount, data, {
          value: amount * 100, // Multiply ticketPrice by amount for payment
        })
      ).to.changeEtherBalance(paymentContract, amount * 100); // Check paymentContract balance

      const balance = await partyTicket.balanceOf(addr1.address, tokenId);

      expect(balance.toNumber()).to.equal(amount);

      const partyInfo = await partyTicket.partyInfo(tokenId);

      expect(partyInfo[2]).to.equal(amount);
    });

    it("should revert if the party is already sold out", async function () {
      const tokenId = 0;
      const amount = 1001;
      const data = "0x";

      await expect(
        partyTicket.connect(addr1).mint(addr1.address, tokenId, amount, data, {
          value: amount * 100, // Multiply ticketPrice by amount for payment
        })
      ).to.be.revertedWith("Party is already sold out!");
    });

    it("should revert if the payment amount is incorrect", async function () {
      const tokenId = 0;
      const amount = 5;
      const data = "0x";

      await expect(
        partyTicket.connect(addr1).mint(addr1.address, tokenId, amount, data, {
          value: 50, // Incorrect payment amount
        })
      ).to.be.revertedWith("Incorrect payment amount!");
    });
  });
});
