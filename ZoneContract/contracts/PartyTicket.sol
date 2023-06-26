// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// Separate Payment Contract
contract PaymentContract {
    // Event emitted when a payment is received
    event PaymentReceived(address payer, uint256 amount);

    // Receive function to accept payments
    receive() external payable {
        emit PaymentReceived(msg.sender, msg.value);
    }
}

contract PartyTicket is ERC1155, Ownable {
    address payable public paymentContract;

    constructor(address payable _paymentContract) ERC1155("") {
        paymentContract = _paymentContract;
    }

    struct Party {
        string uri;
        uint256 ticketPrice;
        uint256 maxCapacity;
        uint256 capacity;
    }

    uint256 public partyId;
    mapping(uint256 => Party) public parties;

    event PartyCreated(address partyOwner, uint256 id);

    /**
     * @dev Retrieves information about a party.
     * @param id The ID of the party.
     * @return uri The URI associated with the party.
     * @return ticketPrice The price of each ticket for the party.
     * @return capacity The current number of tickets sold for the party.
     * @return maxCapacity The maximum capacity of the party.
     */
    function partyInfo(uint256 id) public view returns (string memory uri, uint256 ticketPrice, uint256 capacity, uint256 maxCapacity) {
        Party memory party = parties[id];
        return (party.uri, party.ticketPrice, party.capacity, party.maxCapacity);
    }

    /**
     * @dev Creates a new party.
     * @param _uri The URI associated with the party.
     * @param _ticketPrice The price of each ticket for the party.
     * @param _maxCapacity The maximum capacity of the party.
     */
    function createParty(string memory _uri, uint256 _ticketPrice, uint256 _maxCapacity) public {
        parties[partyId] = Party(_uri, _ticketPrice, _maxCapacity, 0);
        emit PartyCreated(_msgSender(), partyId);
        partyId++;
    }

    /**
     * @dev Mints tickets for a party and assigns them to the specified account.
     * @param account The account to receive the minted tickets.
     * @param id The ID of the party for which tickets are being minted.
     * @param amount The number of tickets to mint.
     * @param data Additional data to pass to the `onERC1155Received` hook.
     */
    function mint(address account, uint256 id, uint256 amount, bytes memory data) public payable {
        Party storage party = parties[id];
        require(party.capacity + amount <= party.maxCapacity, "Party is already sold out!");

        // Ensure payment is made to the payment contract
        uint256 totalPrice = party.ticketPrice * amount;
        require(msg.value == totalPrice, "Incorrect payment amount!");

        // Forward payment to the payment contract
        (bool paymentSuccess, ) = paymentContract.call{value: totalPrice}("");
        require(paymentSuccess, "Payment failed!");

        party.capacity += amount;
        _mint(account, id, amount, data);
    }
}
