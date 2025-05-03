'use client';
   
import Link from 'next/link';
import { useWeb3 } from '../context/Web3Context';

export default function Navbar() {
  const { connect, disconnect, account, isConnected, isRestaurant } = useWeb3();
  
  const shortenAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };
  
  return (
    <header className="bg-white shadow">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Top">
        <div className="flex w-full items-center justify-between border-b border-green-500 py-6 lg:border-none">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-green-600">
              GreenDish
            </Link>
            <div className="ml-10 hidden space-x-8 lg:block">
              <Link href="/marketplace" className="text-base font-medium text-gray-700 hover:text-green-600">
                Ma