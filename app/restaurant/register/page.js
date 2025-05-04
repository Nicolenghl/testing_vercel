'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWeb3 } from '../../context/Web3Context';
import { ethers } from 'ethers';

export default function RestaurantRegister() {
    const router = useRouter();
    const { connect, account, contract, isConnected, loading } = useWeb3();
    const [registering, setRegistering] = useState(false);
    const [formData, setFormData] = useState({
        restaurantName: '',
        supplySource: '0', // Default to LOCAL_PRODUCER (0)
        supplyDetails: '',
        dishName: '',
        dishMainComponent: '',
        dishCarbonCredits: 10,
        dishPrice: 0.01
    });

    // Handle form input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isConnected) {
            await connect();
            return;
        }

        setRegistering(true);
        try {
            const {
                restaurantName,
                supplySource,
                supplyDetails,
                dishName,
                dishMainComponent,
                dishCarbonCredits,
                dishPrice
            } = formData;

            // Convert ETH to Wei for the transaction
            const priceInWei = ethers.utils.parseEther(dishPrice.toString());
            const entryFee = await contract.ENTRY_FEE();

            // Call the contract function
            const tx = await contract.restaurantRegister(
                restaurantName,
                parseInt(supplySource),
                supplyDetails,
                dishName,
                dishMainComponent,
                dishCarbonCredits,
                priceInWei,
                { value: entryFee }
            );

            // Wait for the transaction to be mined
            await tx.wait();

            // Redirect to profile page after successful registration
            router.push('/restaurant/profile');
        } catch (error) {
            console.error("Error registering restaurant:", error);
            alert("Error registering restaurant. Please try again.");
        } finally {
            setRegistering(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto p-6 bg-white rounded-lg shadow-lg mt-10">
            <h1 className="text-2xl font-bold text-green-800 mb-6">Restaurant Registration</h1>

            {!isConnected && (
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-yellow-700">Please connect your wallet to register your restaurant.</p>
                    <button
                        onClick={connect}
                        disabled={loading}
                        className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
                    >
                        {loading ? 'Connecting...' : 'Connect Wallet'}
                    </button>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Restaurant Name</label>
                    <input
                        type="text"
                        name="restaurantName"
                        value={formData.restaurantName}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Supply Source</label>
                    <select
                        name="supplySource"
                        value={formData.supplySource}
                        onChange={handleChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                    >
                        <option value="0">Local Producer</option>
                        <option value="1">Imported Producer</option>
                        <option value="2">Green Producer</option>
                        <option value="3">Other</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Supply Details</label>
                    <textarea
                        name="supplyDetails"
                        value={formData.supplyDetails}
                        onChange={handleChange}
                        required
                        rows="3"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                    ></textarea>
                </div>

                <div className="border-t border-gray-200 pt-4">
                    <h2 className="text-lg font-medium text-gray-900">First Dish Information</h2>
                    <p className="text-sm text-gray-500">Every restaurant must register with at least one dish.</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Dish Name</label>
                    <input
                        type="text"
                        name="dishName"
                        value={formData.dishName}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Main Component</label>
                    <input
                        type="text"
                        name="dishMainComponent"
                        value={formData.dishMainComponent}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Carbon Credits (1-100)</label>
                    <input
                        type="number"
                        name="dishCarbonCredits"
                        value={formData.dishCarbonCredits}
                        onChange={handleChange}
                        min="1"
                        max="100"
                        required
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Price (ETH)</label>
                    <input
                        type="number"
                        name="dishPrice"
                        value={formData.dishPrice}
                        onChange={handleChange}
                        min="0.001"
                        step="0.001"
                        required
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                    />
                </div>

                <div className="border-t border-gray-200 pt-4">
                    <p className="text-sm text-gray-500">
                        Registration requires a one-time fee of 1 ETH.
                    </p>
                </div>

                <button
                    type="submit"
                    disabled={registering || (!isConnected && !loading)}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400"
                >
                    {registering
                        ? 'Registering...'
                        : !isConnected
                            ? 'Connect Wallet to Register'
                            : 'Register Restaurant'}
                </button>
            </form>
        </div>
    );
} 