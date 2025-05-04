'use client';

import { useWeb3 } from './context/Web3Context';
import ContractConnectionHelper from './components/ContractConnectionHelper';
import Link from 'next/link';

export default function Home() {
    const { isConnected, networkValid } = useWeb3();

    return (
        <main className="flex min-h-screen flex-col items-center justify-between p-6">
            <div className="w-full max-w-5xl">
                {/* Show contract status if wallet is connected */}
                {isConnected && <ContractConnectionHelper />}

                <h1 className="text-4xl font-bold text-center text-green-800 mb-8">
                    Welcome to GreenDish
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                    {/* For Diners Section */}
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-2xl font-semibold text-green-700 mb-4">For Diners</h2>
                        <p className="mb-4">
                            Discover sustainable restaurants, earn carbon credits, and make a positive impact with every meal.
                        </p>
                        <ul className="space-y-2 mb-6">
                            <li className="flex items-center">
                                <span className="text-green-500 mr-2">✓</span> Browse eco-friendly restaurants
                            </li>
                            <li className="flex items-center">
                                <span className="text-green-500 mr-2">✓</span> Earn rewards for sustainable choices
                            </li>
                            <li className="flex items-center">
                                <span className="text-green-500 mr-2">✓</span> Track your environmental impact
                            </li>
                        </ul>
                        <Link href="/marketplace" className="block text-center py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 transition">
                            Explore Restaurants
                        </Link>
                    </div>

                    {/* For Restaurants Section */}
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-2xl font-semibold text-green-700 mb-4">For Restaurants</h2>
                        <p className="mb-4">
                            Showcase your commitment to sustainability, attract eco-conscious customers, and grow your business.
                        </p>
                        <ul className="space-y-2 mb-6">
                            <li className="flex items-center">
                                <span className="text-green-500 mr-2">✓</span> Highlight sustainable practices
                            </li>
                            <li className="flex items-center">
                                <span className="text-green-500 mr-2">✓</span> Reach environmentally aware customers
                            </li>
                            <li className="flex items-center">
                                <span className="text-green-500 mr-2">✓</span> Build brand reputation
                            </li>
                        </ul>
                        <Link href="/restaurant/register" className="block text-center py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 transition">
                            Register Your Restaurant
                        </Link>
                    </div>

                    {/* How It Works Section */}
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-2xl font-semibold text-green-700 mb-4">How It Works</h2>
                        <p className="mb-4">
                            Our platform uses blockchain technology to transparently track and reward sustainable dining choices.
                        </p>
                        <ol className="space-y-2 mb-6 list-decimal ml-5">
                            <li>Restaurants register and list sustainable dishes</li>
                            <li>Customers purchase dishes and earn carbon credits</li>
                            <li>Credits can be tracked on the blockchain</li>
                            <li>Rewards increase with continued participation</li>
                        </ol>
                        <div className="text-sm mt-4 p-3 bg-green-50 rounded">
                            <p className="font-medium text-green-800">Using Axiomesh Gemini Network</p>
                            <p className="text-green-700">Our smart contracts run on the eco-friendly Axiomesh Gemini blockchain.</p>
                        </div>
                    </div>
                </div>

                {/* Getting Started with Contract Section */}
                {(!isConnected || !networkValid) && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
                        <h2 className="text-xl font-semibold text-yellow-800 mb-3">Getting Started</h2>
                        <p className="mb-3">To use all features of GreenDish, you need to:</p>
                        <ol className="list-decimal ml-5 space-y-2">
                            <li>Connect your MetaMask wallet to the Axiomesh Gemini network (Chain ID: 23413)</li>
                            <li>Make sure you have deployed the GreenDish smart contract</li>
                            <li>Update the contract address in the application settings</li>
                        </ol>
                        <p className="mt-3 text-sm">
                            See our <Link href="https://github.com/your-repo/GreenDish" className="text-blue-600 hover:underline">documentation</Link> for detailed setup instructions.
                        </p>
                    </div>
                )}
            </div>
        </main>
    );
}