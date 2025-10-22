import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaUser, FaClock, FaCalendar, FaExchangeAlt, FaInfoCircle, FaNetworkWired } from 'react-icons/fa';

interface ActivityLogDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    log: {
        logid: number;
        userid: number;
        username: string;
        action: string;
        entity_type: string;
        entity_id: string;
        details: string | null;
        ip_address: string | null;
        created_at: string;
    } | null;
}

const ActivityLogDetailModal: React.FC<ActivityLogDetailModalProps> = ({ isOpen, onClose, log }) => {
    if (!log) return null;

    let parsedEntityId: any = {};
    let parsedDetails: any = {};

    try {
        parsedEntityId = JSON.parse(log.entity_id);
    } catch (e) {
        parsedEntityId = {};
    }

    try {
        parsedDetails = log.details ? JSON.parse(log.details) : {};
    } catch (e) {
        parsedDetails = {};
    }

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatStatus = (status: string) => {
        const statusMap: any = {
            'gelmedi': 'Gelmedi',
            'geldi': 'Geldi',
            'izinli': 'İzinli',
            'create': 'Oluşturma',
            'update': 'Güncelleme',
            'delete': 'Silme'
        };
        return statusMap[status] || status;
    };

    const getActionColor = (action: string) => {
        const colors: any = {
            create: '#166534',
            update: '#713f12',
            delete: '#991b1b'
        };
        return colors[action] || '#1e40af';
    };

    const getStatusBadgeStyle = (status: string | null) => {
        if (!status) return {};
        const styles: any = {
            gelmedi: { bg: '#fca5a5', color: '#7f1d1d' },
            geldi: { bg: '#86efac', color: '#14532d' },
            izinli: { bg: '#fde047', color: '#713f12' }
        };
        return styles[status] || { bg: '#93c5fd', color: '#1e3a8a' };
    };

    const renderRecordDetails = () => {
        if (log.entity_type === 'izinli') {
            const studentName = parsedEntityId.studentName || parsedDetails.studentName || 'Bilinmeyen';
            const previousStatus = parsedDetails.previousStatus;
            const newStatus = parsedDetails.newStatus || 'izinli';
            const sebep = parsedDetails.sebep;
            const description = parsedDetails.description;

            return (
                <div style={{ padding: '20px', backgroundColor: '#f8fafc', borderRadius: '12px', marginTop: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                        {React.createElement(FaInfoCircle as any, { style: { color: '#3b82f6', fontSize: '20px' } })}
                        <h4 style={{ margin: 0, color: '#1e293b', fontSize: '1.1rem', fontWeight: '600' }}>
                            İzinli Kayıt Detayları
                        </h4>
                    </div>

                    {/* Main Summary Box */}
                    {description && (
                        <div style={{
                            marginBottom: '16px',
                            padding: '16px',
                            backgroundColor: '#dbeafe',
                            borderLeft: '4px solid #3b82f6',
                            borderRadius: '8px'
                        }}>
                            <div style={{ fontSize: '0.85rem', color: '#1e40af', fontWeight: '600', marginBottom: '4px' }}>
                                İŞLEM ÖZETİ
                            </div>
                            <div style={{ color: '#1e40af', fontSize: '1.05rem', fontWeight: '600' }}>
                                {description}
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'grid', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {React.createElement(FaUser as any, { style: { color: '#64748b', fontSize: '16px' } })}
                            <span style={{ color: '#64748b', fontWeight: '500', minWidth: '120px' }}>Talebe:</span>
                            <strong style={{ color: '#1e293b', fontSize: '1.05rem' }}>{studentName}</strong>
                        </div>

                        {parsedEntityId.date && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                {React.createElement(FaCalendar as any, { style: { color: '#64748b', fontSize: '16px' } })}
                                <span style={{ color: '#64748b', fontWeight: '500', minWidth: '120px' }}>Tarih:</span>
                                <strong style={{ color: '#1e293b' }}>
                                    {new Date(parsedEntityId.date).toLocaleDateString('tr-TR', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </strong>
                            </div>
                        )}

                        {parsedEntityId.program_name && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                {React.createElement(FaInfoCircle as any, { style: { color: '#64748b', fontSize: '16px' } })}
                                <span style={{ color: '#64748b', fontWeight: '500', minWidth: '120px' }}>Program:</span>
                                <strong style={{ color: '#1e293b' }}>{parsedEntityId.program_name}</strong>
                            </div>
                        )}

                        {/* Show status change for both create and update */}
                        {log.action !== 'delete' && newStatus && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px', padding: '12px', backgroundColor: '#f0fdf4', borderRadius: '8px' }}>
                                {React.createElement(FaExchangeAlt as any, { style: { color: '#16a34a', fontSize: '16px' } })}
                                <span style={{ color: '#15803d', fontWeight: '600', minWidth: '120px' }}>Durum Değişimi:</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {previousStatus && (
                                        <>
                                            <span style={{
                                                ...getStatusBadgeStyle(previousStatus),
                                                padding: '6px 14px',
                                                borderRadius: '8px',
                                                fontSize: '0.9rem',
                                                fontWeight: '600',
                                                border: '2px solid currentColor'
                                            }}>
                                                {formatStatus(previousStatus)}
                                            </span>
                                            <span style={{ color: '#16a34a', fontSize: '1.4rem', fontWeight: 'bold' }}>→</span>
                                        </>
                                    )}
                                    <span style={{
                                        ...getStatusBadgeStyle(newStatus),
                                        padding: '6px 14px',
                                        borderRadius: '8px',
                                        fontSize: '0.9rem',
                                        fontWeight: '600',
                                        border: '2px solid currentColor'
                                    }}>
                                        {formatStatus(newStatus)}
                                    </span>
                                    {!previousStatus && (
                                        <span style={{ color: '#16a34a', fontSize: '0.85rem', marginLeft: '8px', fontWeight: '600' }}>
                                            (Yeni kayıt)
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        {log.action === 'delete' && previousStatus && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px', padding: '12px', backgroundColor: '#fef2f2', borderRadius: '8px' }}>
                                {React.createElement(FaExchangeAlt as any, { style: { color: '#dc2626', fontSize: '16px' } })}
                                <span style={{ color: '#991b1b', fontWeight: '600', minWidth: '120px' }}>Silinen Kayıt:</span>
                                <span style={{
                                    ...getStatusBadgeStyle(previousStatus),
                                    padding: '6px 14px',
                                    borderRadius: '8px',
                                    fontSize: '0.9rem',
                                    fontWeight: '600',
                                    border: '2px solid currentColor'
                                }}>
                                    {formatStatus(previousStatus)}
                                </span>
                            </div>
                        )}

                        {sebep && (
                            <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#fffbeb', borderRadius: '8px', border: '1px solid #fcd34d' }}>
                                <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                                    {React.createElement(FaInfoCircle as any, { style: { color: '#d97706', fontSize: '16px', marginTop: '2px' } })}
                                    <div style={{ flex: 1 }}>
                                        <div style={{ color: '#92400e', fontWeight: '600', fontSize: '0.85rem', marginBottom: '4px' }}>
                                            İZİN SEBEBİ
                                        </div>
                                        <div style={{
                                            color: '#78350f',
                                            fontSize: '0.95rem',
                                            lineHeight: '1.5'
                                        }}>
                                            {sebep}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Show student ID info */}
                    {parsedEntityId.studentid && (
                        <div style={{
                            marginTop: '16px',
                            padding: '8px 12px',
                            backgroundColor: '#f1f5f9',
                            borderRadius: '6px',
                            fontSize: '0.8rem',
                            color: '#64748b',
                            textAlign: 'center'
                        }}>
                            Talebe ID: {parsedEntityId.studentid}
                        </div>
                    )}
                </div>
            );
        } else if (log.entity_type === 'attendance') {
            const count = parsedDetails.count;
            const description = parsedDetails.description;
            const records = parsedDetails.records || [];
            const studentName = parsedDetails.studentName || parsedEntityId.studentName;
            const previousStatus = parsedDetails.previousStatus;
            const newStatus = parsedDetails.newStatus;

            // Check if this is an individual update (has previousStatus and newStatus)
            const isIndividualUpdate = log.action === 'update' || (previousStatus && newStatus);

            return (
                <div style={{ padding: '20px', backgroundColor: '#f8fafc', borderRadius: '12px', marginTop: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                        {React.createElement(FaInfoCircle as any, { style: { color: '#3b82f6', fontSize: '20px' } })}
                        <h4 style={{ margin: 0, color: '#1e293b', fontSize: '1.1rem', fontWeight: '600' }}>
                            {isIndividualUpdate ? 'Yoklama Güncelleme Detayları' : 'Yoklama Kayıt Detayları'}
                        </h4>
                    </div>

                    {isIndividualUpdate ? (
                        // Show individual update details (like izinli format)
                        <>
                            {description && (
                                <div style={{
                                    marginBottom: '16px',
                                    padding: '16px',
                                    backgroundColor: '#dbeafe',
                                    borderLeft: '4px solid #3b82f6',
                                    borderRadius: '8px'
                                }}>
                                    <div style={{ fontSize: '0.85rem', color: '#1e40af', fontWeight: '600', marginBottom: '4px' }}>
                                        İŞLEM ÖZETİ
                                    </div>
                                    <div style={{ color: '#1e40af', fontSize: '1.05rem', fontWeight: '600' }}>
                                        {description}
                                    </div>
                                </div>
                            )}

                            <div style={{ display: 'grid', gap: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    {React.createElement(FaUser as any, { style: { color: '#64748b', fontSize: '16px' } })}
                                    <span style={{ color: '#64748b', fontWeight: '500', minWidth: '120px' }}>Talebe:</span>
                                    <strong style={{ color: '#1e293b', fontSize: '1.05rem' }}>{studentName || 'Bilinmeyen'}</strong>
                                </div>

                                {parsedEntityId.date && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        {React.createElement(FaCalendar as any, { style: { color: '#64748b', fontSize: '16px' } })}
                                        <span style={{ color: '#64748b', fontWeight: '500', minWidth: '120px' }}>Tarih:</span>
                                        <strong style={{ color: '#1e293b' }}>
                                            {new Date(parsedEntityId.date).toLocaleDateString('tr-TR', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </strong>
                                    </div>
                                )}

                                {parsedEntityId.program_name && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        {React.createElement(FaInfoCircle as any, { style: { color: '#64748b', fontSize: '16px' } })}
                                        <span style={{ color: '#64748b', fontWeight: '500', minWidth: '120px' }}>Program:</span>
                                        <strong style={{ color: '#1e293b' }}>{parsedEntityId.program_name}</strong>
                                    </div>
                                )}

                                {/* Show status change */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px', padding: '12px', backgroundColor: '#f0fdf4', borderRadius: '8px' }}>
                                    {React.createElement(FaExchangeAlt as any, { style: { color: '#16a34a', fontSize: '16px' } })}
                                    <span style={{ color: '#15803d', fontWeight: '600', minWidth: '120px' }}>Durum Değişimi:</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {previousStatus && (
                                            <>
                                                <span style={{
                                                    ...getStatusBadgeStyle(previousStatus),
                                                    padding: '6px 14px',
                                                    borderRadius: '8px',
                                                    fontSize: '0.9rem',
                                                    fontWeight: '600',
                                                    border: '2px solid currentColor'
                                                }}>
                                                    {formatStatus(previousStatus)}
                                                </span>
                                                <span style={{ color: '#16a34a', fontSize: '1.4rem', fontWeight: 'bold' }}>→</span>
                                            </>
                                        )}
                                        <span style={{
                                            ...getStatusBadgeStyle(newStatus),
                                            padding: '6px 14px',
                                            borderRadius: '8px',
                                            fontSize: '0.9rem',
                                            fontWeight: '600',
                                            border: '2px solid currentColor'
                                        }}>
                                            {formatStatus(newStatus)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {parsedEntityId.studentid && (
                                <div style={{
                                    marginTop: '16px',
                                    padding: '8px 12px',
                                    backgroundColor: '#f1f5f9',
                                    borderRadius: '6px',
                                    fontSize: '0.8rem',
                                    color: '#64748b',
                                    textAlign: 'center'
                                }}>
                                    Talebe ID: {parsedEntityId.studentid}
                                </div>
                            )}
                        </>
                    ) : (
                        // Show bulk operation details
                        <div style={{ display: 'grid', gap: '12px' }}>
                            {count && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    {React.createElement(FaInfoCircle as any, { style: { color: '#64748b', fontSize: '16px' } })}
                                    <span style={{ color: '#64748b', fontWeight: '500', minWidth: '120px' }}>Kayıt Sayısı:</span>
                                    <strong style={{
                                        color: '#1e40af',
                                        backgroundColor: '#dbeafe',
                                        padding: '4px 12px',
                                        borderRadius: '8px',
                                        fontSize: '1.05rem',
                                        fontWeight: '600'
                                    }}>
                                        {count} talebe
                                    </strong>
                                </div>
                            )}

                            {description && (
                                <div style={{
                                    padding: '12px',
                                    backgroundColor: '#e0f2fe',
                                    borderLeft: '4px solid #3b82f6',
                                    borderRadius: '8px',
                                    marginTop: '8px'
                                }}>
                                    <strong style={{ color: '#1e40af', fontSize: '0.95rem' }}>{description}</strong>
                                </div>
                            )}

                            {records.length > 0 && records.length <= 10 && (
                                <div style={{ marginTop: '12px' }}>
                                    <h5 style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '8px', fontWeight: '600' }}>
                                        Kayıt Listesi:
                                    </h5>
                                    <div style={{ display: 'grid', gap: '6px' }}>
                                        {records.map((record: any, index: number) => (
                                            <div
                                                key={index}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    padding: '8px 12px',
                                                    backgroundColor: 'white',
                                                    borderRadius: '8px',
                                                    border: '1px solid #e2e8f0'
                                                }}
                                            >
                                                <span style={{ color: '#1e293b', fontWeight: '500' }}>
                                                    {record.studentName}
                                                </span>
                                                <span style={{
                                                    ...getStatusBadgeStyle(record.status),
                                                    padding: '3px 10px',
                                                    borderRadius: '6px',
                                                    fontSize: '0.8rem',
                                                    fontWeight: '600'
                                                }}>
                                                    {formatStatus(record.status)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {records.length > 10 && (
                                <div style={{
                                    padding: '10px',
                                    backgroundColor: '#fef3c7',
                                    borderRadius: '8px',
                                    color: '#713f12',
                                    fontSize: '0.9rem',
                                    textAlign: 'center'
                                }}>
                                    {React.createElement(FaInfoCircle as any, { style: { marginRight: '6px' } })}
                                    Çok sayıda kayıt içerdiği için detaylar gösterilmemektedir
                                </div>
                            )}
                        </div>
                    )}
                </div>
            );
        }

        return null;
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                            zIndex: 9998,
                            backdropFilter: 'blur(4px)'
                        }}
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        style={{
                            position: 'fixed',
                            top: '7.5vh',
                            left: '5%',
                            right: '5%',
                            backgroundColor: 'white',
                            borderRadius: '16px',
                            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                            zIndex: 9999,
                            maxWidth: '700px',
                            margin: '0 auto',
                            maxHeight: '85vh',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                    >
                        {/* Header */}
                        <div style={{
                            padding: '24px',
                            background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                            color: 'white',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexShrink: 0
                        }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '600' }}>
                                    İşlem Detayları
                                </h3>
                                <p style={{ margin: '4px 0 0 0', opacity: 0.9, fontSize: '0.9rem' }}>
                                    Log ID: #{log.logid}
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                style={{
                                    background: 'rgba(255, 255, 255, 0.2)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    width: '36px',
                                    height: '36px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    transition: 'background 0.2s',
                                    color: 'white'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
                            >
                                {React.createElement(FaTimes as any, { size: 18 })}
                            </button>
                        </div>

                        {/* Content */}
                        <div style={{
                            padding: '24px',
                            overflowY: 'auto',
                            overflowX: 'hidden',
                            flex: 1,
                            minHeight: 0,
                            WebkitOverflowScrolling: 'touch'
                        } as React.CSSProperties}>
                            {/* Basic Info */}
                            <div style={{ display: 'grid', gap: '16px', marginBottom: '20px' }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '12px',
                                    backgroundColor: '#f1f5f9',
                                    borderRadius: '10px'
                                }}>
                                    {React.createElement(FaUser as any, { style: { color: getActionColor(log.action), fontSize: '18px' } })}
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '2px' }}>İşlemi Yapan</div>
                                        <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '1.05rem' }}>
                                            {log.username}
                                            <span style={{ color: '#64748b', fontSize: '0.85rem', marginLeft: '8px' }}>
                                                (ID: {log.userid})
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '12px',
                                    backgroundColor: '#f1f5f9',
                                    borderRadius: '10px'
                                }}>
                                    {React.createElement(FaClock as any, { style: { color: getActionColor(log.action), fontSize: '18px' } })}
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '2px' }}>İşlem Zamanı</div>
                                        <div style={{ fontWeight: '600', color: '#1e293b' }}>
                                            {formatDate(log.created_at)}
                                        </div>
                                    </div>
                                </div>

                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '12px',
                                    backgroundColor: '#f1f5f9',
                                    borderRadius: '10px'
                                }}>
                                    {React.createElement(FaExchangeAlt as any, { style: { color: getActionColor(log.action), fontSize: '18px' } })}
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '4px' }}>İşlem Türü</div>
                                        <span style={{
                                            backgroundColor: getActionColor(log.action),
                                            color: 'white',
                                            padding: '4px 12px',
                                            borderRadius: '8px',
                                            fontSize: '0.85rem',
                                            fontWeight: '600',
                                            textTransform: 'uppercase'
                                        }}>
                                            {formatStatus(log.action)}
                                        </span>
                                    </div>
                                </div>

                                {log.ip_address && (
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        padding: '12px',
                                        backgroundColor: '#f1f5f9',
                                        borderRadius: '10px'
                                    }}>
                                        {React.createElement(FaNetworkWired as any, { style: { color: '#64748b', fontSize: '16px' } })}
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '2px' }}>IP Adresi</div>
                                            <div style={{
                                                fontFamily: 'monospace',
                                                color: '#1e293b',
                                                fontSize: '0.95rem',
                                                fontWeight: '500'
                                            }}>
                                                {log.ip_address}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Detailed Record Info */}
                            {renderRecordDetails()}
                        </div>

                        {/* Footer */}
                        <div style={{
                            padding: '16px 24px',
                            borderTop: '1px solid #e2e8f0',
                            display: 'flex',
                            justifyContent: 'flex-end',
                            flexShrink: 0,
                            backgroundColor: 'white'
                        }}>
                            <button
                                onClick={onClose}
                                style={{
                                    backgroundColor: '#3b82f6',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '10px 24px',
                                    fontSize: '0.95rem',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'background 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
                            >
                                Kapat
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default ActivityLogDetailModal;
