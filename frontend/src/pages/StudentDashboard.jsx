import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Link } from 'react-router-dom';
import { FileText, TrendingUp } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function StudentDashboard() {
    const { user, apiClient } = useAuth();
    const [classes, setClasses] = useState([]);
    const [competencyData, setCompetencyData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

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

    if (loading) return (
        <div className="p-8 flex justify-center items-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">Loading dashboard...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="p-8">
            <div className="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 px-4 py-3 rounded">
                {error}
            </div>
        </div>
    );

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome, {user.name}!</h1>
                <div className="flex gap-3">
                    <Link
                        to="/mastery-transcript"
                        className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
                    >
                        <FileText className="h-5 w-5" />
                        My Transcript
                    </Link>
                    <Link
                        to="/progress"
                        className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                    >
                        <TrendingUp className="h-5 w-5" />
                        View My Progress
                    </Link>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2">
                    <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">My Classes</h2>
                    {classes.length === 0 ? (
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center">
                            <p className="text-gray-500 dark:text-gray-400">You are not enrolled in any classes yet.</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {classes.map(cls => (
                                <Link
                                    key={cls.id}
                                    to={`/student/classes/${cls.id}`}
                                    className="block bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:bg-indigo-50 dark:hover:bg-gray-700 transition border border-indigo-100 dark:border-gray-600"
                                >
                                    <h3 className="text-xl font-bold text-indigo-700 dark:text-indigo-400">{cls.name}</h3>
                                    <div className="text-gray-600 dark:text-gray-400 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: cls.description || '<p class="text-gray-500 dark:text-gray-400 italic">No description</p>' }} />
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Teacher: {cls.teacher?.name || 'Unknown'}</p>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
                <div>
                    <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Competency Overview</h2>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
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