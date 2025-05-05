'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWeb3 } from '../../context/Web3Context';
import Link from 'next/link';
import ContractConnectionHelper from '../../components/ContractConnectionHelper';

export default function RestaurantProfile() {
    const router = useRouter();
    const { connect, account, contract, isConnected, isRestaurant, contractName, contractSymbol } = useWeb3();
    const [loading, setLoading] = useState(false);
    const [balance, setBalance] = useState(0);

    // Load basic token data when connected
    useEffect(() => {
        const loadData = async () => {
            if (contract && account) {
                try {
                    setLoading(true);

                    // Try to get token balance if possible
                    try {
                        const balance = await contract.balanceOf(account);
                        // Convert to decimal based on token decimals (default to 18 if not available)
                        let decimals = 18;
                        try {
                            decimals = await contract.decimals();
                        } catch (e) {
                            console.warn("Could not get decimals, using default 18");
                        }

                        const divisor = 10n ** BigInt(decimals);
                        const formattedBalance = Number(balance) / Number(divisor);
                        setBalance(formattedBalance);
                    } catch (e) {
                        console.warn("Could not get token balance:", e);
                        setBalance(0);
                    }
                } catch (error) {
                    console.error("Error loading data:", error);
                } finally {
                    setLoading(false);
                }
            }
        };

        loadData();
    }, [account, contract]);

    // If not connected, prompt to connect
    if (!isConnected) {
        return (
            <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg mt-10">
                <h1 className="text-2xl font-bold text-green-800 mb-6">Restaurant Dashboard</h1>
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-yellow-700">Please connect your wallet to access your restaurant profile.</p>
                    <button
                        onClick={connect}
                        className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                        Connect Wallet
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg mt-10">
            <h1 className="text-2xl font-bold text-green-800 mb-6">Restaurant Dashboard</h1>

            <ContractConnectionHelper />

            <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-2">Account Information</h2>
                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-gray-600">Wallet Address:</p>
                        <p className="font-mono text-sm overflow-hidden text-ellipsis">{account}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Token Balance:</p>
                        <p className="font-semibold">{balance} {contractSymbol || "tokens"}</p>
                    </div>
                </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg mb-6">
                <h2 className="text-lg font-semibold text-green-800 mb-2">Simplified Mode</h2>
                <p className="text-gray-700 mb-2">
                    Your application is running in compatibility mode with a non-GreenDish contract.
                    Some features like dish management and restaurant registration may not be available.
                </p>
                <p className="text-gray-700">
                    Contract: {contractName || "Unknown"} ({contractSymbol || "Unknown"})
                </p>
            </div>

            <div className="flex justify-between items-center mt-8">
                <Link
                    href="/"
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                    Back to Home
                </Link>
            </div>
        </div>
    );
} 