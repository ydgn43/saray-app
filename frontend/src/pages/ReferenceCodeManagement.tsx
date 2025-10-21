import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import { useAuth } from '../auth/AuthContext';
import config from '../config';
import './ReferenceCodeManagement.css';

const API_BASE_URL = config.API_BASE_URL;

// Icon components
const FiPlus = FiIcons.FiPlus as any;
const FiTrash2 = FiIcons.FiTrash2 as any;
const FiCheck = FiIcons.FiCheck as any;
const FiX = FiIcons.FiX as any;
const FiCopy = FiIcons.FiCopy as any;

interface ReferenceCode {
    id: number;
    code: string;
    roleId: string;
    createdBy: number;
    expiresAt: string;
    isUsed: boolean;
    usedBy: number | null;
    usedAt: string | null;
    maxUses: number;
    currentUses: number;
    description: string;
    createdAt: string;
}

const ReferenceCodeManagement: React.FC = () => {
    const { token } = useAuth();
    const [referenceCodes, setReferenceCodes] = useState<ReferenceCode[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>('');
    const [success, setSuccess] = useState<string>('');

    // Form state
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        roleId: 'Teacher',
        expiresAt: '',
        maxUses: 1,
        description: ''
    });

    const roles = ['Teacher', 'Student', 'Admin'];

    useEffect(() => {
        fetchReferenceCodes();
    }, []);

    const fetchReferenceCodes = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await fetch(`${API_BASE_URL}/reference-codes`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Referans kodları yüklenemedi');
            }

            const data = await response.json();
            setReferenceCodes(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/reference-codes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Referans kodu oluşturulamadı');
            }

            const newCode = await response.json();
            setReferenceCodes([newCode, ...referenceCodes]);
            setSuccess('Referans kodu başarıyla oluşturuldu!');
            setShowForm(false);
            setFormData({
                roleId: 'Teacher',
                expiresAt: '',
                maxUses: 1,
                description: ''
            });
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCode = async (id: number) => {
        if (!window.confirm('Bu referans kodunu silmek istediğinizden emin misiniz?')) {
            return;
        }

        setError('');
        try {
            const response = await fetch(`${API_BASE_URL}/reference-codes/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Referans kodu silinemedi');
            }

            setReferenceCodes(referenceCodes.filter(code => code.id !== id));
            setSuccess('Referans kodu silindi');
        } catch (err: any) {
            setError(err.message);
        }
    };

    const copyToClipboard = (code: string) => {
        navigator.clipboard.writeText(code);
        setSuccess('Kod panoya kopyalandı!');
        setTimeout(() => setSuccess(''), 2000);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusBadge = (code: ReferenceCode) => {
        const now = new Date();
        const expiresAt = new Date(code.expiresAt);

        if (code.currentUses >= code.maxUses) {
            return <span className="badge badge-used">Kullanıldı</span>;
        } else if (expiresAt < now) {
            return <span className="badge badge-expired">Süresi Doldu</span>;
        } else {
            return <span className="badge badge-active">Aktif</span>;
        }
    };

    const getRoleName = (roleId: string) => {
        const roleNames: { [key: string]: string } = {
            'Teacher': 'Hoca',
            'Student': 'Talebe',
            'Admin': 'Admin'
        };
        return roleNames[roleId] || roleId;
    };

    return (
        <div className="reference-code-page">
            <motion.div
                className="page-header"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1>Referans Kod Yönetimi</h1>
                <button
                    className="btn-primary"
                    onClick={() => setShowForm(!showForm)}
                >
                    <FiPlus /> Yeni Referans Kodu Oluştur
                </button>
            </motion.div>

            {error && (
                <motion.div
                    className="alert alert-error"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <FiX /> {error}
                </motion.div>
            )}

            {success && (
                <motion.div
                    className="alert alert-success"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <FiCheck /> {success}
                </motion.div>
            )}

            {showForm && (
                <motion.div
                    className="code-form-card"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    <h2>Yeni Referans Kodu</h2>
                    <form onSubmit={handleCreateCode}>
                        <div className="form-group">
                            <label htmlFor="roleId">Rol</label>
                            <select
                                id="roleId"
                                value={formData.roleId}
                                onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                                required
                            >
                                {roles.map(role => (
                                    <option key={role} value={role}>
                                        {getRoleName(role)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="expiresAt">Son Kullanma Tarihi</label>
                            <input
                                type="datetime-local"
                                id="expiresAt"
                                value={formData.expiresAt}
                                onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="maxUses">Maksimum Kullanım Sayısı</label>
                            <input
                                type="number"
                                id="maxUses"
                                min="1"
                                value={formData.maxUses}
                                onChange={(e) => setFormData({ ...formData, maxUses: parseInt(e.target.value) })}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="description">Açıklama (Opsiyonel)</label>
                            <textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Bu kod için bir açıklama ekleyin..."
                                rows={3}
                            />
                        </div>

                        <div className="form-actions">
                            <button type="submit" className="btn-primary" disabled={loading}>
                                {loading ? 'Oluşturuluyor...' : 'Oluştur'}
                            </button>
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={() => setShowForm(false)}
                            >
                                İptal
                            </button>
                        </div>
                    </form>
                </motion.div>
            )}

            <motion.div
                className="codes-table-container"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h2>Mevcut Referans Kodları</h2>
                {loading && <div className="loading">Yükleniyor...</div>}

                {!loading && referenceCodes.length === 0 && (
                    <div className="empty-state">
                        <p>Henüz referans kodu oluşturulmamış.</p>
                    </div>
                )}

                {!loading && referenceCodes.length > 0 && (
                    <div className="table-responsive">
                        <table className="codes-table">
                            <thead>
                                <tr>
                                    <th>Kod</th>
                                    <th>Rol</th>
                                    <th>Durum</th>
                                    <th>Kullanım</th>
                                    <th>Oluşturulma</th>
                                    <th>Son Kullanma</th>
                                    <th>Açıklama</th>
                                    <th>İşlemler</th>
                                </tr>
                            </thead>
                            <tbody>
                                {referenceCodes.map((code) => (
                                    <motion.tr
                                        key={code.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                    >
                                        <td>
                                            <div className="code-cell">
                                                <code>{code.code}</code>
                                                <button
                                                    className="btn-icon"
                                                    onClick={() => copyToClipboard(code.code)}
                                                    title="Kopyala"
                                                >
                                                    <FiCopy />
                                                </button>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="role-badge">{getRoleName(code.roleId)}</span>
                                        </td>
                                        <td>{getStatusBadge(code)}</td>
                                        <td>{code.currentUses} / {code.maxUses}</td>
                                        <td>{formatDate(code.createdAt)}</td>
                                        <td>{formatDate(code.expiresAt)}</td>
                                        <td>
                                            <span className="description-text">
                                                {code.description || '-'}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                className="btn-icon btn-danger"
                                                onClick={() => handleDeleteCode(code.id)}
                                                title="Sil"
                                            >
                                                <FiTrash2 />
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default ReferenceCodeManagement;
