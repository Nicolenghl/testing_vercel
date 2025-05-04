import { ethers } from 'ethers';

// Log ethers version when this module is imported
console.log(`Ethers version in helpers: ${ethers.version || 'unknown'}`);

/**
 * Format Wei value to ETH with specified decimals
 * @param {string|BigNumber} wei - The wei amount to convert
 * @param {number} decimals - Number of decimal places to show
 * @returns {string} Formatted ETH value
 */
export const formatEth = (wei, decimals = 4) => {
    if (!wei) return '0';
    try {
        let formatted;
        // Try ethers v5 syntax first
        if (ethers.utils && ethers.utils.formatEther) {
            formatted = ethers.utils.formatEther(wei);
        }
        // Try ethers v6 syntax as fallback
        else if (ethers.formatEther) {
            formatted = ethers.formatEther(wei);
        }
        // Manual conversion fallback
        else {
            formatted = (Number(wei) / 1e18).toString();
        }

        const parsed = parseFloat(formatted);
        return parsed.toFixed(decimals);
    } catch (error) {
        console.error('Error formatting ETH:', error);
        return '0';
    }
};

/**
 * Parse ETH value to Wei
 * @param {string|number} eth - The ETH amount to convert
 * @returns {BigNumber} Wei value as BigNumber
 */
export const parseEth = (eth) => {
    if (!eth) {
        // Handle empty input for both v5 and v6
        if (ethers.BigNumber && ethers.BigNumber.from) {
            return ethers.BigNumber.from(0);
        } else if (ethers.getBigInt) {
            return ethers.getBigInt(0);
        } else {
            return 0n; // BigInt literal fallback
        }
    }

    try {
        // Try ethers v5 syntax first
        if (ethers.utils && ethers.utils.parseEther) {
            return ethers.utils.parseEther(eth.toString());
        }
        // Try ethers v6 syntax as fallback
        else if (ethers.parseEther) {
            return ethers.parseEther(eth.toString());
        }
        // Throw error if neither method is available
        else {
            throw new Error("No compatible parseEther method found");
        }
    } catch (error) {
        console.error('Error parsing ETH:', error);
        // Return zero with appropriate type for the ethers version
        if (ethers.BigNumber && ethers.BigNumber.from) {
            return ethers.BigNumber.from(0);
        } else if (ethers.getBigInt) {
            return ethers.getBigInt(0);
        } else {
            return 0n; // BigInt literal fallback
        }
    }
};

/**
 * Format address to shortened form (0x1234...5678)
 * @param {string} address - Ethereum address to format
 * @returns {string} Shortened address
 */
export const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

/**
 * Check if address is valid
 * @param {string} address - Ethereum address to check
 * @returns {boolean} Whether address is valid
 */
export const isValidAddress = (address) => {
    try {
        // Try ethers v5 syntax first
        if (ethers.utils && ethers.utils.isAddress) {
            return ethers.utils.isAddress(address);
        }
        // Try ethers v6 syntax as fallback
        else if (ethers.isAddress) {
            return ethers.isAddress(address);
        }
        // Default fallback
        else {
            // Basic validation if neither method is available
            return /^0x[0-9a-fA-F]{40}$/.test(address);
        }
    } catch (error) {
        console.error('Error validating address:', error);
        return false;
    }
}; 