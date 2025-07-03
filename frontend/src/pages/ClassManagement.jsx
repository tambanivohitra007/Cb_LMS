import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';

function ClassManagement() {
    const { apiClient } = useAuth();
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newClass, setNewClass] = useState({ name: '', description: '' });
    const [creating, setCreating] = useState(false);
    const [editingClass, setEditingClass] = useState(null);
    const [editClass, setEditClass] = useState({ name: '', description: '' });
    const [updating, setUpdating] = useState(false);

    const fetchClasses = async () => {
        try {
            setError('');
            const res = await apiClient.get('/classes');
            setClasses(res.data || []);
        } catch (error) {
            console.error("Failed to fetch classes", error);
            setError('Failed to load classes. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClasses();
    }, [apiClient]);

    const handleDelete = async (classId) => {
        if (window.confirm('Are you sure you want to move this class to the trash?')) {
            try {
                await apiClient.delete(`/classes/${classId}`);
                fetchClasses(); // Refresh list
            } catch (error) {
                console.error('Failed to delete class', error);
                alert('Failed to delete class. Please try again.');
            }
        }
    };

    const handleEdit = (cls) => {
        setEditingClass(cls.id);
        setEditClass({ name: cls.name, description: cls.description || '' });
        setShowCreateForm(false); // Close create form if open
    };

    const handleCancelEdit = () => {
        setEditingClass(null);
        setEditClass({ name: '', description: '' });
    };

    const handleUpdateClass = async (e) => {
        e.preventDefault();
        if (!editClass.name.trim()) {
            alert('Class name is required');
            return;
        }

        try {
            setUpdating(true);
            await apiClient.put(`/classes/${editingClass}`, {
                name: editClass.name.trim(),
                description: editClass.description.trim()
            });
            setEditingClass(null);
            setEditClass({ name: '', description: '' });
            fetchClasses(); // Refresh list
        } catch (error) {
            console.error('Failed to update class', error);
            alert('Failed to update class. Please try again.');
        } finally {
            setUpdating(false);
        }
    };

    const handleCreateClass = async (e) => {
        e.preventDefault();
        if (!newClass.name.trim()) {
            alert('Class name is required');
            return;
        }

        try {
            setCreating(true);
            await apiClient.post('/classes', {
                name: newClass.name.trim(),
                description: newClass.description.trim()
            });
            setNewClass({ name: '', description: '' });
            setShowCreateForm(false);
            fetchClasses(); // Refresh list
        } catch (error) {
            console.error('Failed to create class', error);
            alert('Failed to create class. Please try again.');
        } finally {
            setCreating(false);
        }
    };

    if (loading) return (
        <div className="p-8 flex justify-center items-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading classes...</p>
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
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Class Management</h1>
                <button 
                    onClick={() => {
                        setShowCreateForm(!showCreateForm);
                        setEditingClass(null); // Close edit form if open
                    }}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                >
                    {showCreateForm ? 'Cancel' : 'Create New Class'}
                </button>
            </div>

            {showCreateForm && (
                <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                    <h2 className="text-xl font-semibold mb-4">Create New Class</h2>
                    <form onSubmit={handleCreateClass}>
                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-bold mb-2">
                                Class Name
                            </label>
                            <input
                                type="text"
                                value={newClass.name}
                                onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                placeholder="Enter class name"
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-bold mb-2">
                                Description
                            </label>
                            <textarea
                                value={newClass.description}
                                onChange={(e) => setNewClass({ ...newClass, description: e.target.value })}
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                placeholder="Enter class description"
                                rows="3"
                            />
                        </div>
                        <div className="flex space-x-4">
                            <button
                                type="submit"
                                disabled={creating}
                                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
                            >
                                {creating ? 'Creating...' : 'Create Class'}
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
                {classes.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-gray-500">No classes found. Create your first class to get started!</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-200">
                        {classes.map(cls => (
                            <li key={cls.id} className="py-4">
                                {editingClass === cls.id ? (
                                    // Edit Form
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h3 className="text-lg font-semibold mb-4">Edit Class</h3>
                                        <form onSubmit={handleUpdateClass}>
                                            <div className="mb-4">
                                                <label className="block text-gray-700 text-sm font-bold mb-2">
                                                    Class Name
                                                </label>
                                                <input
                                                    type="text"
                                                    value={editClass.name}
                                                    onChange={(e) => setEditClass({ ...editClass, name: e.target.value })}
                                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                                    placeholder="Enter class name"
                                                    required
                                                />
                                            </div>
                                            <div className="mb-4">
                                                <label className="block text-gray-700 text-sm font-bold mb-2">
                                                    Description
                                                </label>
                                                <textarea
                                                    value={editClass.description}
                                                    onChange={(e) => setEditClass({ ...editClass, description: e.target.value })}
                                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                                    placeholder="Enter class description"
                                                    rows="3"
                                                />
                                            </div>
                                            <div className="flex space-x-4">
                                                <button
                                                    type="submit"
                                                    disabled={updating}
                                                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                                                >
                                                    {updating ? 'Updating...' : 'Update Class'}
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
                                ) : (
                                    // View Mode
                                    <div>
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h3 className="text-xl font-bold text-indigo-800">{cls.name}</h3>
                                                <p className="text-gray-600">{cls.description || 'No description'}</p>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    Students: {cls.students?.length || 0} | 
                                                    Assignments: {cls.assignments?.length || 0}
                                                </p>
                                            </div>
                                            <div className="flex space-x-2">
                                                <button 
                                                    onClick={() => handleEdit(cls)}
                                                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm"
                                                >
                                                    Edit
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(cls.id)} 
                                                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                                                >
                                                    Trash
                                                </button>
                                            </div>
                                        </div>
                                        <div className="mt-4 pl-4 border-l-2 border-indigo-100">
                                            <h4 className="font-semibold mb-2">Assignments</h4>
                                            {cls.assignments && cls.assignments.length > 0 ? (
                                                <ul className="list-disc pl-5 space-y-1">
                                                    {cls.assignments.map(a => (
                                                        <li key={a.id} className="text-sm">
                                                            {a.title}
                                                            {a._count?.submissions && (
                                                                <span className="text-gray-500 ml-2">
                                                                    ({a._count.submissions} submissions)
                                                                </span>
                                                            )}
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="text-sm text-gray-500">No assignments yet.</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

export default ClassManagement;