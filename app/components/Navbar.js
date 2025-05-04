'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useWeb3 } from '../context/Web3Context';
import { formatAddress } from '../utils/ethers-helpers';

export default function Navbar() {
    const { connect, disconnect, account, isConnected, isRestaurant, loading } = useWeb3();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <nav className="bg-green-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <Link href="/" className="text-white font-bold text-xl">
                                GreenDish
                            </Link>
                        </div>
                        <div className="hidden md:block">
                            <div className="ml-10 flex items-baseline space-x-4">
                                <Link href="/" className="text-gray-300 hover:bg-green-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                                    Home
                                </Link>

                                {isConnected && isRestaurant && (
                                    <Link href="/restaurant/profile" className="text-gray-300 hover:bg-green-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                                        Restaurant Dashboard
                                    </Link>
                                )}

                                {isConnected && !isRestaurant && (
                                    <Link href="/restaurant/register" className="text-gray-300 hover:bg-green-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                                        Register Restaurant
                                    </Link>
                                )}

                                <Link href="/marketplace" className="text-gray-300 hover:bg-green-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                                    Marketplace
                                </Link>
                            </div>
                        </div>
                    </div>
                    <div className="hidden md:block">
                        <div className="ml-4 flex items-center md:ml-6">
                            {!isConnected ? (
                                <button
                                    onClick={connect}
                                    disabled={loading}
                                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-green-800 focus:ring-white disabled:bg-gray-400"
                                >
                                    {loading ? 'Connecting...' : 'Connect Wallet'}
                                </button>
                            ) : (
                                <div className="flex items-center">
                                    <span className="text-white mr-2 px-3 py-1 bg-green-900 rounded-md">
                                        {formatAddress(account)}
                                    </span>
                                    <button
                                        onClick={disconnect}
                                        className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-green-800 focus:ring-white"
                                    >
                                        Disconnect
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="-mr-2 flex md:hidden">
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="bg-green-900 inline-flex items-center justify-center p-2 rounded-md text-green-100 hover:text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-green-800 focus:ring-white"
                        >
                            <span className="sr-only">Open main menu</span>
                            {!mobileMenuOpen ? (
                                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            ) : (
                                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            {mobileMenuOpen && (
                <div className="md:hidden">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        <Link href="/" className="text-gray-300 hover:bg-green-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium">
                            Home
                        </Link>

                        {isConnected && isRestaurant && (
                            <Link href="/restaurant/profile" className="text-gray-300 hover:bg-green-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium">
                                Restaurant Dashboard
                            </Link>
                        )}

                        {isConnected && !isRestaurant && (
                            <Link href="/restaurant/register" className="text-gray-300 hover:bg-green-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium">
                                Register Restaurant
                            </Link>
                        )}

                        <Link href="/marketplace" className="text-gray-300 hover:bg-green-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium">
                            Marketplace
                        </Link>
                    </div>
                    <div className="pt-4 pb-3 border-t border-green-700">
                        <div className="flex items-center px-5">
                            {!isConnected ? (
                                <button
                                    onClick={connect}
                                    disabled={loading}
                                    className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-green-800 focus:ring-white disabled:bg-gray-400"
                                >
                                    {loading ? 'Connecting...' : 'Connect Wallet'}
                                </button>
                            ) : (
                                <div className="w-full">
                                    <p className="text-white mb-2">{formatAddress(account)}</p>
                                    <button
                                        onClick={disconnect}
                                        className="w-full px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-green-800 focus:ring-white"
                                    >
                                        Disconnect
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}