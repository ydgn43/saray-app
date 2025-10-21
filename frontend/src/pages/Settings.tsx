// src/pages/Settings.tsx
import React, { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import UserManagement from './UserManagement';
import Layout from '../components/Layout';
import CustomManagement from './CustomManagement';

const TABS = [
    { key: 'users', label: 'Kullanıcı Yönetimi', adminOnly: true },
    { key: 'custom', label: 'Sezon ve Program Yönetimi', adminOnly: true },
];

const Settings = () => {
    const { user } = useAuth();
    const [tab, setTab] = useState('users');

    return (
        <div className="container py-4" style={{ maxWidth: 800 }}>
            <h2 className="mb-4">Ayarlar</h2>
            {/* Tabs */}
            <ul className="nav nav-tabs mb-4">
                {TABS.map(t =>
                    (!t.adminOnly || user?.role === 'admin') && (
                        <li className="nav-item" key={t.key}>
                            <button
                                className={`nav-link${tab === t.key ? ' active' : ''}`}
                                onClick={() => setTab(t.key)}
                            >
                                {t.label}
                            </button>
                        </li>
                    )
                )}
            </ul>
            {/* Tab content */}
            <div>
                {tab === 'users' && user?.role === 'admin' && <UserManagement />}
                {tab === 'custom' && user?.role === 'admin' && <CustomManagement />}
            </div>
        </div>
    );
};

export default Settings;
