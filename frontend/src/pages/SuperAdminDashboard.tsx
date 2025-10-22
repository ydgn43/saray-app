import React, { useEffect, useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import PageHeader from '../components/PageHeader';
import { authFetch } from '../utils/authFetch';
import config from '../config';
import {
    Building,
    PeopleFill,
    PersonBadge,
    ShieldCheck,
    TicketPerforated,
    GraphUpArrow,
    Plus,
    Trash,
    Calendar,
    Clock
} from 'react-bootstrap-icons';

interface SystemStats {
    yurts: { total: number };
    users: { admins: number; hocas: number; yoklamaci: number; total: number };
    students: { total: number };
    referenceCodes: { total: number; active: number };
}

interface Yurt {
    yurtid: number;
    yurt_name: string;
    location: string | null;
    description: string | null;
    is_active: boolean;
    created_at: string;
    admins?: Array<{
        accountid: number;
        username: string;
        role_name: string;
    }>;
}

interface AdminReferenceCode {
    id: number;
    code: string;
    roleId: string;
    createdBy: number;
    expiresAt: string;
    maxUses: number;
    currentUses: number;
    description: string;
    isUsed: boolean;
    createdAt: string;
}

const SuperAdminDashboard = () => {
    const [stats, setStats] = useState<SystemStats | null>(null);
    const [yurts, setYurts] = useState<Yurt[]>([]);
    const [referenceCodes, setReferenceCodes] = useState<AdminReferenceCode[]>([]);
    const [loading, setLoading] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Form state for creating reference code
    const [expiresAt, setExpiresAt] = useState('');
    const [maxUses, setMaxUses] = useState(1);
    const [description, setDescription] = useState('');

    useEffect(() => {
        fetchSystemStats();
        fetchYurts();
        fetchReferenceCodes();
    }, []);

    const fetchSystemStats = async () => {
        try {
            const res = await authFetch(`${config.API_BASE_URL}/super-admin/statistics`);
            if (!res.ok) throw new Error();
            const data = await res.json();
            setStats(data);
        } catch {
            toast.error('Failed to load system statistics');
        }
    };

    const fetchYurts = async () => {
        try {
            const res = await authFetch(`${config.API_BASE_URL}/super-admin/yurts`);
            if (!res.ok) throw new Error();
            const data = await res.json();
            setYurts(data);
        } catch {
            toast.error('Failed to load yurts');
        }
    };

    const fetchReferenceCodes = async () => {
        try {
            const res = await authFetch(`${config.API_BASE_URL}/super-admin/admin-reference-codes`);
            if (!res.ok) throw new Error();
            const data = await res.json();
            setReferenceCodes(data);
        } catch {
            toast.error('Failed to load admin reference codes');
        }
    };

    const handleCreateReferenceCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await authFetch(`${config.API_BASE_URL}/super-admin/admin-reference-codes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ expiresAt, maxUses, description })
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to create reference code');
            }

            toast.success('✅ Admin reference code created successfully');
            setShowCreateModal(false);
            setExpiresAt('');
            setMaxUses(1);
            setDescription('');
            fetchReferenceCodes();
            fetchSystemStats();
        } catch (error: any) {
            toast.error(error.message || 'Failed to create reference code');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteReferenceCode = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this reference code?')) return;

        try {
            const res = await authFetch(`${config.API_BASE_URL}/super-admin/admin-reference-codes/${id}`, {
                method: 'DELETE'
            });

            if (!res.ok) throw new Error();

            toast.success('Reference code deleted');
            fetchReferenceCodes();
            fetchSystemStats();
        } catch {
            toast.error('Failed to delete reference code');
        }
    };

    const getStatusBadge = (code: AdminReferenceCode) => {
        const isExpired = new Date(code.expiresAt) < new Date();
        const isFullyUsed = code.currentUses >= code.maxUses;

        if (isFullyUsed) {
            return <span className="badge bg-secondary">Fully Used</span>;
        }
        if (isExpired) {
            return <span className="badge bg-danger">Expired</span>;
        }
        return <span className="badge bg-success">Active</span>;
    };

    return (
        <>
            <ToastContainer />
            <div className="container" style={{ padding: '0 12px', maxWidth: 1400 }}>
                <PageHeader
                    icon="🛡️"
                    title="Super Admin Dashboard"
                    subtitle="System overview and admin reference code management"
                    color="#7c3aed"
                />

                {/* System Statistics Cards */}
                {stats && (
                    <div className="row g-3 mb-4">
                        <div className="col-md-3">
                            <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '12px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                                <div className="card-body text-white">
                                    <div className="d-flex align-items-center justify-content-between mb-2">
                                        <Building size={32} />
                                        <h2 className="mb-0">{stats.yurts.total}</h2>
                                    </div>
                                    <p className="mb-0 opacity-75">Total Yurts</p>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '12px', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                                <div className="card-body text-white">
                                    <div className="d-flex align-items-center justify-content-between mb-2">
                                        <PersonBadge size={32} />
                                        <h2 className="mb-0">{stats.users.admins}</h2>
                                    </div>
                                    <p className="mb-0 opacity-75">Admins</p>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '12px', background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                                <div className="card-body text-white">
                                    <div className="d-flex align-items-center justify-content-between mb-2">
                                        <PeopleFill size={32} />
                                        <h2 className="mb-0">{stats.users.total}</h2>
                                    </div>
                                    <p className="mb-0 opacity-75">Total Users</p>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '12px', background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
                                <div className="card-body text-white">
                                    <div className="d-flex align-items-center justify-content-between mb-2">
                                        <TicketPerforated size={32} />
                                        <h2 className="mb-0">{stats.referenceCodes.active}</h2>
                                    </div>
                                    <p className="mb-0 opacity-75">Active Ref Codes</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Admin Reference Codes Section */}
                <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px' }}>
                    <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center" style={{ padding: '20px' }}>
                        <h5 className="mb-0 fw-bold" style={{ color: '#7c3aed' }}>
                            <TicketPerforated className="me-2" />
                            Admin Reference Codes
                        </h5>
                        <button
                            className="btn btn-primary btn-sm d-flex align-items-center gap-2"
                            onClick={() => setShowCreateModal(true)}
                            style={{ borderRadius: '8px' }}
                        >
                            <Plus size={18} />
                            Create New Code
                        </button>
                    </div>
                    <div className="card-body" style={{ padding: '20px' }}>
                        {referenceCodes.length === 0 ? (
                            <div className="text-center py-5 text-muted">
                                <TicketPerforated size={48} className="mb-3" style={{ opacity: 0.3 }} />
                                <p>No admin reference codes yet. Create one to invite new admins.</p>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table align-middle">
                                    <thead>
                                        <tr>
                                            <th>Code</th>
                                            <th>Status</th>
                                            <th>Uses</th>
                                            <th>Expires</th>
                                            <th>Description</th>
                                            <th>Created</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {referenceCodes.map((code) => (
                                            <tr key={code.id}>
                                                <td>
                                                    <code className="bg-light px-2 py-1 rounded" style={{ fontSize: '16px', fontWeight: '600' }}>
                                                        {code.code}
                                                    </code>
                                                </td>
                                                <td>{getStatusBadge(code)}</td>
                                                <td>
                                                    {code.currentUses} / {code.maxUses}
                                                </td>
                                                <td>
                                                    <small className="text-muted">
                                                        <Calendar className="me-1" size={14} />
                                                        {new Date(code.expiresAt).toLocaleDateString()}
                                                    </small>
                                                </td>
                                                <td>
                                                    <small className="text-muted">{code.description}</small>
                                                </td>
                                                <td>
                                                    <small className="text-muted">
                                                        <Clock className="me-1" size={14} />
                                                        {new Date(code.createdAt).toLocaleDateString()}
                                                    </small>
                                                </td>
                                                <td>
                                                    <button
                                                        className="btn btn-sm btn-outline-danger"
                                                        onClick={() => handleDeleteReferenceCode(code.id)}
                                                        style={{ borderRadius: '6px' }}
                                                    >
                                                        <Trash size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Yurts Overview Section */}
                <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                    <div className="card-header bg-white border-0" style={{ padding: '20px' }}>
                        <h5 className="mb-0 fw-bold" style={{ color: '#7c3aed' }}>
                            <Building className="me-2" />
                            All Yurts
                        </h5>
                    </div>
                    <div className="card-body" style={{ padding: '20px' }}>
                        {yurts.length === 0 ? (
                            <div className="text-center py-5 text-muted">
                                <Building size={48} className="mb-3" style={{ opacity: 0.3 }} />
                                <p>No yurts in the system yet.</p>
                            </div>
                        ) : (
                            <div className="row g-3">
                                {yurts.map((yurt) => {
                                    const admins = yurt.admins || [];
                                    return (
                                        <div key={yurt.yurtid} className="col-md-4">
                                            <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
                                                <div className="card-body">
                                                    <h6 className="fw-bold mb-2">{yurt.yurt_name}</h6>
                                                    {yurt.location && <p className="text-muted small mb-2">📍 {yurt.location}</p>}
                                                    {yurt.description && <p className="text-muted small mb-3">{yurt.description}</p>}
                                                    <div className="d-flex align-items-center gap-2 mb-2">
                                                        <PersonBadge size={16} className="text-primary" />
                                                        <small className="text-muted">
                                                            {admins.length > 0 ? (
                                                                <>
                                                                    Admin: <strong>{admins[0].username}</strong>
                                                                </>
                                                            ) : (
                                                                <span className="text-warning">No admin assigned</span>
                                                            )}
                                                        </small>
                                                    </div>
                                                    <small className="text-muted">
                                                        <Clock size={14} className="me-1" />
                                                        Created: {new Date(yurt.created_at).toLocaleDateString()}
                                                    </small>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Create Reference Code Modal */}
            {showCreateModal && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setShowCreateModal(false)}>
                    <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-content" style={{ borderRadius: '12px' }}>
                            <div className="modal-header border-0">
                                <h5 className="modal-title fw-bold">Create Admin Reference Code</h5>
                                <button type="button" className="btn-close" onClick={() => setShowCreateModal(false)}></button>
                            </div>
                            <form onSubmit={handleCreateReferenceCode}>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label className="form-label fw-semibold">Expiration Date</label>
                                        <input
                                            type="date"
                                            className="form-control"
                                            value={expiresAt}
                                            onChange={(e) => setExpiresAt(e.target.value)}
                                            required
                                            min={new Date().toISOString().split('T')[0]}
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label fw-semibold">Max Uses</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            value={maxUses}
                                            onChange={(e) => setMaxUses(Number(e.target.value))}
                                            required
                                            min={1}
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label fw-semibold">Description (Optional)</label>
                                        <textarea
                                            className="form-control"
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            rows={3}
                                            placeholder="Purpose of this reference code..."
                                        />
                                    </div>
                                    <div className="alert alert-info d-flex align-items-start gap-2 mb-0">
                                        <ShieldCheck size={20} className="flex-shrink-0 mt-1" />
                                        <small>
                                            When an admin signs up with this code, a new yurt will be automatically created and assigned to them.
                                        </small>
                                    </div>
                                </div>
                                <div className="modal-footer border-0">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary" disabled={loading}>
                                        {loading ? 'Creating...' : 'Create Reference Code'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default SuperAdminDashboard;
