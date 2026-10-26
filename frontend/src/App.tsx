import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { SocketProvider } from './websocket/SocketProvider';
import PrivateRoute from './auth/PrivateRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Attendance from './pages/Attendance';
import Statistics from './pages/Statistics';
import Talebeler from './pages/Talebeler';
import Layout from './components/Layout';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import PageTransition from './components/PageTransition';
import Home from './pages/Home';
import IzinliTalebeler from './pages/IzinliTalebeler';
import ReferenceCodeManagement from './pages/ReferenceCodeManagement';
import StudentPortal from './pages/StudentPortal';
import ActivityLogs from './pages/ActivityLogs';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import ExitTracking from './pages/ExitTracking';


function RequireRole({ roles, children }: { roles: string[]; children: React.ReactElement }) {
  const { user } = useAuth();
  if (!user || !roles.includes(user.role)) {
    return <div className="alert alert-danger">Erişiminiz yok</div>;
  }
  return children;
}

// Component to handle role-based home page redirect
function HomeRedirect() {
  const { user } = useAuth();

  if (user?.role === 'super-admin') {
    return <Navigate to="/super-admin" replace />;
  }

  return (
    <Layout>
      <PageTransition>
        <Home />
      </PageTransition>
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route
              path="/attendance"
              element={
                <PrivateRoute>
                  <Layout>
                    <PageTransition>
                      <Attendance />
                    </PageTransition>
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/statistics"
              element={
                <PrivateRoute>
                  <Layout>
                    <PageTransition>
                      <Statistics />
                    </PageTransition>
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/talebeler"
              element={
                <PrivateRoute>
                  <RequireRole roles={['admin']}>
                    <Layout>
                      <PageTransition>
                        <Talebeler />
                      </PageTransition>
                    </Layout>
                  </RequireRole>
                </PrivateRoute>
              }
            />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <HomeRedirect />
                </PrivateRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <Layout>
                    <PageTransition>
                      <Profile />
                    </PageTransition>
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
                      <PageTransition>
                        <Settings />
                      </PageTransition>
                    </Layout>
                  </RequireRole>
                </PrivateRoute>
              }
            />
            <Route
              path="/activity-logs"
              element={
                <PrivateRoute>
                  <RequireRole roles={['admin']}>
                    <Layout>
                      <PageTransition>
                        <ActivityLogs />
                      </PageTransition>
                    </Layout>
                  </RequireRole>
                </PrivateRoute>
              }
            />
            <Route
              path="/izinli-talebeler"
              element={
                <PrivateRoute>
                  <Layout>
                    <PageTransition>
                      <IzinliTalebeler />
                    </PageTransition>
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/exit-tracking"
              element={
                <PrivateRoute>
                  <RequireRole roles={['admin', 'hoca', 'yoklamaci', 'super-admin']}>
                    <Layout>
                      <PageTransition>
                        <ExitTracking />
                      </PageTransition>
                    </Layout>
                  </RequireRole>
                </PrivateRoute>
              }
            />
            <Route
              path="/reference-codes"
              element={
                <PrivateRoute>
                  <RequireRole roles={['admin']}>
                    <Layout>
                      <PageTransition>
                        <ReferenceCodeManagement />
                      </PageTransition>
                    </Layout>
                  </RequireRole>
                </PrivateRoute>
              }
            />
            <Route
              path="/student-portal"
              element={
                <PrivateRoute>
                  <RequireRole roles={['talebe']}>
                    <Layout>
                      <PageTransition>
                        <StudentPortal />
                      </PageTransition>
                    </Layout>
                  </RequireRole>
                </PrivateRoute>
              }
            />
            <Route
              path="/super-admin"
              element={
                <PrivateRoute>
                  <RequireRole roles={['super-admin']}>
                    <Layout>
                      <PageTransition>
                        <SuperAdminDashboard />
                      </PageTransition>
                    </Layout>
                  </RequireRole>
                </PrivateRoute>
              }
            />
          </Routes>

        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;