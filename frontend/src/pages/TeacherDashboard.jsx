import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { Link } from 'react-router-dom';
import { Users, Building, Award, BookOpen, Users2, BarChart3, FileText } from 'lucide-react';

function TeacherDashboard() {
    const { user, apiClient } = useAuth();
    const [stats, setStats] = useState({ students: 0, classes: 0, competencies: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setError('');
                // Get classes data which includes students and assignments info
                const classesRes = await apiClient.get('/classes');
                const classes = classesRes.data || [];
                
                // Calculate statistics from classes data
                const uniqueStudents = new Set();
                const competencyCount = classes.reduce((acc, cls) => {
                    // Count unique students across all classes
                    (cls.students || []).forEach(student => uniqueStudents.add(student.id));
                    
                    // Count competencies in assignments
                    return acc + (cls.assignments || []).reduce((aAcc, assign) => 
                        aAcc + (assign.competencies || []).length, 0);
                }, 0);

                setStats({
                    students: uniqueStudents.size,
                    classes: classes.length,
                    competencies: competencyCount
                });

            } catch (error) {
                console.error("Failed to fetch teacher dashboard data", error);
                setError('Failed to load dashboard data. Please try again.');
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
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
            <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Teacher Dashboard</h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">Welcome back, {user.name}!</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex items-center">
                    <div className="bg-indigo-500 text-white p-4 rounded-full">
                        <Users className="h-8 w-8" />
                    </div>
                    <div className="ml-4">
                        <p className="text-gray-500 dark:text-gray-400">Total Students</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.students}</p>
                    </div>
                </div>
                 <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex items-center">
                    <div className="bg-green-500 text-white p-4 rounded-full">
                        <Building className="h-8 w-8" />
                    </div>
                    <div className="ml-4">
                        <p className="text-gray-500 dark:text-gray-400">Active Classes</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.classes}</p>
                    </div>
                </div>
                 <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex items-center">
                    <div className="bg-yellow-500 text-white p-4 rounded-full">
                        <Award className="h-8 w-8" />
                    </div>
                    <div className="ml-4">
                        <p className="text-gray-500 dark:text-gray-400">Total Competencies</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.competencies}</p>
                    </div>
                </div>
            </div>

            <div className="mt-10 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                     <Link 
                        to="/classes" 
                        className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg text-center transition-colors flex items-center justify-center gap-2"
                     >
                        <BookOpen className="h-5 w-5" />
                        Manage Classes
                     </Link>
                     <Link 
                        to="/cohorts" 
                        className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg text-center transition-colors flex items-center justify-center gap-2"
                     >
                        <Users2 className="h-5 w-5" />
                        Manage Cohorts
                     </Link>
                     <Link 
                        to="/reports" 
                        className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-6 rounded-lg text-center transition-colors flex items-center justify-center gap-2"
                     >
                        <BarChart3 className="h-5 w-5" />
                        View Reports
                     </Link>
                     <Link 
                        to="/mastery-transcript" 
                        className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg text-center transition-colors flex items-center justify-center gap-2"
                     >
                        <FileText className="h-5 w-5" />
                        Mastery Transcripts
                     </Link>
                </div>
            </div>
        </div>
    );
}

export default TeacherDashboard;