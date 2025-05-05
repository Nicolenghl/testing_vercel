'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useWeb3 } from '../context/Web3Context';

export default function Navbar() {
    const { account, connect, disconnect, isConnected, isRestaurant, switchNetwork, networkValid, chainId, contractName, contractSymbol } = useWeb3();
    const [menuOpen, setMenuOpen] = useState(false);

    // For simplicity in this adapter UI, we treat every account as a restaurant
    // since we can't verify in the original contract
    const showRestaurantLinks = isConnected;

    // Helper to format account address
    const formatAddress = (address) => {
        if (!address) return '';
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    };

    return (
        <nav className="bg-green-800 text-white shadow-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <Link href="/" className="flex-shrink-0 flex items-center text-2xl font-bold">
                            GreenDish
                        </Link>
                        <div className="hidden md:ml-6 md:flex md:space-x-4">
                            <Link href="/" className="px-3 py-2 text-white hover:bg-green-700 rounded-md">
                                Home
                            </Link>
                            <Link href="/marketplace" className="px-3 py-2 text-white hover:bg-green-700 rounded-md">
                                Marketplace
                            </Link>
                            {showRestaurantLinks && (
                                <>
                                    <Link href="/restaurant/register" className="px-3 py-2 text-white hover:bg-green-700 rounded-md">
                                        Register
                                    </Link>
                                    <Link href="/restaurant/profile" className="px-3 py-2 text-white hover:bg-green-700 rounded-md">
                                        My Restaurant
                                    </Link>
                                </>
                            )}
                            {isConnected && (
                                <Link href="/profile" className="px-3 py-2 text-white hover:bg-green-700 rounded-md">
                                    My Profile
                                </Link>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center">
                        {contractName && contractSymbol && (
                            <div className="hidden md:block mr-4 bg-green-700 px-3 py-1 rounded-md">
                                {contractName} ({contractSymbol})
                            </div>
                        )}
                        {!isConnected ? (
                            <button
                                onClick={connect}
                                className="bg-white text-green-700 px-4 py-2 rounded font-medium hover:bg-gray-100"
                            >
                                Connect Wallet
                            </button>
                        ) : (
                            <div className="flex items-center">
                                <span className="hidden md:inline-block mr-2 font-mono">
                                    {formatAddress(account)}
                                </span>
                                <button
                                    onClick={disconnect}
                                    className="bg-red-500 text-white px-4 py-2 rounded font-medium hover:bg-red-600"
                                >
                                    Disconnect
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <div className="flex items-center md:hidden">
                        <button
                            onClick={() => setMenuOpen(!menuOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-green-700 focus:outline-none"
                        >
                            <svg
                                className="h-6 w-6"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                {menuOpen ? (
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                ) : (
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 6h16M4 12h16M4 18h16"
                                    />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            {menuOpen && (
                <div className="md:hidden">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        <Link
                            href="/"
                            className="block px-3 py-2 text-white hover:bg-green-700 rounded-md"
                            onClick={() => setMenuOpen(false)}
                        >
                            Home
                        </Link>
                        <Link
                            href="/marketplace"
                            className="block px-3 py-2 text-white hover:bg-green-700 rounded-md"
                            onClick={() => setMenuOpen(false)}
                        >
                            Marketplace
                        </Link>
                        {showRestaurantLinks && (
                            <>
                                <Link
                                    href="/restaurant/register"
                                    className="block px-3 py-2 text-white hover:bg-green-700 rounded-md"
                                    onClick={() => setMenuOpen(false)}
                                >
                                    Register Restaurant
                                </Link>
                                <Link
                                    href="/restaurant/profile"
                                    className="block px-3 py-2 text-white hover:bg-green-700 rounded-md"
                                    onClick={() => setMenuOpen(false)}
                                >
                                    My Restaurant
                                </Link>
                            </>
                        )}
                        {isConnected && (
                            <Link
                                href="/profile"
                                className="block px-3 py-2 text-white hover:bg-green-700 rounded-md"
                                onClick={() => setMenuOpen(false)}
                            >
                                My Profile
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}