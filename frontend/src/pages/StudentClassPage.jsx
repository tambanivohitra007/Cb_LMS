import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../App';
import { 
    BookOpen, 
    FileText, 
    Target, 
    Calendar, 
    CheckCircle, 
    Star, 
    Clock, 
    Download, 
    MessageCircle, 
    Edit, 
    Save, 
    X, 
    Upload, 
    Rocket, 
    Lock,
    AlertTriangle,
    Search,
    ArrowLeft,
    Loader2,
    PlusCircle,
    Users
} from 'lucide-react';

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
    const [editingSubmission, setEditingSubmission] = useState({});
    const [notification, setNotification] = useState(null);

    // Show notification helper
    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 4000);
    };

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
        
        // Check if we have either content or file
        if (!content?.trim() && !file) {
            showNotification('Please enter some content or select a file for your submission.', 'error');
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
            
            // Exit edit mode if we were editing
            setEditingSubmission(prev => ({ ...prev, [assignmentId]: false }));
            
            showNotification('Submission successful!', 'success');
        } catch (error) {
            showNotification('Failed to submit assignment. Please try again.', 'error');
        } finally {
            setSubmittingAssignments(prev => { const n = new Set(prev); n.delete(assignmentId); return n; });
        }
    };

    const handleEditClick = (assignmentId) => {
        setEditingSubmission(prev => ({ ...prev, [assignmentId]: true }));
        const assignment = assignments.find(a => a.id === assignmentId);
        const existingSubmission = assignment?.submissions?.[0];
        
        // Only set text content if it's not a file submission
        if (existingSubmission?.content && !existingSubmission.content.startsWith('/uploads/')) {
            setSubmissionContent(prev => ({
                ...prev,
                [assignmentId]: existingSubmission.content
            }));
        } else {
            // Clear content for file submissions so user can add text if they want
            setSubmissionContent(prev => ({
                ...prev,
                [assignmentId]: ''
            }));
        }
    };
    const handleCancelEdit = (assignmentId) => {
        setEditingSubmission(prev => ({ ...prev, [assignmentId]: false }));
        // Clear any unsaved content when canceling edit
        setSubmissionContent(prev => {
            const newContent = { ...prev };
            delete newContent[assignmentId];
            return newContent;
        });
        setSubmissionFiles(prev => {
            const newFiles = { ...prev };
            delete newFiles[assignmentId];
            return newFiles;
        });
    };

    if (loading) return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
            <div className="text-center">
                <Loader2 className="animate-spin h-16 w-16 text-indigo-600 mx-auto mb-4" />
                <p className="text-xl text-gray-600">Loading class information...</p>
            </div>
        </div>
    );
    
    if (error) return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
            <div className="text-center bg-white rounded-lg shadow-lg p-8 max-w-md">
                <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-red-600 mb-2">Oops! Something went wrong</h2>
                <p className="text-red-500 mb-4">{error}</p>
                <button 
                    onClick={() => window.location.reload()} 
                    className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                    Try Again
                </button>
            </div>
        </div>
    );
    
    if (!classInfo) return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 flex items-center justify-center">
            <div className="text-center bg-white rounded-lg shadow-lg p-8 max-w-md">
                <Search className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-600 mb-2">Class Not Found</h2>
                <p className="text-gray-500 mb-4">The class you're looking for doesn't exist or you don't have access to it.</p>
                <button 
                    onClick={() => window.history.back()} 
                    className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2 mx-auto"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Go Back
                </button>
            </div>
        </div>
    );

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
                        <h1 className="text-4xl font-bold text-gray-800">{classInfo.name}</h1>
                        <div className="bg-indigo-100 text-indigo-800 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
                            <BookOpen className="h-4 w-4" />
                            Class Dashboard
                        </div>
                    </div>
                    <div className="prose prose-lg max-w-none text-gray-600" dangerouslySetInnerHTML={{ __html: classInfo.description || '<p class="text-gray-500 italic">No description available</p>' }} />
                </div>

                {/* Assignments Section */}
                <div className="bg-white rounded-lg shadow-lg p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                            <FileText className="h-8 w-8 text-indigo-600" />
                            Assignments
                        </h2>
                        <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm">
                            {assignments.length} {assignments.length === 1 ? 'assignment' : 'assignments'}
                        </div>
                    </div>
            {assignments.length === 0 ? (
                <div className="text-center py-12">
                    <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-xl text-gray-500 mb-2">No assignments yet</p>
                    <p className="text-gray-400">Check back later for new assignments from your teacher.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {assignments.map((assignment, index) => (
                        <div key={assignment.id} 
                             className="bg-gradient-to-r from-white to-gray-50 rounded-xl shadow-md border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.01]"
                             style={{ animationDelay: `${index * 100}ms` }}>
                            {/* Assignment Header */}
                            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h3 className="text-2xl font-bold mb-2 flex items-center gap-2">
                                            <FileText className="h-6 w-6" />
                                            {assignment.title}
                                        </h3>
                                        <div className="flex flex-wrap items-center gap-4 text-indigo-100">
                                            <span className="flex items-center gap-1 bg-white/20 rounded-full px-3 py-1">
                                                <Target className="h-4 w-4" />
                                                <span className="text-sm font-medium">
                                                    {assignment.competencies?.length > 0 
                                                        ? `${assignment.competencies.length} competenc${assignment.competencies.length === 1 ? 'y' : 'ies'}`
                                                        : 'No competencies'
                                                    }
                                                </span>
                                            </span>
                                            <span className="flex items-center gap-1 bg-white/20 rounded-full px-3 py-1">
                                                <Calendar className="h-4 w-4" />
                                                <span className="text-sm font-medium">
                                                    {assignment.deadline 
                                                        ? new Date(assignment.deadline).toLocaleDateString('en-US', { 
                                                            weekday: 'short', 
                                                            year: 'numeric', 
                                                            month: 'short', 
                                                            day: 'numeric' 
                                                          })
                                                        : 'No deadline'
                                                    }
                                                </span>
                                            </span>
                                        </div>
                                        {assignment.competencies?.length > 0 && (
                                            <div className="mt-2 text-sm text-indigo-100">
                                                <strong>Skills to master:</strong> {assignment.competencies.map(c => c.name).join(', ')}
                                            </div>
                                        )}
                                    </div>
                                    {assignment.submissions && assignment.submissions.length > 0 && (
                                        <div className="ml-4">
                                            <span className={`px-4 py-2 text-sm font-bold rounded-full shadow-lg flex items-center gap-2 ${
                                                assignment.submissions[0].status === 'ACHIEVED' 
                                                    ? 'bg-green-500 text-white' 
                                                    : assignment.submissions[0].status === 'MASTERED' 
                                                    ? 'bg-blue-500 text-white' 
                                                    : 'bg-yellow-500 text-white'
                                            }`}>
                                                {assignment.submissions[0].status === 'ACHIEVED' ? (
                                                    <>
                                                        <CheckCircle className="h-4 w-4" />
                                                        Achieved
                                                    </>
                                                ) : assignment.submissions[0].status === 'MASTERED' ? (
                                                    <>
                                                        <Star className="h-4 w-4" />
                                                        Mastered
                                                    </>
                                                ) : (
                                                    <>
                                                        <Clock className="h-4 w-4" />
                                                        In Progress
                                                    </>
                                                )}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Assignment Content */}
                            <div className="p-6">
                                <div className="prose prose-gray max-w-none mb-6" dangerouslySetInnerHTML={{ __html: assignment.description || '<p class="text-gray-500 italic">No description provided</p>' }} />
                                
                                {assignment.submissions && assignment.submissions.length > 0 ? (
                                    <div className="space-y-4">
                                        {/* Current Submission */}
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                            <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                                                <FileText className="h-4 w-4" />
                                                Your Submission
                                            </h4>
                                            <div className="text-sm text-blue-800">
                                                {assignment.submissions[0].content && assignment.submissions[0].content.startsWith('/uploads/') ? (
                                                    <div className="flex items-center gap-2">
                                                        <Upload className="h-4 w-4" />
                                                        <span>File submitted:</span>
                                                        <a href={assignment.submissions[0].content} target="_blank" rel="noopener noreferrer" 
                                                           className="text-indigo-600 underline hover:text-indigo-800 font-medium flex items-center gap-1">
                                                            <Download className="h-4 w-4" />
                                                            Download File
                                                        </a>
                                                    </div>
                                                ) : (
                                                    <div className="bg-white rounded p-3 border">
                                                        {assignment.submissions[0].content}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Teacher Feedback */}
                                        {assignment.submissions[0].feedback && (
                                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                                <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                                                    <MessageCircle className="h-4 w-4" />
                                                    Teacher Feedback
                                                </h4>
                                                <div className="text-green-800 bg-white rounded p-3 border border-green-200">
                                                    {assignment.submissions[0].feedback}
                                                </div>
                                            </div>
                                        )}

                                        {/* Edit Interface for In Progress Submissions */}
                                        {assignment.submissions[0].status === 'IN_PROGRESS' ? (
                                            editingSubmission[assignment.id] ? (
                                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                                    <h4 className="font-semibold text-yellow-900 mb-3 flex items-center gap-2">
                                                        <Edit className="h-4 w-4" />
                                                        Edit Your Submission
                                                    </h4>
                                                    <div className="space-y-3">
                                                        <textarea
                                                            value={submissionContent[assignment.id] || ''}
                                                            onChange={e => handleContentChange(assignment.id, e.target.value)}
                                                            placeholder="Update your submission text..."
                                                            className="w-full p-3 border border-yellow-300 rounded-lg resize-vertical focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                                            rows="4"
                                                        />
                                                        <div className="flex items-center gap-2">
                                                            <label className="text-sm font-medium text-yellow-800 flex items-center gap-1">
                                                                <Upload className="h-4 w-4" />
                                                                Replace with new file:
                                                            </label>
                                                            <input
                                                                type="file"
                                                                className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-yellow-50 file:text-yellow-700 hover:file:bg-yellow-100"
                                                                onChange={e => handleFileChange(assignment.id, e.target.files[0])}
                                                            />
                                                        </div>
                                                        {assignment.submissions[0].content && assignment.submissions[0].content.startsWith('/uploads/') && (
                                                            <div className="text-xs text-yellow-600">
                                                                Current submission is a file. Add text above or upload a new file to replace it.
                                                            </div>
                                                        )}
                                                        <div className="flex gap-3">
                                                            <button
                                                                onClick={() => handleSubmission(assignment.id)}
                                                                disabled={submittingAssignments.has(assignment.id)}
                                                                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors flex items-center gap-2"
                                                            >
                                                                {submittingAssignments.has(assignment.id) ? (
                                                                    <>
                                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                                        Updating...
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Save className="h-4 w-4" />
                                                                        Save Changes
                                                                    </>
                                                                )}
                                                            </button>
                                                            <button
                                                                onClick={() => handleCancelEdit(assignment.id)}
                                                                className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 font-medium transition-colors flex items-center gap-2"
                                                            >
                                                                <X className="h-4 w-4" />
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-center">
                                                    <button
                                                        onClick={() => handleEditClick(assignment.id)}
                                                        className="bg-yellow-500 text-white px-6 py-3 rounded-lg hover:bg-yellow-600 font-medium transition-colors shadow-md flex items-center gap-2 mx-auto"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                        Edit Submission
                                                    </button>
                                                </div>
                                            )
                                        ) : (
                                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                                                <p className="text-gray-600 flex items-center justify-center gap-2">
                                                    <Lock className="h-4 w-4" />
                                                    <span>This assignment has been {assignment.submissions[0].status.toLowerCase()} and cannot be modified</span>
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    /* New Submission Interface */
                                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
                                        <h4 className="font-semibold text-indigo-900 mb-4 flex items-center gap-2">
                                            <Rocket className="h-4 w-4" />
                                            Submit Your Work
                                        </h4>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-indigo-800 mb-2 flex items-center gap-1">
                                                    <Edit className="h-4 w-4" />
                                                    Text Submission
                                                </label>
                                                <textarea
                                                    value={submissionContent[assignment.id] || ''}
                                                    onChange={e => handleContentChange(assignment.id, e.target.value)}
                                                    placeholder="Enter your submission content here..."
                                                    className="w-full p-3 border border-indigo-300 rounded-lg resize-vertical focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                                    rows="4"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-indigo-800 mb-2 flex items-center gap-1">
                                                    <Upload className="h-4 w-4" />
                                                    File Upload
                                                </label>
                                                <input
                                                    type="file"
                                                    className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                                    onChange={e => handleFileChange(assignment.id, e.target.files[0])}
                                                />
                                                <p className="text-xs text-indigo-600 mt-1">You can submit either text, a file, or both</p>
                                            </div>
                                            <div className="text-center pt-2">
                                                <button
                                                    onClick={() => handleSubmission(assignment.id)}
                                                    disabled={submittingAssignments.has(assignment.id)}
                                                    className="bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors shadow-md flex items-center gap-2 mx-auto"
                                                >
                                                    {submittingAssignments.has(assignment.id) ? (
                                                        <>
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                            Submitting...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Rocket className="h-4 w-4" />
                                                            Submit Work
                                                        </>
                                                    )}
                                                </button>
                                            </div>
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

export default StudentClassPage;
