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
    const [loading, setLoading] = useState(false);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);
        try {
            const res = await fetch('http://localhost:3001/user/me', {
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
                setPassword('');
            } else {
                const data = await res.json().catch(() => ({}));
                setError(data.message || 'Bir hata oluştu.');
            }
        } catch {
            setError('Bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container d-flex justify-content-center align-items-center" style={{ minHeight: '70vh' }}>
            <div className="card shadow-sm p-4" style={{ maxWidth: 420, width: '100%' }}>
                <h2 className="mb-4 text-center" style={{ color: '#0d6efd', fontWeight: 700, letterSpacing: 1 }}>Hesap Ayarları</h2>
                {success && <div className="alert alert-success py-2">{success}</div>}
                {error && <div className="alert alert-danger py-2">{error}</div>}
                <form onSubmit={handleSave} autoComplete="off">
                    <div className="mb-3">
                        <label className="form-label fw-semibold">Kullanıcı Adı</label>
                        <input
                            type="text"
                            className="form-control"
                            value={username}
                            disabled={!edit || loading}
                            onChange={e => setUsername(e.target.value)}
                            autoFocus={edit}
                        />
                    </div>
                    <div className="mb-3">
                        <label className="form-label fw-semibold">Yeni Şifre</label>
                        <input
                            type="password"
                            className="form-control"
                            value={password}
                            disabled={!edit || loading}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="Değiştirmek istemiyorsanız boş bırakın"
                        />
                        <div className="form-text">
                            Şifreyi değiştirmek istemiyorsanız boş bırakın.
                        </div>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mt-4">
                        {!edit ? (
                            <button className="btn btn-primary w-100" type="button" onClick={() => setEdit(true)}>
                                Bilgilerimi Güncelle
                            </button>
                        ) : (
                            <>
                                <button className="btn btn-success me-2 w-50" type="submit" disabled={loading}>
                                    {loading ? (
                                        <span>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                            Kaydediliyor...
                                        </span>
                                    ) : 'Kaydet'}
                                </button>
                                <button
                                    className="btn btn-secondary w-50"
                                    type="button"
                                    onClick={() => { setEdit(false); setUsername(user?.username || ''); setPassword(''); setError(''); setSuccess(''); }}
                                    disabled={loading}
                                >
                                    İptal
                                </button>
                            </>
                        )}
                    </div>
                </form>
                <div className="mt-4 text-center text-muted" style={{ fontSize: 13 }}>
                    <i className="bi bi-person-circle" style={{ fontSize: 32, color: '#0d6efd' }}></i>
                    <div className="mt-2">
                        <span className="badge bg-info text-dark">{user?.role?.toUpperCase()}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AccountSettings;
