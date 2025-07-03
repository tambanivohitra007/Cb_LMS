import React, { useState, createContext, useContext, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import LoginPage from './pages/LoginPage';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import ClassManagement from './pages/ClassManagement';
import AssignmentManagement from './pages/AssignmentManagement';
import StudentManagement from './pages/StudentManagement';
import UserManagement from './pages/UserManagement';
import Trash from './pages/Trash';
import Profile from './pages/Profile';

const AuthContext = createContext(null);

const apiClient = axios.create({
    baseURL: 'http://localhost:5000/api',
});

apiClient.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, error => {
    return Promise.reject(error);
});

// Response interceptor to handle new API response format and errors
apiClient.interceptors.response.use(
    response => {
        // If the response has a success field, return the data directly
        if (response.data && typeof response.data.success !== 'undefined') {
            if (response.data.success) {
                return { ...response, data: response.data.data || response.data };
            } else {
                // Handle API errors with success: false
                const error = new Error(response.data.message || 'An error occurred');
                error.response = response;
                return Promise.reject(error);
            }
        }
        return response;
    },
    error => {
        // Handle authentication errors
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        
        // Extract error message from the new API format
        if (error.response?.data?.message) {
            error.message = error.response.data.message;
        } else if (error.response?.data?.errors) {
            error.message = error.response.data.errors.join(', ');
        }
        
        return Promise.reject(error);
    }
);


function App() {
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
    
    const login = (userData, token) => {
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', token);
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, apiClient }}>
            <Router>
                <div className="min-h-screen flex flex-col">
                    {user && <Navbar />}
                    <main className="flex-grow">
                        <Routes>
                            <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" />} />
                            <Route path="/" element={
                                <ProtectedRoute>
                                    {user?.role === 'TEACHER' ? <TeacherDashboard /> : 
                                     user?.role === 'ADMIN' ? <UserManagement /> : 
                                     <StudentDashboard />}
                                </ProtectedRoute>
                            } />
                             <Route path="/classes" element={<ProtectedRoute role="TEACHER"><ClassManagement /></ProtectedRoute>} />
                             <Route path="/classes/:classId/assignments" element={<ProtectedRoute role="TEACHER"><AssignmentManagement /></ProtectedRoute>} />
                             <Route path="/classes/:classId/students" element={<ProtectedRoute role="TEACHER"><StudentManagement /></ProtectedRoute>} />
                             <Route path="/users" element={<ProtectedRoute role="ADMIN"><UserManagement /></ProtectedRoute>} />
                             <Route path="/trash" element={<ProtectedRoute role="TEACHER"><Trash /></ProtectedRoute>} />
                             <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                            <Route path="*" element={<Navigate to="/" />} />
                        </Routes>
                    </main>
                </div>
            </Router>
        </AuthContext.Provider>
    );
}

function Navbar() {
    const { user, logout } = useAuth();
    const location = useLocation();

    const navLinks = {
        TEACHER: [
            { path: '/', name: 'Dashboard' },
            { path: '/classes', name: 'Classes' },
            { path: '/trash', name: 'Trash' },
        ],
        STUDENT: [
            { path: '/', name: 'Dashboard' },
        ],
        ADMIN: [
            { path: '/', name: 'User Management' },
            { path: '/users', name: 'Users' },
        ],
    };

    return (
        <nav className="bg-white shadow-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <span className="font-bold text-xl text-indigo-600">CBLMS</span>
                        <div className="hidden md:block">
                            <div className="ml-10 flex items-baseline space-x-4">
                                {navLinks[user.role].map(link => (
                                    <Link key={link.path} to={link.path}
                                        className={`${location.pathname === link.path ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'} px-3 py-2 rounded-md text-sm font-medium`}
                                    >{link.name}</Link>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center">
                         <Link to="/profile" className="flex items-center mr-4">
                             <img 
                                src={user.photo || 'https://i.pravatar.cc/150'} 
                                alt="profile" 
                                className="w-8 h-8 rounded-full mr-2"
                                onError={(e) => {
                                    e.target.src = 'https://i.pravatar.cc/150';
                                }}
                             />
                             <span className="text-sm font-medium text-gray-700">{user.name}</span>
                         </Link>
                        <button onClick={logout} className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-md text-sm font-medium">
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}


const ProtectedRoute = ({ children, role }) => {
    const { user } = useAuth();
    if (!user) {
        return <Navigate to="/login" />;
    }
    if (role && user.role !== role) {
        return <Navigate to="/" />;
    }
    return children;
};

export const useAuth = () => useContext(AuthContext);
export default App;