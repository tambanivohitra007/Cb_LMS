import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { 
    User, 
    Edit, 
    Save, 
    X, 
    Camera,
    Mail,
    AlertCircle,
    CheckCircle
} from 'lucide-react';

function Profile() {
    const { user, apiClient, setUser } = useAuth();
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [photo, setPhoto] = useState(user?.photo || '');
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        // Fetch profile from backend
        const fetchProfile = async () => {
            try {
                setError('');
                const res = await apiClient.get('/profile');
                const profile = res.data;
                setName(profile.name || '');
                setEmail(profile.email || '');
                setPhoto(profile.photo || '');
                if (setUser) setUser(profile); // update global user if available
            } catch (err) {
                setError('Failed to load profile.');
            }
        };
        fetchProfile();
        // eslint-disable-next-line
    }, []);

    const handleSave = async () => {
        if (!name.trim() || !email.trim()) {
            setError('Name and email are required');
            return;
        }
        try {
            setLoading(true);
            setError('');
            setSuccess('');
            const res = await apiClient.put('/profile', {
                name: name.trim(),
                email: email.trim(),
                photo: photo.trim()
            });
            setSuccess('Profile updated successfully!');
            setIsEditing(false);
            if (setUser) setUser(res.data);
        } catch (error) {
            setError(error?.response?.data?.message || 'Failed to update profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setName(user?.name || '');
        setEmail(user?.email || '');
        setPhoto(user?.photo || '');
        setIsEditing(false);
        setError('');
        setSuccess('');
    };

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">My Profile</h1>
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md border dark:border-gray-700">
                <div className="flex items-center space-x-6 mb-8">
                    <div className="relative">
                        <img 
                            src={user?.photo || 'https://i.pravatar.cc/150'} 
                            alt="profile" 
                            className="w-24 h-24 rounded-full border-4 border-gray-200 dark:border-gray-600"
                            onError={(e) => {
                                e.target.src = 'https://i.pravatar.cc/150';
                            }}
                        />
                        {isEditing && (
                            <div className="absolute bottom-0 right-0 bg-indigo-500 text-white p-1 rounded-full">
                                <Camera className="h-3 w-3" />
                            </div>
                        )}
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{user?.name || 'Unknown User'}</h2>
                        <p className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            {user?.role === 'TEACHER' ? <GraduationCap className="h-4 w-4" /> : 
                             user?.role === 'ADMIN' ? <Shield className="h-4 w-4" /> : 
                             <User className="h-4 w-4" />}
                            {user?.role || 'Unknown Role'}
                        </p>
                    </div>
                </div>

                {error && (
                    <div className="mb-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mb-4 bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-300 px-4 py-3 rounded flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        {success}
                    </div>
                )}

                <div>
                    <div className="mb-4">
                        <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2 flex items-center gap-1">
                            <User className="h-4 w-4" />
                            Full Name
                        </label>
                        <input 
                            type="text" 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            readOnly={!isEditing}
                            className={`shadow appearance-none border dark:border-gray-600 rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 leading-tight focus:outline-none focus:shadow-outline focus:border-indigo-500 dark:focus:border-indigo-400 ${!isEditing ? 'bg-gray-100 dark:bg-gray-700' : 'bg-white dark:bg-gray-800'}`}
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2 flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            Email Address
                        </label>
                        <input 
                            type="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            readOnly={!isEditing}
                            className={`shadow appearance-none border dark:border-gray-600 rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 leading-tight focus:outline-none focus:shadow-outline focus:border-indigo-500 dark:focus:border-indigo-400 ${!isEditing ? 'bg-gray-100 dark:bg-gray-700' : 'bg-white dark:bg-gray-800'}`}
                        />
                    </div>
                    
                    <div className="flex space-x-4">
                        {!isEditing ? (
                            <button 
                                onClick={() => setIsEditing(true)}
                                className="bg-indigo-500 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-800 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center gap-2 transition-colors"
                            >
                                <Edit className="h-4 w-4" />
                                Edit Profile
                            </button>
                        ) : (
                            <>
                                <button 
                                    onClick={handleSave}
                                    disabled={loading}
                                    className="bg-green-500 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-800 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50 flex items-center gap-2 transition-colors"
                                >
                                    <Save className="h-4 w-4" />
                                    {loading ? 'Saving...' : 'Save Changes'}
                                </button>
                                <button 
                                    onClick={handleCancel}
                                    disabled={loading}
                                    className="bg-gray-500 hover:bg-gray-700 dark:bg-gray-600 dark:hover:bg-gray-800 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50 flex items-center gap-2 transition-colors"
                                >
                                    <X className="h-4 w-4" />
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