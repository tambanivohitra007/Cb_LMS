import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { 
    Users, 
    Plus, 
    Save, 
    X, 
    Edit, 
    Trash2, 
    User, 
    GraduationCap, 
    Shield,
    UserCheck
} from 'lucide-react';

function UserManagement() {
    const { apiClient } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    
    // Form states
    const [newUser, setNewUser] = useState({
        name: '',
        email: '',
        password: '',
        role: 'STUDENT'
    });
    const [editUser, setEditUser] = useState({
        name: '',
        email: '',
        password: '',
        role: 'STUDENT'
    });
    const [creating, setCreating] = useState(false);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, [apiClient]);

    const fetchUsers = async () => {
        try {
            setError('');
            const res = await apiClient.get('/users');
            setUsers(res.data || []);
        } catch (error) {
            console.error("Failed to fetch users", error);
            setError('Failed to load users. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        if (!newUser.name.trim() || !newUser.email.trim() || !newUser.password.trim()) {
            alert('All fields are required');
            return;
        }

        try {
            setCreating(true);
            await apiClient.post('/users', {
                name: newUser.name.trim(),
                email: newUser.email.trim().toLowerCase(),
                password: newUser.password,
                role: newUser.role
            });
            
            setNewUser({ name: '', email: '', password: '', role: 'STUDENT' });
            setShowCreateForm(false);
            fetchUsers();
        } catch (error) {
            console.error('Failed to create user', error);
            alert(error.message || 'Failed to create user. Please try again.');
        } finally {
            setCreating(false);
        }
    };

    const handleEdit = (user) => {
        setEditingUser(user.id);
        setEditUser({
            name: user.name,
            email: user.email,
            password: '', // Don't pre-fill password
            role: user.role
        });
        setShowCreateForm(false);
    };

    const handleUpdateUser = async (e) => {
        e.preventDefault();
        if (!editUser.name.trim() || !editUser.email.trim()) {
            alert('Name and email are required');
            return;
        }

        try {
            setUpdating(true);
            const updateData = {
                name: editUser.name.trim(),
                email: editUser.email.trim().toLowerCase(),
                role: editUser.role
            };

            // Only include password if it's provided
            if (editUser.password.trim()) {
                updateData.password = editUser.password;
            }

            await apiClient.put(`/users/${editingUser}`, updateData);
            
            setEditingUser(null);
            setEditUser({ name: '', email: '', password: '', role: 'STUDENT' });
            fetchUsers();
        } catch (error) {
            console.error('Failed to update user', error);
            alert(error.message || 'Failed to update user. Please try again.');
        } finally {
            setUpdating(false);
        }
    };

    const handleDelete = async (userId, userName) => {
        if (window.confirm(`Are you sure you want to delete ${userName}? This action will soft delete the user.`)) {
            try {
                await apiClient.delete(`/users/${userId}`);
                fetchUsers();
            } catch (error) {
                console.error('Failed to delete user', error);
                alert(error.message || 'Failed to delete user. Please try again.');
            }
        }
    };

    const handleCancelEdit = () => {
        setEditingUser(null);
        setEditUser({ name: '', email: '', password: '', role: 'STUDENT' });
    };

    const getRoleBadgeColor = (role) => {
        switch (role) {
            case 'ADMIN': return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300';
            case 'TEACHER': return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300';
            case 'STUDENT': return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300';
            default: return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
        }
    };

    if (loading) return (
        <div className="p-8 flex justify-center items-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">Loading users...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="p-8">
            <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded">
                {error}
            </div>
        </div>
    );

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">User Management</h1>
                <button 
                    onClick={() => {
                        setShowCreateForm(!showCreateForm);
                        setEditingUser(null);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-800 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors"
                >
                    {showCreateForm ? (
                        <>
                            <X className="h-4 w-4" />
                            Cancel
                        </>
                    ) : (
                        <>
                            <Plus className="h-4 w-4" />
                            Create New User
                        </>
                    )}
                </button>
            </div>

            {showCreateForm && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6 border dark:border-gray-700">
                    <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Create New User</h2>
                    <form onSubmit={handleCreateUser}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    value={newUser.name}
                                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                    className="shadow appearance-none border dark:border-gray-600 rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-indigo-500 dark:focus:border-indigo-400"
                                    placeholder="Enter full name"
                                    required
                                />
                            </div>
                            
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={newUser.email}
                                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    placeholder="Enter email address"
                                    required
                                />
                            </div>
                            
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    value={newUser.password}
                                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    placeholder="Enter password"
                                    required
                                />
                            </div>
                            
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2">
                                    Role
                                </label>
                                <select
                                    value={newUser.role}
                                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    required
                                >
                                    <option value="STUDENT">Student</option>
                                    <option value="TEACHER">Teacher</option>
                                    <option value="ADMIN">Admin</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex space-x-4 mt-6">
                            <button
                                type="submit"
                                disabled={creating}
                                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
                            >
                                {creating ? 'Creating...' : 'Create User'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowCreateForm(false)}
                                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white p-6 rounded-lg shadow-md">
                {users.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-gray-500">No users found.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        User
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Role
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Created
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {users.map(user => (
                                    <tr key={user.id}>
                                        {editingUser === user.id ? (
                                            <td colSpan="4" className="px-6 py-4">
                                                <div className="bg-gray-50 p-4 rounded-lg">
                                                    <h3 className="text-lg font-semibold mb-4">Edit User</h3>
                                                    <form onSubmit={handleUpdateUser}>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="block text-gray-700 text-sm font-bold mb-2">
                                                                    Full Name
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    value={editUser.name}
                                                                    onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
                                                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                                                    required
                                                                />
                                                            </div>
                                                            
                                                            <div>
                                                                <label className="block text-gray-700 text-sm font-bold mb-2">
                                                                    Email
                                                                </label>
                                                                <input
                                                                    type="email"
                                                                    value={editUser.email}
                                                                    onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                                                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                                                    required
                                                                />
                                                            </div>
                                                            
                                                            <div>
                                                                <label className="block text-gray-700 text-sm font-bold mb-2">
                                                                    New Password (optional)
                                                                </label>
                                                                <input
                                                                    type="password"
                                                                    value={editUser.password}
                                                                    onChange={(e) => setEditUser({ ...editUser, password: e.target.value })}
                                                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                                                    placeholder="Leave blank to keep current password"
                                                                />
                                                            </div>
                                                            
                                                            <div>
                                                                <label className="block text-gray-700 text-sm font-bold mb-2">
                                                                    Role
                                                                </label>
                                                                <select
                                                                    value={editUser.role}
                                                                    onChange={(e) => setEditUser({ ...editUser, role: e.target.value })}
                                                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                                                    required
                                                                >
                                                                    <option value="STUDENT">Student</option>
                                                                    <option value="TEACHER">Teacher</option>
                                                                    <option value="ADMIN">Admin</option>
                                                                </select>
                                                            </div>
                                                        </div>

                                                        <div className="flex space-x-4 mt-4">
                                                            <button
                                                                type="submit"
                                                                disabled={updating}
                                                                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                                                            >
                                                                {updating ? 'Updating...' : 'Update User'}
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={handleCancelEdit}
                                                                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </form>
                                                </div>
                                            </td>
                                        ) : (
                                            <>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <img 
                                                            className="h-10 w-10 rounded-full" 
                                                            src={user.photo || 'https://i.pravatar.cc/150'} 
                                                            alt={user.name}
                                                            onError={(e) => {
                                                                e.target.src = 'https://i.pravatar.cc/150';
                                                            }}
                                                        />
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {user.name}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                {user.email}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {new Date(user.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex justify-end space-x-2">
                                                        <button 
                                                            onClick={() => handleEdit(user)}
                                                            className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDelete(user.id, user.name)} 
                                                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default UserManagement;
