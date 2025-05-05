'use client';

import { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { CONTRACT_ADDRESS, NETWORK_CONFIGS } from '../contracts/contract';
import { ethers } from 'ethers';

export default function ContractConnectionHelper() {
    const { account, provider, networkValid, chainId, networkName } = useWeb3();
    const [contractCode, setContractCode] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showDetails, setShowDetails] = useState(false);

    // Check contract code when account or network changes
    useEffect(() => {
        const checkContract = async () => {
            if (!provider || !account) return;

            setLoading(true);
            try {
                const code = await provider.getCode(CONTRACT_ADDRESS);
                setContractCode(code);

                // If we have contract code, try to validate basic functionality
                if (code !== '0x' && code !== '') {
                    try {
                        // Create a read-only contract instance for testing
                        const contract = new ethers.Contract(
                            CONTRACT_ADDRESS,
                            [
                                "function dishCounter() view returns (uint256)",
                                "function contract_owner() view returns (address)"
                            ],
                            provider
                        );

                        // Test basic read functions to validate contract
                        const dishCounter = await contract.dishCounter();
                        console.log("Contract validation passed. Dish counter:", dishCounter.toString());

                        // Check contract owner
                        const owner = await contract.contract_owner();
                        console.log("Contract owner:", owner);
                    } catch (functionError) {
                        console.warn("Contract code exists but functions may be incompatible:", functionError);
                    }
                }
            } catch (error) {
                console.error("Error checking contract code:", error);
                setContractCode(null);
            } finally {
                setLoading(false);
            }
        };

        checkContract();
    }, [provider, account, chainId]);

    // Determine the status and message
    const getStatusInfo = () => {
        if (!account) {
            return {
                status: 'warning',
                title: 'Wallet Not Connected',
                message: 'Connect your wallet to interact with the smart contract.'
            };
        }

        if (loading) {
            return {
                status: 'info',
                title: 'Checking Contract...',
                message: 'Verifying the smart contract on the network...'
            };
        }

        if (contractCode === '0x' || contractCode === '') {
            return {
                status: 'error',
                title: 'Contract Not Found',
                message: `No contract found at ${CONTRACT_ADDRESS} on the current network (${networkName || `Chain ID: ${chainId}`}). You need to deploy your contract to this network or switch to a network where it's deployed.`
            };
        }

        if (contractCode) {
            return {
                status: 'success',
                title: 'Contract Connected',
                message: 'Smart contract is available and ready to use.'
            };
        }

        return {
            status: 'error',
            title: 'Connection Error',
            message: 'Could not verify the smart contract. There might be network issues.'
        };
    };

    const statusInfo = getStatusInfo();
    const statusColors = {
        success: 'bg-green-50 border-green-200 text-green-700',
        warning: 'bg-yellow-50 border-yellow-200 text-yellow-700',
        error: 'bg-red-50 border-red-200 text-red-700',
        info: 'bg-blue-50 border-blue-200 text-blue-700'
    };

    // Get the list of supported networks
    const supportedNetworks = Object.entries(NETWORK_CONFIGS).map(([id, config]) => ({
        id: parseInt(id),
        name: config.chainName
    }));

    return (
        <div className={`p-4 border rounded-md ${statusColors[statusInfo.status]} mb-6`}>
            <div className="flex justify-between items-center">
                <h3 className="font-medium">{statusInfo.title}</h3>
                <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="text-sm underline"
                >
                    {showDetails ? 'Hide Details' : 'Show Details'}
                </button>
            </div>

            <p className="mt-1">{statusInfo.message}</p>

            {showDetails && (
                <div className="mt-4 text-sm">
                    <p><strong>Contract Address:</strong> {CONTRACT_ADDRESS}</p>
                    <p><strong>Current Network:</strong> {networkName || `Chain ID: ${chainId || 'Unknown'}`}</p>
                    <p><strong>Contract Status:</strong> {
                        loading ? 'Checking...' :
                            contractCode === null ? 'Unknown' :
                                contractCode === '0x' || contractCode === '' ? 'Not Deployed' : 'Deployed'
                    }</p>

                    <div className="mt-3">
                        <h4 className="font-medium">Supported Networks:</h4>
                        <ul className="list-disc ml-5 mt-1">
                            {supportedNetworks.map(network => (
                                <li key={network.id}>{network.name} (Chain ID: {network.id})</li>
                            ))}
                        </ul>
                    </div>

                    <div className="mt-3">
                        <h4 className="font-medium">Troubleshooting Steps:</h4>
                        <ol className="list-decimal ml-5 mt-1">
                            <li>Make sure your contract is deployed to your current network</li>
                            <li>Update the CONTRACT_ADDRESS in app/contracts/contract.js with your deployed contract address</li>
                            <li>Ensure your wallet has tokens for transactions</li>
                            <li>Try refreshing the page or reconnecting your wallet</li>
                        </ol>
                    </div>
                </div>
            )}
        </div>
    );
} 