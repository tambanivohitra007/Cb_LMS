import React, { useState } from 'react';
import { useAuth, useTheme } from '../App';
import { useNavigate } from 'react-router-dom';

function LoginPage() {
    const [email, setEmail] = useState('teacher@demo.com');
    const [password, setPassword] = useState('password');
    const [error, setError] = useState('');
    const { login, apiClient } = useAuth();
    const { isDarkMode } = useTheme();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const response = await apiClient.post('/auth/login', { email, password });
            // The interceptor now handles the response format, so we can access data directly
            login(response.data.user, response.data.token);
            navigate('/');
        } catch (err) {
            setError(err.message || 'Login failed. Please try again.');
        }
    };

    return (
        <div className={`min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 ${isDarkMode ? 'dark' : ''}`}>
            <div className="max-w-md w-full bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-6">Login to CBLMS</h2>
                {error && <p className="bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-3 rounded mb-4">{error}</p>}
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="shadow appearance-none border dark:border-gray-600 rounded w-full py-2 px-3 text-gray-700 dark:text-white bg-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            required
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="shadow appearance-none border dark:border-gray-600 rounded w-full py-2 px-3 text-gray-700 dark:text-white bg-white dark:bg-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                            required
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <button className="bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full" type="submit">
                            Sign In
                        </button>
                    </div>
                     <div className="mt-4 text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Use `teacher@demo.com` or `student@demo.com` with password `password`</p>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default LoginPage;