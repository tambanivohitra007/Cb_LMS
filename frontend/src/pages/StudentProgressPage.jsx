import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { useParams, Link } from 'react-router-dom';
import { 
    CheckCircle, 
    Circle, 
    Clock, 
    Trophy, 
    BookOpen, 
    Target, 
    Calendar,
    User,
    ArrowLeft,
    TrendingUp,
    Award,
    AlertCircle
} from 'lucide-react';

function StudentProgressPage() {
    const { apiClient } = useAuth();
    const { classId } = useParams();
    const [classData, setClassData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (classId) {
            fetchClassProgress();
        } else {
            fetchOverallProgress();
        }
    }, [classId]);

    const fetchClassProgress = async () => {
        try {
            setError('');
            const response = await apiClient.get(`/classes/${classId}/competencies/progress`);
            setClassData(response.data);
        } catch (err) {
            setError('Failed to load progress data.');
        } finally {
            setLoading(false);
        }
    };

    const fetchOverallProgress = async () => {
        try {
            setError('');
            const response = await apiClient.get('/competencies/progress');
            setClassData(response.data);
        } catch (err) {
            setError('Failed to load progress data.');
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'MASTERED':
                return <Trophy className="h-5 w-5 text-yellow-500" />;
            case 'ACHIEVED':
                return <CheckCircle className="h-5 w-5 text-green-500" />;
            case 'IN_PROGRESS':
                return <Clock className="h-5 w-5 text-blue-500" />;
            default:
                return <Circle className="h-5 w-5 text-gray-400" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'MASTERED':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'ACHIEVED':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'IN_PROGRESS':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            default:
                return 'bg-gray-100 text-gray-600 border-gray-200';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'MASTERED':
                return 'Mastered';
            case 'ACHIEVED':
                return 'Achieved';
            case 'IN_PROGRESS':
                return 'In Progress';
            default:
                return 'Not Started';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-xl text-gray-600">Loading progress...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
                <div className="text-center bg-white rounded-lg shadow-lg p-8 max-w-md">
                    <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-red-600 mb-2">Error Loading Progress</h2>
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
    }

    // Overall progress view
    if (!classId && classData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="p-8 max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <TrendingUp className="h-8 w-8 text-indigo-600" />
                                <h1 className="text-4xl font-bold text-gray-800">My Learning Progress</h1>
                            </div>
                            <Link 
                                to="/student-dashboard"
                                className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back to Dashboard
                            </Link>
                        </div>
                        <p className="text-gray-600">Track your competency achievements across all your classes</p>
                    </div>

                    {/* Overall Statistics */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
                        <div className="bg-white rounded-lg shadow p-6 text-center">
                            <Target className="h-8 w-8 text-indigo-600 mx-auto mb-2" />
                            <div className="text-2xl font-bold text-gray-800">{classData.totalCompetencies}</div>
                            <div className="text-sm text-gray-600">Total Competencies</div>
                        </div>
                        <div className="bg-white rounded-lg shadow p-6 text-center">
                            <Circle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <div className="text-2xl font-bold text-gray-600">{classData.notStarted}</div>
                            <div className="text-sm text-gray-600">Not Started</div>
                        </div>
                        <div className="bg-white rounded-lg shadow p-6 text-center">
                            <Clock className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                            <div className="text-2xl font-bold text-blue-600">{classData.inProgress}</div>
                            <div className="text-sm text-gray-600">In Progress</div>
                        </div>
                        <div className="bg-white rounded-lg shadow p-6 text-center">
                            <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                            <div className="text-2xl font-bold text-green-600">{classData.achieved}</div>
                            <div className="text-sm text-gray-600">Achieved</div>
                        </div>
                        <div className="bg-white rounded-lg shadow p-6 text-center">
                            <Trophy className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                            <div className="text-2xl font-bold text-yellow-600">{classData.mastered}</div>
                            <div className="text-sm text-gray-600">Mastered</div>
                        </div>
                    </div>

                    {/* Classes Summary */}
                    <div className="space-y-6">
                        {classData.classesSummary.map(classItem => (
                            <div key={classItem.classId} className="bg-white rounded-lg shadow-lg p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-2xl font-bold text-gray-800">{classItem.className}</h2>
                                    <Link
                                        to={`/progress/${classItem.classId}`}
                                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                                    >
                                        <BookOpen className="h-4 w-4" />
                                        View Details
                                    </Link>
                                </div>
                                
                                <div className="space-y-4">
                                    {classItem.assignments.map(assignment => (
                                        <div key={assignment.assignmentId} className="border border-gray-200 rounded-lg p-4">
                                            <h3 className="text-lg font-semibold text-gray-800 mb-3">{assignment.assignmentTitle}</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                {assignment.competencies.map(competency => (
                                                    <div key={competency.competencyId} className={`border rounded-lg p-3 ${getStatusColor(competency.status)}`}>
                                                        <div className="flex items-center gap-2 mb-2">
                                                            {getStatusIcon(competency.status)}
                                                            <span className="font-medium">{competency.name}</span>
                                                        </div>
                                                        <div className="text-xs">{getStatusText(competency.status)}</div>
                                                        {competency.achievedAt && (
                                                            <div className="text-xs mt-1">
                                                                Achieved: {new Date(competency.achievedAt).toLocaleDateString()}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // Class-specific progress view
    if (classId && classData) {
        const progressPercentage = classData.progressPercentage || 0;
        
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="p-8 max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <BookOpen className="h-8 w-8 text-indigo-600" />
                                <div>
                                    <h1 className="text-4xl font-bold text-gray-800">{classData.className}</h1>
                                    <p className="text-gray-600">Competency Progress</p>
                                </div>
                            </div>
                            <Link 
                                to="/progress"
                                className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                All Classes
                            </Link>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="mb-4">
                            <div className="flex justify-between text-sm text-gray-600 mb-2">
                                <span>Overall Progress</span>
                                <span>{progressPercentage}% Complete</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                                <div 
                                    className="bg-indigo-600 h-3 rounded-full transition-all duration-300"
                                    style={{ width: `${progressPercentage}%` }}
                                ></div>
                            </div>
                        </div>

                        {classData.description && (
                            <p className="text-gray-600">{classData.description}</p>
                        )}
                    </div>

                    {/* Statistics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white rounded-lg shadow p-6 text-center">
                            <Target className="h-8 w-8 text-indigo-600 mx-auto mb-2" />
                            <div className="text-2xl font-bold text-gray-800">{classData.totalCompetencies}</div>
                            <div className="text-sm text-gray-600">Total Competencies</div>
                        </div>
                        <div className="bg-white rounded-lg shadow p-6 text-center">
                            <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                            <div className="text-2xl font-bold text-green-600">{classData.achievedCompetencies}</div>
                            <div className="text-sm text-gray-600">Achieved</div>
                        </div>
                        <div className="bg-white rounded-lg shadow p-6 text-center">
                            <Trophy className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                            <div className="text-2xl font-bold text-yellow-600">{classData.masteredCompetencies}</div>
                            <div className="text-sm text-gray-600">Mastered</div>
                        </div>
                        <div className="bg-white rounded-lg shadow p-6 text-center">
                            <Award className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                            <div className="text-2xl font-bold text-purple-600">
                                {classData.totalCompetencies - classData.achievedCompetencies - classData.masteredCompetencies}
                            </div>
                            <div className="text-sm text-gray-600">Remaining</div>
                        </div>
                    </div>

                    {/* Assignments and Competencies */}
                    <div className="space-y-6">
                        {classData.assignments.map(assignment => (
                            <div key={assignment.id} className="bg-white rounded-lg shadow-lg p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-800">{assignment.title}</h2>
                                        {assignment.description && (
                                            <p className="text-gray-600 mt-1">{assignment.description}</p>
                                        )}
                                    </div>
                                    {assignment.deadline && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Calendar className="h-4 w-4" />
                                            Due: {new Date(assignment.deadline).toLocaleDateString()}
                                        </div>
                                    )}
                                </div>

                                {/* Submission Status */}
                                {assignment.submission && (
                                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4 text-blue-600" />
                                            <span className="text-sm font-medium text-blue-800">
                                                Submission Status: {assignment.submission.status}
                                            </span>
                                        </div>
                                        {assignment.submission.feedback && (
                                            <div className="mt-2 text-sm text-blue-700">
                                                <strong>Feedback:</strong> {assignment.submission.feedback}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Competencies Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {assignment.competencies.map(competency => (
                                        <div key={competency.id} className={`border rounded-lg p-4 ${getStatusColor(competency.status)}`}>
                                            <div className="flex items-start gap-3 mb-3">
                                                {getStatusIcon(competency.status)}
                                                <div className="flex-1">
                                                    <h3 className="font-semibold">{competency.name}</h3>
                                                    {competency.description && (
                                                        <p className="text-sm mt-1 opacity-80">{competency.description}</p>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            <div className="text-sm font-medium mb-2">
                                                Status: {getStatusText(competency.status)}
                                            </div>
                                            
                                            {competency.achievedAt && (
                                                <div className="text-sm mb-2">
                                                    <strong>Achieved:</strong> {new Date(competency.achievedAt).toLocaleDateString()}
                                                </div>
                                            )}
                                            
                                            {competency.feedback && (
                                                <div className="text-sm">
                                                    <strong>Feedback:</strong> {competency.feedback}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return null;
}

export default StudentProgressPage;
