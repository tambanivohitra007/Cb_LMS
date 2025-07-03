import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';

function Trash() {
    const { apiClient } = useAuth();
    const [trashItems, setTrashItems] = useState({ deletedClasses: [], deletedAssignments: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('classes'); // 'classes' or 'assignments'

    const fetchTrash = async () => {
        try {
            setError('');
            const res = await apiClient.get('/trash');
            setTrashItems(res.data || { deletedClasses: [], deletedAssignments: [] });
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

    const handleRestoreAssignment = async (assignmentId) => {
        try {
            await apiClient.post(`/trash/restore/assignment/${assignmentId}`);
            fetchTrash();
        } catch (error) {
            console.error('Failed to restore assignment', error);
            alert('Failed to restore assignment. Please try again.');
        }
    };

    const handlePermanentDeleteAssignment = async (assignmentId) => {
        if(window.confirm('This action is permanent and cannot be undone. Are you sure?')) {
            try {
                await apiClient.delete(`/trash/permanent/assignment/${assignmentId}`);
                fetchTrash();
            } catch (error) {
                console.error('Failed to permanently delete assignment', error);
                alert('Failed to permanently delete assignment. Please try again.');
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
            
            {/* Tab Navigation */}
            <div className="bg-white rounded-lg shadow-md mb-6">
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex">
                        <button
                            onClick={() => setActiveTab('classes')}
                            className={`px-6 py-3 border-b-2 font-medium text-sm ${
                                activeTab === 'classes'
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            Deleted Classes ({trashItems.deletedClasses?.length || 0})
                        </button>
                        <button
                            onClick={() => setActiveTab('assignments')}
                            className={`px-6 py-3 border-b-2 font-medium text-sm ${
                                activeTab === 'assignments'
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            Deleted Assignments ({trashItems.deletedAssignments?.length || 0})
                        </button>
                    </nav>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                    {activeTab === 'classes' && (
                        <div>
                            <h2 className="text-xl font-semibold mb-4">Deleted Classes</h2>
                            {trashItems.deletedClasses && trashItems.deletedClasses.length > 0 ? (
                                <ul className="divide-y divide-gray-200">
                                    {trashItems.deletedClasses.map(cls => (
                                        <li key={cls.id} className="py-4 flex justify-between items-start">
                                            <div className="flex-1">
                                                <p className="font-medium text-lg">{cls.name}</p>
                                                <p className="text-sm text-gray-500 mb-2">
                                                    Deleted on: {new Date(cls.deleted_at).toLocaleDateString()}
                                                </p>
                                                {cls.description && (
                                                    <div 
                                                        className="text-sm text-gray-600 mb-2 prose prose-sm max-w-none" 
                                                        dangerouslySetInnerHTML={{ __html: cls.description }}
                                                    />
                                                )}
                                                <div className="text-sm text-gray-500">
                                                    <span className="mr-4">Students: {cls.students?.length || 0}</span>
                                                    <span>Assignments: {cls.assignments?.length || 0}</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-2 ml-4">
                                                <button 
                                                    onClick={() => handleRestore(cls.id)} 
                                                    className="px-4 py-2 bg-green-100 text-green-700 hover:bg-green-200 rounded-md font-medium transition-colors"
                                                >
                                                    Restore
                                                </button>
                                                <button 
                                                    onClick={() => handlePermanentDelete(cls.id)} 
                                                    className="px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-md font-medium transition-colors"
                                                >
                                                    Delete Permanently
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-gray-500">No deleted classes found.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'assignments' && (
                        <div>
                            <h2 className="text-xl font-semibold mb-4">Deleted Assignments</h2>
                            {trashItems.deletedAssignments && trashItems.deletedAssignments.length > 0 ? (
                                <ul className="divide-y divide-gray-200">
                                    {trashItems.deletedAssignments.map(assignment => (
                                        <li key={assignment.id} className="py-4 flex justify-between items-start">
                                            <div className="flex-1">
                                                <p className="font-medium text-lg">{assignment.title}</p>
                                                <p className="text-sm text-gray-500 mb-2">
                                                    Class: {assignment.class?.name} • Deleted on: {new Date(assignment.deleted_at).toLocaleDateString()}
                                                </p>
                                                {assignment.description && (
                                                    <div 
                                                        className="text-sm text-gray-600 mb-2 prose prose-sm max-w-none" 
                                                        dangerouslySetInnerHTML={{ __html: assignment.description }}
                                                    />
                                                )}
                                                <div className="text-sm text-gray-500">
                                                    <span className="mr-4">Competencies: {assignment.competencies?.length || 0}</span>
                                                    <span>Submissions: {assignment.submissions?.length || 0}</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-2 ml-4">
                                                <button 
                                                    onClick={() => handleRestoreAssignment(assignment.id)} 
                                                    className="px-4 py-2 bg-green-100 text-green-700 hover:bg-green-200 rounded-md font-medium transition-colors"
                                                >
                                                    Restore
                                                </button>
                                                <button 
                                                    onClick={() => handlePermanentDeleteAssignment(assignment.id)} 
                                                    className="px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-md font-medium transition-colors"
                                                >
                                                    Delete Permanently
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-gray-500">No deleted assignments found.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Trash;