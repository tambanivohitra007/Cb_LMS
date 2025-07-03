import React, { useState } from 'react';
import { useAuth } from '../App';

function Profile() {
    const { user, apiClient } = useAuth();
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSave = async () => {
        if (!name.trim() || !email.trim()) {
            setError('Name and email are required');
            return;
        }

        try {
            setLoading(true);
            setError('');
            setSuccess('');
            
            // Note: This endpoint would need to be implemented in the backend
            // For now, we'll just simulate the update
            console.log("Profile update would be sent to API:", { name: name.trim(), email: email.trim() });
            
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            setSuccess('Profile updated successfully! (Note: This is a simulation - backend endpoint needed)');
            setIsEditing(false);
        } catch (error) {
            console.error('Failed to update profile', error);
            setError('Failed to update profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setName(user?.name || '');
        setEmail(user?.email || '');
        setIsEditing(false);
        setError('');
        setSuccess('');
    };

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">My Profile</h1>
            <div className="bg-white p-8 rounded-lg shadow-md">
                <div className="flex items-center space-x-6 mb-8">
                    <img 
                        src={user?.photo || 'https://i.pravatar.cc/150'} 
                        alt="profile" 
                        className="w-24 h-24 rounded-full"
                        onError={(e) => {
                            e.target.src = 'https://i.pravatar.cc/150';
                        }}
                    />
                    <div>
                        <h2 className="text-2xl font-bold">{user?.name || 'Unknown User'}</h2>
                        <p className="text-gray-500">{user?.role || 'Unknown Role'}</p>
                    </div>
                </div>

                {error && (
                    <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                        {success}
                    </div>
                )}

                <div>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Full Name</label>
                        <input 
                            type="text" 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            readOnly={!isEditing}
                            className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${!isEditing && 'bg-gray-100'}`}
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Email Address</label>
                        <input 
                            type="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            readOnly={!isEditing}
                            className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${!isEditing && 'bg-gray-100'}`}
                        />
                    </div>
                    
                    <div className="flex space-x-4">
                        {!isEditing ? (
                            <button 
                                onClick={() => setIsEditing(true)}
                                className="bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                            >
                                Edit Profile
                            </button>
                        ) : (
                            <>
                                <button 
                                    onClick={handleSave}
                                    disabled={loading}
                                    className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
                                >
                                    {loading ? 'Saving...' : 'Save Changes'}
                                </button>
                                <button 
                                    onClick={handleCancel}
                                    disabled={loading}
                                    className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Profile;