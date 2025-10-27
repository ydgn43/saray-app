import React, { useEffect, useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { authFetch } from '../utils/authFetch';
import config from '../config';

type Yurt = {
    yurtId: number;
    yurtName: string;
    location: string | null;
    description: string | null;
    isActive: boolean;
    isPrimary: boolean;
    assignedAt: string;
};

const YurtManagement = () => {
    const [yurts, setYurts] = useState<Yurt[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingYurt, setEditingYurt] = useState<Yurt | null>(null);
    const [yurtName, setYurtName] = useState('');
    const [location, setLocation] = useState('');
    const [description, setDescription] = useState('');
    const [saving, setSaving] = useState(false);

    const loadYurts = async () => {
        setLoading(true);
        try {
            const res = await authFetch(`${config.API_BASE_URL}/yurt-management/my-yurts`);
            const response = await res.json();
            // The backend returns { success: true, data: [...] }
            const data = response.data || response;
            // Ensure data is an array
            setYurts(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to load yurts:', error);
            toast.error('Yurtlar yüklenemedi');
            setYurts([]); // Set to empty array on error
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadYurts();
    }, []);

    const startEdit = (yurt: Yurt) => {
        setEditingYurt(yurt);
        setYurtName(yurt.yurtName);
        setLocation(yurt.location || '');
        setDescription(yurt.description || '');
    };

    const cancelEdit = () => {
        setEditingYurt(null);
        setYurtName('');
        setLocation('');
        setDescription('');
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingYurt) return;

        setSaving(true);
        try {
            const res = await authFetch(`${config.API_BASE_URL}/yurts/${editingYurt.yurtId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    yurt_name: yurtName,
                    location: location || null,
                    description: description || null
                })
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Güncelleme başarısız');
            }

            toast.success('✅ Yurt başarıyla güncellendi');
            cancelEdit();
            loadYurts();

            // Refresh page to show updated yurt details
            setTimeout(() => window.location.reload(), 1000);
        } catch (error: any) {
            toast.error(error.message || 'Yurt güncellenemedi');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (yurt: Yurt) => {
        if (!window.confirm(`"${yurt.yurtName}" yurdunu silmek istediğinize emin misiniz? Bu işlem geri alınamaz ve tüm ilişkili veriler (öğrenciler, yoklama kayıtları, vb.) silinecektir.`)) {
            return;
        }

        setSaving(true);
        try {
            const res = await authFetch(`${config.API_BASE_URL}/yurts/${yurt.yurtId}`, {
                method: 'DELETE'
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Silme başarısız');
            }

            toast.success('✅ Yurt başarıyla silindi');
            loadYurts();

            // Refresh page to update yurt list and selector
            setTimeout(() => window.location.reload(), 1000);
        } catch (error: any) {
            toast.error(error.message || 'Yurt silinemedi');
        } finally {
            setSaving(false);
        }
    };

    const handleSetPrimary = async (yurt: Yurt) => {
        if (yurt.isPrimary) {
            toast.info('Bu yurt zaten varsayılan yurt');
            return;
        }

        setSaving(true);
        try {
            const res = await authFetch(`${config.API_BASE_URL}/yurt-management/my-primary-yurt`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ yurtid: yurt.yurtId })
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'İşlem başarısız');
            }

            toast.success('✅ Varsayılan yurt güncellendi');
            loadYurts();

            // Refresh page to update yurt selector and all yurt-related data
            setTimeout(() => window.location.reload(), 1000);
        } catch (error: any) {
            toast.error(error.message || 'Varsayılan yurt ayarlanamadı');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Yükleniyor...</span>
                </div>
            </div>
        );
    }

    return (
        <div>
            <ToastContainer />
            <h4 className="mb-3">Yurt Yönetimi</h4>
            <p className="text-muted mb-4">Yurtlarınızı görüntüleyin ve düzenleyin.</p>

            {yurts.length === 0 ? (
                <div className="alert alert-info">
                    Size atanmış yurt bulunamadı.
                </div>
            ) : (
                <div className="row g-3">
                    {yurts.map((yurt) => (
                        <div key={yurt.yurtId} className="col-md-6">
                            <div className="card border-0 shadow-sm h-100">
                                <div className="card-body">
                                    {editingYurt?.yurtId === yurt.yurtId ? (
                                        <form onSubmit={handleSave}>
                                            <div className="mb-3">
                                                <label className="form-label fw-semibold">Yurt Adı</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={yurtName}
                                                    onChange={(e) => setYurtName(e.target.value)}
                                                    required
                                                    minLength={2}
                                                />
                                            </div>
                                            <div className="mb-3">
                                                <label className="form-label fw-semibold">Konum (Opsiyonel)</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={location}
                                                    onChange={(e) => setLocation(e.target.value)}
                                                    placeholder="Örn: İstanbul, Fatih"
                                                />
                                            </div>
                                            <div className="mb-3">
                                                <label className="form-label fw-semibold">Açıklama (Opsiyonel)</label>
                                                <textarea
                                                    className="form-control"
                                                    value={description}
                                                    onChange={(e) => setDescription(e.target.value)}
                                                    rows={3}
                                                    placeholder="Yurt hakkında ek bilgiler..."
                                                />
                                            </div>
                                            <div className="d-flex gap-2">
                                                <button
                                                    type="submit"
                                                    className="btn btn-primary btn-sm"
                                                    disabled={saving}
                                                >
                                                    {saving ? 'Kaydediliyor...' : 'Kaydet'}
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn btn-secondary btn-sm"
                                                    onClick={cancelEdit}
                                                    disabled={saving}
                                                >
                                                    İptal
                                                </button>
                                            </div>
                                        </form>
                                    ) : (
                                        <>
                                            <div className="d-flex justify-content-between align-items-start mb-3">
                                                <h5 className="card-title mb-0">
                                                    {yurt.yurtName}
                                                    {yurt.isPrimary && (
                                                        <span className="badge bg-primary ms-2">Varsayılan</span>
                                                    )}
                                                </h5>
                                                <span className={`badge ${yurt.isActive ? 'bg-success' : 'bg-secondary'}`}>
                                                    {yurt.isActive ? 'Aktif' : 'Pasif'}
                                                </span>
                                            </div>
                                            {yurt.location && (
                                                <p className="text-muted mb-2">
                                                    <strong>📍 Konum:</strong> {yurt.location}
                                                </p>
                                            )}
                                            {yurt.description && (
                                                <p className="text-muted mb-3">
                                                    <strong>📝 Açıklama:</strong> {yurt.description}
                                                </p>
                                            )}
                                            <p className="text-muted small mb-3">
                                                <strong>📅 Atanma Tarihi:</strong>{' '}
                                                {new Date(yurt.assignedAt).toLocaleDateString('tr-TR')}
                                            </p>
                                            <div className="d-flex gap-2 flex-wrap">
                                                <button
                                                    className="btn btn-outline-primary btn-sm"
                                                    onClick={() => startEdit(yurt)}
                                                >
                                                    ✏️ Düzenle
                                                </button>
                                                {!yurt.isPrimary && (
                                                    <button
                                                        className="btn btn-outline-success btn-sm"
                                                        onClick={() => handleSetPrimary(yurt)}
                                                        disabled={saving}
                                                        title="Bu yurdu varsayılan yap"
                                                    >
                                                        ⭐ Varsayılan Yap
                                                    </button>
                                                )}
                                                <button
                                                    className="btn btn-outline-danger btn-sm"
                                                    onClick={() => handleDelete(yurt)}
                                                    disabled={yurts.length <= 1 || yurt.isPrimary}
                                                    title={
                                                        yurt.isPrimary
                                                            ? 'Varsayılan yurdu silemezsiniz'
                                                            : yurts.length <= 1
                                                                ? 'Son yurdunuzu silemezsiniz'
                                                                : 'Yurdu sil'
                                                    }
                                                >
                                                    🗑️ Sil
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default YurtManagement;
