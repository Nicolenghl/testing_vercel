'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI, MINIMAL_CONTRACT_ABI, isContractAvailable, NETWORK_CONFIGS } from '../contracts/contract';

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
    networkValid: true,
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
    const [networkValid, setNetworkValid] = useState(true);
    const [chainId, setChainId] = useState(null);
    const [networkName, setNetworkName] = useState(null);

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

        // Get network name if available
        const networkConfig = NETWORK_CONFIGS[chainIdDec.toString()];
        if (networkConfig) {
            setNetworkName(networkConfig.chainName);
            console.log(`Connected to known network: ${networkConfig.chainName}`);
        } else {
            setNetworkName("Unknown Network");
            console.log("Connected to unknown network");
        }

        // We're being network-agnostic, so set to valid regardless
        setNetworkValid(true);

        // If account is already connected, reinitialize contract
        if (account && provider) {
            initializeContract(account, provider);
        }
    };

    // Initialize contract
    const initializeContract = async (account, web3Provider) => {
        try {
            let signer;

            // Use a more generic approach to get the signer
            try {
                // Try various methods to get a signer
                if (typeof web3Provider.getSigner === 'function') {
                    signer = web3Provider.getSigner();
                } else if (web3Provider.signer) {
                    signer = web3Provider.signer;
                } else {
                    throw new Error("Could not get signer from provider");
                }
            } catch (signerError) {
                console.error("Error getting signer:", signerError);
                throw new Error("Failed to get signer. Please check wallet connection.");
            }

            // Create contract instance with minimal requirements
            try {
                const contract = new ethers.Contract(CONTRACT_ADDRESS, MINIMAL_CONTRACT_ABI, signer);
                console.log("Contract initialized with address:", CONTRACT_ADDRESS);
                setContract(contract);

                // Basic validation that doesn't depend on specific ethers version
                if (!contract.address) {
                    throw new Error("Contract address is undefined");
                }
            } catch (contractError) {
                console.error("Contract initialization error:", contractError);
                throw new Error("Failed to initialize contract. Check address and ABI.");
            }

            // Check if the contract is deployed and has code
            try {
                const contractCode = await web3Provider.getCode(CONTRACT_ADDRESS);
                if (contractCode === '0x' || contractCode === '') {
                    console.warn(`No contract found at ${CONTRACT_ADDRESS}. Make sure it's deployed to the current network.`);
                } else {
                    console.log("Contract verified with code on current network");

                    // Try to fetch dishCounter to validate contract state
                    try {
                        const dishCounter = await contract.dishCounter();
                        console.log("Current dish counter:", dishCounter.toString());
                    } catch (err) {
                        console.warn("Could not fetch dish counter, contract might be incompatible:", err);
                    }
                }
            } catch (codeError) {
                console.error("Error checking contract code:", codeError);
            }

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

    // Switch network function - updated to accept a chainId parameter
    const switchNetwork = async (targetChainId = '23413') => {
        if (!isMetaMaskInstalled) return false;

        const networkConfig = NETWORK_CONFIGS[targetChainId];
        if (!networkConfig) {
            console.error(`Network configuration not found for chain ID: ${targetChainId}`);
            return false;
        }

        try {
            // Try to switch to the network
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: networkConfig.chainId }],
            });
            return true;
        } catch (switchError) {
            // This error code indicates that the chain has not been added to MetaMask
            if (switchError.code === 4902) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [networkConfig],
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
            // Request account access without requiring a specific network
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            const account = accounts[0];
            setAccount(account);

            // Create contract instance
            if (provider) {
                await initializeContract(account, provider);
            }

            // Listen for account changes
            window.ethereum.on('accountsChanged', (accounts) => {
                if (accounts.length === 0) {
                    disconnect();
                } else {
                    setAccount(accounts[0]);
                    // Check restaurant status for new account
                    if (contract) {
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
                chainId,
                networkName
            }}
        >
            {children}
        </Web3Context.Provider>
    );
} 