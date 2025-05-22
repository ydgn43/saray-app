import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function PrivateRoute({ children }: { children: React.ReactElement }) {
    const { user, loading } = useAuth();
    if (loading) return <div>Loading...</div>; // Or a spinner
    if (!user) return <Navigate to="/login" replace />;
    return children;
}
