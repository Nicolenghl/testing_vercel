'use client';

import { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import ContractConnectionHelper from '../components/ContractConnectionHelper';
import Link from 'next/link';

export default function Profile() {
    const { connect, account, contract, isConnected, contractName, contractSymbol } = useWeb3();
    const [loading, setLoading] = useState(false);
    const [tokenBalance, setTokenBalance] = useState(0);
    const [totalSupply, setTotalSupply] = useState(0);

    // Load basic token data
    useEffect(() => {
        const loadData = async () => {
            if (contract && account) {
                try {
                    setLoading(true);

                    // Try to get token balance
                    try {
                        const balance = await contract.balanceOf(account);

                        // Get decimals (default to 18 if not available)
                        let decimals = 18;
                        try {
                            decimals = await contract.decimals();
                        } catch (e) {
                            console.warn("Could not get decimals, using default 18");
                        }

                        // Format balance to human-readable format
                        const divisor = 10n ** BigInt(decimals);
                        const formattedBalance = Number(balance) / Number(divisor);
                        setTokenBalance(formattedBalance);

                        // Try to get total supply
                        try {
                            const supply = await contract.totalSupply();
                            const formattedSupply = Number(supply) / Number(divisor);
                            setTotalSupply(formattedSupply);
                        } catch (e) {
                            console.warn("Could not get total supply:", e);
                        }
                    } catch (e) {
                        console.warn("Could not get token balance:", e);
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
            <div className="max-w-xl mx-auto p-6 bg-white rounded-lg shadow-lg mt-10">
                <h1 className="text-2xl font-bold text-green-800 mb-6">Your Profile</h1>
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-yellow-700">Please connect your wallet to view your profile.</p>
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
        <div className="max-w-xl mx-auto p-6 bg-white rounded-lg shadow-lg mt-10">
            <h1 className="text-2xl font-bold text-green-800 mb-6">Your Profile</h1>

            <ContractConnectionHelper />

            {loading ? (
                <div className="flex justify-center my-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
                </div>
            ) : (
                <>
                    <div className="bg-gray-50 p-4 rounded-lg mb-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-2">Account Information</h2>
                        <div>
                            <p className="text-sm text-gray-600">Wallet Address:</p>
                            <p className="font-mono text-sm overflow-hidden text-ellipsis">{account}</p>
                        </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg mb-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-2">Token Information</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-600">Name:</p>
                                <p className="font-medium">{contractName || "Unknown"}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Symbol:</p>
                                <p className="font-medium">{contractSymbol || "Unknown"}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Your Balance:</p>
                                <p className="font-medium">{tokenBalance} {contractSymbol || "tokens"}</p>
                            </div>
                            {totalSupply > 0 && (
                                <div>
                                    <p className="text-sm text-gray-600">Total Supply:</p>
                                    <p className="font-medium">{totalSupply} {contractSymbol || "tokens"}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-green-50 p-4 rounded-lg mb-6">
                        <h2 className="text-lg font-semibold text-green-800 mb-2">How to Earn GreenCoins</h2>
                        <p className="text-gray-700 mb-2">
                            GreenCoins (GRC) can only be earned by purchasing sustainable dishes from verified restaurants.
                        </p>
                        <p className="text-gray-700 mb-2">
                            The reward amount is based on the carbon credits of the dish and your loyalty tier.
                        </p>
                        <p className="text-gray-700">
                            <span className="font-medium">Loyalty Tiers:</span> Bronze (1.0x) → Silver (1.1x) → Gold (1.25x) → Platinum (1.5x)
                        </p>
                    </div>

                    <div className="bg-green-50 p-4 rounded-lg mb-6">
                        <h2 className="text-lg font-semibold text-green-800 mb-2">Simplified Mode</h2>
                        <p className="text-gray-700">
                            Your application is running in compatibility mode with a non-GreenDish contract.
                            Some features like transaction history and loyalty tiers may not be available.
                        </p>
                    </div>
                </>
            )}

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