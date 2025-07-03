import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';

function Trash() {
    const { apiClient } = useAuth();
    const [trashItems, setTrashItems] = useState({ deletedClasses: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchTrash = async () => {
        try {
            setError('');
            const res = await apiClient.get('/trash');
            setTrashItems(res.data || { deletedClasses: [] });
        } catch (error) {
            console.error("Failed to fetch trash", error);
            setError('Failed to load trash items. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTrash();
    }, [apiClient]);

    const handleRestore = async (classId) => {
        try {
            await apiClient.post(`/trash/restore/class/${classId}`);
            fetchTrash();
        } catch (error) {
            console.error('Failed to restore class', error);
            alert('Failed to restore class. Please try again.');
        }
    };
    
    const handlePermanentDelete = async (classId) => {
        if(window.confirm('This action is permanent and cannot be undone. Are you sure?')) {
            try {
                await apiClient.delete(`/trash/permanent/class/${classId}`);
                fetchTrash();
            } catch (error) {
                console.error('Failed to permanently delete class', error);
                alert('Failed to permanently delete class. Please try again.');
            }
        }
    };

    if (loading) return (
        <div className="p-8 flex justify-center items-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading trash...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="p-8">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
            </div>
        </div>
    );

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Trash</h1>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Deleted Classes</h2>
                {trashItems.deletedClasses && trashItems.deletedClasses.length > 0 ? (
                    <ul className="divide-y divide-gray-200">
                        {trashItems.deletedClasses.map(cls => (
                            <li key={cls.id} className="py-3 flex justify-between items-center">
                                <div>
                                    <p className="font-medium">{cls.name}</p>
                                    <p className="text-sm text-gray-500">
                                        Deleted on: {new Date(cls.deleted_at).toLocaleDateString()}
                                    </p>
                                    {cls.description && (
                                        <p className="text-sm text-gray-600 mt-1">{cls.description}</p>
                                    )}
                                </div>
                                <div>
                                    <button 
                                        onClick={() => handleRestore(cls.id)} 
                                        className="text-green-600 hover:text-green-800 font-semibold mr-4"
                                    >
                                        Restore
                                    </button>
                                    <button 
                                        onClick={() => handlePermanentDelete(cls.id)} 
                                        className="text-red-600 hover:text-red-800 font-semibold"
                                    >
                                        Delete Permanently
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-center py-8">
                        <p className="text-gray-500">The trash is empty.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Trash;