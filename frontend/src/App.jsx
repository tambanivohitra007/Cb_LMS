import React, { useState, createContext, useContext, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { 
    LayoutDashboard, 
    BookOpen, 
    Users, 
    BarChart3, 
    FileText, 
    Trash2, 
    TrendingUp, 
    GraduationCap,
    UserCog,
    ChevronLeft,
    LogOut
} from 'lucide-react';
import LoginPage from './pages/LoginPage';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import ClassManagement from './pages/ClassManagement';
import AssignmentManagement from './pages/AssignmentManagement';
import StudentManagement from './pages/StudentManagement';
import UserManagement from './pages/UserManagement';
import CohortManagement from './pages/CohortManagement';
import Trash from './pages/Trash';
import Profile from './pages/Profile';
import StudentClassPage from './pages/StudentClassPage';
import AssignmentSubmissionsReview from './pages/AssignmentSubmissionsReview';
import StudentProgressPage from './pages/StudentProgressPage';
import Reports from './pages/Reports';
import MasteryTranscript from './pages/MasteryTranscript';

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
                <div className="min-h-screen flex">
                    {user && <Sidebar />}
                    <div className="flex-1 flex flex-col">
                        <main className="flex-grow bg-gray-50">
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
                                 <Route path="/cohorts" element={<ProtectedRoute role="TEACHER"><CohortManagement /></ProtectedRoute>} />
                                 <Route path="/reports" element={<ProtectedRoute role="TEACHER"><Reports /></ProtectedRoute>} />
                                 <Route path="/mastery-transcript" element={<ProtectedRoute><MasteryTranscript /></ProtectedRoute>} />
                                 <Route path="/mastery-transcript/:studentId" element={<ProtectedRoute role="TEACHER"><MasteryTranscript /></ProtectedRoute>} />
                                 <Route path="/users" element={<ProtectedRoute role="ADMIN"><UserManagement /></ProtectedRoute>} />
                                 <Route path="/trash" element={<ProtectedRoute role="TEACHER"><Trash /></ProtectedRoute>} />
                                 <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                                 <Route path="/progress" element={<ProtectedRoute role="STUDENT"><StudentProgressPage /></ProtectedRoute>} />
                                 <Route path="/progress/:classId" element={<ProtectedRoute role="STUDENT"><StudentProgressPage /></ProtectedRoute>} />
                                 <Route path="/student/classes/:classId" element={<StudentClassPage />} />
                                 <Route path="/teacher/assignments/:assignmentId/submissions" element={<AssignmentSubmissionsReview />} />
                                <Route path="*" element={<Navigate to="/" />} />
                            </Routes>
                        </main>
                    </div>
                </div>
            </Router>
        </AuthContext.Provider>
    );
}

function Sidebar() {
    const { user, logout } = useAuth();
    const location = useLocation();
    const [isCollapsed, setIsCollapsed] = useState(false);

    const navLinks = {
        TEACHER: [
            { path: '/', name: 'Dashboard', icon: LayoutDashboard },
            { path: '/classes', name: 'Classes', icon: BookOpen },
            { path: '/cohorts', name: 'Cohorts', icon: Users },
            { path: '/reports', name: 'Reports', icon: BarChart3 },
            { path: '/mastery-transcript', name: 'Transcripts', icon: FileText },
            { path: '/trash', name: 'Trash', icon: Trash2 },
        ],
        STUDENT: [
            { path: '/', name: 'Dashboard', icon: LayoutDashboard },
            { path: '/progress', name: 'My Progress', icon: TrendingUp },
            { path: '/mastery-transcript', name: 'My Transcript', icon: GraduationCap },
        ],
        ADMIN: [
            { path: '/', name: 'User Management', icon: UserCog },
            { path: '/users', name: 'Users', icon: Users },
        ],
    };

    const roleColors = {
        TEACHER: 'from-indigo-600 to-purple-600',
        STUDENT: 'from-green-600 to-teal-600',
        ADMIN: 'from-red-600 to-pink-600'
    };

    return (
        <div className={`${isCollapsed ? 'w-16' : 'w-64'} bg-white shadow-lg transition-all duration-300 ease-in-out flex flex-col`}>
            {/* Header with Logo and Toggle */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
                {!isCollapsed && (
                    <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${roleColors[user.role]} flex items-center justify-center mr-3`}>
                            <span className="text-white font-bold text-sm">CB</span>
                        </div>
                        <span className="font-bold text-xl text-gray-800">CBLMS</span>
                    </div>
                )}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                    <ChevronLeft 
                        className={`w-5 h-5 text-gray-600 transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
                    />
                </button>
            </div>

            {/* User Profile Section */}
            <div className="p-4 border-b border-gray-200">
                <Link to="/profile" className={`flex items-center hover:bg-gray-50 rounded-lg p-2 transition-colors ${isCollapsed ? 'justify-center' : ''}`}>
                    <img 
                        src={user.photo || 'https://i.pravatar.cc/150'} 
                        alt="profile" 
                        className={`${isCollapsed ? 'w-8 h-8' : 'w-10 h-10'} rounded-full border-2 border-gray-200`}
                        onError={(e) => {
                            e.target.src = 'https://i.pravatar.cc/150';
                        }}
                    />
                    {!isCollapsed && (
                        <div className="ml-3 flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                            <p className="text-xs text-gray-500 capitalize">{user.role.toLowerCase()}</p>
                        </div>
                    )}
                </Link>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 p-4 space-y-2">
                {navLinks[user.role].map(link => {
                    const isActive = location.pathname === link.path;
                    const IconComponent = link.icon;
                    return (
                        <Link 
                            key={link.path} 
                            to={link.path}
                            className={`flex items-center px-3 py-3 rounded-lg transition-all duration-200 ${
                                isActive 
                                    ? `bg-gradient-to-r ${roleColors[user.role]} text-white shadow-md` 
                                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                            } ${isCollapsed ? 'justify-center' : ''}`}
                            title={isCollapsed ? link.name : ''}
                        >
                            <IconComponent className={`w-5 h-5 ${!isCollapsed ? 'mr-3' : ''}`} />
                            {!isCollapsed && (
                                <span className="font-medium">{link.name}</span>
                            )}
                            {!isCollapsed && isActive && (
                                <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Logout Button */}
            <div className="p-4 border-t border-gray-200">
                <button 
                    onClick={logout} 
                    className={`flex items-center w-full px-3 py-3 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors ${
                        isCollapsed ? 'justify-center' : ''
                    }`}
                    title={isCollapsed ? 'Logout' : ''}
                >
                    <LogOut className={`w-5 h-5 ${!isCollapsed ? 'mr-3' : ''}`} />
                    {!isCollapsed && <span className="font-medium">Logout</span>}
                </button>
            </div>
        </div>
    );
}

// Header component for pages
function PageHeader({ title, subtitle, actions }) {
    return (
        <div className="bg-white border-b border-gray-200">
            <div className="px-6 py-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                        {subtitle && <p className="text-gray-600 mt-1">{subtitle}</p>}
                    </div>
                    {actions && <div className="flex space-x-3">{actions}</div>}
                </div>
            </div>
        </div>
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
export { PageHeader };
export default App;