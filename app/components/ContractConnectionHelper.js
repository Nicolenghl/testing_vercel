'use client';

import { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { CONTRACT_ADDRESS, NETWORK_CONFIG } from '../contracts/contract';

export default function ContractConnectionHelper() {
    const { account, provider, networkValid, chainId } = useWeb3();
    const [contractCode, setContractCode] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showDetails, setShowDetails] = useState(false);

    // Check contract code when account or network changes
    useEffect(() => {
        const checkContract = async () => {
            if (!provider || !networkValid || !account) return;

            setLoading(true);
            try {
                const code = await provider.getCode(CONTRACT_ADDRESS);
                setContractCode(code);
            } catch (error) {
                console.error("Error checking contract code:", error);
                setContractCode(null);
            } finally {
                setLoading(false);
            }
        };

        checkContract();
    }, [provider, networkValid, account]);

    // Determine the status and message
    const getStatusInfo = () => {
        if (!account) {
            return {
                status: 'warning',
                title: 'Wallet Not Connected',
                message: 'Connect your wallet to interact with the smart contract.'
            };
        }

        if (!networkValid) {
            return {
                status: 'warning',
                title: 'Wrong Network',
                message: `Please switch to the Axiomesh Gemini network (Chain ID: 23413). You're currently on network ${chainId}.`
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
                message: `No contract found at ${CONTRACT_ADDRESS}. You need to deploy your contract to Axiomesh Gemini.`
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
                    <p><strong>Network:</strong> {networkValid ? 'Axiomesh Gemini' : `Chain ID ${chainId || 'Unknown'}`}</p>
                    <p><strong>Contract Status:</strong> {
                        loading ? 'Checking...' :
                            contractCode === null ? 'Unknown' :
                                contractCode === '0x' || contractCode === '' ? 'Not Deployed' : 'Deployed'
                    }</p>

                    <div className="mt-3">
                        <h4 className="font-medium">Troubleshooting Steps:</h4>
                        <ol className="list-decimal ml-5 mt-1">
                            <li>Make sure your contract is deployed to the Axiomesh Gemini network</li>
                            <li>Update the CONTRACT_ADDRESS in app/contracts/contract.js with your deployed contract address</li>
                            <li>Ensure your wallet has AXC tokens for transactions</li>
                            <li>Try refreshing the page or reconnecting your wallet</li>
                        </ol>
                    </div>
                </div>
            )}
        </div>
    );
} 