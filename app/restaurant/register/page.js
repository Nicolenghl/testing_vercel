'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWeb3 } from '../../context/Web3Context';
import { ethers } from 'ethers';
import ContractConnectionHelper from '../../components/ContractConnectionHelper';

export default function RestaurantRegister() {
    const router = useRouter();
    const { connect, account, contract, isConnected, loading, networkValid, switchNetwork, chainId } = useWeb3();
    const [registering, setRegistering] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [formData, setFormData] = useState({
        restaurantName: '',
        supplySource: '0', // Default to LOCAL_PRODUCER (0)
        supplyDetails: '',
        dishName: '',
        dishMainComponent: '',
        dishCarbonCredits: 10,
        dishPrice: 0.01
    });

    // Log ethers version on component mount
    useEffect(() => {
        console.log(`Ethers version: ${ethers.version}`);
    }, []);

    // Handle form input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle network switch
    const handleNetworkSwitch = async () => {
        try {
            await switchNetwork();
        } catch (error) {
            console.error("Error switching network:", error);
            setErrorMessage("Failed to switch network. Please switch to Axiomesh Gemini manually in your wallet.");
        }
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isConnected) {
            await connect();
            return;
        }

        // Check if we're on the right network
        if (!networkValid) {
            setErrorMessage(`You're connected to the wrong network. Please switch to Axiomesh Gemini network.`);
            return;
        }

        setRegistering(true);
        setErrorMessage('');
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

            // Check if contract is available
            if (!contract) {
                throw new Error("Smart contract not connected. Please refresh and try again.");
            }

            // Log network information for debugging
            console.log(`Connected to network with Chain ID: ${chainId}`);
            console.log(`Contract address: ${contract.address}`);

            // Check if contract exists on the current network
            try {
                const code = await contract.provider.getCode(contract.address);
                if (code === '0x' || code === '') {
                    throw new Error(`No contract found at ${contract.address} on current network. Make sure you've deployed your contract to Axiomesh Gemini network.`);
                }
            } catch (codeError) {
                console.error("Error checking contract code:", codeError);
                throw new Error(`Could not verify contract at ${contract.address}. Are you on the correct network?`);
            }

            // Convert ETH to Wei for the transaction - handle both ethers v5 and v6 syntax
            let priceInWei;
            try {
                // Try ethers v5 syntax first
                if (ethers.utils && ethers.utils.parseEther) {
                    priceInWei = ethers.utils.parseEther(dishPrice.toString());
                }
                // Try ethers v6 syntax as fallback
                else if (ethers.parseEther) {
                    priceInWei = ethers.parseEther(dishPrice.toString());
                }
                else {
                    throw new Error("Could not parse ETH amount - ethers.js API incompatibility");
                }
            } catch (parseError) {
                console.error("Error parsing ETH:", parseError);
                throw new Error(`Failed to convert price to wei: ${parseError.message}`);
            }

            // Get entry fee from contract
            try {
                const entryFee = await contract.ENTRY_FEE();
                console.log(`Required entry fee: ${formatEther(entryFee)} AXC`);

                // Get user balance to check if sufficient
                const userBalance = await contract.provider.getBalance(account);
                console.log(`User balance: ${formatEther(userBalance)} AXC`);

                if (userBalance.lt(entryFee)) {
                    throw new Error(`Insufficient balance. You need at least ${formatEther(entryFee)} AXC for the entry fee.`);
                }
            } catch (balanceError) {
                console.error("Error checking balance:", balanceError);
                if (balanceError.message.includes("invalid opcode")) {
                    throw new Error(`Contract interaction failed. This could be due to network issues or contract incompatibility.`);
                }
                throw balanceError;
            }

            // Call the contract function with more detailed error handling
            try {
                const tx = await contract.restaurantRegister(
                    restaurantName,
                    parseInt(supplySource),
                    supplyDetails,
                    dishName,
                    dishMainComponent,
                    dishCarbonCredits,
                    priceInWei,
                    {
                        value: await contract.ENTRY_FEE(),
                        gasLimit: 3000000 // Set a higher gas limit to ensure transaction completes
                    }
                );

                console.log(`Transaction submitted: ${tx.hash}`);
                alert(`Restaurant registration in progress. Transaction: ${tx.hash}`);

                // Wait for the transaction to be mined
                await tx.wait();

                // Redirect to profile page after successful registration
                router.push('/restaurant/profile');
            } catch (txError) {
                console.error("Transaction error:", txError);

                if (txError.code === 'INSUFFICIENT_FUNDS') {
                    throw new Error(`Insufficient funds for gas + entry fee. Need more AXC on the Axiomesh Gemini network.`);
                } else if (txError.code === 'UNPREDICTABLE_GAS_LIMIT') {
                    throw new Error(`Contract execution error. This might be due to invalid parameters or contract restrictions.`);
                } else if (txError.message.includes("user rejected")) {
                    throw new Error("Transaction rejected in wallet.");
                } else if (txError.message.includes("invalid opcode")) {
                    throw new Error(`Contract method execution failed. This might be due to an incompatible contract version or network mismatch.`);
                } else {
                    throw new Error(`Transaction failed: ${txError.message}`);
                }
            }
        } catch (error) {
            console.error("Error registering restaurant:", error);
            setErrorMessage(error.message);
            alert(`Error registering restaurant: ${error.message}`);
        } finally {
            setRegistering(false);
        }
    };

    // Helper function to format ETH - handles both ethers v5 and v6
    const formatEther = (value) => {
        try {
            // Try ethers v5 syntax first
            if (ethers.utils && ethers.utils.formatEther) {
                return ethers.utils.formatEther(value);
            }
            // Try ethers v6 syntax as fallback
            else if (ethers.formatEther) {
                return ethers.formatEther(value);
            }
            // Fallback to manual conversion
            else {
                return (Number(value) / 1e18).toString();
            }
        } catch (error) {
            console.error("Error formatting ETH:", error);
            return "unknown";
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

            {isConnected && !networkValid && (
                <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-md">
                    <p className="text-orange-700">You need to switch to the Axiomesh Gemini network (Chain ID: 23413).</p>
                    <button
                        onClick={handleNetworkSwitch}
                        className="mt-2 px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
                    >
                        Switch to Axiomesh Gemini
                    </button>
                </div>
            )}

            {isConnected && networkValid && <ContractConnectionHelper />}

            {errorMessage && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-red-700">{errorMessage}</p>
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
                    <label className="block text-sm font-medium text-gray-700">Price (AXC)</label>
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
                        Registration requires a one-time fee of 1 AXC.
                    </p>
                </div>

                <button
                    type="submit"
                    disabled={registering || (!isConnected && !loading) || (isConnected && !networkValid)}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400"
                >
                    {registering
                        ? 'Registering...'
                        : !isConnected
                            ? 'Connect Wallet to Register'
                            : !networkValid
                                ? 'Switch to Axiomesh Network'
                                : 'Register Restaurant'}
                </button>
            </form>
        </div>
    );
} 