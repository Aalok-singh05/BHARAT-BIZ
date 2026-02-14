import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

const ProtectedRoute = () => {
    // Basic check: if token exists. AuthContext validates it on mount.
    const { token, loading } = useAuth();

    if (loading) {
        return <div className="min-h-screen bg-[#0a0808] flex items-center justify-center text-[#ff9f43]">Loading session...</div>;
    }

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
