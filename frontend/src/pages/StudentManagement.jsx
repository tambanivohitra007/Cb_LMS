import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    UserPlus, 
    Users, 
    ArrowLeft, 
    Plus, 
    X, 
    Trash2,
    GraduationCap
} from 'lucide-react';

function StudentManagement() {
    const { apiClient } = useAuth();
    const { classId } = useParams();
    const navigate = useNavigate();
    const [classInfo, setClassInfo] = useState(null);
    const [enrolledStudents, setEnrolledStudents] = useState([]);
    const [availableStudents, setAvailableStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState('');
    const [adding, setAdding] = useState(false);

    useEffect(() => {
        if (classId) {
            fetchData();
        }
    }, [classId, apiClient]);

    const fetchData = async () => {
        try {
            setError('');
            const [classRes, enrolledRes, availableRes] = await Promise.all([
                apiClient.get('/classes'),
                apiClient.get(`/classes/${classId}/students`),
                apiClient.get(`/classes/${classId}/available-students`)
            ]);

            // Find the specific class info
            const currentClass = (classRes.data || []).find(cls => cls.id === parseInt(classId));
            setClassInfo(currentClass);
            setEnrolledStudents(enrolledRes.data || []);
            setAvailableStudents(availableRes.data || []);
        } catch (error) {
            console.error("Failed to fetch student management data", error);
            setError('Failed to load student data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddStudent = async (e) => {
        e.preventDefault();
        if (!selectedStudent) {
            alert('Please select a student to add');
            return;
        }

        try {
            setAdding(true);
            await apiClient.post(`/classes/${classId}/students`, {
                studentId: parseInt(selectedStudent)
            });
            
            setSelectedStudent('');
            setShowAddForm(false);
            fetchData(); // Refresh the data
        } catch (error) {
            console.error('Failed to add student', error);
            alert(error.message || 'Failed to add student. Please try again.');
        } finally {
            setAdding(false);
        }
    };

    const handleRemoveStudent = async (studentId, studentName) => {
        if (window.confirm(`Are you sure you want to remove ${studentName} from this class?`)) {
            try {
                await apiClient.delete(`/classes/${classId}/students/${studentId}`);
                fetchData(); // Refresh the data
            } catch (error) {
                console.error('Failed to remove student', error);
                alert(error.message || 'Failed to remove student. Please try again.');
            }
        }
    };

    if (loading) return (
        <div className="p-8 flex justify-center items-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">Loading student data...</p>
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
            <div className="mb-6">
                <button 
                    onClick={() => navigate('/classes')}
                    className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 mb-4 flex items-center gap-1 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Classes
                </button>
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Student Management</h1>
                        {classInfo && (
                            <p className="text-gray-600 dark:text-gray-400 mt-2">Class: {classInfo.name}</p>
                        )}
                    </div>
                    <button 
                        onClick={() => setShowAddForm(!showAddForm)}
                        disabled={availableStudents.length === 0}
                        className={`px-4 py-2 rounded-md font-medium flex items-center gap-2 transition-colors ${
                            availableStudents.length === 0 
                                ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed' 
                                : 'bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-800 text-white'
                        }`}
                    >
                        {showAddForm ? (
                            <>
                                <X className="h-4 w-4" />
                                Cancel
                            </>
                        ) : (
                            <>
                                <UserPlus className="h-4 w-4" />
                                Add Student
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Add Student Form */}
            {showAddForm && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6 border dark:border-gray-700">
                    <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Add Student to Class</h2>
                    <form onSubmit={handleAddStudent}>
                        <div className="flex gap-4 items-end">
                            <div className="flex-1">
                                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                                    Select Student
                                </label>
                                <select
                                    value={selectedStudent}
                                    onChange={(e) => setSelectedStudent(e.target.value)}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    required
                                >
                                    <option value="">Choose a student...</option>
                                    {availableStudents.map(student => (
                                        <option key={student.id} value={student.id}>
                                            {student.name} ({student.email})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <button
                                type="submit"
                                disabled={adding}
                                className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
                            >
                                {adding ? 'Adding...' : 'Add Student'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* No Available Students Message */}
            {availableStudents.length === 0 && !showAddForm && (
                <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-6">
                    All available students are already enrolled in this class.
                </div>
            )}

            {/* Enrolled Students List */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">
                    Enrolled Students ({enrolledStudents.length})
                </h2>
                
                {enrolledStudents.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-gray-500">No students enrolled in this class yet.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Student
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Email
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Enrolled Date
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {enrolledStudents.map(student => (
                                    <tr key={student.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <img 
                                                    className="h-10 w-10 rounded-full" 
                                                    src={student.photo || 'https://i.pravatar.cc/150'} 
                                                    alt={student.name}
                                                    onError={(e) => {
                                                        e.target.src = 'https://i.pravatar.cc/150';
                                                    }}
                                                />
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {student.name}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {student.email}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(student.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button 
                                                onClick={() => handleRemoveStudent(student.id, student.name)}
                                                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                                            >
                                                Remove
                                            </button>
                                        </td>
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

export default StudentManagement;
