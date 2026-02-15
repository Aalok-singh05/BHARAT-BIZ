import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    // Configure Axios defaults
    if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
        delete axios.defaults.headers.common['Authorization'];
    }

    useEffect(() => {
        // Check if token exists and is valid (simple check)
        if (token) {
            // Ideally verify with backend, but for now trust token presence
            // We could store username in localStorage too or decode token
            // For MVP, just assume logged in if token exists
            setUser({ username: 'admin' }); // Placeholder user
        }
        setLoading(false);
    }, [token]);

    const login = async (username, password) => {
        try {
            const formData = new FormData();
            formData.append('username', username);
            formData.append('password', password);

            const response = await axios.post('/api/auth/login', formData);
            const { access_token } = response.data;

            localStorage.setItem('token', access_token);
            setToken(access_token);
            setUser({ username });
            return { success: true };
        } catch (error) {
            console.error("Login failed:", error);
            return {
                success: false,
                message: error.response?.data?.detail || "Login failed. Please check credentials."
            };
        }
    };

    const bypassLogin = async () => {
        try {
            const response = await axios.post('/api/auth/bypass');
            const { access_token } = response.data;

            localStorage.setItem('token', access_token);
            setToken(access_token);
            setUser({ username: 'admin (dev)' });
            return { success: true };
        } catch (error) {
            console.error("Bypass failed:", error);
            return { success: false, message: "Bypass failed." };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        delete axios.defaults.headers.common['Authorization'];
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, bypassLogin, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
