'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../contracts/contract';

// Create context
const Web3Context = createContext({
    connect: async () => { },
    disconnect: () => { },
    account: null,
    contract: null,
    isConnected: false,
    isRestaurant: false,
    loading: false
});

export const useWeb3 = () => useContext(Web3Context);

export function Web3Provider({ children }) {
    const [account, setAccount] = useState(null);
    const [contract, setContract] = useState(null);
    const [provider, setProvider] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isRestaurant, setIsRestaurant] = useState(false);

    // Check if MetaMask is installed
    const isMetaMaskInstalled = typeof window !== 'undefined' && window.ethereum;

    // Initialize provider
    useEffect(() => {
        if (isMetaMaskInstalled) {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            setProvider(provider);
        }
    }, [isMetaMaskInstalled]);

    // Check if the connected account is a restaurant
    const checkIsRestaurant = async (address, contract) => {
        try {
            const restaurantInfo = await contract.restaurants(address);
            return restaurantInfo.isVerified;
        } catch (error) {
            console.error("Error checking restaurant status:", error);
            return false;
        }
    };

    // Connect to MetaMask
    const connect = async () => {
        if (!isMetaMaskInstalled) {
            alert("Please install MetaMask to use this application");
            return;
        }

        setLoading(true);
        try {
            // Request account access
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            const account = accounts[0];
            setAccount(account);

            // Create contract instance
            const signer = provider.getSigner();
            const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
            setContract(contract);

            // Check if the account is a restaurant
            const restaurantStatus = await checkIsRestaurant(account, contract);
            setIsRestaurant(restaurantStatus);

            // Listen for account changes
            window.ethereum.on('accountsChanged', (accounts) => {
                if (accounts.length === 0) {
                    disconnect();
                } else {
                    setAccount(accounts[0]);
                    // Check restaurant status for new account
                    checkIsRestaurant(accounts[0], contract)
                        .then(status => setIsRestaurant(status));
                }
            });

        } catch (error) {
            console.error("Error connecting to MetaMask:", error);
            alert("Error connecting to MetaMask. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Disconnect from MetaMask
    const disconnect = () => {
        setAccount(null);
        setContract(null);
        setIsRestaurant(false);
    };

    return (
        <Web3Context.Provider
            value={{
                connect,
                disconnect,
                account,
                contract,
                isConnected: !!account,
                isRestaurant,
                loading
            }}
        >
            {children}
        </Web3Context.Provider>
    );
} 