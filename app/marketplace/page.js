'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useWeb3 } from '../context/Web3Context';
import { formatEth } from '../utils/ethers-helpers';

export default function Marketplace() {
    const router = useRouter();
    const { connect, account, contract, isConnected, loading } = useWeb3();
    const [restaurants, setRestaurants] = useState([]);
    const [loadingRestaurants, setLoadingRestaurants] = useState(false);
    const [dishCount, setDishCount] = useState(0);
    const [error, setError] = useState(null);

    // Load initial restaurant data
    useEffect(() => {
        if (contract) {
            loadRestaurantCount();
        }
    }, [contract]);

    // Get total number of dishes to determine how many restaurants to load
    const loadRestaurantCount = async () => {
        try {
            const count = await contract.dishCounter();
            setDishCount(count.toNumber());
            if (count.toNumber() > 0) {
                loadRestaurants();
            }
        } catch (error) {
            console.error("Error loading dish count:", error);
            setError("Failed to load restaurants. Please try again later.");
        }
    };

    // Load restaurant data
    const loadRestaurants = async () => {
        setLoadingRestaurants(true);
        setError(null);
        try {
            const maxDishId = dishCount;
            const uniqueRestaurants = new Set();
            const restaurantDetails = [];

            // Scan through dishes to find unique restaurants
            for (let i = 1; i <= maxDishId; i++) {
                try {
                    const dish = await contract.dishes(i);
                    if (dish.restaurant && dish.isActive && !uniqueRestaurants.has(dish.restaurant)) {
                        uniqueRestaurants.add(dish.restaurant);

                        // Get restaurant details
                        const restaurantInfo = await contract.restaurants(dish.restaurant);
                        if (restaurantInfo.isVerified) {
                            // Get restaurant's dishes
                            const result = await contract.getRestaurantInfo(
                                dish.restaurant,
                                0,
                                10,
                                true // Only active dishes
                            );

                            restaurantDetails.push({
                                address: dish.restaurant,
                                name: restaurantInfo.name,
                                supplySource: restaurantInfo.supplySource,
                                dishCount: result.dishIds.length,
                                dishes: result.dishDetails.map((d, index) => ({
                                    id: result.dishIds[index].toNumber(),
                                    name: d.name,
                                    mainComponent: d.mainComponent,
                                    carbonCredits: d.carbonCredits.toNumber(),
                                    price: formatEth(d.price),
                                }))
                            });
                        }
                    }
                } catch (error) {
                    console.error(`Error loading dish ${i}:`, error);
                    // Continue with other dishes even if one fails
                }
            }

            setRestaurants(restaurantDetails);
        } catch (error) {
            console.error("Error loading restaurants:", error);
            setError("Failed to load restaurants. Please try again later.");
        } finally {
            setLoadingRestaurants(false);
        }
    };

    // Get supply source text
    const getSupplySourceText = (sourceId) => {
        const sources = ["Local Producer", "Imported Producer", "Green Producer", "Other"];
        return sources[sourceId] || "Unknown";
    };

    // Handle viewing restaurant details
    const viewRestaurant = (address) => {
        router.push(`/restaurant/${address}`);
    };

    // Error display component
    const ErrorMessage = () => (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 my-4">
            <div className="flex">
                <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                </div>
                <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            </div>
        </div>
    );

    // Loading indicator
    const LoadingIndicator = () => (
        <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <h1 className="text-3xl font-bold text-green-800 mb-2">Sustainable Dining Marketplace</h1>
                <p className="text-gray-600">
                    Browse sustainable restaurants and dishes. Each purchase earns you carbon credits and rewards.
                </p>

                {!isConnected && (
                    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                        <p className="text-yellow-700 mb-2">Connect your wallet to purchase dishes and earn rewards.</p>
                        <button
                            onClick={connect}
                            disabled={loading}
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
                        >
                            {loading ? 'Connecting...' : 'Connect Wallet'}
                        </button>
                    </div>
                )}

                {error && <ErrorMessage />}
            </div>

            {loadingRestaurants ? (
                <LoadingIndicator />
            ) : restaurants.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {restaurants.map((restaurant) => (
                        <div key={restaurant.address} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                            <div className="p-6">
                                <h2 className="text-xl font-semibold text-gray-800 mb-2">{restaurant.name}</h2>
                                <p className="text-sm text-gray-500 mb-4">
                                    Supply Source: {getSupplySourceText(restaurant.supplySource)}
                                </p>

                                <div className="border-t border-gray-100 pt-4 mt-4">
                                    <h3 className="text-md font-medium text-gray-700 mb-3">Featured Dishes</h3>
                                    <ul className="space-y-3">
                                        {restaurant.dishes.slice(0, 3).map((dish) => (
                                            <li key={dish.id} className="flex justify-between items-center">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{dish.name}</p>
                                                    <p className="text-xs text-gray-500">{dish.carbonCredits} carbon credits</p>
                                                </div>
                                                <p className="text-sm font-medium text-green-600">{dish.price} ETH</p>
                                            </li>
                                        ))}
                                    </ul>

                                    {restaurant.dishCount > 3 && (
                                        <p className="text-xs text-gray-500 mt-2">
                                            +{restaurant.dishCount - 3} more dishes
                                        </p>
                                    )}
                                </div>

                                <div className="mt-6">
                                    <button
                                        onClick={() => viewRestaurant(restaurant.address)}
                                        className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                                    >
                                        View Menu
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : !loadingRestaurants && dishCount === 0 ? (
                <div className="bg-white p-8 rounded-lg shadow-md text-center">
                    <h2 className="text-2xl font-semibold text-gray-700 mb-2">No Restaurants Available</h2>
                    <p className="text-gray-500">There are currently no restaurants in the marketplace.</p>
                </div>
            ) : null}
        </div>
    );
} 