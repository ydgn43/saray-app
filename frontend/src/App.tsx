import React from 'react';
import { BrowserRouter as Router, Routes, Route, } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import PrivateRoute from './auth/PrivateRoute';
import Login from './pages/Login';
import Attendance from './pages/Attendance';
import Statistics from './pages/Statistics';
import Talebeler from './pages/Talebeler';
import Layout from './components/Layout';
import AccountSettings from './pages/AccountSettings';
import Settings from './pages/Settings';
import PageTransition from './components/PageTransition';
import Home from './pages/Home';


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
            path="/account"
            element={
              <PrivateRoute>
                <Layout>
                  <PageTransition>
                    <AccountSettings />
                  </PageTransition>
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <PrivateRoute>
                <Layout>
                  <PageTransition>
                    <Settings />
                  </PageTransition>
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