'use client';

import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useWeb3 } from '../context/Web3Context';

export default function Marketplace() {
  const { contract, account, isConnected, connect, loading: walletLoading } = useWeb3();
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  
  // Fallback mock data in case contract interaction fails
  const mockDishes = [
    { id: 1, name: "Organic Vegan Bowl", mainComponent: "Local Vegetables", carbonCredits: 25, price: "0.01" },
    { id: 2, name: "Sustainable Fish Tacos", mainComponent: "MSC Certified Fish", carbonCredits: 40, price: "0.015" },
    { id: 3, name: "Farm-to-Table Salad", mainComponent: "Seasonal Greens", carbonCredits: 15, price: "0.008" }
  ];
  
  useEffect(() => {
    async function fetchDishes() {
      if (!contract) {
        // If no contract, use mock data
        setDishes(mockDishes);
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        // Get dish IDs from contract
        const dishIds = await contract.getDishes();
        
        if (dishIds.length === 0) {
          setDishes([]);
          setLoading(false);
          return;
        }
        
        // Get details for each dish
        const dishPromises = dishIds.map(async (id) => {
          try {
            const details = await contract.getDishDetails(id);
            
            return {
              id: id.toNumber(),
              name: details[0],
              mainComponent: details[1],
              carbonCredits: details[2].toNumber(),
              price: window.ethers.utils.formatEther(details[3]),
              restaurant: details[4],
              isActive: details[5],
              isVerified: details[6]
            };
          } catch (err) {
            console.error(`Error fetching dish ${id}:`, err);
            return null;
          }
        });
        
        const dishDetails = await Promise.all(dishPromises);
        // Filter out null results and inactive dishes
        const validDishes = dishDetails.filter(dish => dish && dish.isActive);
        
        setDishes(validDishes.length > 0 ? validDishes : mockDishes);
      } catch (err) {
        console.error("Error fetching dishes:", err);
        setError("Failed to load dishes. Using sample data instead.");
        setDishes(mockDishes);
      } finally {
        setLoading(false);
      }
    }
    
    fetchDishes();
  }, [contract]);
  
  const handlePurchase = async (dishId, price) => {
    if (!isConnected) {
      alert("Please connect your wallet first");
      connect();
      return;
    }
    
    if (!contract) {
      alert("Contract not connected. Please try again later.");
      return;
    }
    
    try {
      setPurchaseLoading(true);
      
      const priceInWei = window.ethers.utils.parseEther(price);
      const tx = await contract.purchaseDishWithEth(dishId, { 
        value: priceInWei 
      });
      
      alert("Transaction submitted! Please wait for confirmation...");
      
      const receipt = await tx.wait();
      
      alert("Purchase successful! You've earned carbon credits!");
      
      // Refresh dishes (in case any status changed)
      window.location.reload();
    } catch (err) {
      console.error("Purchase error:", err);
      alert(`Transaction failed: ${err.message}`);
    } finally {
      setPurchaseLoading(false);
    }
  };
  
  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-green-100">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 text-center mb-8">Sustainable Dish Marketplace</h1>
        
        {!isConnected && (
          <div className="bg-yellow-50 border border-yellow-100 text-yellow-800 p-4 rounded-md mb-8 text-center">
            Please connect your wallet to purchase dishes and earn rewards.
          </div>
        )}
        
        {loading || walletLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
            <p className="mt-4 text-gray-600">Loading dishes...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-100 text-red-700 p-4 rounded-md mb-8">
            {error}
          </div>
        ) : dishes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No dishes available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dishes.map((dish) => (
              <div key={dish.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{dish.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">Main ingredient: {dish.mainComponent}</p>
                    </div>
                    <div className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                      {dish.carbonCredits} carbon credits
                    </div>
                  </div>
                  
                  <div className="mt-4 flex items-center">
                    <span className="text-lg font-bold text-gray-900">{dish.price} ETH</span>
                  </div>
                  
                  <div className="mt-6">
                    {isConnected ? (
                      <button
                        onClick={() => handlePurchase(dish.id, dish.price)}
                        disabled={purchaseLoading}
                        className={`w-full ${purchaseLoading ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'} text-white font-bold py-2 px-4 rounded transition duration-200`}
                      >
                        {purchaseLoading ? 'Processing...' : 'Purchase Dish'}
                      </button>
                    ) : (
                      <button
                        onClick={connect}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-200"
                      >
                        Connect Wallet to Purchase
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}