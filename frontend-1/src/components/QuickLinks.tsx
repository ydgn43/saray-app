// filepath: /Users/yusuf/Documents/GitHub/saray-app/frontend/src/pages/Dashboard.tsx
import React from 'react';
import Layout from '../components/Layout';
import { Link } from 'react-router-dom';

const Dashboard = () => {
    return (
        <Layout>
            <div className="container py-4">
                <h1 className="text-center">Dashboard</h1>
                <p className="text-center">Welcome to the Efendim App Dashboard!</p>

                <div className="row mt-4">
                    <div className="col-md-4">
                        <div className="card text-white bg-primary mb-3">
                            <div className="card-header">Attendance Statistics</div>
                            <div className="card-body">
                                <h5 className="card-title">View Attendance</h5>
                                <p className="card-text">Check the attendance statistics for all classes.</p>
                                <Link to="/attendance" className="btn btn-light">Go to Attendance</Link>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="card text-white bg-success mb-3">
                            <div className="card-header">Student Management</div>
                            <div className="card-body">
                                <h5 className="card-title">Manage Students</h5>
                                <p className="card-text">Add, edit, or remove students from the system.</p>
                                <Link to="/talebeler" className="btn btn-light">Go to Students</Link>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="card text-white bg-warning mb-3">
                            <div className="card-header">Settings</div>
                            <div className="card-body">
                                <h5 className="card-title">Application Settings</h5>
                                <p className="card-text">Configure application settings and user roles.</p>
                                <Link to="/settings" className="btn btn-light">Go to Settings</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Dashboard;