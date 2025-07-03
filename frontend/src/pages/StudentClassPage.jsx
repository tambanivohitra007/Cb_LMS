import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../App';

function StudentClassPage() {
    const { classId } = useParams();
    const { apiClient } = useAuth();
    const [classInfo, setClassInfo] = useState(null);
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [submissionContent, setSubmissionContent] = useState({});
    const [submissionFiles, setSubmissionFiles] = useState({});
    const [submittingAssignments, setSubmittingAssignments] = useState(new Set());

    useEffect(() => {
        const fetchClass = async () => {
            try {
                setError('');
                const classRes = await apiClient.get(`/classes`);
                const found = (classRes.data || []).find(cls => cls.id === parseInt(classId));
                setClassInfo(found);
                if (found) {
                    const assignmentsRes = await apiClient.get(`/classes/${classId}/assignments`);
                    setAssignments(assignmentsRes.data || []);
                }
            } catch (err) {
                setError('Failed to load class or assignments.');
            } finally {
                setLoading(false);
            }
        };
        fetchClass();
    }, [classId, apiClient]);

    const handleFileChange = (assignmentId, file) => {
        setSubmissionFiles(prev => ({ ...prev, [assignmentId]: file }));
    };
    const handleContentChange = (assignmentId, content) => {
        setSubmissionContent(prev => ({ ...prev, [assignmentId]: content }));
    };
    const handleSubmission = async (assignmentId) => {
        const content = submissionContent[assignmentId];
        const file = submissionFiles[assignmentId];
        if (!content?.trim() && !file) {
            alert('Please enter some content or select a file for your submission.');
            return;
        }
        try {
            setSubmittingAssignments(prev => new Set([...prev, assignmentId]));
            let formData;
            if (file) {
                formData = new FormData();
                formData.append('assignmentId', assignmentId);
                formData.append('file', file);
                if (content?.trim()) formData.append('content', content.trim());
                await apiClient.post('/submissions', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                await apiClient.post('/submissions', {
                    assignmentId,
                    content: content.trim()
                });
            }
            // Refresh assignments
            const assignmentsRes = await apiClient.get(`/classes/${classId}/assignments`);
            setAssignments(assignmentsRes.data || []);
            setSubmissionContent(prev => { const n = { ...prev }; delete n[assignmentId]; return n; });
            setSubmissionFiles(prev => { const n = { ...prev }; delete n[assignmentId]; return n; });
            alert('Submission successful!');
        } catch (error) {
            alert('Failed to submit assignment. Please try again.');
        } finally {
            setSubmittingAssignments(prev => { const n = new Set(prev); n.delete(assignmentId); return n; });
        }
    };

    if (loading) return <div className="p-8">Loading...</div>;
    if (error) return <div className="p-8 text-red-600">{error}</div>;
    if (!classInfo) return <div className="p-8">Class not found.</div>;

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-4">{classInfo.name}</h1>
            <div className="prose mb-6" dangerouslySetInnerHTML={{ __html: classInfo.description || '<p class=\"text-gray-500 italic\">No description</p>' }} />
            <h2 className="text-2xl font-semibold mb-4">Assignments</h2>
            {assignments.length === 0 ? (
                <p className="text-gray-500">No assignments yet.</p>
            ) : (
                assignments.map(assignment => (
                    <div key={assignment.id} className="mb-8 border-b pb-6">
                        <h3 className="text-xl font-bold text-indigo-700">{assignment.title}</h3>
                        <div className="text-gray-600 prose prose-sm max-w-none mb-2" dangerouslySetInnerHTML={{ __html: assignment.description || '<p class=\"text-gray-500 italic\">No description</p>' }} />
                        <p className="text-sm font-medium mb-2">Competencies: {assignment.competencies?.map(c => c.name).join(', ') || 'None'}</p>
                        <p className="text-sm text-gray-500 mb-2">Deadline: {assignment.deadline ? new Date(assignment.deadline).toLocaleDateString() : 'No deadline set'}</p>
                        {assignment.submissions && assignment.submissions.length > 0 ? (
                            <div>
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${assignment.submissions[0].status === 'ACHIEVED' ? 'bg-green-200 text-green-800' : assignment.submissions[0].status === 'MASTERED' ? 'bg-blue-200 text-blue-800' : 'bg-yellow-200 text-yellow-800'}`}>Status: {assignment.submissions[0].status}</span>
                                <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                                    <strong>Your submission:</strong> {assignment.submissions[0].content && assignment.submissions[0].content.startsWith('/uploads/') ? (
                                        <a href={assignment.submissions[0].content} target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline">Download File</a>
                                    ) : assignment.submissions[0].content}
                                </div>
                                {assignment.submissions[0].status === 'IN_PROGRESS' && (
                                    <div className="mt-3">
                                        <textarea
                                            value={submissionContent[assignment.id] || assignment.submissions[0].content}
                                            onChange={e => handleContentChange(assignment.id, e.target.value)}
                                            placeholder="Update your submission..."
                                            className="w-full p-2 border rounded-md resize-vertical"
                                            rows="3"
                                        />
                                        <input
                                            type="file"
                                            className="mt-2"
                                            onChange={e => handleFileChange(assignment.id, e.target.files[0])}
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
                                    onChange={e => handleContentChange(assignment.id, e.target.value)}
                                    placeholder="Enter your submission content..."
                                    className="w-full p-2 border rounded-md resize-vertical"
                                    rows="3"
                                />
                                <input
                                    type="file"
                                    className="mt-2"
                                    onChange={e => handleFileChange(assignment.id, e.target.files[0])}
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
                ))
            )}
        </div>
    );
}

export default StudentClassPage;
