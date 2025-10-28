import React, { useEffect, useState, useCallback } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import { motion } from 'framer-motion';
import PageHeader from '../components/PageHeader';
import { authFetch } from '../utils/authFetch';
import config from '../config';
import { useAuth } from '../auth/AuthContext';
import ActivityLogDetailModal from '../components/ActivityLogDetailModal';
import { FaEye } from 'react-icons/fa';

interface ActivityLog {
    logid: number;
    userid: number;
    username: string;
    action: string;
    entity_type: string;
    entity_id: string;
    details: string | null;
    ip_address: string | null;
    created_at: string;
}

const ActivityLogs = () => {
    const { user } = useAuth();
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [filterEntityType, setFilterEntityType] = useState('');
    const [filterAction, setFilterAction] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            let url = `${config.API_BASE_URL}/activity-logs?limit=200`;

            if (startDate && endDate) {
                url = `${config.API_BASE_URL}/activity-logs/date-range?startDate=${startDate}&endDate=${endDate}&limit=200`;
            } else if (filterEntityType) {
                url = `${config.API_BASE_URL}/activity-logs/by-entity?entity_type=${filterEntityType}&limit=200`;
            }

            const res = await authFetch(url);
            const data = await res.json();
            setLogs(Array.isArray(data) ? data : []);
        } catch (error) {
            toast.error('Log kayıtları alınamadı');
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [startDate, endDate, filterEntityType]);

    useEffect(() => {
        if (user?.role === 'admin') {
            fetchLogs();
        }
    }, [user, fetchLogs]);

    const filteredLogs = logs.filter(log => {
        if (filterAction && log.action !== filterAction) return false;
        return true;
    });

    const getActionBadge = (action: string) => {
        const styles: any = {
            create: { bg: 'rgba(134, 239, 172, 0.3)', color: '#166534', border: 'rgba(134, 239, 172, 0.5)' },
            update: { bg: 'rgba(253, 224, 71, 0.3)', color: '#713f12', border: 'rgba(253, 224, 71, 0.5)' },
            delete: { bg: 'rgba(252, 165, 165, 0.3)', color: '#991b1b', border: 'rgba(252, 165, 165, 0.5)' },
        };
        const style = styles[action] || styles.create;

        return (
            <span style={{
                backgroundColor: style.bg,
                color: style.color,
                border: `1px solid ${style.border}`,
                padding: '4px 10px',
                borderRadius: '12px',
                fontSize: '0.75rem',
                fontWeight: '600',
                textTransform: 'uppercase'
            }}>
                {action === 'create' ? 'Oluşturma' : action === 'update' ? 'Güncelleme' : 'Silme'}
            </span>
        );
    };

    const getEntityTypeBadge = (type: string) => {
        const colors: any = {
            attendance: '#3b82f6',
            izinli: '#f59e0b',
            student: '#8b5cf6',
        };

        return (
            <span style={{
                backgroundColor: `${colors[type] || '#6b7280'}20`,
                color: colors[type] || '#6b7280',
                padding: '4px 10px',
                borderRadius: '12px',
                fontSize: '0.75rem',
                fontWeight: '600'
            }}>
                {type === 'attendance' ? 'Yoklama' : type === 'izinli' ? 'İzinli' : type}
            </span>
        );
    };

    const parseEntityId = (entityId: string) => {
        try {
            const parsed = JSON.parse(entityId);
            if (Array.isArray(parsed)) {
                return `${parsed.length} kayıt`;
            }
            return Object.entries(parsed).map(([key, value]) => `${key}: ${value}`).join(', ');
        } catch {
            return entityId;
        }
    };

    const getSummary = (log: ActivityLog) => {
        try {
            const details = log.details ? JSON.parse(log.details) : {};
            const entityId = log.entity_id ? JSON.parse(log.entity_id) : {};

            // Check for description first (most detailed)
            if (details.description) {
                return details.description;
            }

            // For attendance records, try to show date and program
            if (log.entity_type === 'attendance' || log.entity_type === 'izinli') {
                const parts = [];

                // Add student name if available
                if (details.studentName || entityId.studentName) {
                    parts.push(details.studentName || entityId.studentName);
                }

                // Add program name
                if (details.program_name || entityId.program_name) {
                    parts.push(details.program_name || entityId.program_name);
                }

                // Add date
                if (details.date || entityId.date) {
                    const date = details.date || entityId.date;
                    parts.push(new Date(date).toLocaleDateString('tr-TR'));
                }

                // Add status change if it's an update
                if (log.action === 'update' && details.previousStatus && details.newStatus) {
                    parts.push(`${details.previousStatus} → ${details.newStatus}`);
                }

                // Add count for bulk operations
                if (details.count) {
                    parts.push(`(${details.count} kayıt)`);
                }

                if (parts.length > 0) {
                    return parts.join(' - ');
                }
            }

            // Fallback to entity ID parsing
            if (Array.isArray(entityId)) {
                return `${entityId.length} kayıt`;
            }
            if (typeof entityId === 'object' && Object.keys(entityId).length > 0) {
                return Object.entries(entityId).map(([key, value]) => `${key}: ${value}`).join(', ');
            }
            return log.entity_id;
        } catch {
            return log.entity_id;
        }
    };

    const handleViewDetails = (log: ActivityLog) => {
        setSelectedLog(log);
        setIsModalOpen(true);
    };

    if (user?.role !== 'admin') {
        return (
            <div className="container">
                <div className="alert alert-warning mt-4">
                    Bu sayfaya erişim yetkiniz yok.
                </div>
            </div>
        );
    }

    return (
        <div className="container" style={{ padding: '0 12px', maxWidth: 1400 }}>
            <ToastContainer />
            <PageHeader
                icon=""
                title="Aktivite Logları"
                subtitle="Kullanıcı işlemlerini görüntüleyin ve izleyin"
                color="#1e40af"
            />

            {/* Filters */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="card shadow-sm border-0 mb-3"
                style={{ borderRadius: '12px' }}
            >
                <div className="card-body p-3">
                    <div className="row g-2">
                        <div className="col-md-3">
                            <label className="form-label fw-bold mb-1" style={{ fontSize: '0.85rem' }}>Başlangıç Tarihi</label>
                            <input
                                type="date"
                                className="form-control form-control-sm"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                            />
                        </div>
                        <div className="col-md-3">
                            <label className="form-label fw-bold mb-1" style={{ fontSize: '0.85rem' }}>Bitiş Tarihi</label>
                            <input
                                type="date"
                                className="form-control form-control-sm"
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                            />
                        </div>
                        <div className="col-md-2">
                            <label className="form-label fw-bold mb-1" style={{ fontSize: '0.85rem' }}>İşlem Tipi</label>
                            <select
                                className="form-select form-select-sm"
                                value={filterEntityType}
                                onChange={e => setFilterEntityType(e.target.value)}
                            >
                                <option value="">Tümü</option>
                                <option value="attendance">Yoklama</option>
                                <option value="izinli">İzinli</option>
                            </select>
                        </div>
                        <div className="col-md-2">
                            <label className="form-label fw-bold mb-1" style={{ fontSize: '0.85rem' }}>Aksiyon</label>
                            <select
                                className="form-select form-select-sm"
                                value={filterAction}
                                onChange={e => setFilterAction(e.target.value)}
                            >
                                <option value="">Tümü</option>
                                <option value="create">Oluşturma</option>
                                <option value="update">Güncelleme</option>
                                <option value="delete">Silme</option>
                            </select>
                        </div>
                        <div className="col-md-2 d-flex align-items-end">
                            <button
                                className="btn btn-sm w-100"
                                style={{
                                    background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontWeight: '600',
                                    padding: '8px'
                                }}
                                onClick={fetchLogs}
                            >
                                Filtrele
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Logs Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="card shadow-sm border-0"
                style={{ borderRadius: '16px', overflow: 'hidden' }}
            >
                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Yükleniyor...</span>
                        </div>
                    </div>
                ) : filteredLogs.length === 0 ? (
                    <div className="alert alert-info m-3" style={{ borderRadius: '8px' }}>
                        Log kaydı bulunamadı
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="table align-middle mb-0" style={{ minWidth: '1000px' }}>
                            <thead style={{
                                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                                borderBottom: '2px solid #e2e8f0'
                            }}>
                                <tr>
                                    <th style={{ padding: '16px', fontWeight: '600', color: '#475569', fontSize: '0.875rem', textAlign: 'center' }}>ID</th>
                                    <th style={{ padding: '16px', fontWeight: '600', color: '#475569', fontSize: '0.875rem' }}>Kullanıcı</th>
                                    <th style={{ padding: '16px', fontWeight: '600', color: '#475569', fontSize: '0.875rem', textAlign: 'center' }}>Aksiyon</th>
                                    <th style={{ padding: '16px', fontWeight: '600', color: '#475569', fontSize: '0.875rem', textAlign: 'center' }}>Tip</th>
                                    <th style={{ padding: '16px', fontWeight: '600', color: '#475569', fontSize: '0.875rem' }}>Özet</th>
                                    <th style={{ padding: '16px', fontWeight: '600', color: '#475569', fontSize: '0.875rem', textAlign: 'center' }}>Tarih/Saat</th>
                                    <th style={{ padding: '16px', fontWeight: '600', color: '#475569', fontSize: '0.875rem', textAlign: 'center' }}>İşlem</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLogs.map((log, index) => (
                                    <motion.tr
                                        key={log.logid}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: index * 0.02 }}
                                        style={{
                                            borderBottom: '1px solid #f1f5f9',
                                            transition: 'background-color 0.2s ease'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        <td style={{ padding: '16px', textAlign: 'center', color: '#64748b', fontWeight: '500' }}>
                                            {log.logid}
                                        </td>
                                        <td style={{ padding: '16px', color: '#1e293b', fontWeight: '500' }}>
                                            {log.username}
                                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>ID: {log.userid}</div>
                                        </td>
                                        <td style={{ padding: '16px', textAlign: 'center' }}>
                                            {getActionBadge(log.action)}
                                        </td>
                                        <td style={{ padding: '16px', textAlign: 'center' }}>
                                            {getEntityTypeBadge(log.entity_type)}
                                        </td>
                                        <td style={{ padding: '16px', fontSize: '0.9rem', color: '#1e293b', fontWeight: '500' }}>
                                            {getSummary(log)}
                                        </td>
                                        <td style={{ padding: '16px', fontSize: '0.85rem', color: '#475569' }}>
                                            {new Date(log.created_at).toLocaleString('tr-TR')}
                                        </td>
                                        <td style={{ padding: '16px', textAlign: 'center' }}>
                                            <button
                                                onClick={() => handleViewDetails(log)}
                                                style={{
                                                    backgroundColor: '#3b82f6',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    padding: '6px 12px',
                                                    fontSize: '0.85rem',
                                                    fontWeight: '600',
                                                    cursor: 'pointer',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    transition: 'all 0.2s'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.backgroundColor = '#2563eb';
                                                    e.currentTarget.style.transform = 'scale(1.05)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.backgroundColor = '#3b82f6';
                                                    e.currentTarget.style.transform = 'scale(1)';
                                                }}
                                            >
                                                {React.createElement(FaEye as any)} Detay
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </motion.div>

            {/* Detail Modal */}
            <ActivityLogDetailModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedLog(null);
                }}
                log={selectedLog}
            />
        </div>
    );
};

export default ActivityLogs;
