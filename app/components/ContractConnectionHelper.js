'use client';

import { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { CONTRACT_ADDRESS, NETWORK_CONFIGS, MINIMAL_CONTRACT_ABI } from '../contracts/contract';
import { ethers } from 'ethers';

export default function ContractConnectionHelper() {
    const { account, provider, networkValid, chainId, networkName } = useWeb3();
    const [contractCode, setContractCode] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showDetails, setShowDetails] = useState(false);

    // Fallback method to check contract existence
    const checkContractWithFetch = async () => {
        if (!chainId) return false;

        try {
            // Get the appropriate RPC URL based on current chain
            const networkConfig = NETWORK_CONFIGS[chainId.toString()];
            if (!networkConfig || !networkConfig.rpcUrls || networkConfig.rpcUrls.length === 0) {
                console.error("No RPC URL available for current network");
                return false;
            }

            const rpcUrl = networkConfig.rpcUrls[0];
            console.log("Checking contract with direct RPC fetch:", rpcUrl);

            // Create a simple JSON-RPC request to check code at the contract address
            const response = await fetch(rpcUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: 1,
                    method: 'eth_getCode',
                    params: [CONTRACT_ADDRESS, 'latest']
                }),
            });

            const data = await response.json();
            console.log("RPC response:", data);

            if (data.result && data.result !== '0x') {
                console.log("Contract exists according to direct RPC call");
                return true;
            } else {
                console.log("Contract does not exist according to direct RPC call");
                return false;
            }
        } catch (error) {
            console.error("Error in fallback contract check:", error);
            return false;
        }
    };

    // Check contract code when account or network changes
    useEffect(() => {
        const checkContract = async () => {
            if (!provider || !account) return;

            setLoading(true);
            try {
                console.log(`Checking contract at address: ${CONTRACT_ADDRESS}`);
                console.log(`Current network: ${networkName || chainId}`);

                const code = await provider.getCode(CONTRACT_ADDRESS);
                setContractCode(code);

                console.log(`Contract code received: ${code.slice(0, 10)}...${code === '0x' ? ' (empty)' : ''}`);

                // If contract code is empty, try fallback method
                if (code === '0x' || code === '') {
                    console.log("Trying fallback method to check contract...");
                    const exists = await checkContractWithFetch();
                    if (exists) {
                        console.log("Fallback method detected the contract exists!");
                        // If fallback finds it but provider doesn't, there might be a provider issue
                        alert("Contract detected through direct RPC call but not through your wallet provider. Try refreshing or switching network in your wallet.");
                    }
                }

                // The rest of the function remains unchanged
                if (code !== '0x' && code !== '') {
                    try {
                        // Create a read-only contract instance for testing with minimal ABI
                        console.log("Attempting to create contract instance for validation");
                        const contract = new ethers.Contract(
                            CONTRACT_ADDRESS,
                            MINIMAL_CONTRACT_ABI,
                            provider
                        );

                        // Try to fetch dishCounter to validate contract state
                        console.log("Testing dishCounter function...");
                        try {
                            const dishCounter = await contract.dishCounter();
                            console.log("Current dish counter:", dishCounter.toString());
                        } catch (err) {
                            console.warn("dishCounter function failed:", err.message);
                            // Try an alternative function to validate the contract
                            try {
                                console.log("Trying alternative function: name()");
                                const name = await contract.name();
                                console.log("Contract name:", name);
                                // If we get here, contract exists but might be missing dishCounter
                                console.warn("Contract exists but dishCounter function missing. This may not be a GreenDish contract.");
                            } catch (nameErr) {
                                console.warn("name function failed:", nameErr.message);
                                throw new Error("Contract functions are missing or incompatible");
                            }
                        }

                        // Check contract owner
                        console.log("Testing contract_owner function...");
                        const owner = await contract.contract_owner();
                        console.log("Contract owner:", owner);
                    } catch (functionError) {
                        console.warn("Contract code exists but functions may be incompatible:", functionError);
                        console.log("Error details:", JSON.stringify(functionError).slice(0, 200));
                    }
                }
            } catch (error) {
                console.error("Error checking contract code:", error);
                console.log("Error details:", JSON.stringify(error).slice(0, 200));
                setContractCode(null);

                // Try fallback method if provider check fails
                console.log("Provider check failed. Trying fallback method...");
                const exists = await checkContractWithFetch();
                if (exists) {
                    console.log("Contract exists according to fallback check");
                    alert("Contract exists according to direct RPC call, but your wallet provider couldn't verify it. Try refreshing or reconnecting your wallet.");
                }
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
                message: `No contract found at ${CONTRACT_ADDRESS} on the current network (${networkName || `Chain ID: ${chainId}`}). You need to deploy your contract to this network or switch to a network where it's deployed. Note: Ethereum addresses are case-sensitive in checksum format.`
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