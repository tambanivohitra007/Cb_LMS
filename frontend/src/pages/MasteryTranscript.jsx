import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { useParams, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';

const MasteryTranscript = () => {
    const { apiClient, user } = useAuth();
    const { studentId } = useParams();
    const [searchParams] = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [transcriptData, setTranscriptData] = useState(null);
    const [includeInProgress, setIncludeInProgress] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState('');
    const [students, setStudents] = useState([]);
    const [viewMode, setViewMode] = useState('class'); // 'class', 'cohort', 'status'

    useEffect(() => {
        console.log('MasteryTranscript initial load useEffect triggered');
        console.log('User:', user);
        console.log('StudentId from params:', studentId);
        console.log('apiClient:', apiClient);
        
        if (!user) {
            console.log('No user yet, waiting...');
            return;
        }

        // Test API connectivity first
        testApiConnection();
        
        if (user?.role === 'TEACHER') {
            loadStudents();
        }
        
        // Initial load with default includeInProgress = false
        if (studentId) {
            setSelectedStudent(studentId);
            loadTranscriptWithSettings(studentId, false);
        } else if (user?.role === 'STUDENT' && user?.id) {
            // Students view their own transcript
            console.log('Student loading own transcript, user.id:', user.id);
            setSelectedStudent(user.id.toString());
            loadTranscriptWithSettings(user.id, false);
        }
    }, [studentId, user?.id, user?.role]);

    const testApiConnection = async () => {
        try {
            console.log('Testing API connection...');
            const response = await apiClient.get('/classes');
            console.log('API test successful:', response);
        } catch (err) {
            console.error('API test failed:', err);
        }
    };

    // Separate function that doesn't depend on state
    const loadTranscriptWithSettings = async (studentIdToLoad, includeInProgressFlag) => {
        setLoading(true);
        setError('');
        
        console.log('Loading transcript for student:', studentIdToLoad);
        console.log('Include in progress:', includeInProgressFlag);
        
        try {
            const response = await apiClient.get(
                `/reports/student/${studentIdToLoad}/mastery-transcript?includeInProgress=${includeInProgressFlag}`
            );
            console.log('Transcript response:', response);
            setTranscriptData(response.data);
        } catch (err) {
            console.error('Transcript error:', err);
            setError('Failed to load mastery transcript: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const loadStudents = async () => {
        try {
            const classesResponse = await apiClient.get('/classes');
            const allStudents = [];
            
            for (const cls of classesResponse.data) {
                const studentsResponse = await apiClient.get(`/classes/${cls.id}/students`);
                studentsResponse.data.forEach(student => {
                    if (!allStudents.some(s => s.id === student.id)) {
                        allStudents.push(student);
                    }
                });
            }
            
            setStudents(allStudents);
        } catch (err) {
            setError('Failed to load students: ' + err.message);
        }
    };

    const loadTranscript = async (studentIdToLoad) => {
        loadTranscriptWithSettings(studentIdToLoad, includeInProgress);
    };

    const handleStudentChange = (newStudentId) => {
        setSelectedStudent(newStudentId);
        if (newStudentId) {
            loadTranscript(newStudentId);
        }
    };

    const handleIncludeInProgressChange = (checked) => {
        console.log('Include in progress changed to:', checked);
        setIncludeInProgress(checked);
        if (selectedStudent) {
            loadTranscriptWithSettings(selectedStudent, checked);
        }
    };

    const getStatusBadge = (status) => {
        const badgeClasses = {
            'MASTERED': 'bg-purple-100 text-purple-800 border-purple-300',
            'ACHIEVED': 'bg-green-100 text-green-800 border-green-300',
            'IN_PROGRESS': 'bg-yellow-100 text-yellow-800 border-yellow-300'
        };
        
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeClasses[status] || 'bg-gray-100 text-gray-800 border-gray-300'}`}>
                {status.replace('_', ' ')}
            </span>
        );
    };

    const renderCompetencyCard = (competency, showClassInfo = true) => (
        <div key={`${competency.id}-${competency.assignment.id}`} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-gray-900">{competency.name}</h4>
                {getStatusBadge(competency.status)}
            </div>
            
            {competency.description && (
                <p className="text-gray-600 text-sm mb-2">{competency.description}</p>
            )}
            
            {showClassInfo && (
                <div className="text-sm text-gray-500 mb-2">
                    <span className="font-medium">{competency.class.name}</span> - {competency.assignment.title}
                </div>
            )}
            
            {competency.achievedAt && (
                <div className="text-sm text-gray-500 mb-2">
                    Achieved: {format(new Date(competency.achievedAt), 'MMM dd, yyyy')}
                </div>
            )}
            
            {competency.feedback && (
                <div className="bg-blue-50 border border-blue-200 rounded p-2 mb-2">
                    <p className="text-sm text-blue-800">
                        <span className="font-medium">Teacher Feedback:</span> {competency.feedback}
                    </p>
                </div>
            )}
            
            {competency.evidence && (
                <div className="bg-gray-50 border border-gray-200 rounded p-2">
                    <p className="text-sm font-medium text-gray-700 mb-1">Evidence:</p>
                    <p className="text-sm text-gray-600 mb-1">{competency.evidence.content}</p>
                    <div className="text-xs text-gray-500">
                        Submitted: {format(new Date(competency.evidence.submittedAt), 'MMM dd, yyyy')}
                        {competency.evidence.reviewedAt && (
                            <span> • Reviewed: {format(new Date(competency.evidence.reviewedAt), 'MMM dd, yyyy')}</span>
                        )}
                    </div>
                    {competency.evidence.teacherFeedback && (
                        <p className="text-sm text-green-700 mt-1">
                            <span className="font-medium">Review:</span> {competency.evidence.teacherFeedback}
                        </p>
                    )}
                </div>
            )}
        </div>
    );

    const renderClassView = () => (
        <div className="space-y-6">
            {transcriptData.competenciesByClass.map(classGroup => (
                <div key={classGroup.classInfo.id} className="bg-gray-50 rounded-lg p-6">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">{classGroup.className}</h3>
                            {classGroup.classInfo.description && (
                                <p className="text-gray-600">{classGroup.classInfo.description}</p>
                            )}
                            {classGroup.cohort && (
                                <p className="text-sm text-purple-600 font-medium">
                                    {classGroup.cohort.name} (Level {classGroup.cohort.level})
                                </p>
                            )}
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-bold text-green-600">
                                {classGroup.summary.mastered + classGroup.summary.achieved}/{classGroup.summary.total}
                            </div>
                            <div className="text-sm text-gray-500">Competencies</div>
                        </div>
                    </div>
                    
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {classGroup.competencies.map(competency => renderCompetencyCard(competency, false))}
                    </div>
                </div>
            ))}
        </div>
    );

    const renderCohortView = () => (
        <div className="space-y-6">
            {transcriptData.competenciesByCohort.map(cohortGroup => (
                <div key={cohortGroup.cohortInfo.id} className="bg-purple-50 rounded-lg p-6">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h3 className="text-xl font-bold text-purple-900">{cohortGroup.cohortName}</h3>
                            <p className="text-purple-700">Level {cohortGroup.cohortInfo.level}</p>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-bold text-purple-600">
                                {cohortGroup.summary.mastered + cohortGroup.summary.achieved}/{cohortGroup.summary.total}
                            </div>
                            <div className="text-sm text-purple-500">Competencies</div>
                        </div>
                    </div>
                    
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {cohortGroup.competencies.map(competency => renderCompetencyCard(competency))}
                    </div>
                </div>
            ))}
        </div>
    );

    const renderStatusView = () => (
        <div className="space-y-6">
            {transcriptData.masteredCompetencies.length > 0 && (
                <div className="bg-purple-50 rounded-lg p-6">
                    <h3 className="text-xl font-bold text-purple-900 mb-4">
                        Mastered Competencies ({transcriptData.masteredCompetencies.length})
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {transcriptData.masteredCompetencies.map(competency => renderCompetencyCard(competency))}
                    </div>
                </div>
            )}
            
            {transcriptData.achievedCompetencies.length > 0 && (
                <div className="bg-green-50 rounded-lg p-6">
                    <h3 className="text-xl font-bold text-green-900 mb-4">
                        Achieved Competencies ({transcriptData.achievedCompetencies.length})
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {transcriptData.achievedCompetencies.map(competency => renderCompetencyCard(competency))}
                    </div>
                </div>
            )}
            
            {includeInProgress && transcriptData.inProgressCompetencies.length > 0 && (
                <div className="bg-yellow-50 rounded-lg p-6">
                    <h3 className="text-xl font-bold text-yellow-900 mb-4">
                        In Progress Competencies ({transcriptData.inProgressCompetencies.length})
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {transcriptData.inProgressCompetencies.map(competency => renderCompetencyCard(competency))}
                    </div>
                </div>
            )}
        </div>
    );

    const exportTranscript = () => {
        if (!transcriptData) return;
        
        const printWindow = window.open('', '_blank');
        const content = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Mastery Transcript - ${transcriptData.student.name}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
                    .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
                    .summary { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
                    .competency { margin: 15px 0; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
                    .status-mastered { background: #f3e8ff; border-color: #a855f7; }
                    .status-achieved { background: #f0fdf4; border-color: #22c55e; }
                    .status-inprogress { background: #fefce8; border-color: #eab308; }
                    .evidence { background: #f9f9f9; padding: 10px; margin-top: 10px; border-radius: 4px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Mastery Transcript</h1>
                    <h2>${transcriptData.student.name}</h2>
                    <p>Generated on: ${format(new Date(), 'MMMM dd, yyyy')}</p>
                </div>
                
                <div class="summary">
                    <h3>Summary</h3>
                    <p><strong>Total Competencies:</strong> ${transcriptData.summary.totalCompetencies}</p>
                    <p><strong>Mastered:</strong> ${transcriptData.summary.mastered}</p>
                    <p><strong>Achieved:</strong> ${transcriptData.summary.achieved}</p>
                    <p><strong>Completion Rate:</strong> ${transcriptData.summary.completionRate}%</p>
                    <p><strong>Mastery Rate:</strong> ${transcriptData.summary.masteryRate}%</p>
                </div>
                
                ${transcriptData.competenciesByClass.map(classGroup => `
                    <div class="class-section">
                        <h3>${classGroup.className}</h3>
                        ${classGroup.competencies.map(comp => `
                            <div class="competency status-${comp.status.toLowerCase().replace('_', '')}">
                                <h4>${comp.name}</h4>
                                <p><strong>Status:</strong> ${comp.status.replace('_', ' ')}</p>
                                <p><strong>Assignment:</strong> ${comp.assignment.title}</p>
                                ${comp.achievedAt ? `<p><strong>Achieved:</strong> ${format(new Date(comp.achievedAt), 'MMM dd, yyyy')}</p>` : ''}
                                ${comp.description ? `<p><strong>Description:</strong> ${comp.description}</p>` : ''}
                                ${comp.feedback ? `<p><strong>Feedback:</strong> ${comp.feedback}</p>` : ''}
                                ${comp.evidence ? `
                                    <div class="evidence">
                                        <strong>Evidence:</strong> ${comp.evidence.content}
                                        <br><small>Submitted: ${format(new Date(comp.evidence.submittedAt), 'MMM dd, yyyy')}</small>
                                    </div>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                `).join('')}
            </body>
            </html>
        `;
        
        printWindow.document.write(content);
        printWindow.document.close();
        printWindow.print();
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <div className="ml-4">
                        <p className="text-gray-600">Loading mastery transcript...</p>
                        <p className="text-sm text-gray-500">This may take a moment to load your data.</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-6 text-center">
                    <h2 className="text-xl font-semibold text-yellow-800 mb-2">Authentication Required</h2>
                    <p className="text-yellow-700 mb-4">Please log in to view your mastery transcript.</p>
                    <a 
                        href="/login" 
                        className="inline-block bg-yellow-600 text-white px-6 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
                    >
                        Go to Login
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Mastery Transcript</h1>
                
                {/* Controls */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {user?.role === 'TEACHER' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Select Student
                                </label>
                                <select
                                    value={selectedStudent}
                                    onChange={(e) => handleStudentChange(e.target.value)}
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                >
                                    <option value="">Choose student...</option>
                                    {students.map(student => (
                                        <option key={student.id} value={student.id}>
                                            {student.name} ({student.email})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                View Mode
                            </label>
                            <select
                                value={viewMode}
                                onChange={(e) => setViewMode(e.target.value)}
                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            >
                                <option value="class">By Class</option>
                                <option value="cohort">By Cohort</option>
                                <option value="status">By Status</option>
                            </select>
                        </div>
                        
                        <div>
                            <label className="flex items-center mt-6">
                                <input
                                    type="checkbox"
                                    checked={includeInProgress}
                                    onChange={(e) => handleIncludeInProgressChange(e.target.checked)}
                                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                                />
                                <span className="ml-2 text-sm text-gray-600">Include In Progress</span>
                            </label>
                        </div>
                        
                        <div className="flex items-end">
                            <button
                                onClick={exportTranscript}
                                disabled={!transcriptData}
                                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                                Export Transcript
                            </button>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                        <p className="text-red-800">{error}</p>
                    </div>
                )}
            </div>

            {transcriptData && (
                <>
                    {/* Student Info & Summary */}
                    <div className="bg-white rounded-lg shadow p-6 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">{transcriptData.student.name}</h2>
                                <p className="text-gray-600 mb-1">{transcriptData.student.email}</p>
                                <p className="text-sm text-gray-500">
                                    Transcript generated: {format(new Date(transcriptData.student.transcriptGeneratedAt), 'MMM dd, yyyy HH:mm')}
                                </p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-center p-4 bg-green-50 rounded-lg">
                                    <div className="text-2xl font-bold text-green-600">{transcriptData.summary.totalCompetencies}</div>
                                    <div className="text-sm text-green-800">Total Competencies</div>
                                </div>
                                <div className="text-center p-4 bg-purple-50 rounded-lg">
                                    <div className="text-2xl font-bold text-purple-600">{transcriptData.summary.mastered}</div>
                                    <div className="text-sm text-purple-800">Mastered</div>
                                </div>
                                <div className="text-center p-4 bg-blue-50 rounded-lg">
                                    <div className="text-2xl font-bold text-blue-600">{transcriptData.summary.completionRate}%</div>
                                    <div className="text-sm text-blue-800">Completion Rate</div>
                                </div>
                                <div className="text-center p-4 bg-indigo-50 rounded-lg">
                                    <div className="text-2xl font-bold text-indigo-600">{transcriptData.summary.masteryRate}%</div>
                                    <div className="text-sm text-indigo-800">Mastery Rate</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content based on view mode */}
                    {viewMode === 'class' && renderClassView()}
                    {viewMode === 'cohort' && renderCohortView()}
                    {viewMode === 'status' && renderStatusView()}
                </>
            )}
        </div>
    );
};

export default MasteryTranscript;
