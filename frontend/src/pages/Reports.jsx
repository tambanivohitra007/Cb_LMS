import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { format } from 'date-fns';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    TimeScale,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    TimeScale
);

const Reports = () => {
    const { apiClient } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [reportType, setReportType] = useState('student');
    const [reportData, setReportData] = useState(null);
    
    // Form states for different report types
    const [selectedStudent, setSelectedStudent] = useState('');
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedCompetency, setSelectedCompetency] = useState('');
    
    // Dropdown options
    const [students, setStudents] = useState([]);
    const [classes, setClasses] = useState([]);
    const [competencies, setCompetencies] = useState([]);

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        try {
            // Load students from all teacher's classes
            const classesResponse = await apiClient.get('/classes');
            setClasses(classesResponse.data);
            
            // Get all students from teacher's classes
            const allStudents = [];
            const allCompetencies = [];
            
            for (const cls of classesResponse.data) {
                const studentsResponse = await apiClient.get(`/classes/${cls.id}/students`);
                studentsResponse.data.forEach(student => {
                    if (!allStudents.some(s => s.id === student.id)) {
                        allStudents.push(student);
                    }
                });
                
                // Get competencies from assignments
                const assignmentsResponse = await apiClient.get(`/classes/${cls.id}/assignments`);
                assignmentsResponse.data.forEach(assignment => {
                    assignment.competencies.forEach(competency => {
                        if (!allCompetencies.some(c => c.id === competency.id)) {
                            allCompetencies.push(competency);
                        }
                    });
                });
            }
            
            setStudents(allStudents);
            setCompetencies(allCompetencies);
        } catch (err) {
            setError('Failed to load initial data: ' + err.message);
        }
    };

    const generateReport = async () => {
        setLoading(true);
        setError('');
        setReportData(null);

        try {
            let response;
            switch (reportType) {
                case 'student':
                    if (!selectedStudent) {
                        setError('Please select a student');
                        return;
                    }
                    response = await apiClient.get(`/reports/student/${selectedStudent}/progress`);
                    break;
                case 'class':
                    if (!selectedClass) {
                        setError('Please select a class');
                        return;
                    }
                    response = await apiClient.get(`/reports/class/${selectedClass}/progress`);
                    break;
                case 'competency':
                    if (!selectedCompetency) {
                        setError('Please select a competency');
                        return;
                    }
                    response = await apiClient.get(`/reports/competency/${selectedCompetency}/progress`);
                    break;
                default:
                    setError('Invalid report type');
                    return;
            }
            setReportData(response.data);
        } catch (err) {
            setError('Failed to generate report: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'NOT_STARTED': return 'bg-gray-100 text-gray-800';
            case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800';
            case 'ACHIEVED': return 'bg-blue-100 text-blue-800';
            case 'MASTERED': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const formatStatus = (status) => {
        return status.replace('_', ' ');
    };

    const renderStudentProgressChart = () => {
        if (!reportData || !reportData.timeline) return null;

        const timeline = reportData.timeline;
        const competencyNames = [...new Set(timeline.map(item => item.competencyName))];
        
        const datasets = competencyNames.map((competencyName, index) => {
            const competencyData = timeline.filter(item => item.competencyName === competencyName);
            const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#F97316'];
            
            return {
                label: competencyName,
                data: competencyData.map(item => ({
                    x: new Date(item.updated_at),
                    y: ['NOT_STARTED', 'IN_PROGRESS', 'ACHIEVED', 'MASTERED'].indexOf(item.status) + 1
                })),
                borderColor: colors[index % colors.length],
                backgroundColor: colors[index % colors.length] + '20',
                tension: 0.1,
            };
        });

        const chartData = {
            datasets: datasets
        };

        const options = {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Competency Progress Over Time'
                },
                legend: {
                    position: 'top',
                }
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'day'
                    },
                    title: {
                        display: true,
                        text: 'Date'
                    }
                },
                y: {
                    min: 0.5,
                    max: 4.5,
                    ticks: {
                        stepSize: 1,
                        callback: function(value) {
                            const statuses = ['', 'Not Started', 'In Progress', 'Achieved', 'Mastered'];
                            return statuses[value] || '';
                        }
                    },
                    title: {
                        display: true,
                        text: 'Progress Status'
                    }
                }
            }
        };

        return (
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <Line data={chartData} options={options} />
            </div>
        );
    };

    const renderClassProgressChart = () => {
        if (!reportData || !reportData.competencyBreakdown) return null;

        const breakdown = reportData.competencyBreakdown;
        
        const chartData = {
            labels: breakdown.map(item => item.competencyName),
            datasets: [
                {
                    label: 'Not Started',
                    data: breakdown.map(item => item.not_started),
                    backgroundColor: '#9CA3AF',
                },
                {
                    label: 'In Progress',
                    data: breakdown.map(item => item.in_progress),
                    backgroundColor: '#F59E0B',
                },
                {
                    label: 'Achieved',
                    data: breakdown.map(item => item.achieved),
                    backgroundColor: '#3B82F6',
                },
                {
                    label: 'Mastered',
                    data: breakdown.map(item => item.mastered),
                    backgroundColor: '#10B981',
                }
            ]
        };

        const options = {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Class Competency Progress Distribution'
                },
                legend: {
                    position: 'top',
                }
            },
            scales: {
                x: {
                    stacked: true,
                    title: {
                        display: true,
                        text: 'Competencies'
                    }
                },
                y: {
                    stacked: true,
                    title: {
                        display: true,
                        text: 'Number of Students'
                    }
                }
            }
        };

        return (
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <Bar data={chartData} options={options} />
            </div>
        );
    };

    const renderCompetencyProgressChart = () => {
        if (!reportData || !reportData.studentBreakdown) return null;

        const breakdown = reportData.studentBreakdown;
        
        const chartData = {
            labels: breakdown.map(item => item.studentName),
            datasets: [
                {
                    label: 'Progress Level',
                    data: breakdown.map(item => {
                        const statusMap = { 'NOT_STARTED': 1, 'IN_PROGRESS': 2, 'ACHIEVED': 3, 'MASTERED': 4 };
                        return statusMap[item.status] || 1;
                    }),
                    backgroundColor: breakdown.map(item => {
                        const colorMap = {
                            'NOT_STARTED': '#9CA3AF',
                            'IN_PROGRESS': '#F59E0B',
                            'ACHIEVED': '#3B82F6',
                            'MASTERED': '#10B981'
                        };
                        return colorMap[item.status] || '#9CA3AF';
                    }),
                }
            ]
        };

        const options = {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Student Progress on Competency'
                },
                legend: {
                    display: false,
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Students'
                    }
                },
                y: {
                    min: 0.5,
                    max: 4.5,
                    ticks: {
                        stepSize: 1,
                        callback: function(value) {
                            const statuses = ['', 'Not Started', 'In Progress', 'Achieved', 'Mastered'];
                            return statuses[value] || '';
                        }
                    },
                    title: {
                        display: true,
                        text: 'Progress Status'
                    }
                }
            }
        };

        return (
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <Bar data={chartData} options={options} />
            </div>
        );
    };

    const renderStudentProgressTable = () => {
        if (!reportData || !reportData.classesSummary) return null;

        return (
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <h3 className="text-lg font-semibold mb-4">Progress by Class</h3>
                <div className="overflow-x-auto">
                    <table className="w-full table-auto">
                        <thead>
                            <tr className="bg-gray-50">
                                <th className="px-4 py-2 text-left">Class</th>
                                <th className="px-4 py-2 text-left">Total Competencies</th>
                                <th className="px-4 py-2 text-left">Not Started</th>
                                <th className="px-4 py-2 text-left">In Progress</th>
                                <th className="px-4 py-2 text-left">Achieved</th>
                                <th className="px-4 py-2 text-left">Mastered</th>
                                <th className="px-4 py-2 text-left">Progress %</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportData.classesSummary.map((cls, index) => (
                                <tr key={index} className="border-t">
                                    <td className="px-4 py-2 font-medium">{cls.className}</td>
                                    <td className="px-4 py-2">{cls.totalCompetencies}</td>
                                    <td className="px-4 py-2">{cls.not_started}</td>
                                    <td className="px-4 py-2">{cls.in_progress}</td>
                                    <td className="px-4 py-2">{cls.achieved}</td>
                                    <td className="px-4 py-2">{cls.mastered}</td>
                                    <td className="px-4 py-2">
                                        <div className="flex items-center">
                                            <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                                                <div 
                                                    className="bg-blue-600 h-2 rounded-full" 
                                                    style={{ width: `${cls.progressPercentage}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-sm">{cls.progressPercentage.toFixed(1)}%</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderClassProgressTable = () => {
        if (!reportData || !reportData.studentsSummary) return null;

        return (
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <h3 className="text-lg font-semibold mb-4">Student Progress Summary</h3>
                <div className="overflow-x-auto">
                    <table className="w-full table-auto">
                        <thead>
                            <tr className="bg-gray-50">
                                <th className="px-4 py-2 text-left">Student</th>
                                <th className="px-4 py-2 text-left">Total Competencies</th>
                                <th className="px-4 py-2 text-left">Not Started</th>
                                <th className="px-4 py-2 text-left">In Progress</th>
                                <th className="px-4 py-2 text-left">Achieved</th>
                                <th className="px-4 py-2 text-left">Mastered</th>
                                <th className="px-4 py-2 text-left">Progress %</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportData.studentsSummary.map((student, index) => (
                                <tr key={index} className="border-t">
                                    <td className="px-4 py-2 font-medium">{student.studentName}</td>
                                    <td className="px-4 py-2">{student.totalCompetencies}</td>
                                    <td className="px-4 py-2">{student.not_started}</td>
                                    <td className="px-4 py-2">{student.in_progress}</td>
                                    <td className="px-4 py-2">{student.achieved}</td>
                                    <td className="px-4 py-2">{student.mastered}</td>
                                    <td className="px-4 py-2">
                                        <div className="flex items-center">
                                            <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                                                <div 
                                                    className="bg-blue-600 h-2 rounded-full" 
                                                    style={{ width: `${student.progressPercentage}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-sm">{student.progressPercentage.toFixed(1)}%</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderCompetencyProgressTable = () => {
        if (!reportData || !reportData.assignmentBreakdown) return null;

        return (
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <h3 className="text-lg font-semibold mb-4">Progress by Assignment</h3>
                <div className="overflow-x-auto">
                    <table className="w-full table-auto">
                        <thead>
                            <tr className="bg-gray-50">
                                <th className="px-4 py-2 text-left">Assignment</th>
                                <th className="px-4 py-2 text-left">Class</th>
                                <th className="px-4 py-2 text-left">Total Students</th>
                                <th className="px-4 py-2 text-left">Not Started</th>
                                <th className="px-4 py-2 text-left">In Progress</th>
                                <th className="px-4 py-2 text-left">Achieved</th>
                                <th className="px-4 py-2 text-left">Mastered</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportData.assignmentBreakdown.map((assignment, index) => (
                                <tr key={index} className="border-t">
                                    <td className="px-4 py-2 font-medium">{assignment.assignmentTitle}</td>
                                    <td className="px-4 py-2">{assignment.className}</td>
                                    <td className="px-4 py-2">{assignment.totalStudents}</td>
                                    <td className="px-4 py-2">{assignment.not_started}</td>
                                    <td className="px-4 py-2">{assignment.in_progress}</td>
                                    <td className="px-4 py-2">{assignment.achieved}</td>
                                    <td className="px-4 py-2">{assignment.mastered}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const exportToCSV = () => {
        if (!reportData) return;

        let csvContent = '';
        let filename = '';

        switch (reportType) {
            case 'student':
                filename = `student_progress_${selectedStudent}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
                csvContent = 'Class,Competency,Status,Last Updated,Feedback\n';
                if (reportData.timeline) {
                    reportData.timeline.forEach(item => {
                        csvContent += `"${item.className}","${item.competencyName}","${formatStatus(item.status)}","${format(new Date(item.updated_at), 'yyyy-MM-dd HH:mm')}","${item.feedback || ''}"\n`;
                    });
                }
                break;
            case 'class':
                filename = `class_progress_${selectedClass}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
                csvContent = 'Student,Total Competencies,Not Started,In Progress,Achieved,Mastered,Progress %\n';
                if (reportData.studentsSummary) {
                    reportData.studentsSummary.forEach(student => {
                        csvContent += `"${student.studentName}",${student.totalCompetencies},${student.not_started},${student.in_progress},${student.achieved},${student.mastered},${student.progressPercentage.toFixed(1)}\n`;
                    });
                }
                break;
            case 'competency':
                filename = `competency_progress_${selectedCompetency}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
                csvContent = 'Student,Status,Last Updated,Assignment,Class\n';
                if (reportData.studentBreakdown) {
                    reportData.studentBreakdown.forEach(student => {
                        csvContent += `"${student.studentName}","${formatStatus(student.status)}","${format(new Date(student.updated_at), 'yyyy-MM-dd HH:mm')}","${student.assignmentTitle}","${student.className}"\n`;
                    });
                }
                break;
        }

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Reports</h1>

            {/* Report Type Selection */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <h2 className="text-xl font-semibold mb-4">Generate Report</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Report Type
                        </label>
                        <select
                            value={reportType}
                            onChange={(e) => setReportType(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="student">Student Progress</option>
                            <option value="class">Class Progress</option>
                            <option value="competency">Competency Progress</option>
                        </select>
                    </div>

                    {reportType === 'student' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Student
                            </label>
                            <select
                                value={selectedStudent}
                                onChange={(e) => setSelectedStudent(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="">Select a student</option>
                                {students.map(student => (
                                    <option key={student.id} value={student.id}>
                                        {student.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {reportType === 'class' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Class
                            </label>
                            <select
                                value={selectedClass}
                                onChange={(e) => setSelectedClass(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="">Select a class</option>
                                {classes.map(cls => (
                                    <option key={cls.id} value={cls.id}>
                                        {cls.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {reportType === 'competency' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Competency
                            </label>
                            <select
                                value={selectedCompetency}
                                onChange={(e) => setSelectedCompetency(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="">Select a competency</option>
                                {competencies.map(competency => (
                                    <option key={competency.id} value={competency.id}>
                                        {competency.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={generateReport}
                        disabled={loading}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md disabled:opacity-50"
                    >
                        {loading ? 'Generating...' : 'Generate Report'}
                    </button>

                    {reportData && (
                        <button
                            onClick={exportToCSV}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
                        >
                            Export to CSV
                        </button>
                    )}
                </div>

                {error && (
                    <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                        {error}
                    </div>
                )}
            </div>

            {/* Report Results */}
            {reportData && (
                <div>
                    {reportType === 'student' && (
                        <>
                            <div className="mb-6">
                                <h2 className="text-2xl font-semibold mb-2">
                                    Progress Report for {students.find(s => s.id === parseInt(selectedStudent))?.name}
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                    <div className="bg-white p-4 rounded-lg shadow-md text-center">
                                        <h3 className="text-lg font-semibold text-gray-600">Total Competencies</h3>
                                        <p className="text-3xl font-bold text-indigo-600">{reportData.summary?.totalCompetencies || 0}</p>
                                    </div>
                                    <div className="bg-white p-4 rounded-lg shadow-md text-center">
                                        <h3 className="text-lg font-semibold text-gray-600">In Progress</h3>
                                        <p className="text-3xl font-bold text-yellow-600">{reportData.summary?.in_progress || 0}</p>
                                    </div>
                                    <div className="bg-white p-4 rounded-lg shadow-md text-center">
                                        <h3 className="text-lg font-semibold text-gray-600">Achieved</h3>
                                        <p className="text-3xl font-bold text-blue-600">{reportData.summary?.achieved || 0}</p>
                                    </div>
                                    <div className="bg-white p-4 rounded-lg shadow-md text-center">
                                        <h3 className="text-lg font-semibold text-gray-600">Mastered</h3>
                                        <p className="text-3xl font-bold text-green-600">{reportData.summary?.mastered || 0}</p>
                                    </div>
                                </div>
                            </div>
                            {renderStudentProgressChart()}
                            {renderStudentProgressTable()}
                        </>
                    )}

                    {reportType === 'class' && (
                        <>
                            <div className="mb-6">
                                <h2 className="text-2xl font-semibold mb-2">
                                    Class Progress Report: {classes.find(c => c.id === parseInt(selectedClass))?.name}
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                    <div className="bg-white p-4 rounded-lg shadow-md text-center">
                                        <h3 className="text-lg font-semibold text-gray-600">Total Students</h3>
                                        <p className="text-3xl font-bold text-indigo-600">{reportData.summary?.totalStudents || 0}</p>
                                    </div>
                                    <div className="bg-white p-4 rounded-lg shadow-md text-center">
                                        <h3 className="text-lg font-semibold text-gray-600">Total Competencies</h3>
                                        <p className="text-3xl font-bold text-gray-600">{reportData.summary?.totalCompetencies || 0}</p>
                                    </div>
                                    <div className="bg-white p-4 rounded-lg shadow-md text-center">
                                        <h3 className="text-lg font-semibold text-gray-600">Average Progress</h3>
                                        <p className="text-3xl font-bold text-blue-600">
                                            {reportData.summary?.averageProgress ? `${reportData.summary.averageProgress.toFixed(1)}%` : '0%'}
                                        </p>
                                    </div>
                                    <div className="bg-white p-4 rounded-lg shadow-md text-center">
                                        <h3 className="text-lg font-semibold text-gray-600">Assignments</h3>
                                        <p className="text-3xl font-bold text-green-600">{reportData.summary?.totalAssignments || 0}</p>
                                    </div>
                                </div>
                            </div>
                            {renderClassProgressChart()}
                            {renderClassProgressTable()}
                        </>
                    )}

                    {reportType === 'competency' && (
                        <>
                            <div className="mb-6">
                                <h2 className="text-2xl font-semibold mb-2">
                                    Competency Progress Report: {competencies.find(c => c.id === parseInt(selectedCompetency))?.name}
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                    <div className="bg-white p-4 rounded-lg shadow-md text-center">
                                        <h3 className="text-lg font-semibold text-gray-600">Total Students</h3>
                                        <p className="text-3xl font-bold text-indigo-600">{reportData.summary?.totalStudents || 0}</p>
                                    </div>
                                    <div className="bg-white p-4 rounded-lg shadow-md text-center">
                                        <h3 className="text-lg font-semibold text-gray-600">Not Started</h3>
                                        <p className="text-3xl font-bold text-gray-600">{reportData.summary?.not_started || 0}</p>
                                    </div>
                                    <div className="bg-white p-4 rounded-lg shadow-md text-center">
                                        <h3 className="text-lg font-semibold text-gray-600">In Progress</h3>
                                        <p className="text-3xl font-bold text-yellow-600">{reportData.summary?.in_progress || 0}</p>
                                    </div>
                                    <div className="bg-white p-4 rounded-lg shadow-md text-center">
                                        <h3 className="text-lg font-semibold text-gray-600">Achieved/Mastered</h3>
                                        <p className="text-3xl font-bold text-green-600">
                                            {(reportData.summary?.achieved || 0) + (reportData.summary?.mastered || 0)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            {renderCompetencyProgressChart()}
                            {renderCompetencyProgressTable()}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default Reports;
