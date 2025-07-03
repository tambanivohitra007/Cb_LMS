import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { Link } from 'react-router-dom';

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
            <h1 className="text-3xl font-bold mb-6">Teacher Dashboard</h1>
            <p className="text-xl text-gray-600 mb-8">Welcome back, {user.name}!</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-md flex items-center">
                    <div className="bg-indigo-500 text-white p-4 rounded-full">
                         {/* Placeholder Icon */}
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                    </div>
                    <div className="ml-4">
                        <p className="text-gray-500">Total Students</p>
                        <p className="text-2xl font-bold">{stats.students}</p>
                    </div>
                </div>
                 <div className="bg-white p-6 rounded-lg shadow-md flex items-center">
                    <div className="bg-green-500 text-white p-4 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" /></svg>
                    </div>
                    <div className="ml-4">
                        <p className="text-gray-500">Active Classes</p>
                        <p className="text-2xl font-bold">{stats.classes}</p>
                    </div>
                </div>
                 <div className="bg-white p-6 rounded-lg shadow-md flex items-center">
                    <div className="bg-yellow-500 text-white p-4 rounded-full">
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 20.417V21h18v-.583a12.02 12.02 0 00-4.382-8.433z" /></svg>
                    </div>
                    <div className="ml-4">
                        <p className="text-gray-500">Total Competencies</p>
                        <p className="text-2xl font-bold">{stats.competencies}</p>
                    </div>
                </div>
            </div>

            <div className="mt-10 bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-semibold mb-4">Quick Actions</h2>
                <div className="flex space-x-4">
                     <Link 
                        to="/classes" 
                        className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded"
                     >
                        Manage Classes
                     </Link>
                     {/* Add more quick actions as needed */}
                </div>
            </div>
        </div>
    );
}

export default TeacherDashboard;