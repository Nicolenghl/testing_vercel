'use client';
   
import Navbar from '../components/Navbar';
import { useWeb3 } from '../context/Web3Context';

export default function Profile() {
  const { isConnected, account, connect } = useWeb3();
  
  // Mock data 
  const mockData = {
    carbonCredits: 80,
    tokenBalance: '25.5',
    transactions: [
      { id: 1, dish: "Organic Vegan Bowl", date: "2023-04-25", credits: 25, price: "0.01 ETH" },
      { id: 2, dish: "Sustainable Fish Tacos", date: "2023-04-22", credits: 40, price: "0.015 ETH" },
      { id: 3, dish: "Farm-to-Table Salad", date: "2023-04-18", credits: 15, price: "0.008 ETH" }
    ]
  };
  
  if (!isConnected) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-green-50 to-green-100">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white shadow rounded-lg p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Connect Your Wallet</h1>
            <p className="text-gray-600 mb-6">Please connect your wallet to view your profile.</p>
            <button
              onClick={connect}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded"
            >
              Connect Wallet
            </button>
          </div>
        </div>
      </main>
    );
  }
  
  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-green-100">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Profile</h1>
        
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
          {/* Stats Section */}
          <div className="md:col-span-4 space-y-6">
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Your Wallet</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Carbon Credits</p>
                    <p className="text-2xl font-bold text-green-700">{mockData.carbonCredits}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">GreenCoins</p>
                    <p className="text-2xl font-bold text-green-700">{mockData.tokenBalance}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Transaction History */}
          <div className="md:col-span-8">
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Transaction History</h2>
              </div>
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Dish
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Price
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Credits
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {mockData.transactions.map((tx) => (
                        <tr key={tx.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {tx.dish}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {tx.date}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {tx.price}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              +{tx.credits}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}