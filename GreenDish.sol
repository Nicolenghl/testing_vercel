// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title GreenDish - Restaurant carbon credit marketplace
 */
contract GreenDish {
    // =============== STATE VARIABLES =============== //
    address public owner;
    uint public constant ENTRY_FEE = 1 ether;
    uint public dishCounter;
    bool private _locked;

    // Token Variables
    string public constant name = "GreenCoin";
    string public constant symbol = "GRC";
    uint8 public constant decimals = 18;
    uint256 public constant MAX_SUPPLY = 1000000 * 10 ** 18;
    uint256 public totalSupply;
    uint256 public constant REWARD_PERCENTAGE = 10;

    // Loyalty multipliers
    uint256[4] public tierMultipliers = [100, 110, 125, 150];

    // Mappings
    mapping(uint => Dish) public dishes;
    mapping(address => Restaurant) public restaurants;
    mapping(address => uint) public customerCarbonCredits;
    mapping(address => mapping(uint => Transaction)) public userTransactions;
    mapping(address => uint) public userTransactionCount;
    mapping(address => uint256) public balances;
    mapping(address => mapping(address => uint256)) public allowances;
    mapping(address => LoyaltyTier) public customerTier;

    // =============== STRUCTS & ENUMS =============== //
    enum SupplySource {
        LOCAL_PRODUCER,
        IMPORTED_PRODUCER,
        GREEN_PRODUCER,
        OTHER
    }
    enum TransactionStatus {
        CREATED,
        REWARDED,
        REWARD_FAILED
    }
    enum LoyaltyTier {
        BRONZE,
        SILVER,
        GOLD,
        PLATINUM
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

    struct Transaction {
        uint dishId;
        uint timestamp;
        uint carbonCredits;
        uint price;
        TransactionStatus status;
    }

    // =============== EVENTS =============== //
    event DishRegistered(
        uint indexed dishId,
        address indexed restaurant,
        string name
    );
    event DishPurchased(uint indexed dishId, address indexed customer);
    event PurchaseRewarded(
        uint indexed dishId,
        address indexed customer,
        uint reward
    );
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );
    event RestaurantRegistered(
        address indexed restaurant,
        string name,
        SupplySource supplySource
    );
    event RewardFailure(
        uint indexed dishId,
        address indexed customer,
        string reason
    );
    event DishUpdated(
        uint indexed dishId,
        address indexed restaurant,
        bool isActive,
        uint price
    );
    event LoyaltyTierUpdated(
        address indexed customer,
        LoyaltyTier tier,
        uint256 multiplier
    );

    // =============== CONSTRUCTOR =============== //
    constructor(uint _initialSupply) {
        require(msg.sender != address(0));
        owner = msg.sender;
        require(_initialSupply * 10 ** uint256(decimals) <= MAX_SUPPLY);
        totalSupply = _initialSupply * 10 ** uint256(decimals);
        balances[address(this)] = totalSupply;
        emit Transfer(address(0), address(this), totalSupply);
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

    modifier validDish(uint _dishId) {
        require(_dishId > 0 && _dishId <= dishCounter, "Invalid dish ID");
        _;
    }

    modifier nonReentrant() {
        require(!_locked);
        _locked = true;
        _;
        _locked = false;
    }

    modifier onlyDishOwner(uint _dishId) {
        require(dishes[_dishId].restaurant == msg.sender, "Not dish owner");
        _;
    }

    modifier whenDishActive(uint _dishId) {
        require(dishes[_dishId].isActive, "Dish not active");
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
    ) external payable nonReentrant {
        require(!restaurants[msg.sender].isVerified);
        require(msg.value >= ENTRY_FEE);
        require(bytes(_name).length > 0 && bytes(_name).length <= 50);
        require(
            bytes(_supplyDetails).length > 0 &&
                bytes(_supplyDetails).length <= 200
        );
        require(bytes(_dishName).length > 0 && bytes(_dishName).length <= 50);
        require(
            bytes(_dishMainComponent).length > 0 &&
                bytes(_dishMainComponent).length <= 50
        );
        require(_dishPrice > 0);
        require(_dishCarbonCredits > 0 && _dishCarbonCredits <= 100);

        uint excess = msg.value - ENTRY_FEE;
        if (excess > 0) {
            (bool success, ) = payable(msg.sender).call{value: excess}("");
            require(success, "Refund failed");
        }

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

    function addDish(
        string calldata _name,
        string calldata _mainComponent,
        uint _carbonCredits,
        uint _price,
        bool _isActive
    ) external onlyVerifiedRestaurant nonReentrant {
        require(bytes(_name).length > 0 && bytes(_name).length <= 50);
        require(
            bytes(_mainComponent).length > 0 &&
                bytes(_mainComponent).length <= 50
        );
        require(_price > 0);
        require(_carbonCredits > 0 && _carbonCredits <= 100);
        dishCounter++;
        dishes[dishCounter] = Dish({
            name: _name,
            mainComponent: _mainComponent,
            carbonCredits: _carbonCredits,
            price: _price,
            restaurant: msg.sender,
            isActive: _isActive
        });
        restaurants[msg.sender].dishIds.push(dishCounter);
        emit DishRegistered(dishCounter, msg.sender, _name);
    }

    function manageDish(
        uint _dishId,
        string calldata _name,
        uint _price,
        bool _isActive,
        bool _isDeactivateOnly
    )
        external
        onlyVerifiedRestaurant
        nonReentrant
        validDish(_dishId)
        onlyDishOwner(_dishId)
    {
        Dish storage dish = dishes[_dishId];

        if (_isDeactivateOnly) {
            require(dish.isActive, "Dish already inactive");
            dish.isActive = false;
        } else {
            require(bytes(_name).length > 0 && bytes(_name).length <= 50);
            require(_price > 0);
            dish.name = _name;
            dish.price = _price;
            dish.isActive = _isActive;
        }
        emit DishUpdated(_dishId, msg.sender, dish.isActive, dish.price);
    }

    function getRestaurantInfo(
        address _restaurant,
        uint startIdx,
        uint count,
        bool activeOnly
    )
        external
        view
        returns (
            Restaurant memory info,
            uint[] memory dishIds,
            Dish[] memory dishDetails
        )
    {
        info = restaurants[_restaurant];
        if (!info.isVerified || info.dishIds.length == 0)
            return (info, new uint[](0), new Dish[](0));

        uint[] memory validDishIds;
        uint validCount;

        // Filter dishes - either all dishes or only active ones
        if (activeOnly) {
            // Only active dishes
            validDishIds = new uint[](info.dishIds.length);
            for (uint i = 0; i < info.dishIds.length; i++) {
                uint dishId = info.dishIds[i];
                if (dishes[dishId].isActive) {
                    validDishIds[validCount++] = dishId;
                }
            }
        } else {
            // All dishes (active and inactive)
            validCount = info.dishIds.length;
            validDishIds = info.dishIds;
        }

        if (validCount == 0 || startIdx >= validCount)
            return (info, new uint[](0), new Dish[](0));

        uint returnCount = startIdx + count > validCount
            ? validCount - startIdx
            : count;

        dishIds = new uint[](returnCount);
        dishDetails = new Dish[](returnCount);

        for (uint i = 0; i < returnCount; i++) {
            uint dishId = validDishIds[startIdx + i];
            dishIds[i] = dishId;
            dishDetails[i] = dishes[dishId];
        }
    }

    // =============== CUSTOMER FUNCTIONS =============== //
    function purchaseDish(
        uint _dishId
    ) external payable nonReentrant validDish(_dishId) whenDishActive(_dishId) {
        Dish storage dish = dishes[_dishId];
        require(
            restaurants[dish.restaurant].isVerified,
            "Restaurant not verified"
        );
        require(msg.value == dish.price, "Wrong payment amount");
        require(msg.sender != dish.restaurant, "Cannot purchase own dish");

        // Record state changes
        uint txIndex = userTransactionCount[msg.sender]++;
        userTransactions[msg.sender][txIndex] = Transaction({
            dishId: _dishId,
            timestamp: block.timestamp,
            carbonCredits: dish.carbonCredits,
            price: dish.price,
            status: TransactionStatus.CREATED
        });

        // Handle loyalty tier
        customerCarbonCredits[msg.sender] += dish.carbonCredits;
        _updateLoyaltyTier(msg.sender);

        emit DishPurchased(_dishId, msg.sender);

        // Pay restaurant
        (bool paymentSuccess, ) = payable(dish.restaurant).call{
            value: msg.value
        }("");
        require(paymentSuccess, "Payment failed");

        // Process reward
        try
            this.processReward(_dishId, msg.sender, dish.carbonCredits)
        returns (bool success) {
            if (success) {
                userTransactions[msg.sender][txIndex].status = TransactionStatus
                    .REWARDED;
            } else {
                userTransactions[msg.sender][txIndex].status = TransactionStatus
                    .REWARD_FAILED;
                emit RewardFailure(_dishId, msg.sender, "Insufficient balance");
            }
        } catch {
            userTransactions[msg.sender][txIndex].status = TransactionStatus
                .REWARD_FAILED;
            emit RewardFailure(_dishId, msg.sender, "Reward error");
        }
    }

    // CUSTOMER DATA ACCESS FUNCTIONS
    function getMyProfile()
        external
        view
        returns (
            uint carbonCredits,
            uint tokenBalance,
            uint transactionCount,
            LoyaltyTier tier,
            uint256 rewardMultiplier
        )
    {
        LoyaltyTier userTier = customerTier[msg.sender];
        if (customerCarbonCredits[msg.sender] == 0 && uint(userTier) == 0) {
            userTier = LoyaltyTier.BRONZE;
        }
        return (
            customerCarbonCredits[msg.sender],
            balances[msg.sender],
            userTransactionCount[msg.sender],
            userTier,
            tierMultipliers[uint(userTier)]
        );
    }

    function getMyTransactions(
        uint startIndex,
        uint count
    ) external view returns (Transaction[] memory) {
        uint availableCount = userTransactionCount[msg.sender];
        if (startIndex >= availableCount) return new Transaction[](0);

        uint returnCount = startIndex + count > availableCount
            ? availableCount - startIndex
            : count;
        Transaction[] memory result = new Transaction[](returnCount);
        for (uint i = 0; i < returnCount; i++) {
            result[i] = userTransactions[msg.sender][startIndex + i];
        }
        return result;
    }

    // REWARD FUNCTIONS
    function processReward(
        uint _dishId,
        address _recipient,
        uint _carbonCredits
    ) external returns (bool) {
        require(msg.sender == address(this), "Only callable by contract");

        // Calculate reward
        uint baseRewardAmount = (_carbonCredits *
            10 ** uint256(decimals) *
            REWARD_PERCENTAGE) / 100;

        // Apply loyalty tier multiplier
        uint tierIndex = uint(customerTier[_recipient]);
        uint tierMultiplier = tierMultipliers[tierIndex];
        uint rewardAmount = (baseRewardAmount * tierMultiplier) / 100;

        // Process reward
        if (rewardAmount > 0) {
            if (balances[address(this)] >= rewardAmount) {
                _transfer(address(this), _recipient, rewardAmount);
                emit PurchaseRewarded(_dishId, _recipient, rewardAmount);
                return true;
            } else {
                return false;
            }
        }
        return true;
    }

    // =============== HELPER FUNCTIONS =============== //
    function _transfer(
        address sender,
        address recipient,
        uint256 amount
    ) internal {
        require(
            sender != address(0) && recipient != address(0),
            "Zero address"
        );
        require(balances[sender] >= amount, "Insufficient balance");
        balances[sender] -= amount;
        balances[recipient] += amount;
        emit Transfer(sender, recipient, amount);
    }

    function _updateLoyaltyTier(address customer) internal {
        uint credits = customerCarbonCredits[customer];
        LoyaltyTier oldTier = customerTier[customer];
        LoyaltyTier newTier;

        if (credits >= 5000) newTier = LoyaltyTier.PLATINUM;
        else if (credits >= 2000) newTier = LoyaltyTier.GOLD;
        else if (credits >= 500) newTier = LoyaltyTier.SILVER;
        else newTier = LoyaltyTier.BRONZE;

        if (
            newTier != oldTier ||
            (customer != address(0) &&
                oldTier == LoyaltyTier(0) &&
                credits == 0)
        ) {
            customerTier[customer] = newTier;
            emit LoyaltyTierUpdated(
                customer,
                newTier,
                tierMultipliers[uint(newTier)]
            );
        }
    }

    // =============== TOKEN FUNCTIONS =============== //
    function transfer(
        address recipient,
        uint256 amount
    ) external returns (bool) {
        _transfer(msg.sender, recipient, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        require(spender != address(0), "Zero address");
        allowances[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external returns (bool) {
        require(allowances[sender][msg.sender] >= amount, "Exceeds allowance");
        allowances[sender][msg.sender] -= amount;
        _transfer(sender, recipient, amount);
        return true;
    }

    function mint(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Zero address");
        require(totalSupply + amount <= MAX_SUPPLY, "Exceeds max supply");
        totalSupply += amount;
        balances[to] += amount;
        emit Transfer(address(0), to, amount);
    }

    function withdrawEth(uint _amount) external onlyOwner nonReentrant {
        require(address(this).balance >= _amount, "Insufficient balance");
        (bool success, ) = payable(owner).call{value: _amount}("");
        require(success, "Transfer failed");
    }

    receive() external payable {}
}
