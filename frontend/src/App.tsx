import React from 'react';
import { BrowserRouter as Router, Routes, Route, } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import PrivateRoute from './auth/PrivateRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
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
          <Route path="/signup" element={<Signup />} />
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
                <Layout>
                  <PageTransition>
                    <Home />
                  </PageTransition>
                </Layout>
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
        </Routes>

      </Router>
    </AuthProvider>
  );
}

export default App;