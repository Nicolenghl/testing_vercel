// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract TestContract {
    string public name = "TestContract";
    address public owner;
    uint256 public counter;

    constructor() {
        owner = msg.sender;
        counter = 1;
    }

    function increment() public {
        counter += 1;
    }

    function getOwner() public view returns (address) {
        return owner;
    }
}
