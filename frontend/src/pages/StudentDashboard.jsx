import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function StudentDashboard() {
    const { user, apiClient } = useAuth();
    const [classes, setClasses] = useState([]);
    const [competencyData, setCompetencyData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [submissionContent, setSubmissionContent] = useState({});
    const [submittingAssignments, setSubmittingAssignments] = useState(new Set());

    useEffect(() => {
        const fetchData = async () => {
            try {
                setError('');
                const [classesRes, competenciesRes] = await Promise.all([
                    apiClient.get('/classes'),
                    apiClient.get('/competencies/status')
                ]);
                setClasses(classesRes.data || []);
                
                const statusData = competenciesRes.data || { IN_PROGRESS: 0, ACHIEVED: 0, MASTERED: 0 };
                setCompetencyData({
                    labels: ['In Progress', 'Achieved', 'Mastered'],
                    datasets: [{
                        label: '# of Competencies',
                        data: [statusData.IN_PROGRESS, statusData.ACHIEVED, statusData.MASTERED],
                        backgroundColor: [
                            'rgba(255, 206, 86, 0.6)',
                            'rgba(75, 192, 192, 0.6)',
                            'rgba(54, 162, 235, 0.6)',
                        ],
                        borderColor: [
                            'rgba(255, 206, 86, 1)',
                            'rgba(75, 192, 192, 1)',
                            'rgba(54, 162, 235, 1)',
                        ],
                        borderWidth: 1,
                    }]
                });

            } catch (error) {
                console.error("Failed to fetch student data", error);
                setError('Failed to load dashboard data. Please try again.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [apiClient]);

    const handleSubmission = async (assignmentId) => {
        const content = submissionContent[assignmentId];
        if (!content?.trim()) {
            alert('Please enter some content for your submission.');
            return;
        }

        try {
            setSubmittingAssignments(prev => new Set([...prev, assignmentId]));
            await apiClient.post('/submissions', {
                assignmentId,
                content: content.trim()
            });
            
            // Refresh the classes data to show updated submission status
            const classesRes = await apiClient.get('/classes');
            setClasses(classesRes.data || []);
            
            // Clear the submission content
            setSubmissionContent(prev => {
                const newContent = { ...prev };
                delete newContent[assignmentId];
                return newContent;
            });
            
            alert('Submission successful!');
        } catch (error) {
            console.error('Failed to submit assignment', error);
            alert('Failed to submit assignment. Please try again.');
        } finally {
            setSubmittingAssignments(prev => {
                const newSet = new Set(prev);
                newSet.delete(assignmentId);
                return newSet;
            });
        }
    };

    const handleContentChange = (assignmentId, content) => {
        setSubmissionContent(prev => ({
            ...prev,
            [assignmentId]: content
        }));
    };

    if (loading) return (
        <div className="p-8 flex justify-center items-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading dashboard...</p>
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
            <h1 className="text-3xl font-bold mb-6">Welcome, {user.name}!</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2">
                    <h2 className="text-2xl font-semibold mb-4">My Classes & Assignments</h2>
                    {classes.length === 0 ? (
                        <div className="bg-white p-6 rounded-lg shadow-md text-center">
                            <p className="text-gray-500">You are not enrolled in any classes yet.</p>
                        </div>
                    ) : (
                        classes.map(cls => (
                            <div key={cls.id} className="bg-white p-6 rounded-lg shadow-md mb-6">
                                <h3 className="text-xl font-bold text-indigo-700">{cls.name}</h3>
                                <div 
                                    className="text-gray-600 mb-4 prose prose-sm max-w-none"
                                    dangerouslySetInnerHTML={{ 
                                        __html: cls.description || '<p class="text-gray-500 italic">No description</p>' 
                                    }}
                                />
                                <p className="text-sm text-gray-500 mb-4">
                                    Teacher: {cls.teacher?.name || 'Unknown'}
                                </p>
                                
                                {cls.assignments && cls.assignments.length > 0 ? (
                                    cls.assignments.map(assignment => (
                                        <div key={assignment.id} className="border-t pt-4 mt-4">
                                            <h4 className="font-semibold">{assignment.title}</h4>
                                            <div 
                                                className="text-sm text-gray-600 mb-2 prose prose-sm max-w-none"
                                                dangerouslySetInnerHTML={{ 
                                                    __html: assignment.description || '<p class="text-gray-500 italic">No description</p>' 
                                                }}
                                            />
                                            <p className="text-sm font-medium mb-3">
                                                Competencies: {assignment.competencies?.map(c => c.name).join(', ') || 'None'}
                                            </p>
                                            
                                            <div className="mt-2">
                                                {assignment.submissions && assignment.submissions.length > 0 ? (
                                                    <div>
                                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                            assignment.submissions[0].status === 'ACHIEVED' ? 'bg-green-200 text-green-800' :
                                                            assignment.submissions[0].status === 'MASTERED' ? 'bg-blue-200 text-blue-800' :
                                                            'bg-yellow-200 text-yellow-800'
                                                        }`}>
                                                            Status: {assignment.submissions[0].status}
                                                        </span>
                                                        <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                                                            <strong>Your submission:</strong> {assignment.submissions[0].content}
                                                        </div>
                                                        {assignment.submissions[0].status === 'IN_PROGRESS' && (
                                                            <div className="mt-3">
                                                                <textarea
                                                                    value={submissionContent[assignment.id] || assignment.submissions[0].content}
                                                                    onChange={(e) => handleContentChange(assignment.id, e.target.value)}
                                                                    placeholder="Update your submission..."
                                                                    className="w-full p-2 border rounded-md resize-vertical"
                                                                    rows="3"
                                                                />
                                                                <button
                                                                    onClick={() => handleSubmission(assignment.id)}
                                                                    disabled={submittingAssignments.has(assignment.id)}
                                                                    className="mt-2 bg-indigo-500 text-white px-3 py-1 text-sm rounded-md hover:bg-indigo-600 disabled:opacity-50"
                                                                >
                                                                    {submittingAssignments.has(assignment.id) ? 'Updating...' : 'Update Submission'}
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="mt-3">
                                                        <textarea
                                                            value={submissionContent[assignment.id] || ''}
                                                            onChange={(e) => handleContentChange(assignment.id, e.target.value)}
                                                            placeholder="Enter your submission content..."
                                                            className="w-full p-2 border rounded-md resize-vertical"
                                                            rows="3"
                                                        />
                                                        <button
                                                            onClick={() => handleSubmission(assignment.id)}
                                                            disabled={submittingAssignments.has(assignment.id)}
                                                            className="mt-2 bg-indigo-500 text-white px-3 py-1 text-sm rounded-md hover:bg-indigo-600 disabled:opacity-50"
                                                        >
                                                            {submittingAssignments.has(assignment.id) ? 'Submitting...' : 'Submit Work'}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="border-t pt-4 mt-4">
                                        <p className="text-sm text-gray-500">No assignments yet.</p>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
                
                <div>
                    <h2 className="text-2xl font-semibold mb-4">Competency Overview</h2>
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        {competencyData && (
                            <Bar 
                                data={competencyData} 
                                options={{ 
                                    responsive: true, 
                                    plugins: { 
                                        legend: { position: 'top' }, 
                                        title: { display: true, text: 'Your Competency Status' } 
                                    } 
                                }} 
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default StudentDashboard;