// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title SimpleGreenDish - Minimal version for testing
 */
contract SimpleGreenDish {
    // =============== STATE VARIABLES =============== //
    address public owner;
    uint public dishCounter;

    // Mappings
    mapping(uint => Dish) public dishes;
    mapping(address => Restaurant) public restaurants;

    // =============== STRUCTS & ENUMS =============== //
    enum SupplySource {
        LOCAL_PRODUCER,
        IMPORTED_PRODUCER,
        GREEN_PRODUCER,
        OTHER
    }

    struct Dish {
        string name;
        string mainComponent;
        uint carbonCredits;
        uint price;
        address restaurant;
        bool isActive;
    }

    struct Restaurant {
        bool isVerified;
        string name;
        SupplySource supplySource;
        string supplyDetails;
        uint registrationTimestamp;
        uint[] dishIds;
    }

    // =============== EVENTS =============== //
    event DishRegistered(
        uint indexed dishId,
        address indexed restaurant,
        string name
    );
    event RestaurantRegistered(
        address indexed restaurant,
        string name,
        SupplySource supplySource
    );

    // =============== CONSTRUCTOR =============== //
    constructor() {
        owner = msg.sender;
    }

    // =============== MODIFIERS =============== //
    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    modifier onlyVerifiedRestaurant() {
        require(restaurants[msg.sender].isVerified, "Not verified");
        _;
    }

    // =============== RESTAURANT FUNCTIONS =============== //
    function restaurantRegister(
        string calldata _name,
        SupplySource _supplySource,
        string calldata _supplyDetails,
        string memory _dishName,
        string memory _dishMainComponent,
        uint _dishCarbonCredits,
        uint _dishPrice
    ) external {
        require(!restaurants[msg.sender].isVerified, "Already registered");
        require(bytes(_name).length > 0, "Name required");
        require(bytes(_dishName).length > 0, "Dish name required");
        require(_dishPrice > 0, "Price must be positive");

        restaurants[msg.sender] = Restaurant({
            isVerified: true,
            name: _name,
            supplySource: _supplySource,
            supplyDetails: _supplyDetails,
            registrationTimestamp: block.timestamp,
            dishIds: new uint[](0)
        });

        dishCounter++;
        uint dishId = dishCounter;
        dishes[dishId] = Dish({
            name: _dishName,
            mainComponent: _dishMainComponent,
            carbonCredits: _dishCarbonCredits,
            price: _dishPrice,
            restaurant: msg.sender,
            isActive: true
        });
        restaurants[msg.sender].dishIds.push(dishId);

        emit RestaurantRegistered(msg.sender, _name, _supplySource);
        emit DishRegistered(dishId, msg.sender, _dishName);
    }

    // =============== CUSTOMER FUNCTIONS =============== //
    function purchaseDish(uint _dishId) external payable {
        require(_dishId > 0 && _dishId <= dishCounter, "Invalid dish ID");
        Dish storage dish = dishes[_dishId];
        require(dish.isActive, "Dish not active");
        require(
            restaurants[dish.restaurant].isVerified,
            "Restaurant not verified"
        );
        require(msg.value == dish.price, "Wrong payment amount");

        // Pay restaurant
        (bool success, ) = payable(dish.restaurant).call{value: msg.value}("");
        require(success, "Payment failed");
    }

    // =============== VIEW FUNCTIONS =============== //
    function isRestaurantVerified(
        address _restaurant
    ) external view returns (bool) {
        return restaurants[_restaurant].isVerified;
    }

    function getDish(uint _dishId) external view returns (Dish memory) {
        require(_dishId > 0 && _dishId <= dishCounter, "Invalid dish ID");
        return dishes[_dishId];
    }
}
