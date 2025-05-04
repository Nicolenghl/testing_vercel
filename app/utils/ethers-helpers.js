import { ethers } from 'ethers';

/**
 * Format Wei value to ETH with specified decimals
 * @param {string|BigNumber} wei - The wei amount to convert
 * @param {number} decimals - Number of decimal places to show
 * @returns {string} Formatted ETH value
 */
export const formatEth = (wei, decimals = 4) => {
    if (!wei) return '0';
    try {
        const formatted = ethers.utils.formatEther(wei);
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
    if (!eth) return ethers.BigNumber.from(0);
    try {
        return ethers.utils.parseEther(eth.toString());
    } catch (error) {
        console.error('Error parsing ETH:', error);
        return ethers.BigNumber.from(0);
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
        return ethers.utils.isAddress(address);
    } catch (error) {
        return false;
    }
}; 