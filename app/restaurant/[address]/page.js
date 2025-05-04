'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWeb3 } from '../../context/Web3Context';
import { formatEth, formatAddress, parseEth } from '../../utils/ethers-helpers';

export default function RestaurantDetail({ params }) {
    const restaurantAddress = params.address;
    const router = useRouter();
    const { connect, account, contract, isConnected, loading } = useWeb3();

    const [restaurantInfo, setRestaurantInfo] = useState(null);
    const [dishes, setDishes] = useState([]);
    const [loadingData, setLoadingData] = useState(false);
    const [purchasingDish, setPurchasingDish] = useState(null);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Load restaurant data when connected
    useEffect(() => {
        if (contract) {
            loadRestaurantData();
        }
    }, [contract, restaurantAddress]);

    // Load restaurant and dish data
    const loadRestaurantData = async () => {
        if (!restaurantAddress) return;

        setLoadingData(true);
        setError(null);
        try {
            // Get restaurant info
            const restaurantData = await contract.restaurants(restaurantAddress);

            if (!restaurantData.isVerified) {
                setError("Restaurant not found or not verified.");
                setLoadingData(false);
                return;
            }

            setRestaurantInfo({
                address: restaurantAddress,
                name: restaurantData.name,
                supplySource: restaurantData.supplySource,
                supplyDetails: restaurantData.supplyDetails,
                registrationTimestamp: restaurantData.registrationTimestamp.toNumber()
            });

            // Get restaurant dishes
            const result = await contract.getRestaurantInfo(
                restaurantAddress,
                0,
                100,
                true // Only active dishes
            );

            const formattedDishes = result.dishDetails.map((dish, index) => ({
                id: result.dishIds[index].toNumber(),
                name: dish.name,
                mainComponent: dish.mainComponent,
                carbonCredits: dish.carbonCredits.toNumber(),
                price: dish.price,
                priceEth: formatEth(dish.price),
                isActive: dish.isActive
            }));

            setDishes(formattedDishes);
        } catch (error) {
            console.error("Error loading restaurant data:", error);
            setError("Failed to load restaurant information. Please try again later.");
        } finally {
            setLoadingData(false);
        }
    };

    // Handle dish purchase
    const purchaseDish = async (dish) => {
        if (!isConnected) {
            await connect();
            return;
        }

        setPurchasingDish(dish.id);
        setError(null);
        setSuccess(null);

        try {
            // Call the contract function
            const tx = await contract.purchaseDish(dish.id, {
                value: dish.price,
                gasLimit: 300000 // Set a sufficient gas limit
            });

            // Wait for the transaction to be mined
            await tx.wait();

            setSuccess(`Successfully purchased ${dish.name}! Check your profile for carbon credits and rewards.`);

            // Delay to show success message
            setTimeout(() => {
                setSuccess(null);
            }, 5000);
        } catch (error) {
            console.error("Error purchasing dish:", error);
            if (error.code === 'INSUFFICIENT_FUNDS') {
                setError("Insufficient funds to complete this purchase.");
            } else if (error.message.includes("user rejected")) {
                setError("Transaction was rejected.");
            } else {
                setError("Failed to purchase dish. Please try again.");
            }
        } finally {
            setPurchasingDish(null);
        }
    };

    // Get supply source text
    const getSupplySourceText = (sourceId) => {
        const sources = ["Local Producer", "Imported Producer", "Green Producer", "Other"];
        return sources[sourceId] || "Unknown";
    };

    // Format date from unix timestamp
    const formatDate = (timestamp) => {
        return new Date(timestamp * 1000).toLocaleDateString();
    };

    // Error display component
    const ErrorMessage = ({ message }) => (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 my-4">
            <div className="flex">
                <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                </div>
                <div className="ml-3">
                    <p className="text-sm text-red-700">{message}</p>
                </div>
            </div>
        </div>
    );

    // Success message component
    const SuccessMessage = ({ message }) => (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 my-4">
            <div className="flex">
                <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                </div>
                <div className="ml-3">
                    <p className="text-sm text-green-700">{message}</p>
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

    if (error && !restaurantInfo) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <button
                    onClick={() => router.push('/marketplace')}
                    className="mb-6 text-green-600 hover:text-green-800 flex items-center"
                >
                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                    </svg>
                    Back to Marketplace
                </button>
                <ErrorMessage message={error} />
            </div>
        );
    }

    if (loadingData) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <h1 className="text-2xl font-bold text-green-800 mb-6">Restaurant Menu</h1>
                <LoadingIndicator />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <button
                onClick={() => router.push('/marketplace')}
                className="mb-6 text-green-600 hover:text-green-800 flex items-center"
            >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                </svg>
                Back to Marketplace
            </button>

            {error && <ErrorMessage message={error} />}
            {success && <SuccessMessage message={success} />}

            {restaurantInfo && (
                <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                    <h1 className="text-2xl font-bold text-green-800 mb-2">{restaurantInfo.name}</h1>
                    <p className="text-sm text-gray-500 mb-4">
                        {formatAddress(restaurantInfo.address)} • {getSupplySourceText(restaurantInfo.supplySource)} •
                        Since {formatDate(restaurantInfo.registrationTimestamp)}
                    </p>
                    <div className="border-t border-gray-100 pt-4">
                        <h2 className="text-lg font-medium text-gray-700 mb-2">Supply Details</h2>
                        <p className="text-gray-600">{restaurantInfo.supplyDetails}</p>
                    </div>
                </div>
            )}

            <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Menu</h2>

                {!isConnected && (
                    <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                        <p className="text-yellow-700">Connect your wallet to purchase dishes and earn carbon credits.</p>
                        <button
                            onClick={connect}
                            disabled={loading}
                            className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
                        >
                            {loading ? 'Connecting...' : 'Connect Wallet'}
                        </button>
                    </div>
                )}

                {dishes.length > 0 ? (
                    <div className="bg-white rounded-lg shadow-md overflow-hidden">
                        <ul className="divide-y divide-gray-200">
                            {dishes.map((dish) => (
                                <li key={dish.id} className="p-6">
                                    <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                                        <div className="mb-4 md:mb-0">
                                            <h3 className="text-lg font-medium text-gray-900">{dish.name}</h3>
                                            <p className="text-sm text-gray-500">{dish.mainComponent}</p>
                                            <div className="mt-1 flex items-center">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    {dish.carbonCredits} Carbon Credits
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-start md:items-end">
                                            <p className="text-lg font-medium text-green-600">{dish.priceEth} ETH</p>
                                            <button
                                                onClick={() => purchaseDish(dish)}
                                                disabled={!isConnected || purchasingDish === dish.id}
                                                className="mt-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                            >
                                                {purchasingDish === dish.id ? 'Processing...' : 'Purchase'}
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : (
                    <div className="bg-white p-8 rounded-lg shadow-md text-center">
                        <p className="text-gray-500">No dishes available at this time.</p>
                    </div>
                )}
            </div>
        </div>
    );
} 