// src/pages/AccountSettings.tsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { FaUser, FaKey, FaEdit, FaSave, FaTimes } from 'react-icons/fa';
import { IconType } from 'react-icons';

// Fixed IconComponent with proper typing
const IconComponent = ({ icon: Icon, className }: { icon: IconType; className?: string }) => {
    const IconComponent = Icon as React.ComponentType<any>;
    return <IconComponent size={20} className={className} />;
};

interface FormState {
    username: string;
    password: string;
}

const AccountSettings = () => {
    const { user, setUser } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [formData, setFormData] = useState<FormState>({
        username: '',
        password: ''
    });

    // Sync with user data when available
    useEffect(() => {
        if (user?.username) {
            setFormData(prev => ({ ...prev, username: user.username }));
        }
    }, [user]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage(null);

        try {
<<<<<<< HEAD
            const response = await fetch('https://api.efendim.nl/user/me', {
=======
            const response = await fetch('https://api.efendim.nl
/user/me', {
>>>>>>> parent of f85c599 (changed to new api domain)
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    username: formData.username,
                    ...(formData.password && { password: formData.password })
                })
            });

            if (response.ok) {
                setMessage({ type: 'success', text: 'Bilgileriniz başarıyla güncellendi.' });
                setIsEditing(false);
                if (setUser && user) {
                    setUser({ ...user, username: formData.username });
                }
                setFormData(prev => ({ ...prev, password: '' }));
            } else {
                const error = await response.json();
                setMessage({ type: 'error', text: error.message || 'Güncelleme başarısız oldu.' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Bir hata oluştu. Lütfen tekrar deneyin.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setFormData(prev => ({
            username: user?.username || '',
            password: ''
        }));
        setMessage(null);
    };

    return (
        <div className="container py-5">
            <div className="row justify-content-center">
                <div className="col-12 col-md-8 col-lg-6">
                    <div className="card shadow-sm border-0">
                        {/* Header */}
                        <div className="card-header bg-primary text-white py-3">
                            <h4 className="mb-0 text-center">
                                <IconComponent icon={FaUser} className="me-2" />
                                Hesap Ayarları
                            </h4>
                        </div>

                        {/* Body */}
                        <div className="card-body p-4">
                            {message && (
                                <div className={`alert alert-${message.type === 'success' ? 'success' : 'danger'} alert-dismissible fade show`}>
                                    {message.text}
                                    <button type="button" className="btn-close" onClick={() => setMessage(null)}></button>
                                </div>
                            )}

                            <form onSubmit={handleSubmit}>
                                {/* Username Field */}
                                <div className="mb-4">
                                    <label className="form-label fw-bold">
                                        <IconComponent icon={FaUser} className="me-2 text-primary" />
                                        Kullanıcı Adı
                                    </label>
                                    <input
                                        type="text"
                                        name="username"
                                        className="form-control form-control-lg"
                                        value={formData.username}
                                        onChange={handleInputChange}
                                        disabled={!isEditing || isLoading}
                                        required
                                    />
                                </div>

                                {/* Password Field */}
                                <div className="mb-4">
                                    <label className="form-label fw-bold">
                                        <IconComponent icon={FaKey} className="me-2 text-primary" />
                                        Yeni Şifre
                                    </label>
                                    <input
                                        type="password"
                                        name="password"
                                        className="form-control form-control-lg"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        disabled={!isEditing || isLoading}
                                        placeholder={isEditing ? 'Yeni şifrenizi girin' : '••••••••'}
                                    />
                                    {isEditing && (
                                        <small className="form-text text-muted">
                                            Şifrenizi değiştirmek istemiyorsanız boş bırakın.
                                        </small>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="d-grid gap-2">
                                    {!isEditing ? (
                                        <button
                                            type="button"
                                            className="btn btn-primary btn-lg"
                                            onClick={() => setIsEditing(true)}
                                        >
                                            <IconComponent icon={FaEdit} className="me-2" />
                                            Düzenle
                                        </button>
                                    ) : (
                                        <div className="d-flex gap-2">
                                            <button
                                                type="submit"
                                                className="btn btn-success btn-lg flex-grow-1"
                                                disabled={isLoading}
                                            >
                                                {isLoading ? (
                                                    <>
                                                        <span className="spinner-border spinner-border-sm me-2" />
                                                        Kaydediliyor...
                                                    </>
                                                ) : (
                                                    <>
                                                        <IconComponent icon={FaSave} className="me-2" />
                                                        Kaydet
                                                    </>
                                                )}
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-outline-secondary btn-lg flex-grow-1"
                                                onClick={handleCancel}
                                                disabled={isLoading}
                                            >
                                                <IconComponent icon={FaTimes} className="me-2" />
                                                İptal
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </form>
                        </div>

                        {/* Footer */}
                        <div className="card-footer bg-light py-3 text-center">
                            <div className="d-flex flex-column align-items-center">
                                <div className="mb-2">
                                    <span className="badge bg-info text-dark">
                                        {user?.role?.toUpperCase()}
                                    </span>
                                </div>
                                <small className="text-muted">
                                    Son güncelleme: {new Date().toLocaleDateString()}
                                </small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AccountSettings;
