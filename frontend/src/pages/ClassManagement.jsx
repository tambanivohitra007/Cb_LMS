import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { useNavigate } from 'react-router-dom';
import RichTextEditor from '../components/RichTextEditor';
import { 
    Users, 
    GraduationCap, 
    School, 
    User, 
    Plus, 
    Save, 
    Edit, 
    Trash2, 
    FileText, 
    UserPlus,
    X
} from 'lucide-react';

function ClassManagement() {
    const { apiClient } = useAuth();
    const navigate = useNavigate();
    const [classes, setClasses] = useState([]);
    const [cohorts, setCohorts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newClass, setNewClass] = useState({ name: '', description: '', cohortId: '' });
    const [creating, setCreating] = useState(false);
    const [editingClass, setEditingClass] = useState(null);
    const [editClass, setEditClass] = useState({ name: '', description: '', cohortId: '' });
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

    const fetchCohorts = async () => {
        try {
            const res = await apiClient.get('/cohorts');
            setCohorts(res.data || []);
        } catch (error) {
            console.error("Failed to fetch cohorts", error);
            // Don't set error for cohorts as it's optional
        }
    };

    useEffect(() => {
        fetchClasses();
        fetchCohorts();
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
        setEditClass({ 
            name: cls.name, 
            description: cls.description || '',
            cohortId: cls.cohort?.id || ''
        });
        setShowCreateForm(false); // Close create form if open
    };

    const handleCancelEdit = () => {
        setEditingClass(null);
        setEditClass({ name: '', description: '', cohortId: '' });
    };

    // Helper functions for cohort display
    const getLevelName = (level) => {
        const levels = {
            1: 'Elementary',
            2: 'Middle School', 
            3: 'High School',
            4: 'College',
            5: 'Graduate'
        };
        return levels[level] || `Level ${level}`;
    };

    const getLevelIcon = (level) => {
        if (level <= 1) return <User className="h-4 w-4" />;
        if (level <= 2) return <School className="h-4 w-4" />;
        return <GraduationCap className="h-4 w-4" />;
    };

    const getLevelColor = (level) => {
        if (level <= 1) return 'bg-green-100 text-green-800';
        if (level <= 2) return 'bg-blue-100 text-blue-800'; 
        return 'bg-purple-100 text-purple-800';
    };

    const handleUpdateClass = async (e) => {
        e.preventDefault();
        if (!editClass.name.trim()) {
            alert('Class name is required');
            return;
        }

        try {
            setUpdating(true);
            const updateData = {
                name: editClass.name.trim(),
                description: editClass.description.trim()
            };
            
            // Only include cohortId if one is selected
            if (editClass.cohortId) {
                updateData.cohortId = editClass.cohortId;
            }
            
            await apiClient.put(`/classes/${editingClass}`, updateData);
            setEditingClass(null);
            setEditClass({ name: '', description: '', cohortId: '' });
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
            const createData = {
                name: newClass.name.trim(),
                description: newClass.description.trim()
            };
            
            // Only include cohortId if one is selected
            if (newClass.cohortId) {
                createData.cohortId = newClass.cohortId;
            }
            
            await apiClient.post('/classes', createData);
            setNewClass({ name: '', description: '', cohortId: '' });
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
                <p className="mt-4 text-gray-600 dark:text-gray-400">Loading classes...</p>
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
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Class Management</h1>
                <button 
                    onClick={() => {
                        setShowCreateForm(!showCreateForm);
                        setEditingClass(null); // Close edit form if open
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
                            Create New Class
                        </>
                    )}
                </button>
            </div>

            {showCreateForm && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6 border dark:border-gray-700">
                    <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Create New Class</h2>
                    <form onSubmit={handleCreateClass}>
                        <div className="mb-4">
                            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                                Class Name
                            </label>
                            <input
                                type="text"
                                value={newClass.name}
                                onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                                className="shadow appearance-none border dark:border-gray-600 rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-indigo-500 dark:focus:border-indigo-400"
                                placeholder="Enter class name"
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                                Description
                            </label>
                            <RichTextEditor
                                value={newClass.description}
                                onChange={(content) => setNewClass({ ...newClass, description: content })}
                                placeholder="Enter a detailed class description..."
                                className="min-h-[200px]"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                                Cohort (Optional)
                            </label>
                            <select
                                value={newClass.cohortId}
                                onChange={(e) => setNewClass({ ...newClass, cohortId: e.target.value })}
                                className="shadow appearance-none border dark:border-gray-600 rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-indigo-500 dark:focus:border-indigo-400"
                            >
                                <option value="">Select a cohort (optional)</option>
                                {cohorts.map(cohort => (
                                    <option key={cohort.id} value={cohort.id}>
                                        {cohort.name} - {getLevelName(cohort.level)}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex space-x-4">
                            <button
                                type="submit"
                                disabled={creating}
                                className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white px-4 py-2 rounded-md disabled:opacity-50 flex items-center gap-2 transition-colors"
                            >
                                <Save className="h-4 w-4" />
                                {creating ? 'Creating...' : 'Create Class'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowCreateForm(false)}
                                className="bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors"
                            >
                                <X className="h-4 w-4" />
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border dark:border-gray-700">
                {classes.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-gray-500 dark:text-gray-400">No classes found. Create your first class to get started!</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                        {classes.map(cls => (
                            <li key={cls.id} className="py-4">
                                {editingClass === cls.id ? (
                                    // Edit Form
                                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border dark:border-gray-600">
                                        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Edit Class</h3>
                                        <form onSubmit={handleUpdateClass}>
                                            <div className="mb-4">
                                                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                                                    Class Name
                                                </label>
                                                <input
                                                    type="text"
                                                    value={editClass.name}
                                                    onChange={(e) => setEditClass({ ...editClass, name: e.target.value })}
                                                    className="shadow appearance-none border dark:border-gray-600 rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 leading-tight focus:outline-none focus:shadow-outline focus:border-indigo-500 dark:focus:border-indigo-400"
                                                    placeholder="Enter class name"
                                                    required
                                                />
                                            </div>
                                            <div className="mb-4">
                                                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                                                    Description
                                                </label>
                                                <RichTextEditor
                                                    value={editClass.description}
                                                    onChange={(content) => setEditClass({ ...editClass, description: content })}
                                                    placeholder="Enter a detailed class description..."
                                                    className="min-h-[200px]"
                                                />
                                            </div>
                                            <div className="mb-4">
                                                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                                                    Cohort (Optional)
                                                </label>
                                                <select
                                                    value={editClass.cohortId}
                                                    onChange={(e) => setEditClass({ ...editClass, cohortId: e.target.value })}
                                                    className="shadow appearance-none border dark:border-gray-600 rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 leading-tight focus:outline-none focus:shadow-outline focus:border-indigo-500 dark:focus:border-indigo-400"
                                                >
                                                    <option value="">Select a cohort (optional)</option>
                                                    {cohorts.map(cohort => (
                                                        <option key={cohort.id} value={cohort.id}>
                                                            {cohort.name} - {getLevelName(cohort.level)}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="flex space-x-4">
                                                <button
                                                    type="submit"
                                                    disabled={updating}
                                                    className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white px-4 py-2 rounded-md disabled:opacity-50 flex items-center gap-2 transition-colors"
                                                >
                                                    <Save className="h-4 w-4" />
                                                    {updating ? 'Updating...' : 'Update Class'}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={handleCancelEdit}
                                                    className="bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors"
                                                >
                                                    <X className="h-4 w-4" />
                                                    Cancel
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                ) : (
                                    // View Mode
                                    <div>
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-xl font-bold text-indigo-800 dark:text-indigo-300">{cls.name}</h3>
                                                    {cls.cohort && (
                                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(cls.cohort.level)} dark:bg-opacity-20 dark:text-opacity-90`}>
                                                            {getLevelIcon(cls.cohort.level)}
                                                            {cls.cohort.name}
                                                        </span>
                                                    )}
                                                </div>
                                                <div 
                                                    className="text-gray-600 dark:text-gray-400 prose prose-sm max-w-none mb-2 dark:prose-invert"
                                                    dangerouslySetInnerHTML={{ 
                                                        __html: cls.description || '<p class="text-gray-500 dark:text-gray-400 italic">No description</p>' 
                                                    }}
                                                />
                                                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                                    <span className="flex items-center gap-1">
                                                        <Users className="h-4 w-4" />
                                                        {cls.students?.length || 0} Students
                                                    </span>
                                                    <span>•</span>
                                                    <span>{cls.assignments?.length || 0} Assignments</span>
                                                    {cls.cohort && (
                                                        <>
                                                            <span>•</span>
                                                            <span>{getLevelName(cls.cohort.level)}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-2 ml-4">
                                                <button 
                                                    onClick={() => navigate(`/classes/${cls.id}/assignments`)}
                                                    className="bg-indigo-500 hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white px-3 py-1 rounded text-sm transition-colors flex items-center gap-1"
                                                >
                                                    <FileText className="h-3 w-3" />
                                                    Assignments
                                                </button>
                                                <button 
                                                    onClick={() => navigate(`/classes/${cls.id}/students`)}
                                                    className="bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors flex items-center gap-1"
                                                >
                                                    <UserPlus className="h-3 w-3" />
                                                    Students
                                                </button>
                                                <button 
                                                    onClick={() => handleEdit(cls)}
                                                    className="bg-yellow-500 hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm transition-colors flex items-center gap-1"
                                                >
                                                    <Edit className="h-3 w-3" />
                                                    Edit
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(cls.id)} 
                                                    className="bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors flex items-center gap-1"
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                    Trash
                                                </button>
                                            </div>
                                        </div>
                                        <div className="mt-4 pl-4 border-l-2 border-indigo-100 dark:border-indigo-800">
                                            <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">Assignments</h4>
                                            {cls.assignments && cls.assignments.length > 0 ? (
                                                <ul className="list-disc pl-5 space-y-1">
                                                    {cls.assignments.map(a => (
                                                        <li key={a.id} className="text-sm text-gray-700 dark:text-gray-300">
                                                            {a.title}
                                                            {a._count?.submissions && (
                                                                <span className="text-gray-500 dark:text-gray-400 ml-2">
                                                                    ({a._count.submissions} submissions)
                                                                </span>
                                                            )}
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="text-sm text-gray-500 dark:text-gray-400">No assignments yet.</p>
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