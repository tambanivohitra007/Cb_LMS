import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { 
    Users, 
    BookOpen, 
    Plus, 
    Edit, 
    Trash2, 
    Save, 
    X, 
    AlertTriangle,
    Loader2,
    GraduationCap,
    School,
    User
} from 'lucide-react';

function CohortManagement() {
    const { apiClient } = useAuth();
    const [cohorts, setCohorts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [notification, setNotification] = useState(null);
    const [editingCohort, setEditingCohort] = useState(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        level: 1
    });

    // Show notification helper
    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 4000);
    };

    useEffect(() => {
        fetchCohorts();
    }, []);

    const fetchCohorts = async () => {
        try {
            setError('');
            const response = await apiClient.get('/cohorts');
            setCohorts(response.data || []);
        } catch (err) {
            setError('Failed to load cohorts.');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleCreateCohort = async () => {
        if (!formData.name.trim()) {
            showNotification('Please enter a cohort name.', 'error');
            return;
        }

        try {
            await apiClient.post('/cohorts', formData);
            showNotification('Cohort created successfully!');
            setShowCreateForm(false);
            setFormData({ name: '', description: '', level: 1 });
            fetchCohorts();
        } catch (error) {
            showNotification(error.response?.data?.message || 'Failed to create cohort.', 'error');
        }
    };

    const handleUpdateCohort = async (cohortId) => {
        if (!formData.name.trim()) {
            showNotification('Please enter a cohort name.', 'error');
            return;
        }

        try {
            await apiClient.put(`/cohorts/${cohortId}`, formData);
            showNotification('Cohort updated successfully!');
            setEditingCohort(null);
            setFormData({ name: '', description: '', level: 1 });
            fetchCohorts();
        } catch (error) {
            showNotification(error.response?.data?.message || 'Failed to update cohort.', 'error');
        }
    };

    const handleDeleteCohort = async (cohortId, cohortName) => {
        if (!confirm(`Are you sure you want to delete the cohort "${cohortName}"? This will unassign all classes from this cohort.`)) {
            return;
        }

        try {
            await apiClient.delete(`/cohorts/${cohortId}`);
            showNotification('Cohort deleted successfully!');
            fetchCohorts();
        } catch (error) {
            showNotification(error.response?.data?.message || 'Failed to delete cohort.', 'error');
        }
    };

    const startEdit = (cohort) => {
        setEditingCohort(cohort.id);
        setFormData({
            name: cohort.name,
            description: cohort.description || '',
            level: cohort.level
        });
        setShowCreateForm(false);
    };

    const cancelEdit = () => {
        setEditingCohort(null);
        setFormData({ name: '', description: '', level: 1 });
    };

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

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="animate-spin h-16 w-16 text-indigo-600 mx-auto mb-4" />
                    <p className="text-xl text-gray-600">Loading cohorts...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
                <div className="text-center bg-white rounded-lg shadow-lg p-8 max-w-md">
                    <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-red-600 mb-2">Error Loading Cohorts</h2>
                    <p className="text-red-500 mb-4">{error}</p>
                    <button 
                        onClick={fetchCohorts}
                        className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            {/* Notification Toast */}
            {notification && (
                <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm animate-bounce ${
                    notification.type === 'success' 
                        ? 'bg-green-100 border border-green-500 text-green-700' 
                        : 'bg-red-100 border border-red-500 text-red-700'
                }`}>
                    <div className="flex items-center gap-2">
                        <span className="font-medium">{notification.message}</span>
                        <button 
                            onClick={() => setNotification(null)}
                            className="ml-auto text-lg hover:opacity-70"
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}

            <div className="p-8 max-w-6xl mx-auto">
                {/* Header Section */}
                <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <Users className="h-8 w-8 text-indigo-600" />
                            <h1 className="text-4xl font-bold text-gray-800">Cohort Management</h1>
                        </div>
                        <div className="bg-indigo-100 text-indigo-800 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
                            <GraduationCap className="h-4 w-4" />
                            Education Levels
                        </div>
                    </div>
                    <p className="text-gray-600">Organize your classes into cohorts by education level (Elementary, Middle School, High School, etc.)</p>
                </div>

                {/* Main Content */}
                <div className="bg-white rounded-lg shadow-lg p-8">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-bold text-gray-800">Your Cohorts</h2>
                            <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm">
                                {cohorts.length} {cohorts.length === 1 ? 'cohort' : 'cohorts'}
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                setShowCreateForm(!showCreateForm);
                                setEditingCohort(null);
                                setFormData({ name: '', description: '', level: 1 });
                            }}
                            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            Create Cohort
                        </button>
                    </div>

                    {/* Create/Edit Form */}
                    {(showCreateForm || editingCohort) && (
                        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6 mb-6">
                            <h3 className="text-lg font-semibold text-indigo-900 mb-4 flex items-center gap-2">
                                <Plus className="h-5 w-5" />
                                {editingCohort ? 'Edit Cohort' : 'Create New Cohort'}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-indigo-800 mb-2">
                                        Cohort Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => handleInputChange('name', e.target.value)}
                                        placeholder="e.g., Elementary 2024, Grade 6-8"
                                        className="w-full p-3 border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-indigo-800 mb-2">
                                        Education Level
                                    </label>
                                    <select
                                        value={formData.level}
                                        onChange={(e) => handleInputChange('level', parseInt(e.target.value))}
                                        className="w-full p-3 border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    >
                                        <option value={1}>Elementary (Level 1)</option>
                                        <option value={2}>Middle School (Level 2)</option>
                                        <option value={3}>High School (Level 3)</option>
                                        <option value={4}>College (Level 4)</option>
                                        <option value={5}>Graduate (Level 5)</option>
                                    </select>
                                </div>
                            </div>
                            <div className="mt-4">
                                <label className="block text-sm font-medium text-indigo-800 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => handleInputChange('description', e.target.value)}
                                    placeholder="Optional description for this cohort..."
                                    rows="3"
                                    className="w-full p-3 border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => editingCohort ? handleUpdateCohort(editingCohort) : handleCreateCohort()}
                                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                                >
                                    <Save className="h-4 w-4" />
                                    {editingCohort ? 'Update Cohort' : 'Create Cohort'}
                                </button>
                                <button
                                    onClick={() => {
                                        setShowCreateForm(false);
                                        cancelEdit();
                                    }}
                                    className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
                                >
                                    <X className="h-4 w-4" />
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Cohorts List */}
                    {cohorts.length === 0 ? (
                        <div className="text-center py-12">
                            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                            <p className="text-xl text-gray-500 mb-2">No cohorts yet</p>
                            <p className="text-gray-400 mb-6">Create your first cohort to organize classes by education level.</p>
                            <button
                                onClick={() => setShowCreateForm(true)}
                                className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 mx-auto"
                            >
                                <Plus className="h-4 w-4" />
                                Create Your First Cohort
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {cohorts.map(cohort => (
                                <div key={cohort.id} className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-all duration-300">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <h3 className="text-xl font-bold text-gray-800 mb-2">{cohort.name}</h3>
                                            <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getLevelColor(cohort.level)}`}>
                                                {getLevelIcon(cohort.level)}
                                                {getLevelName(cohort.level)}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => startEdit(cohort)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Edit cohort"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteCohort(cohort.id, cohort.name)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete cohort"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                    
                                    {cohort.description && (
                                        <p className="text-gray-600 text-sm mb-4">{cohort.description}</p>
                                    )}
                                    
                                    <div className="border-t pt-4">
                                        <div className="flex items-center justify-between text-sm text-gray-500">
                                            <div className="flex items-center gap-1">
                                                <BookOpen className="h-4 w-4" />
                                                <span>{cohort._count.classes} {cohort._count.classes === 1 ? 'class' : 'classes'}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Users className="h-4 w-4" />
                                                <span>
                                                    {cohort.classes.reduce((total, cls) => total + cls.students.length, 0)} students
                                                </span>
                                            </div>
                                        </div>
                                        
                                        {cohort.classes.length > 0 && (
                                            <div className="mt-3">
                                                <p className="text-xs text-gray-500 mb-2">Classes in this cohort:</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {cohort.classes.slice(0, 3).map(cls => (
                                                        <span key={cls.id} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                                                            {cls.name}
                                                        </span>
                                                    ))}
                                                    {cohort.classes.length > 3 && (
                                                        <span className="bg-gray-200 text-gray-600 px-2 py-1 rounded text-xs">
                                                            +{cohort.classes.length - 3} more
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default CohortManagement;
