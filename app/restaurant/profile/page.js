'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWeb3 } from '../../context/Web3Context';
import { ethers } from 'ethers';

export default function RestaurantProfile() {
    const router = useRouter();
    const { connect, account, contract, isConnected, isRestaurant, loading } = useWeb3();

    const [restaurantInfo, setRestaurantInfo] = useState(null);
    const [dishes, setDishes] = useState([]);
    const [loadingData, setLoadingData] = useState(false);

    // Add dish form state
    const [showAddDishForm, setShowAddDishForm] = useState(false);
    const [addingDish, setAddingDish] = useState(false);
    const [newDish, setNewDish] = useState({
        name: '',
        mainComponent: '',
        carbonCredits: 10,
        price: 0.01,
        isActive: true
    });

    // Edit dish form state
    const [editDishId, setEditDishId] = useState(null);
    const [editingDish, setEditingDish] = useState(false);
    const [editDishData, setEditDishData] = useState({
        name: '',
        price: 0,
        isActive: true
    });

    // Load restaurant data when connected
    useEffect(() => {
        if (isConnected && contract && account) {
            loadRestaurantData();
        }
    }, [isConnected, contract, account]);

    // Redirect to registration if not a restaurant
    useEffect(() => {
        if (isConnected && !isRestaurant && !loading) {
            router.push('/restaurant/register');
        }
    }, [isConnected, isRestaurant, loading, router]);

    // Load restaurant and dish data
    const loadRestaurantData = async () => {
        setLoadingData(true);
        try {
            // Get restaurant info
            const restaurantData = await contract.restaurants(account);
            setRestaurantInfo({
                name: restaurantData.name,
                isVerified: restaurantData.isVerified,
                supplySource: restaurantData.supplySource,
                supplyDetails: restaurantData.supplyDetails,
                registrationTimestamp: restaurantData.registrationTimestamp.toNumber()
            });

            // Get restaurant dishes
            const result = await contract.getRestaurantInfo(account, 0, 100, false);
            const formattedDishes = result.dishDetails.map((dish, index) => ({
                id: result.dishIds[index].toNumber(),
                name: dish.name,
                mainComponent: dish.mainComponent,
                carbonCredits: dish.carbonCredits.toNumber(),
                price: ethers.utils.formatEther(dish.price),
                isActive: dish.isActive
            }));

            setDishes(formattedDishes);
        } catch (error) {
            console.error("Error loading restaurant data:", error);
            alert("Error loading restaurant data. Please try again.");
        } finally {
            setLoadingData(false);
        }
    };

    // Handle new dish form input changes
    const handleNewDishChange = (e) => {
        const { name, value, type, checked } = e.target;
        setNewDish(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Handle edit dish form input changes
    const handleEditDishChange = (e) => {
        const { name, value, type, checked } = e.target;
        setEditDishData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Add a new dish
    const handleAddDish = async (e) => {
        e.preventDefault();
        setAddingDish(true);
        try {
            const priceInWei = ethers.utils.parseEther(newDish.price.toString());

            const tx = await contract.addDish(
                newDish.name,
                newDish.mainComponent,
                newDish.carbonCredits,
                priceInWei,
                newDish.isActive
            );

            await tx.wait();

            // Reset form and reload data
            setNewDish({
                name: '',
                mainComponent: '',
                carbonCredits: 10,
                price: 0.01,
                isActive: true
            });
            setShowAddDishForm(false);
            await loadRestaurantData();
        } catch (error) {
            console.error("Error adding dish:", error);
            alert("Error adding dish. Please try again.");
        } finally {
            setAddingDish(false);
        }
    };

    // Start editing a dish
    const startEditDish = (dish) => {
        setEditDishId(dish.id);
        setEditDishData({
            name: dish.name,
            price: dish.price,
            isActive: dish.isActive
        });
    };

    // Cancel dish editing
    const cancelEditDish = () => {
        setEditDishId(null);
        setEditDishData({
            name: '',
            price: 0,
            isActive: true
        });
    };

    // Update a dish
    const handleUpdateDish = async (e, dishId) => {
        e.preventDefault();
        setEditingDish(true);
        try {
            const priceInWei = ethers.utils.parseEther(editDishData.price.toString());

            const tx = await contract.manageDish(
                dishId,
                editDishData.name,
                priceInWei,
                editDishData.isActive,
                false // not deactivate only
            );

            await tx.wait();

            // Reset form and reload data
            cancelEditDish();
            await loadRestaurantData();
        } catch (error) {
            console.error("Error updating dish:", error);
            alert("Error updating dish. Please try again.");
        } finally {
            setEditingDish(false);
        }
    };

    // Deactivate a dish
    const deactivateDish = async (dishId) => {
        try {
            const tx = await contract.manageDish(
                dishId,
                "", // name not needed for deactivation
                0,  // price not needed for deactivation
                false, // setting as inactive
                true   // deactivate only
            );

            await tx.wait();
            await loadRestaurantData();
        } catch (error) {
            console.error("Error deactivating dish:", error);
            alert("Error deactivating dish. Please try again.");
        }
    };

    // Get supply source text
    const getSupplySourceText = (sourceId) => {
        const sources = ["Local Producer", "Imported Producer", "Green Producer", "Other"];
        return sources[sourceId] || "Unknown";
    };

    // Format date from unix timestamp
    const formatDate = (timestamp) => {
        return new Date(timestamp * 1000).toLocaleDateString();
    };

    if (!isConnected) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <h1 className="text-2xl font-bold text-green-800 mb-6">Restaurant Profile</h1>
                <div className="bg-yellow-50 p-4 rounded-md border border-yellow-100">
                    <p className="text-yellow-700">Please connect your wallet to view your restaurant profile.</p>
                    <button
                        onClick={connect}
                        disabled={loading}
                        className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
                    >
                        {loading ? 'Connecting...' : 'Connect Wallet'}
                    </button>
                </div>
            </div>
        );
    }

    if (loading || loadingData) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <h1 className="text-2xl font-bold text-green-800 mb-6">Restaurant Profile</h1>
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-2xl font-bold text-green-800 mb-6">Restaurant Profile</h1>

            {restaurantInfo && (
                <div className="bg-white p-5 rounded-lg shadow-md mb-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">{restaurantInfo.name}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-gray-500">Supply Source</p>
                            <p className="font-medium">{getSupplySourceText(restaurantInfo.supplySource)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Registration Date</p>
                            <p className="font-medium">{formatDate(restaurantInfo.registrationTimestamp)}</p>
                        </div>
                        <div className="md:col-span-2">
                            <p className="text-sm text-gray-500">Supply Details</p>
                            <p className="font-medium">{restaurantInfo.supplyDetails}</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Your Dishes</h2>
                <button
                    onClick={() => setShowAddDishForm(!showAddDishForm)}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                    {showAddDishForm ? 'Cancel' : 'Add New Dish'}
                </button>
            </div>

            {showAddDishForm && (
                <div className="bg-white p-5 rounded-lg shadow-md mb-8">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Dish</h3>
                    <form onSubmit={handleAddDish} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Dish Name</label>
                            <input
                                type="text"
                                name="name"
                                value={newDish.name}
                                onChange={handleNewDishChange}
                                required
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Main Component</label>
                            <input
                                type="text"
                                name="mainComponent"
                                value={newDish.mainComponent}
                                onChange={handleNewDishChange}
                                required
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Carbon Credits (1-100)</label>
                            <input
                                type="number"
                                name="carbonCredits"
                                value={newDish.carbonCredits}
                                onChange={handleNewDishChange}
                                min="1"
                                max="100"
                                required
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Price (ETH)</label>
                            <input
                                type="number"
                                name="price"
                                value={newDish.price}
                                onChange={handleNewDishChange}
                                min="0.001"
                                step="0.001"
                                required
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                            />
                        </div>

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                name="isActive"
                                checked={newDish.isActive}
                                onChange={handleNewDishChange}
                                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                            />
                            <label className="ml-2 block text-sm text-gray-900">
                                Active (available for purchase)
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={addingDish}
                            className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400"
                        >
                            {addingDish ? 'Adding Dish...' : 'Add Dish'}
                        </button>
                    </form>
                </div>
            )}

            {dishes.length > 0 ? (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Dish
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Details
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Price
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {dishes.map((dish) => (
                                <tr key={dish.id} className={!dish.isActive ? 'bg-gray-50' : ''}>
                                    {editDishId === dish.id ? (
                                        <td colSpan="5" className="px-6 py-4">
                                            <form onSubmit={(e) => handleUpdateDish(e, dish.id)} className="space-y-3">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Dish Name</label>
                                                    <input
                                                        type="text"
                                                        name="name"
                                                        value={editDishData.name}
                                                        onChange={handleEditDishChange}
                                                        required
                                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Price (ETH)</label>
                                                    <input
                                                        type="number"
                                                        name="price"
                                                        value={editDishData.price}
                                                        onChange={handleEditDishChange}
                                                        min="0.001"
                                                        step="0.001"
                                                        required
                                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                                                    />
                                                </div>

                                                <div className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        name="isActive"
                                                        checked={editDishData.isActive}
                                                        onChange={handleEditDishChange}
                                                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                                    />
                                                    <label className="ml-2 block text-sm text-gray-900">
                                                        Active (available for purchase)
                                                    </label>
                                                </div>

                                                <div className="flex space-x-2">
                                                    <button
                                                        type="submit"
                                                        disabled={editingDish}
                                                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:bg-gray-400"
                                                    >
                                                        {editingDish ? 'Saving...' : 'Save Changes'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={cancelEditDish}
                                                        className="px-3 py-1 bg-gray-200 text-gray-800 text-sm rounded hover:bg-gray-300"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </form>
                                        </td>
                                    ) : (
                                        <>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{dish.name}</div>
                                                <div className="text-sm text-gray-500">#{dish.id}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{dish.mainComponent}</div>
                                                <div className="text-sm text-gray-500">{dish.carbonCredits} carbon credits</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{dish.price} ETH</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${dish.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                    {dish.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => startEditDish(dish)}
                                                    className="text-green-600 hover:text-green-900 mr-3"
                                                >
                                                    Edit
                                                </button>
                                                {dish.isActive && (
                                                    <button
                                                        onClick={() => deactivateDish(dish.id)}
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        Deactivate
                                                    </button>
                                                )}
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="bg-white p-8 rounded-lg shadow-md text-center">
                    <p className="text-gray-500">You haven't added any dishes yet.</p>
                </div>
            )}
        </div>
    );
} 