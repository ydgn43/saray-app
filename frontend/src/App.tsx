import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import PrivateRoute from './auth/PrivateRoute';
import Login from './pages/Login';
import Attendance from './pages/Attendance';
import Statistics from './pages/Statistics';
import Settings from './pages/Settings';
import Layout from './components/Layout';

function RequireRole({ roles, children }: { roles: string[]; children: React.ReactElement }) {
  const { user } = useAuth();
  if (!user || !roles.includes(user.role)) {
    return <div className="alert alert-danger">Erişiminiz yok</div>;
  }
  return children;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/attendance"
            element={
              <PrivateRoute>
                <Layout>
                  <Attendance />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/statistics"
            element={
              <PrivateRoute>
                <Layout>
                  <Statistics />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <PrivateRoute>
                <RequireRole roles={['admin']}>
                  <Layout>
                    <Settings />
                  </Layout>
                </RequireRole>
              </PrivateRoute>
            }
          />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout>
                  <Attendance />
                </Layout>
              </PrivateRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;