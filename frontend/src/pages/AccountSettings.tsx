// src/pages/AccountSettings.tsx

import React, { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import Layout from '../components/Layout';

const AccountSettings = () => {
    const { user } = useAuth();
    const [edit, setEdit] = useState(false);
    const [username, setUsername] = useState(user?.username || '');
    const [password, setPassword] = useState('');
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        // TODO: Call your backend API to update username/password
        try {
            const res = await fetch('http://YOUR_BACKEND/account/update', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({ username, password }),
            });
            if (res.ok) {
                setSuccess('Bilgileriniz güncellendi.');
                setEdit(false);
            } else {
                setError('Bir hata oluştu.');
            }
        } catch {
            setError('Bir hata oluştu.');
        }
    };

    return (
        <Layout>
            <div className="container" style={{ maxWidth: 400, marginTop: 40 }}>
                <h2>Hesabım</h2>
                {success && <div className="alert alert-success">{success}</div>}
                {error && <div className="alert alert-danger">{error}</div>}
                <form onSubmit={handleSave}>
                    <div className="mb-3">
                        <label className="form-label">Kullanıcı Adı</label>
                        <input
                            type="text"
                            className="form-control"
                            value={username}
                            disabled={!edit}
                            onChange={e => setUsername(e.target.value)}
                        />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Yeni Şifre</label>
                        <input
                            type="password"
                            className="form-control"
                            value={password}
                            disabled={!edit}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="Değiştirmek istemiyorsanız boş bırakın"
                        />
                    </div>
                    {!edit ? (
                        <button className="btn btn-primary" type="button" onClick={() => setEdit(true)}>
                            Bilgilerimi Güncelle
                        </button>
                    ) : (
                        <>
                            <button className="btn btn-success me-2" type="submit">Kaydet</button>
                            <button className="btn btn-secondary" type="button" onClick={() => setEdit(false)}>
                                İptal
                            </button>
                        </>
                    )}
                </form>
            </div>
        </Layout>
    );
};

export default AccountSettings;
