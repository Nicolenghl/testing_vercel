Main page 

Restaurant: 
user flow: the restaurant get up to the page, clicked register, fill in the required information, add the first dish and pay for the entry fee. After sucessful registration, it will be direct to their profile page showing their existing dish. they can then choose to mange/ update exisitng dish details or add new dish. 
1. register page: access smart contract function restaurantRegister
2. profile page: access smart contract function addDish, manageDish, getRestaurantInfo

Customer: 
user flow: when they get on the webpage, they can access the marketplace where all the restaruants will be there and if they click into it it will pop up like a menu page where they are see the list of active dish. Then they can click on a single dish and choose to purchase them according to the price tagged by the restaurant. After sucessful purchase, they will be rewarded the GRC token. they can then check out their profile on their loyalty stage which i beleive it is initalted already, as well as check out their transaction record, their accumulated carbon credits and tokens. 
1. makerplace and menu page: access smart contract function getRestaurantInfo
2. Purchase page: purchaseDish
3. Customer profile page: getMyProfile, getMyTransactions

thoughout the proceess, all functions in the smart contract shd be performed 
