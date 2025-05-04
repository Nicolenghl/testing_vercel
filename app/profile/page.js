'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWeb3 } from '../context/Web3Context';
import { formatEth, formatAddress } from '../utils/ethers-helpers';

export default function CustomerProfile() {
    const router = useRouter();
    const { connect, account, contract, isConnected, loading } = useWeb3();

    const [profileData, setProfileData] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loadingProfile, setLoadingProfile] = useState(false);
    const [loadingTransactions, setLoadingTransactions] = useState(false);
    const [error, setError] = useState(null);

    // Load profile data when connected
    useEffect(() => {
        if (isConnected && contract && account) {
            loadProfileData();
            loadTransactionHistory();
        }
    }, [isConnected, contract, account]);

    // Load customer profile data
    const loadProfileData = async () => {
        setLoadingProfile(true);
        setError(null);
        try {
            const profile = await contract.getMyProfile();

            setProfileData({
                carbonCredits: profile.carbonCredits.toNumber(),
                tokenBalance: formatEth(profile.tokenBalance),
                transactionCount: profile.transactionCount.toNumber(),
                tier: profile.tier,
                rewardMultiplier: profile.rewardMultiplier.toNumber() / 100 // Convert from percentage basis to decimal
            });
        } catch (error) {
            console.error("Error loading profile data:", error);
            setError("Failed to load profile data. Please try again later.");
        } finally {
            setLoadingProfile(false);
        }
    };

    // Load transaction history
    const loadTransactionHistory = async () => {
        setLoadingTransactions(true);
        try {
            const count = (await contract.userTransactionCount(account)).toNumber();

            if (count > 0) {
                const transactionBatch = await contract.getMyTransactions(0, count);

                // Get dishes info for each transaction
                const txsWithDetails = await Promise.all(
                    transactionBatch.map(async (tx, index) => {
                        try {
                            const dish = await contract.dishes(tx.dishId);
                            return {
                                id: index,
                                dishId: tx.dishId.toNumber(),
                                timestamp: tx.timestamp.toNumber(),
                                carbonCredits: tx.carbonCredits.toNumber(),
                                price: formatEth(tx.price),
                                status: tx.status,
                                dishName: dish.name,
                                restaurant: dish.restaurant
                            };
                        } catch (error) {
                            console.error(`Error getting dish details for transaction ${index}:`, error);
                            return {
                                id: index,
                                dishId: tx.dishId.toNumber(),
                                timestamp: tx.timestamp.toNumber(),
                                carbonCredits: tx.carbonCredits.toNumber(),
                                price: formatEth(tx.price),
                                status: tx.status,
                                dishName: "Unknown",
                                restaurant: "0x0000000000000000000000000000000000000000"
                            };
                        }
                    })
                );

                // Sort by most recent first
                setTransactions(txsWithDetails.sort((a, b) => b.timestamp - a.timestamp));
            }
        } catch (error) {
            console.error("Error loading transaction history:", error);
            setError("Failed to load transaction history. Please try again later.");
        } finally {
            setLoadingTransactions(false);
        }
    };

    // Format date from unix timestamp
    const formatDate = (timestamp) => {
        return new Date(timestamp * 1000).toLocaleString();
    };

    // Get status text
    const getStatusText = (status) => {
        const statuses = ["Created", "Rewarded", "Reward Failed"];
        return statuses[status] || "Unknown";
    };

    // Get tier text
    const getTierText = (tier) => {
        const tiers = ["Bronze", "Silver", "Gold", "Platinum"];
        return tiers[tier] || "Unknown";
    };

    // Get tier color
    const getTierColor = (tier) => {
        const colors = {
            0: "bg-amber-100 text-amber-800", // Bronze
            1: "bg-gray-100 text-gray-800",   // Silver
            2: "bg-yellow-100 text-yellow-800", // Gold
            3: "bg-indigo-100 text-indigo-800"  // Platinum
        };
        return colors[tier] || "bg-gray-100 text-gray-800";
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

    if (!isConnected) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <h1 className="text-2xl font-bold text-green-800 mb-6">Customer Profile</h1>
                <div className="bg-yellow-50 p-4 rounded-md border border-yellow-100">
                    <p className="text-yellow-700">Please connect your wallet to view your profile.</p>
                    <button
                        onClick={connect}
                        disabled={loading}
                        className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
                    >
                        {loading ? 'Connecting...' : 'Connect Wallet'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-2xl font-bold text-green-800 mb-6">Your Green Profile</h1>

            {error && <ErrorMessage />}

            {loadingProfile ? (
                <LoadingIndicator />
            ) : profileData ? (
                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Carbon Credits */}
                        <div className="bg-green-50 p-4 rounded-lg">
                            <h2 className="text-sm font-medium text-green-800 uppercase tracking-wide mb-2">Carbon Credits</h2>
                            <div className="flex items-end">
                                <p className="text-3xl font-bold text-green-600">
                                    {profileData.carbonCredits}
                                </p>
                                <p className="ml-2 text-sm text-green-600">points</p>
                            </div>
                        </div>

                        {/* Token Balance */}
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <h2 className="text-sm font-medium text-blue-800 uppercase tracking-wide mb-2">GRC Balance</h2>
                            <div className="flex items-end">
                                <p className="text-3xl font-bold text-blue-600">
                                    {profileData.tokenBalance}
                                </p>
                                <p className="ml-2 text-sm text-blue-600">GRC</p>
                            </div>
                        </div>

                        {/* Loyalty Tier */}
                        <div className="bg-purple-50 p-4 rounded-lg">
                            <h2 className="text-sm font-medium text-purple-800 uppercase tracking-wide mb-2">Loyalty Tier</h2>
                            <div className="flex items-center">
                                <p className="text-3xl font-bold text-purple-600">
                                    {getTierText(profileData.tier)}
                                </p>
                                <span className={`ml-2 px-2.5 py-0.5 rounded-full text-xs font-medium ${getTierColor(profileData.tier)}`}>
                                    {profileData.rewardMultiplier}x rewards
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6">
                        <p className="text-sm text-gray-600">
                            Your wallet: {formatAddress(account)}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                            Total Purchases: {profileData.transactionCount}
                        </p>
                    </div>

                    <div className="mt-6 border-t border-gray-200 pt-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-medium text-gray-900">Tier Progression</h2>
                        </div>

                        <div className="relative pt-1">
                            <div className="flex mb-2 items-center justify-between">
                                <div>
                                    <span className="text-xs font-semibold inline-block text-green-600">
                                        {profileData.carbonCredits} / 5000
                                    </span>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs font-semibold inline-block text-green-600">
                                        {profileData.tier === 3 ? "Maximum Tier Reached" : "Next Tier"}
                                    </span>
                                </div>
                            </div>
                            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-green-200">
                                <div style={{ width: `${Math.min(profileData.carbonCredits / 5000 * 100, 100)}%` }}
                                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"></div>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500">
                                <span>0 (Bronze)</span>
                                <span>500 (Silver)</span>
                                <span>2000 (Gold)</span>
                                <span>5000 (Platinum)</span>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}

            <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Transaction History</h2>

                {loadingTransactions ? (
                    <LoadingIndicator />
                ) : transactions.length > 0 ? (
                    <div className="bg-white rounded-lg shadow-md overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Dish
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Date
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Price
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Credits
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {transactions.map((tx) => (
                                        <tr key={tx.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{tx.dishName}</div>
                                                <div className="text-sm text-gray-500">#{tx.dishId}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{formatDate(tx.timestamp)}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{tx.price} ETH</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-green-600">+{tx.carbonCredits}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                          ${tx.status === 1 ? 'bg-green-100 text-green-800' :
                                                        tx.status === 2 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                                                    {getStatusText(tx.status)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white p-8 rounded-lg shadow-md text-center">
                        <p className="text-gray-500">You haven't made any purchases yet.</p>
                        <button
                            onClick={() => router.push('/marketplace')}
                            className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                            Browse Marketplace
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
} 