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

interface Admin {
    accountid: number;
    username: string;
    role_name: string;
}

interface User {
    accountid: number;
    username: string;
    role_name: string;
    studentid: number | null;
    yurts: Array<{
        yurtid: number;
        yurt_name: string;
        is_primary: boolean;
    }>;
}

const SuperAdminDashboard = () => {
    const [stats, setStats] = useState<SystemStats | null>(null);
    const [yurts, setYurts] = useState<Yurt[]>([]);
    const [referenceCodes, setReferenceCodes] = useState<AdminReferenceCode[]>([]);
    const [admins, setAdmins] = useState<Admin[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showCreateAdminModal, setShowCreateAdminModal] = useState(false);
    const [showAssignAdminModal, setShowAssignAdminModal] = useState(false);
    const [showEditUserModal, setShowEditUserModal] = useState(false);
    const [showEditYurtModal, setShowEditYurtModal] = useState(false);

    // Form state for creating reference code
    const [expiresAt, setExpiresAt] = useState('');
    const [maxUses, setMaxUses] = useState(1);
    const [description, setDescription] = useState('');

    // Form state for creating admin user directly
    const [newAdminUsername, setNewAdminUsername] = useState('');
    const [newAdminPassword, setNewAdminPassword] = useState('');
    const [selectedYurtId, setSelectedYurtId] = useState<number | ''>('');

    // Form state for assigning existing admin
    const [selectedAdminId, setSelectedAdminId] = useState<number | ''>('');
    const [assignYurtId, setAssignYurtId] = useState<number | ''>('');
    const [isPrimary, setIsPrimary] = useState(false);

    // Form state for user management
    const [roleFilter, setRoleFilter] = useState('all');
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [editUsername, setEditUsername] = useState('');
    const [editRole, setEditRole] = useState('');
    const [editPassword, setEditPassword] = useState('');

    // Form state for yurt management
    const [editingYurt, setEditingYurt] = useState<Yurt | null>(null);
    const [editYurtName, setEditYurtName] = useState('');
    const [editYurtLocation, setEditYurtLocation] = useState('');
    const [editYurtDescription, setEditYurtDescription] = useState('');

    useEffect(() => {
        fetchSystemStats();
        fetchYurts();
        fetchReferenceCodes();
        fetchAdmins();
        fetchUsers();
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [roleFilter]);

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

    const fetchAdmins = async () => {
        try {
            const res = await authFetch(`${config.API_BASE_URL}/super-admin/admins`);
            if (!res.ok) throw new Error();
            const data = await res.json();
            setAdmins(data);
        } catch {
            toast.error('Failed to load admins');
        }
    };

    const fetchUsers = async () => {
        try {
            const url = roleFilter === 'all'
                ? `${config.API_BASE_URL}/super-admin/users`
                : `${config.API_BASE_URL}/super-admin/users?role=${roleFilter}`;
            const res = await authFetch(url);
            if (!res.ok) throw new Error();
            const data = await res.json();
            setUsers(data);
        } catch {
            toast.error('Failed to load users');
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

    const handleCreateAdminUser = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newAdminUsername || !newAdminPassword || !selectedYurtId) {
            toast.error('All fields are required');
            return;
        }

        setLoading(true);

        try {
            const res = await authFetch(`${config.API_BASE_URL}/super-admin/create-admin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: newAdminUsername,
                    password: newAdminPassword,
                    yurtid: selectedYurtId
                })
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to create admin user');
            }

            toast.success('✅ Admin user created successfully');
            setShowCreateAdminModal(false);
            setNewAdminUsername('');
            setNewAdminPassword('');
            setSelectedYurtId('');
            fetchYurts();
            fetchSystemStats();
            fetchAdmins();

            // Refresh page to show new admin
            setTimeout(() => window.location.reload(), 1000);
        } catch (error: any) {
            toast.error(error.message || 'Failed to create admin user');
        } finally {
            setLoading(false);
        }
    };

    const handleAssignAdmin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedAdminId || !assignYurtId) {
            toast.error('Please select both admin and yurt');
            return;
        }

        setLoading(true);

        try {
            const res = await authFetch(`${config.API_BASE_URL}/super-admin/assign-admin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    accountid: selectedAdminId,
                    yurtid: assignYurtId,
                    isPrimary: isPrimary
                })
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to assign admin');
            }

            toast.success('✅ Admin assigned to yurt successfully');
            setShowAssignAdminModal(false);
            setSelectedAdminId('');
            setAssignYurtId('');
            setIsPrimary(false);
            fetchYurts();

            // Refresh page to show updated yurt assignments
            setTimeout(() => window.location.reload(), 1000);
        } catch (error: any) {
            toast.error(error.message || 'Failed to assign admin');
        } finally {
            setLoading(false);
        }
    };

    const handleEditUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;

        setLoading(true);
        try {
            const updateData: any = {};
            if (editUsername && editUsername !== editingUser.username) {
                updateData.username = editUsername;
            }
            if (editRole && editRole !== editingUser.role_name) {
                updateData.role_name = editRole;
            }
            if (editPassword) {
                updateData.password = editPassword;
            }

            const res = await authFetch(
                `${config.API_BASE_URL}/super-admin/users/${editingUser.accountid}`,
                {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updateData)
                }
            );

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message);
            }

            toast.success('✅ User updated successfully');
            setShowEditUserModal(false);
            setEditingUser(null);
            setEditUsername('');
            setEditRole('');
            setEditPassword('');
            fetchUsers();
            fetchSystemStats();

            // Refresh page to show updated user details
            setTimeout(() => window.location.reload(), 1000);
        } catch (error: any) {
            toast.error(error.message || 'Failed to update user');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (user: User) => {
        if (!window.confirm(`Are you sure you want to delete user "${user.username}"? This action cannot be undone.`)) {
            return;
        }

        setLoading(true);
        try {
            const res = await authFetch(
                `${config.API_BASE_URL}/super-admin/users/${user.accountid}`,
                { method: 'DELETE' }
            );

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message);
            }

            toast.success('✅ User deleted successfully');
            fetchUsers();
            fetchSystemStats();

            // Refresh page to update user list
            setTimeout(() => window.location.reload(), 1000);
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete user');
        } finally {
            setLoading(false);
        }
    };

    const openEditModal = (user: User) => {
        setEditingUser(user);
        setEditUsername(user.username);
        setEditRole(user.role_name);
        setEditPassword('');
        setShowEditUserModal(true);
    };

    const openEditYurtModal = (yurt: Yurt) => {
        setEditingYurt(yurt);
        setEditYurtName(yurt.yurt_name);
        setEditYurtLocation(yurt.location || '');
        setEditYurtDescription(yurt.description || '');
        setShowEditYurtModal(true);
    };

    const handleEditYurt = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingYurt) return;

        setLoading(true);
        try {
            const res = await authFetch(
                `${config.API_BASE_URL}/yurts/${editingYurt.yurtid}`,
                {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        yurt_name: editYurtName,
                        location: editYurtLocation || null,
                        description: editYurtDescription || null
                    })
                }
            );

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message);
            }

            toast.success('✅ Yurt updated successfully');
            setShowEditYurtModal(false);
            setEditingYurt(null);
            setEditYurtName('');
            setEditYurtLocation('');
            setEditYurtDescription('');
            fetchYurts();

            // Refresh page to show updated yurt details
            setTimeout(() => window.location.reload(), 1000);
        } catch (error: any) {
            toast.error(error.message || 'Failed to update yurt');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteYurt = async (yurt: Yurt) => {
        if (!window.confirm(`Are you sure you want to delete yurt "${yurt.yurt_name}"? This will delete all associated data (students, attendance, etc.) and cannot be undone.`)) {
            return;
        }

        setLoading(true);
        try {
            const res = await authFetch(
                `${config.API_BASE_URL}/yurts/${yurt.yurtid}`,
                { method: 'DELETE' }
            );

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message);
            }

            toast.success('✅ Yurt deleted successfully');
            fetchYurts();
            fetchSystemStats();

            // Refresh page to update all yurt-related data
            setTimeout(() => window.location.reload(), 1000);
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete yurt');
        } finally {
            setLoading(false);
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
                    <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center" style={{ padding: '20px' }}>
                        <h5 className="mb-0 fw-bold" style={{ color: '#7c3aed' }}>
                            <Building className="me-2" />
                            All Yurts
                        </h5>
                        <div className="d-flex gap-2">
                            <button
                                className="btn btn-outline-primary btn-sm"
                                onClick={() => setShowAssignAdminModal(true)}
                                style={{ borderRadius: '8px', fontWeight: '500' }}
                            >
                                <PersonBadge className="me-1" size={16} />
                                Assign Admin to Yurt
                            </button>
                            <button
                                className="btn btn-primary btn-sm"
                                onClick={() => setShowCreateAdminModal(true)}
                                style={{ borderRadius: '8px', fontWeight: '500' }}
                            >
                                <Plus className="me-1" size={16} />
                                Create Admin User
                            </button>
                        </div>
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
                                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                                        <h6 className="fw-bold mb-0">{yurt.yurt_name}</h6>
                                                        <div className="d-flex gap-1">
                                                            <button
                                                                className="btn btn-sm btn-outline-primary"
                                                                onClick={() => openEditYurtModal(yurt)}
                                                                style={{ borderRadius: '6px', padding: '2px 8px' }}
                                                                title="Edit Yurt"
                                                            >
                                                                ✏️
                                                            </button>
                                                            <button
                                                                className="btn btn-sm btn-outline-danger"
                                                                onClick={() => handleDeleteYurt(yurt)}
                                                                style={{ borderRadius: '6px', padding: '2px 8px' }}
                                                                title="Delete Yurt"
                                                                disabled={yurt.yurtid === 1}
                                                            >
                                                                <Trash size={14} />
                                                            </button>
                                                        </div>
                                                    </div>
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

                {/* User Management Section */}
                <div className="card border-0 shadow-sm mt-4" style={{ borderRadius: '12px' }}>
                    <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center" style={{ padding: '20px' }}>
                        <h5 className="mb-0 fw-bold" style={{ color: '#7c3aed' }}>
                            <PeopleFill className="me-2" />
                            User Management
                        </h5>
                        <select
                            className="form-select w-auto"
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            style={{ borderRadius: '8px' }}
                        >
                            <option value="all">All Users</option>
                            <option value="super-admin">Super Admins</option>
                            <option value="admin">Admins</option>
                            <option value="hoca">Hocas</option>
                            <option value="yoklamaci">Yoklamacis</option>
                            <option value="talebe">Talebes</option>
                        </select>
                    </div>
                    <div className="card-body" style={{ padding: '20px' }}>
                        {users.length === 0 ? (
                            <div className="text-center py-5 text-muted">
                                <PeopleFill size={48} className="mb-3" style={{ opacity: 0.3 }} />
                                <p>No users found.</p>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-hover">
                                    <thead>
                                        <tr>
                                            <th>Username</th>
                                            <th>Role</th>
                                            <th>Yurts</th>
                                            <th className="text-end">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map((user) => (
                                            <tr key={user.accountid}>
                                                <td className="fw-semibold">{user.username}</td>
                                                <td>
                                                    <span className={`badge ${user.role_name === 'super-admin' ? 'bg-danger' :
                                                        user.role_name === 'admin' ? 'bg-primary' :
                                                            user.role_name === 'hoca' ? 'bg-success' :
                                                                user.role_name === 'yoklamaci' ? 'bg-info' :
                                                                    'bg-secondary'
                                                        }`}>
                                                        {user.role_name}
                                                    </span>
                                                </td>
                                                <td>
                                                    {user.yurts.length > 0 ? (
                                                        <div className="d-flex flex-wrap gap-1">
                                                            {user.yurts.map((yurt, idx) => (
                                                                <small key={idx} className="badge bg-light text-dark">
                                                                    {yurt.yurt_name}
                                                                    {yurt.is_primary && ' ⭐'}
                                                                </small>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <small className="text-muted">No yurt assigned</small>
                                                    )}
                                                </td>
                                                <td className="text-end">
                                                    <button
                                                        className="btn btn-sm btn-outline-primary me-2"
                                                        onClick={() => openEditModal(user)}
                                                        style={{ borderRadius: '6px' }}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-outline-danger"
                                                        onClick={() => handleDeleteUser(user)}
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

            {/* Create Admin User Modal */}
            {showCreateAdminModal && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setShowCreateAdminModal(false)}>
                    <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-content" style={{ borderRadius: '12px' }}>
                            <div className="modal-header border-0">
                                <h5 className="modal-title fw-bold">Create Admin User</h5>
                                <button type="button" className="btn-close" onClick={() => setShowCreateAdminModal(false)}></button>
                            </div>
                            <form onSubmit={handleCreateAdminUser}>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label className="form-label fw-semibold">Username</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={newAdminUsername}
                                            onChange={(e) => setNewAdminUsername(e.target.value)}
                                            required
                                            placeholder="Enter username"
                                            autoComplete="off"
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label fw-semibold">Password</label>
                                        <input
                                            type="password"
                                            className="form-control"
                                            value={newAdminPassword}
                                            onChange={(e) => setNewAdminPassword(e.target.value)}
                                            required
                                            placeholder="Enter password"
                                            minLength={6}
                                            autoComplete="new-password"
                                        />
                                        <small className="text-muted">Minimum 6 characters</small>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label fw-semibold">Assign to Yurt</label>
                                        <select
                                            className="form-select"
                                            value={selectedYurtId}
                                            onChange={(e) => setSelectedYurtId(Number(e.target.value))}
                                            required
                                        >
                                            <option value="">Select a yurt...</option>
                                            {yurts.map((yurt) => (
                                                <option key={yurt.yurtid} value={yurt.yurtid}>
                                                    {yurt.yurt_name} {yurt.location ? `(${yurt.location})` : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="alert alert-info d-flex align-items-start gap-2 mb-0">
                                        <PersonBadge size={20} className="flex-shrink-0 mt-1" />
                                        <small>
                                            This admin user will be created immediately and assigned to the selected yurt with full admin privileges.
                                        </small>
                                    </div>
                                </div>
                                <div className="modal-footer border-0">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowCreateAdminModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary" disabled={loading}>
                                        {loading ? 'Creating...' : 'Create Admin User'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Assign Admin to Yurt Modal */}
            {showAssignAdminModal && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setShowAssignAdminModal(false)}>
                    <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-content" style={{ borderRadius: '12px' }}>
                            <div className="modal-header border-0">
                                <h5 className="modal-title fw-bold">Assign Existing Admin to Yurt</h5>
                                <button type="button" className="btn-close" onClick={() => setShowAssignAdminModal(false)}></button>
                            </div>
                            <form onSubmit={handleAssignAdmin}>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label className="form-label fw-semibold">Select Admin User</label>
                                        <select
                                            className="form-select"
                                            value={selectedAdminId}
                                            onChange={(e) => setSelectedAdminId(Number(e.target.value))}
                                            required
                                        >
                                            <option value="">Select an admin...</option>
                                            {admins.map((admin) => (
                                                <option key={admin.accountid} value={admin.accountid}>
                                                    {admin.username}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label fw-semibold">Assign to Yurt</label>
                                        <select
                                            className="form-select"
                                            value={assignYurtId}
                                            onChange={(e) => setAssignYurtId(Number(e.target.value))}
                                            required
                                        >
                                            <option value="">Select a yurt...</option>
                                            {yurts.map((yurt) => (
                                                <option key={yurt.yurtid} value={yurt.yurtid}>
                                                    {yurt.yurt_name} {yurt.location ? `(${yurt.location})` : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="mb-3 form-check">
                                        <input
                                            type="checkbox"
                                            className="form-check-input"
                                            id="isPrimary"
                                            checked={isPrimary}
                                            onChange={(e) => setIsPrimary(e.target.checked)}
                                        />
                                        <label className="form-check-label" htmlFor="isPrimary">
                                            Set as primary yurt for this admin
                                        </label>
                                    </div>
                                    <div className="alert alert-info d-flex align-items-start gap-2 mb-0">
                                        <PersonBadge size={20} className="flex-shrink-0 mt-1" />
                                        <small>
                                            This will assign the selected admin to the chosen yurt. If set as primary, it will be the admin's default yurt.
                                        </small>
                                    </div>
                                </div>
                                <div className="modal-footer border-0">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowAssignAdminModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary" disabled={loading}>
                                        {loading ? 'Assigning...' : 'Assign Admin'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {showEditUserModal && editingUser && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setShowEditUserModal(false)}>
                    <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-content" style={{ borderRadius: '12px' }}>
                            <div className="modal-header border-0">
                                <h5 className="modal-title fw-bold">Edit User: {editingUser.username}</h5>
                                <button type="button" className="btn-close" onClick={() => setShowEditUserModal(false)}></button>
                            </div>
                            <form onSubmit={handleEditUser}>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label className="form-label fw-semibold">Username</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={editUsername}
                                            onChange={(e) => setEditUsername(e.target.value)}
                                            placeholder="Enter username"
                                            minLength={3}
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label fw-semibold">Role</label>
                                        <select
                                            className="form-select"
                                            value={editRole}
                                            onChange={(e) => setEditRole(e.target.value)}
                                        >
                                            <option value="">Keep current role ({editingUser.role_name})</option>
                                            <option value="super-admin">Super Admin</option>
                                            <option value="admin">Admin</option>
                                            <option value="hoca">Hoca</option>
                                            <option value="yoklamaci">Yoklamaci</option>
                                            <option value="talebe">Talebe</option>
                                        </select>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label fw-semibold">New Password (Optional)</label>
                                        <input
                                            type="password"
                                            className="form-control"
                                            value={editPassword}
                                            onChange={(e) => setEditPassword(e.target.value)}
                                            placeholder="Leave blank to keep current password"
                                            minLength={6}
                                            autoComplete="new-password"
                                        />
                                        <small className="text-muted">Leave blank to keep current password</small>
                                    </div>
                                    <div className="alert alert-warning d-flex align-items-start gap-2 mb-0">
                                        <ShieldCheck size={20} className="flex-shrink-0 mt-1" />
                                        <small>
                                            You cannot change your own role. Username must be unique across all users.
                                        </small>
                                    </div>
                                </div>
                                <div className="modal-footer border-0">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowEditUserModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary" disabled={loading}>
                                        {loading ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Yurt Modal */}
            {showEditYurtModal && editingYurt && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setShowEditYurtModal(false)}>
                    <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-content" style={{ borderRadius: '12px' }}>
                            <div className="modal-header border-0">
                                <h5 className="modal-title fw-bold">Edit Yurt: {editingYurt.yurt_name}</h5>
                                <button type="button" className="btn-close" onClick={() => setShowEditYurtModal(false)}></button>
                            </div>
                            <form onSubmit={handleEditYurt}>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label className="form-label fw-semibold">Yurt Name</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={editYurtName}
                                            onChange={(e) => setEditYurtName(e.target.value)}
                                            placeholder="Enter yurt name"
                                            required
                                            minLength={2}
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label fw-semibold">Location <span className="text-muted">(Optional)</span></label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={editYurtLocation}
                                            onChange={(e) => setEditYurtLocation(e.target.value)}
                                            placeholder="Enter location"
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label fw-semibold">Description <span className="text-muted">(Optional)</span></label>
                                        <textarea
                                            className="form-control"
                                            value={editYurtDescription}
                                            onChange={(e) => setEditYurtDescription(e.target.value)}
                                            placeholder="Enter description"
                                            rows={3}
                                        />
                                    </div>
                                    <div className="alert alert-info d-flex align-items-start gap-2 mb-0">
                                        <Building size={20} className="flex-shrink-0 mt-1" />
                                        <small>
                                            Changes will affect all admins and students assigned to this yurt.
                                        </small>
                                    </div>
                                </div>
                                <div className="modal-footer border-0">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowEditYurtModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary" disabled={loading}>
                                        {loading ? 'Saving...' : 'Save Changes'}
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
