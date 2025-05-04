'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI, isContractAvailable, NETWORK_CONFIG } from '../contracts/contract';

// Create context
const Web3Context = createContext({
    connect: async () => { },
    disconnect: () => { },
    switchNetwork: async () => { },
    account: null,
    contract: null,
    isConnected: false,
    isRestaurant: false,
    loading: false,
    networkValid: false,
    chainId: null
});

export const useWeb3 = () => useContext(Web3Context);

export function Web3Provider({ children }) {
    const [account, setAccount] = useState(null);
    const [contract, setContract] = useState(null);
    const [provider, setProvider] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isRestaurant, setIsRestaurant] = useState(false);
    const [ethersVersion, setEthersVersion] = useState(null);
    const [networkValid, setNetworkValid] = useState(false);
    const [chainId, setChainId] = useState(null);

    // Check if MetaMask is installed
    const isMetaMaskInstalled = typeof window !== 'undefined' && window.ethereum;

    // Log ethers version on mount
    useEffect(() => {
        setEthersVersion(ethers.version || 'unknown');
        console.log(`Ethers version in context: ${ethers.version || 'unknown'}`);
    }, []);

    // Handle network change
    const handleNetworkChange = async (chainIdHex) => {
        const chainIdDec = parseInt(chainIdHex, 16);
        setChainId(chainIdDec);
        console.log(`Network changed to: ${chainIdHex} (${chainIdDec})`);

        // Check if we're on the correct network (Axiomesh Gemini = 23413)
        const isValidNetwork = chainIdDec === 23413;
        setNetworkValid(isValidNetwork);

        if (!isValidNetwork) {
            console.warn(`Connected to wrong network. Expected Axiomesh Gemini (23413), got ${chainIdDec}`);
            setContract(null);
        } else {
            console.log("Connected to correct network: Axiomesh Gemini");
            // If account is already connected, reinitialize contract
            if (account && provider) {
                initializeContract(account, provider);
            }
        }
    };

    // Initialize contract
    const initializeContract = async (account, web3Provider) => {
        try {
            let signer;
            // Try ethers v5 syntax first
            if (web3Provider.getSigner) {
                signer = web3Provider.getSigner();
            }
            // Try ethers v6 syntax
            else if (web3Provider.getSigner) {
                signer = await web3Provider.getSigner();
            }
            else {
                throw new Error("Could not get signer - ethers.js API incompatibility");
            }

            const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
            setContract(contract);

            // Log contract address and ABI for debugging
            console.log("Contract initialized with address:", CONTRACT_ADDRESS);
            console.log("First few ABI entries:", CONTRACT_ABI.slice(0, 2));

            // Check if the account is a restaurant
            try {
                const restaurantStatus = await checkIsRestaurant(account, contract);
                setIsRestaurant(restaurantStatus);
            } catch (error) {
                console.error("Error checking restaurant status:", error);
            }
        } catch (contractError) {
            console.error("Error initializing contract:", contractError);
            throw new Error(`Failed to initialize contract: ${contractError.message}`);
        }
    };

    // Initialize provider
    useEffect(() => {
        if (isMetaMaskInstalled) {
            try {
                let web3Provider;
                // Try ethers v5 syntax first
                if (ethers.providers && ethers.providers.Web3Provider) {
                    web3Provider = new ethers.providers.Web3Provider(window.ethereum);
                }
                // Try ethers v6 syntax
                else if (ethers.BrowserProvider) {
                    web3Provider = new ethers.BrowserProvider(window.ethereum);
                }
                // Fallback error
                else {
                    console.error("Could not find compatible ethers.js provider API");
                    return;
                }

                setProvider(web3Provider);

                // Get current chain ID
                window.ethereum.request({ method: 'eth_chainId' })
                    .then(handleNetworkChange)
                    .catch(error => console.error("Error getting chain ID:", error));

                // Listen for chain changes
                window.ethereum.on('chainChanged', handleNetworkChange);

                // Check if contract is available on the current network
                isContractAvailable(web3Provider)
                    .then(available => {
                        if (!available) {
                            console.warn(`Contract not found at ${CONTRACT_ADDRESS} on current network. Make sure you're connected to the correct network.`);
                        } else {
                            console.log("Contract is available on current network");
                        }
                    })
                    .catch(err => console.error("Error checking contract availability:", err));
            } catch (error) {
                console.error("Error initializing Web3 provider:", error);
            }
        }

        // Clean up listeners
        return () => {
            if (window.ethereum && window.ethereum.removeListener) {
                window.ethereum.removeListener('chainChanged', handleNetworkChange);
            }
        };
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

    // Switch to the Axiomesh Gemini network
    const switchNetwork = async () => {
        if (!isMetaMaskInstalled) return false;

        try {
            // Try to switch to the network
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: NETWORK_CONFIG.chainId }],
            });
            return true;
        } catch (switchError) {
            // This error code indicates that the chain has not been added to MetaMask
            if (switchError.code === 4902) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [NETWORK_CONFIG],
                    });
                    return true;
                } catch (addError) {
                    console.error("Error adding network:", addError);
                    return false;
                }
            } else {
                console.error("Error switching network:", switchError);
                return false;
            }
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
            // If we're not on the correct network, try to switch
            if (chainId !== 23413) {
                const switched = await switchNetwork();
                if (!switched) {
                    alert(`Please switch to the Axiomesh Gemini network (Chain ID: 23413) in your wallet to continue.`);
                    setLoading(false);
                    return;
                }
            }

            // Request account access
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            const account = accounts[0];
            setAccount(account);

            // Create contract instance if on correct network
            if (networkValid && provider) {
                await initializeContract(account, provider);
            }

            // Listen for account changes
            window.ethereum.on('accountsChanged', (accounts) => {
                if (accounts.length === 0) {
                    disconnect();
                } else {
                    setAccount(accounts[0]);
                    // Check restaurant status for new account
                    if (contract && networkValid) {
                        checkIsRestaurant(accounts[0], contract)
                            .then(status => setIsRestaurant(status));
                    }
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
                switchNetwork,
                account,
                contract,
                isConnected: !!account,
                isRestaurant,
                loading,
                ethersVersion,
                networkValid,
                chainId
            }}
        >
            {children}
        </Web3Context.Provider>
    );
} 