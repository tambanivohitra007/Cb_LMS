import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { useParams, useNavigate } from 'react-router-dom';
import RichTextEditor from '../components/RichTextEditor';

function AssignmentManagement() {
    const { apiClient } = useAuth();
    const { classId } = useParams();
    const navigate = useNavigate();
    const [assignments, setAssignments] = useState([]);
    const [classInfo, setClassInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingAssignment, setEditingAssignment] = useState(null);
    
    // Form states
    const [newAssignment, setNewAssignment] = useState({
        title: '',
        description: '',
        competencyNames: [''],
        deadline: '' // New field
    });
    const [editAssignment, setEditAssignment] = useState({
        title: '',
        description: '',
        competencyNames: [''],
        deadline: '' // New field
    });
    const [creating, setCreating] = useState(false);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        if (!classId || isNaN(parseInt(classId))) {
            setError('Invalid class ID');
            setLoading(false);
            return;
        }
        fetchAssignments();
        fetchClassInfo();
    }, [classId, apiClient]);

    const fetchAssignments = async () => {
        try {
            setError('');
            const res = await apiClient.get(`/classes/${classId}/assignments`);
            setAssignments(res.data || []);
        } catch (error) {
            console.error("Failed to fetch assignments", error);
            setError('Failed to load assignments. Please try again.');
        }
    };

    const fetchClassInfo = async () => {
        try {
            const res = await apiClient.get('/classes');
            const classes = res.data || [];
            const currentClass = classes.find(cls => cls.id === parseInt(classId));
            setClassInfo(currentClass);
        } catch (error) {
            console.error("Failed to fetch class info", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAssignment = async (e) => {
        e.preventDefault();
        if (!newAssignment.title.trim()) {
            alert('Assignment title is required');
            return;
        }
        const competencyNames = newAssignment.competencyNames.filter(name => name.trim() !== '');
        if (competencyNames.length === 0) {
            alert('At least one competency is required');
            return;
        }
        try {
            setCreating(true);
            await apiClient.post('/assignments', {
                title: newAssignment.title.trim(),
                description: newAssignment.description.trim(),
                classId: parseInt(classId),
                competencyNames: competencyNames,
                deadline: newAssignment.deadline ? new Date(newAssignment.deadline).toISOString() : undefined
            });
            setNewAssignment({ title: '', description: '', competencyNames: [''], deadline: '' });
            setShowCreateForm(false);
            fetchAssignments();
        } catch (error) {
            console.error('Failed to create assignment', error);
            alert('Failed to create assignment. Please try again.');
        } finally {
            setCreating(false);
        }
    };

    const handleEdit = (assignment) => {
        setEditingAssignment(assignment.id);
        setEditAssignment({
            title: assignment.title,
            description: assignment.description || '',
            competencyNames: assignment.competencies.map(comp => comp.name),
            deadline: assignment.deadline ? assignment.deadline.split('T')[0] : ''
        });
        setShowCreateForm(false);
    };

    const handleUpdateAssignment = async (e) => {
        e.preventDefault();
        if (!editAssignment.title.trim()) {
            alert('Assignment title is required');
            return;
        }
        const competencyNames = editAssignment.competencyNames.filter(name => name.trim() !== '');
        if (competencyNames.length === 0) {
            alert('At least one competency is required');
            return;
        }
        try {
            setUpdating(true);
            await apiClient.put(`/assignments/${editingAssignment}`, {
                title: editAssignment.title.trim(),
                description: editAssignment.description.trim(),
                classId: parseInt(classId),
                competencyNames: competencyNames,
                deadline: editAssignment.deadline ? new Date(editAssignment.deadline).toISOString() : undefined
            });
            setEditingAssignment(null);
            setEditAssignment({ title: '', description: '', competencyNames: [''], deadline: '' });
            fetchAssignments();
        } catch (error) {
            console.error('Failed to update assignment', error);
            alert('Failed to update assignment. Please try again.');
        } finally {
            setUpdating(false);
        }
    };

    const handleDelete = async (assignmentId) => {
        if (window.confirm('Are you sure you want to delete this assignment?')) {
            try {
                await apiClient.delete(`/assignments/${assignmentId}`);
                fetchAssignments();
            } catch (error) {
                console.error('Failed to delete assignment', error);
                alert('Failed to delete assignment. Please try again.');
            }
        }
    };

    const handleCancelEdit = () => {
        setEditingAssignment(null);
        setEditAssignment({ title: '', description: '', competencyNames: [''], deadline: '' });
    };

    const addCompetencyField = (isEdit = false) => {
        if (isEdit) {
            setEditAssignment(prev => ({
                ...prev,
                competencyNames: [...prev.competencyNames, '']
            }));
        } else {
            setNewAssignment(prev => ({
                ...prev,
                competencyNames: [...prev.competencyNames, '']
            }));
        }
    };

    const removeCompetencyField = (index, isEdit = false) => {
        if (isEdit) {
            setEditAssignment(prev => ({
                ...prev,
                competencyNames: prev.competencyNames.filter((_, i) => i !== index)
            }));
        } else {
            setNewAssignment(prev => ({
                ...prev,
                competencyNames: prev.competencyNames.filter((_, i) => i !== index)
            }));
        }
    };

    const updateCompetencyName = (index, value, isEdit = false) => {
        if (isEdit) {
            setEditAssignment(prev => ({
                ...prev,
                competencyNames: prev.competencyNames.map((name, i) => i === index ? value : name)
            }));
        } else {
            setNewAssignment(prev => ({
                ...prev,
                competencyNames: prev.competencyNames.map((name, i) => i === index ? value : name)
            }));
        }
    };

    if (loading) return (
        <div className="p-8 flex justify-center items-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading assignments...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="p-8">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
            </div>
            <button 
                onClick={() => navigate('/classes')}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
            >
                Back to Classes
            </button>
        </div>
    );

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <button 
                        onClick={() => navigate('/classes')}
                        className="text-indigo-600 hover:text-indigo-800 mb-2"
                    >
                        ← Back to Classes
                    </button>
                    <h1 className="text-3xl font-bold">
                        Assignments for {classInfo?.name || 'Class'}
                    </h1>
                    {classInfo?.description && (
                        <p className="text-gray-600 mt-2">{classInfo.description}</p>
                    )}
                </div>
                <button 
                    onClick={() => {
                        setShowCreateForm(!showCreateForm);
                        setEditingAssignment(null);
                    }}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                >
                    {showCreateForm ? 'Cancel' : 'Create New Assignment'}
                </button>
            </div>

            {showCreateForm && (
                <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                    <h2 className="text-xl font-semibold mb-4">Create New Assignment</h2>
                    <form onSubmit={handleCreateAssignment}>
                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-bold mb-2">
                                Assignment Title
                            </label>
                            <input
                                type="text"
                                value={newAssignment.title}
                                onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                placeholder="Enter assignment title"
                                required
                            />
                        </div>
                        
                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-bold mb-2">
                                Description
                            </label>
                            <RichTextEditor
                                value={newAssignment.description}
                                onChange={(content) => setNewAssignment({ ...newAssignment, description: content })}
                                placeholder="Provide detailed assignment instructions, requirements, and expectations..."
                                className="min-h-[300px]"
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-bold mb-2">
                                Competencies
                            </label>
                            {newAssignment.competencyNames.map((competency, index) => (
                                <div key={index} className="flex items-center mb-2">
                                    <input
                                        type="text"
                                        value={competency}
                                        onChange={(e) => updateCompetencyName(index, e.target.value, false)}
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mr-2"
                                        placeholder="Enter competency name"
                                        required
                                    />
                                    {newAssignment.competencyNames.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeCompetencyField(index, false)}
                                            className="bg-red-500 text-white px-2 py-2 rounded text-sm hover:bg-red-600"
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={() => addCompetencyField(false)}
                                className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
                            >
                                Add Competency
                            </button>
                        </div>

                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-bold mb-2">
                                Deadline
                            </label>
                            <input
                                type="date"
                                value={newAssignment.deadline}
                                onChange={(e) => setNewAssignment({ ...newAssignment, deadline: e.target.value })}
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            />
                        </div>

                        <div className="flex space-x-4">
                            <button
                                type="submit"
                                disabled={creating}
                                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
                            >
                                {creating ? 'Creating...' : 'Create Assignment'}
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
                {assignments.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-gray-500">No assignments found. Create your first assignment to get started!</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-200">
                        {assignments.map(assignment => (
                            <li key={assignment.id} className="py-4">
                                {editingAssignment === assignment.id ? (
                                    // Edit Form
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h3 className="text-lg font-semibold mb-4">Edit Assignment</h3>
                                        <form onSubmit={handleUpdateAssignment}>
                                            <div className="mb-4">
                                                <label className="block text-gray-700 text-sm font-bold mb-2">
                                                    Assignment Title
                                                </label>
                                                <input
                                                    type="text"
                                                    value={editAssignment.title}
                                                    onChange={(e) => setEditAssignment({ ...editAssignment, title: e.target.value })}
                                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                                    required
                                                />
                                            </div>
                                            
                                            <div className="mb-4">
                                                <label className="block text-gray-700 text-sm font-bold mb-2">
                                                    Description
                                                </label>
                                                <RichTextEditor
                                                    value={editAssignment.description}
                                                    onChange={(content) => setEditAssignment({ ...editAssignment, description: content })}
                                                    placeholder="Provide detailed assignment instructions, requirements, and expectations..."
                                                    className="min-h-[300px]"
                                                />
                                            </div>

                                            <div className="mb-4">
                                                <label className="block text-gray-700 text-sm font-bold mb-2">
                                                    Competencies
                                                </label>
                                                {editAssignment.competencyNames.map((competency, index) => (
                                                    <div key={index} className="flex items-center mb-2">
                                                        <input
                                                            type="text"
                                                            value={competency}
                                                            onChange={(e) => updateCompetencyName(index, e.target.value, true)}
                                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mr-2"
                                                            required
                                                        />
                                                        {editAssignment.competencyNames.length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => removeCompetencyField(index, true)}
                                                                className="bg-red-500 text-white px-2 py-2 rounded text-sm hover:bg-red-600"
                                                            >
                                                                Remove
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                                <button
                                                    type="button"
                                                    onClick={() => addCompetencyField(true)}
                                                    className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
                                                >
                                                    Add Competency
                                                </button>
                                            </div>

                                            <div className="mb-4">
                                                <label className="block text-gray-700 text-sm font-bold mb-2">
                                                    Deadline
                                                </label>
                                                <input
                                                    type="date"
                                                    value={editAssignment.deadline}
                                                    onChange={(e) => setEditAssignment({ ...editAssignment, deadline: e.target.value })}
                                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                                />
                                            </div>

                                            <div className="flex space-x-4">
                                                <button
                                                    type="submit"
                                                    disabled={updating}
                                                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                                                >
                                                    {updating ? 'Updating...' : 'Update Assignment'}
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
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <h3 className="text-xl font-bold text-indigo-800">{assignment.title}</h3>
                                                <div 
                                                    className="text-gray-600 mt-1 prose prose-sm max-w-none"
                                                    dangerouslySetInnerHTML={{ 
                                                        __html: assignment.description || '<p class="text-gray-500 italic">No description</p>' 
                                                    }}
                                                />
                                                <p className="text-sm text-gray-500 mt-2">
                                                    Submissions: {assignment._count?.submissions || 0}
                                                </p>
                                                
                                                <div className="mt-3">
                                                    <h4 className="font-semibold text-sm text-gray-700 mb-1">Competencies:</h4>
                                                    <div className="flex flex-wrap gap-2">
                                                        {assignment.competencies.map(competency => (
                                                            <span 
                                                                key={competency.id} 
                                                                className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full"
                                                            >
                                                                {competency.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="mt-3">
                                                    <h4 className="font-semibold text-sm text-gray-700 mb-1">Deadline:</h4>
                                                    <p className="text-sm text-gray-500">
                                                        {assignment.deadline ? new Date(assignment.deadline).toLocaleDateString() : 'No deadline set'}
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex space-x-2 ml-4">
                                                <button 
                                                    onClick={() => handleEdit(assignment)}
                                                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm"
                                                >
                                                    Edit
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(assignment.id)} 
                                                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                                                >
                                                    Delete
                                                </button>
                                            </div>
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

export default AssignmentManagement;
