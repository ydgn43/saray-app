import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

/**
 * Dashboard component that redirects users to appropriate page based on role
 */
const Dashboard: React.FC = () => {
    const { user } = useAuth();

    // Redirect based on role
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Super-admin goes to Super Admin Dashboard
    if (user.role === 'super-admin') {
        return <Navigate to="/super-admin" replace />;
    }

    // Admin, hoca, yoklamaci go to Statistics
    if (user.role === 'admin' || user.role === 'hoca' || user.role === 'yoklamaci') {
        return <Navigate to="/statistics" replace />;
    }

    // Talebe (students) go to Student Portal
    if (user.role === 'talebe') {
        return <Navigate to="/student-portal" replace />;
    }

    // Fallback (shouldn't happen)
    return <Navigate to="/statistics" replace />;
};

export default Dashboard;
