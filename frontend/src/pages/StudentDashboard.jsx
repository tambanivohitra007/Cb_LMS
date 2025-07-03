import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Link } from 'react-router-dom';

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
                    <h2 className="text-2xl font-semibold mb-4">My Classes</h2>
                    {classes.length === 0 ? (
                        <div className="bg-white p-6 rounded-lg shadow-md text-center">
                            <p className="text-gray-500">You are not enrolled in any classes yet.</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {classes.map(cls => (
                                <Link
                                    key={cls.id}
                                    to={`/student/classes/${cls.id}`}
                                    className="block bg-white p-6 rounded-lg shadow-md hover:bg-indigo-50 transition border border-indigo-100"
                                >
                                    <h3 className="text-xl font-bold text-indigo-700">{cls.name}</h3>
                                    <div className="text-gray-600 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: cls.description || '<p class="text-gray-500 italic">No description</p>' }} />
                                    <p className="text-sm text-gray-500 mt-2">Teacher: {cls.teacher?.name || 'Unknown'}</p>
                                </Link>
                            ))}
                        </div>
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