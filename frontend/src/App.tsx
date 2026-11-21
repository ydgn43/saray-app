import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { SocketProvider } from './websocket/SocketProvider';
import PrivateRoute from './auth/PrivateRoute';
import Login from './pages/Login';
import Layout from './components/Layout';
import PageTransition from './components/PageTransition';

// Pages are downloaded when first opened, so the first screen loads fast.
const Signup = React.lazy(() => import('./pages/Signup'));
const ForgotPassword = React.lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = React.lazy(() => import('./pages/ResetPassword'));
const Attendance = React.lazy(() => import('./pages/Attendance'));
const Statistics = React.lazy(() => import('./pages/Statistics'));
const Talebeler = React.lazy(() => import('./pages/Talebeler'));
const Profile = React.lazy(() => import('./pages/Profile'));
const Settings = React.lazy(() => import('./pages/Settings'));
const Home = React.lazy(() => import('./pages/Home'));
const IzinliTalebeler = React.lazy(() => import('./pages/IzinliTalebeler'));
const ReferenceCodeManagement = React.lazy(() => import('./pages/ReferenceCodeManagement'));
const StudentPortal = React.lazy(() => import('./pages/StudentPortal'));
const ActivityLogs = React.lazy(() => import('./pages/ActivityLogs'));
const SuperAdminDashboard = React.lazy(() => import('./pages/SuperAdminDashboard'));
const ExitTracking = React.lazy(() => import('./pages/ExitTracking'));

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
          <Suspense
            fallback={
              <div className="d-flex justify-content-center py-5">
                <div className="spinner-border" role="status" aria-hidden="true"></div>
              </div>
            }
          >
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
          </Suspense>

        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;