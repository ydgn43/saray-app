import React, { useState, useEffect, useMemo } from 'react';
import {
    LogOut,
    LogIn,
    AlertTriangle,
    Clock,
    Search,
    ShieldAlert,
    Plus,
    Calendar,
    CheckCircle2,
    Edit2,
    Trash2,
    Users,
    User,
    Filter,
    Info,
    RefreshCw,
    X,
    SlidersHorizontal,
    Check,
    ChevronDown,
    Wrench,
    FileText
} from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import config from '../config';
import { authFetch } from '../utils/authFetch';
import PageHeader from '../components/PageHeader';

const API = config.API_BASE_URL;

interface Student {
    studentid: number;
    first_name: string;
    last_name: string;
    class_name?: string;
}

interface OutLog {
    id: number;
    studentid: number;
    first_name: string;
    last_name: string;
    class_name: string;
    reason: string;
    notes?: string;
    exit_time: string;
    expected_return_time?: string | null;
    actual_return_time?: string | null;
    max_allowed_minutes?: number;
    is_late: boolean | number;
    late_minutes: number;
    status: 'OUT' | 'RETURNED';
    created_at?: string;
}

interface FoulSummary {
    studentid: number;
    first_name: string;
    last_name: string;
    class_name: string;
    total_exits: number;
    total_late_fouls: number;
    total_late_minutes: number;
    last_foul_date?: string | null;
    last_exit_date?: string | null;
    is_currently_out?: number | boolean;
}

// Helper to convert Date to YYYY-MM-DDTHH:mm string for datetime-local input
const toDateTimeLocal = (date: Date = new Date()): string => {
    const d = new Date(date);
    const pad = (n: number) => n.toString().padStart(2, '0');
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// Format a date string in Turkish locale nicely
const formatDateTime = (dateStr?: string | null): string => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const formatTimeOnly = (dateStr?: string | null): string => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
};

const formatDuration = (minutes: number): string => {
    if (!minutes || minutes <= 0) return '0 dk';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0 && m > 0) return `${h} sa ${m} dk`;
    if (h > 0) return `${h} saat`;
    return `${m} dk`;
};

const ExitTracking: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'live' | 'fouls' | 'history'>('live');
    const [students, setStudents] = useState<Student[]>([]);
    const [outLogs, setOutLogs] = useState<OutLog[]>([]);
    const [foulsSummary, setFoulsSummary] = useState<FoulSummary[]>([]);
    const [loading, setLoading] = useState(false);

    // Filter states
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [historyDateFilter, setHistoryDateFilter] = useState<'all' | 'today' | 'yesterday' | 'week' | 'month'>('all');
    const [historyReasonFilter, setHistoryReasonFilter] = useState<string>('all');
    const [historyStatusFilter, setHistoryStatusFilter] = useState<'all' | 'late' | 'ontime' | 'out'>('all');
    const [foulsOnlyFilter, setFoulsOnlyFilter] = useState<boolean>(true);

    // Modal: New Exit Record
    const [showNewModal, setShowNewModal] = useState(false);
    const [entryMode, setEntryMode] = useState<'active' | 'direct'>('active'); // active: student going out now/scheduled, direct: exit & entrance entered together
    const [selectionType, setSelectionType] = useState<'single' | 'batch'>('single');
    const [selectedStudent, setSelectedStudent] = useState<number | ''>('');
    const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
    const [classFilter, setClassFilter] = useState<string>('all');
    const [reason, setReason] = useState<string>('Market/Kişisel');
    const [customReason, setCustomReason] = useState<string>('');
    const [exitTime, setExitTime] = useState<string>(toDateTimeLocal());
    const [thresholdType, setThresholdType] = useState<'duration' | 'datetime' | 'none'>('duration');
    const [durationMinutes, setDurationMinutes] = useState<number>(60);
    const [expectedReturnTime, setExpectedReturnTime] = useState<string>('');
    const [actualReturnTimeDirect, setActualReturnTimeDirect] = useState<string>(toDateTimeLocal());
    const [notes, setNotes] = useState<string>('');

    // Modal: Record Return (Entrance)
    const [returnModalLog, setReturnModalLog] = useState<OutLog | null>(null);
    const [returnInputTime, setReturnInputTime] = useState<string>(toDateTimeLocal());

    // Modal: Edit Log
    const [editLog, setEditLog] = useState<OutLog | null>(null);
    const [editReason, setEditReason] = useState<string>('');
    const [editExitTime, setEditExitTime] = useState<string>('');
    const [editHasThreshold, setEditHasThreshold] = useState<boolean>(true);
    const [editExpectedReturn, setEditExpectedReturn] = useState<string>('');
    const [editActualReturn, setEditActualReturn] = useState<string>('');
    const [editNotes, setEditNotes] = useState<string>('');
    const [editStatus, setEditStatus] = useState<'OUT' | 'RETURNED'>('OUT');

    // Modal: Student Foul History Details
    const [selectedStudentForHistory, setSelectedStudentForHistory] = useState<Student | null>(null);
    const [studentHistoryLogs, setStudentHistoryLogs] = useState<OutLog[]>([]);
    const [loadingStudentHistory, setLoadingStudentHistory] = useState(false);

    // Load initial data
    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        fetchStudents();
        fetchLogs();
        fetchFoulsSummary();
    };

    const fetchStudents = async () => {
        try {
            const res = await authFetch(`${API}/student`);
            if (res.ok) {
                const data = await res.json();
                setStudents(Array.isArray(data) ? data : []);
            }
        } catch {
            console.error("Öğrenci listesi yüklenemedi.");
        }
    };

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await authFetch(`${API}/exit/logs`);
            if (res.ok) {
                const data = await res.json();
                setOutLogs(Array.isArray(data) ? data : []);
            }
        } catch {
            toast.error("Çıkış/Giriş kayıtları yüklenemedi.");
        } finally {
            setLoading(false);
        }
    };

    const fetchFoulsSummary = async () => {
        try {
            const res = await authFetch(`${API}/exit/fouls-summary`);
            if (res.ok) {
                const data = await res.json();
                setFoulsSummary(Array.isArray(data) ? data : []);
            }
        } catch {
            console.error("İhlal istatistikleri alınamadı.");
        }
    };

    // Preset helper for weekend leave threshold (e.g. Sunday evening 20:00)
    const setSundayPreset = () => {
        const now = new Date();
        const nextSunday = new Date();
        const dayOfWeek = now.getDay();
        const diffDays = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
        nextSunday.setDate(now.getDate() + diffDays);
        nextSunday.setHours(20, 0, 0, 0);
        setThresholdType('datetime');
        setExpectedReturnTime(toDateTimeLocal(nextSunday));
    };

    const setTonightPreset = () => {
        const tonight = new Date();
        tonight.setHours(21, 0, 0, 0);
        setThresholdType('datetime');
        setExpectedReturnTime(toDateTimeLocal(tonight));
    };

    const setPlusHoursPreset = (hours: number) => {
        const base = exitTime ? new Date(exitTime) : new Date();
        const future = new Date(base.getTime() + hours * 60 * 60 * 1000);
        setThresholdType('datetime');
        setExpectedReturnTime(toDateTimeLocal(future));
    };

    // Open New Record Modal with defaults
    const handleOpenNewModal = (defaultReason: string = 'Market/Kişisel') => {
        setEntryMode('active');
        setSelectionType('single');
        setSelectedStudent('');
        setSelectedStudentIds([]);
        setReason(defaultReason);
        setCustomReason('');
        setExitTime(toDateTimeLocal());
        setNotes('');

        if (defaultReason === 'Haftasonu Tatili' || defaultReason === 'Haftasonu İzni') {
            setSundayPreset();
        } else {
            setThresholdType('duration');
            setDurationMinutes(60);
            setExpectedReturnTime('');
        }

        setShowNewModal(true);
    };

    // Save Exit Record
    const handleRecordExit = async (e: React.FormEvent) => {
        e.preventDefault();

        const activeReason = reason === 'Diğer' ? (customReason.trim() || 'Diğer') : reason;

        let targetIds: number[] = [];
        if (selectionType === 'batch') {
            targetIds = selectedStudentIds.map(Number).filter(id => Number.isInteger(id) && id > 0);
            if (targetIds.length === 0) {
                toast.warning("Lütfen en az bir talebe seçiniz.");
                return;
            }
        } else {
            const parsed = Number(selectedStudent);
            if (!Number.isInteger(parsed) || parsed <= 0) {
                toast.warning("Lütfen bir talebe seçiniz.");
                return;
            }
            targetIds = [parsed];
        }

        const primaryStudentId = targetIds[0];
        const payload: any = {
            studentid: primaryStudentId, // Required for backend compatibility
            studentids: targetIds,
            reason: activeReason,
            notes: notes.trim() || null,
            exitTime: exitTime || new Date().toISOString(),
            thresholdType,
            customMaxMinutes: Number(durationMinutes) || 60,
            directReturn: entryMode === 'direct',
        };

        if (thresholdType === 'duration') {
            payload.customMaxMinutes = Number(durationMinutes) || 60;
        } else if (thresholdType === 'datetime') {
            if (!expectedReturnTime) {
                toast.warning("Lütfen dönüş zaman eşiğini belirtiniz.");
                return;
            }
            payload.expectedReturnTime = expectedReturnTime;
        }

        if (entryMode === 'direct') {
            if (!actualReturnTimeDirect) {
                toast.warning("Lütfen fiili dönüş saatini giriniz.");
                return;
            }
            if (new Date(actualReturnTimeDirect) < new Date(exitTime)) {
                toast.warning("Dönüş saati, çıkış saatinden önce olamaz.");
                return;
            }
            payload.actualReturnTime = actualReturnTimeDirect;
        }

        try {
            const res = await authFetch(`${API}/exit/record-exit`, {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (res.ok) {
                toast.success(data.message || "Çıkış kaydı başarıyla oluşturuldu.");
                setShowNewModal(false);
                fetchLogs();
                fetchFoulsSummary();
            } else {
                toast.error(data.error || "Çıkış kaydı oluşturulamadı.");
            }
        } catch {
            toast.error("Sunucu iletişim hatası.");
        }
    };

    // Open Return Modal
    const handleOpenReturnModal = (log: OutLog) => {
        setReturnModalLog(log);
        setReturnInputTime(toDateTimeLocal());
    };

    // Submit Return with manual time
    const handleSubmitReturn = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!returnModalLog) return;

        try {
            const res = await authFetch(`${API}/exit/record-return`, {
                method: 'POST',
                body: JSON.stringify({
                    logId: returnModalLog.id,
                    actualReturnTime: returnInputTime || new Date().toISOString(),
                })
            });

            const data = await res.json();
            if (res.ok) {
                if (data.isLate) {
                    toast.warning(`Talebe ${data.lateMinutes} dakika geç kaldı (Kural İhlali).`);
                } else {
                    toast.success("Giriş kaydı başarıyla alındı.");
                }
                setReturnModalLog(null);
                fetchLogs();
                fetchFoulsSummary();
            } else {
                toast.error(data.error || "Giriş kaydı alınamadı.");
            }
        } catch {
            toast.error("Sunucu iletişim hatası.");
        }
    };

    // Open Edit Log Modal
    const handleOpenEditModal = (log: OutLog) => {
        setEditLog(log);
        setEditReason(log.reason);
        setEditExitTime(log.exit_time ? toDateTimeLocal(new Date(log.exit_time)) : '');
        setEditHasThreshold(Boolean(log.expected_return_time));
        setEditExpectedReturn(log.expected_return_time ? toDateTimeLocal(new Date(log.expected_return_time)) : '');
        setEditActualReturn(log.actual_return_time ? toDateTimeLocal(new Date(log.actual_return_time)) : '');
        setEditNotes(log.notes || '');
        setEditStatus(log.status);
    };

    // Submit Edit Log
    const handleSubmitEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editLog) return;

        try {
            const res = await authFetch(`${API}/exit/logs/${editLog.id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    reason: editReason,
                    exitTime: editExitTime,
                    expectedReturnTime: editHasThreshold && editExpectedReturn ? editExpectedReturn : null,
                    actualReturnTime: editStatus === 'RETURNED' && editActualReturn ? editActualReturn : null,
                    status: editStatus,
                    notes: editNotes.trim() || null,
                })
            });

            const data = await res.json();
            if (res.ok) {
                toast.success("Kayıt güncellendi.");
                setEditLog(null);
                fetchLogs();
                fetchFoulsSummary();
            } else {
                toast.error(data.error || "Güncelleme başarısız.");
            }
        } catch {
            toast.error("Sunucu iletişim hatası.");
        }
    };

    // Delete Log
    const handleDeleteLog = async (logId: number) => {
        if (!window.confirm("Bu kaydı silmek istediğinize emin misiniz?")) return;

        try {
            const res = await authFetch(`${API}/exit/logs/${logId}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                toast.success("Kayıt silindi.");
                fetchLogs();
                fetchFoulsSummary();
            } else {
                toast.error("Kayıt silinemedi.");
            }
        } catch {
            toast.error("Sunucu hatası.");
        }
    };

    // Open Student History Modal
    const handleOpenStudentHistory = async (studentId: number) => {
        const targetStudent = students.find(s => s.studentid === studentId);
        if (!targetStudent) return;

        setSelectedStudentForHistory(targetStudent);
        setLoadingStudentHistory(true);
        try {
            const res = await authFetch(`${API}/exit/student/${studentId}`);
            if (res.ok) {
                const data = await res.json();
                setStudentHistoryLogs(Array.isArray(data) ? data : []);
            }
        } catch {
            toast.error("Talebe geçmişi yüklenemedi.");
        } finally {
            setLoadingStudentHistory(false);
        }
    };

    // Unique classes list for filter
    const classesList = useMemo(() => {
        const clsSet = new Set<string>();
        students.forEach(s => {
            if (s.class_name) clsSet.add(s.class_name);
        });
        return Array.from(clsSet).sort();
    }, [students]);

    // Active currently OUT logs
    const activeOutLogs = useMemo(() => {
        return outLogs.filter(log => log.status === 'OUT');
    }, [outLogs]);

    // Filtered currently OUT logs
    const filteredOutLogs = useMemo(() => {
        return activeOutLogs.filter(log => {
            const matchesSearch = `${log.first_name} ${log.last_name} ${log.class_name || ''} ${log.reason}`
                .toLowerCase()
                .includes(searchTerm.toLowerCase());
            return matchesSearch;
        });
    }, [activeOutLogs, searchTerm]);

    // Filtered Foul Summary
    const filteredFoulsSummary = useMemo(() => {
        return foulsSummary.filter(f => {
            const matchesSearch = `${f.first_name} ${f.last_name} ${f.class_name || ''}`
                .toLowerCase()
                .includes(searchTerm.toLowerCase());
            if (foulsOnlyFilter && f.total_late_fouls <= 0) return false;
            return matchesSearch;
        });
    }, [foulsSummary, searchTerm, foulsOnlyFilter]);

    // Filtered History Logs
    const filteredHistoryLogs = useMemo(() => {
        const now = new Date();
        const todayStr = now.toISOString().slice(0, 10);

        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().slice(0, 10);

        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        return outLogs.filter(log => {
            // Search
            const searchTarget = `${log.first_name} ${log.last_name} ${log.class_name || ''} ${log.reason} ${log.notes || ''}`.toLowerCase();
            if (searchTerm && !searchTarget.includes(searchTerm.toLowerCase())) return false;

            // Reason
            if (historyReasonFilter !== 'all' && log.reason !== historyReasonFilter) return false;

            // Status
            if (historyStatusFilter === 'late' && (!log.is_late || log.status !== 'RETURNED')) return false;
            if (historyStatusFilter === 'ontime' && (log.is_late || log.status !== 'RETURNED')) return false;
            if (historyStatusFilter === 'out' && log.status !== 'OUT') return false;

            // Date
            const exitDate = new Date(log.exit_time);
            const exitDateStr = exitDate.toISOString().slice(0, 10);

            if (historyDateFilter === 'today' && exitDateStr !== todayStr) return false;
            if (historyDateFilter === 'yesterday' && exitDateStr !== yesterdayStr) return false;
            if (historyDateFilter === 'week' && exitDate < oneWeekAgo) return false;
            if (historyDateFilter === 'month' && exitDate < oneMonthAgo) return false;

            return true;
        });
    }, [outLogs, searchTerm, historyReasonFilter, historyStatusFilter, historyDateFilter]);

    // Aggregated top metrics
    const statsMetrics = useMemo(() => {
        const currentlyOutCount = activeOutLogs.length;
        const now = new Date();
        const overdueCount = activeOutLogs.filter(log => {
            if (!log.expected_return_time) return false;
            return now > new Date(log.expected_return_time);
        }).length;

        const todayStr = now.toISOString().slice(0, 10);
        const todayExitsCount = outLogs.filter(log => log.exit_time.slice(0, 10) === todayStr).length;

        const totalLateFoulsCount = foulsSummary.reduce((sum, f) => sum + Number(f.total_late_fouls || 0), 0);

        return {
            currentlyOutCount,
            overdueCount,
            todayExitsCount,
            totalLateFoulsCount,
        };
    }, [activeOutLogs, outLogs, foulsSummary]);

    // Handle batch selection helper
    const handleToggleStudentSelection = (sid: number) => {
        setSelectedStudentIds(prev =>
            prev.includes(sid) ? prev.filter(id => id !== sid) : [...prev, sid]
        );
    };

    const handleSelectAllInClass = () => {
        const studentsInClass = students.filter(s =>
            classFilter === 'all' ? true : s.class_name === classFilter
        );
        const ids = studentsInClass.map(s => s.studentid);
        const allSelected = ids.every(id => selectedStudentIds.includes(id));
        if (allSelected) {
            setSelectedStudentIds(prev => prev.filter(id => !ids.includes(id)));
        } else {
            setSelectedStudentIds(prev => Array.from(new Set([...prev, ...ids])));
        }
    };

    return (
        <div className="container" style={{ padding: '0 12px', maxWidth: 1240 }}>
            <ToastContainer position="top-right" autoClose={3000} />

            {/* Work In Progress Banner */}
            <div
                className="alert border-0 shadow-sm d-flex align-items-center gap-3 mb-3"
                style={{
                    backgroundColor: '#fffbeb',
                    borderLeft: '5px solid #f59e0b',
                    borderRadius: '12px',
                    padding: '12px 18px',
                    color: '#92400e'
                }}
            >
                <div
                    style={{
                        width: 38,
                        height: 38,
                        borderRadius: '10px',
                        backgroundColor: '#fef3c7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                    }}
                >
                    <Wrench size={20} color="#d97706" />
                </div>
                <div className="flex-grow-1">
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                        <span className="fw-bold" style={{ fontSize: '0.95rem' }}>
                            Çıkış / Giriş ve Foya Takibi Modülü
                        </span>
                        <span
                            className="badge"
                            style={{
                                backgroundColor: '#fef3c7',
                                color: '#b45309',
                                border: '1px solid #fde68a',
                                fontSize: '0.75rem',
                                padding: '3px 8px'
                            }}
                        >
                            🚧 Geliştirilme Aşamasında
                        </span>
                    </div>
                    <small style={{ color: '#b45309', fontSize: '0.85rem' }}>
                        Bu sistem manuel saat girişi, opsiyonel izin eşikleri ve geç kalma foya istatistikleri ile aktif olarak test edilmektedir.
                    </small>
                </div>
            </div>

            {/* Page Header */}
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                <PageHeader
                    icon=""
                    title="Çıkış / Giriş ve İzin Takibi"
                    subtitle="Market, haftasonu tatili ve özel izinlerde çıkış/giriş saatlerini kaydedin, eşik aşımlarını ve foyaları takip edin"
                    color="#1e40af"
                />
                <div className="d-flex gap-2">
                    <button
                        onClick={fetchAllData}
                        className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
                        style={{ borderRadius: '8px', padding: '8px 12px' }}
                        title="Verileri Yenile"
                    >
                        <RefreshCw size={15} />
                        <span className="d-none d-sm-inline">Yenile</span>
                    </button>
                    <button
                        onClick={() => handleOpenNewModal('Market/Kişisel')}
                        className="btn btn-primary btn-sm d-flex align-items-center gap-1"
                        style={{
                            borderRadius: '8px',
                            padding: '8px 14px',
                            fontWeight: 600,
                            background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                            border: 'none'
                        }}
                    >
                        <Plus size={16} />
                        <span>Yeni Çıkış / İzin Kaydet</span>
                    </button>
                </div>
            </div>

            {/* Quick Summary Metric Cards */}
            <div className="row g-2 mb-3">
                <div className="col-6 col-md-3">
                    <div className="card shadow-sm border-0 h-100" style={{ borderRadius: '12px' }}>
                        <div className="card-body p-3 d-flex align-items-center gap-3">
                            <div
                                style={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: '10px',
                                    backgroundColor: '#eff6ff',
                                    color: '#2563eb',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                }}
                            >
                                <Clock size={22} />
                            </div>
                            <div>
                                <div className="text-muted small fw-semibold">Şu An Dışarıda</div>
                                <div className="fw-bold fs-4" style={{ color: '#1e293b' }}>
                                    {statsMetrics.currentlyOutCount}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-6 col-md-3">
                    <div className="card shadow-sm border-0 h-100" style={{ borderRadius: '12px' }}>
                        <div className="card-body p-3 d-flex align-items-center gap-3">
                            <div
                                style={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: '10px',
                                    backgroundColor: statsMetrics.overdueCount > 0 ? '#fef2f2' : '#f8fafc',
                                    color: statsMetrics.overdueCount > 0 ? '#dc2626' : '#94a3b8',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                }}
                            >
                                <AlertTriangle size={22} />
                            </div>
                            <div>
                                <div className="text-muted small fw-semibold">Süresi Dolan / Geciken</div>
                                <div
                                    className="fw-bold fs-4"
                                    style={{ color: statsMetrics.overdueCount > 0 ? '#dc2626' : '#1e293b' }}
                                >
                                    {statsMetrics.overdueCount}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-6 col-md-3">
                    <div className="card shadow-sm border-0 h-100" style={{ borderRadius: '12px' }}>
                        <div className="card-body p-3 d-flex align-items-center gap-3">
                            <div
                                style={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: '10px',
                                    backgroundColor: '#f0fdf4',
                                    color: '#16a34a',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                }}
                            >
                                <LogOut size={22} />
                            </div>
                            <div>
                                <div className="text-muted small fw-semibold">Bugünkü Çıkışlar</div>
                                <div className="fw-bold fs-4" style={{ color: '#1e293b' }}>
                                    {statsMetrics.todayExitsCount}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-6 col-md-3">
                    <div className="card shadow-sm border-0 h-100" style={{ borderRadius: '12px' }}>
                        <div className="card-body p-3 d-flex align-items-center gap-3">
                            <div
                                style={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: '10px',
                                    backgroundColor: statsMetrics.totalLateFoulsCount > 0 ? '#fff1f2' : '#f8fafc',
                                    color: statsMetrics.totalLateFoulsCount > 0 ? '#e11d48' : '#94a3b8',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                }}
                            >
                                <ShieldAlert size={22} />
                            </div>
                            <div>
                                <div className="text-muted small fw-semibold">Toplam Foya (İhlal)</div>
                                <div
                                    className="fw-bold fs-4"
                                    style={{ color: statsMetrics.totalLateFoulsCount > 0 ? '#e11d48' : '#1e293b' }}
                                >
                                    {statsMetrics.totalLateFoulsCount}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs Bar */}
            <div className="card shadow-sm border-0 mb-3" style={{ borderRadius: '12px' }}>
                <div className="card-body p-2 p-md-3 d-flex flex-wrap align-items-center justify-content-between gap-2">
                    <div className="d-flex flex-wrap gap-2">
                        <button
                            onClick={() => setActiveTab('live')}
                            className={`btn btn-sm ${activeTab === 'live' ? 'btn-primary' : 'btn-outline-secondary'}`}
                            style={{ borderRadius: '8px', fontWeight: 600, padding: '7px 14px' }}
                        >
                            <span className="d-flex align-items-center gap-1.5">
                                <Clock size={15} />
                                Şu An Dışarıdakiler
                                <span className="badge bg-light text-primary ms-1" style={{ fontSize: '0.75rem' }}>
                                    {activeOutLogs.length}
                                </span>
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveTab('fouls')}
                            className={`btn btn-sm ${activeTab === 'fouls' ? 'btn-danger' : 'btn-outline-secondary'}`}
                            style={{ borderRadius: '8px', fontWeight: 600, padding: '7px 14px' }}
                        >
                            <span className="d-flex align-items-center gap-1.5">
                                <ShieldAlert size={15} />
                                Geç Kalma İhlalleri (Foyalar)
                                {statsMetrics.totalLateFoulsCount > 0 && (
                                    <span className="badge bg-light text-danger ms-1" style={{ fontSize: '0.75rem' }}>
                                        {statsMetrics.totalLateFoulsCount}
                                    </span>
                                )}
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`btn btn-sm ${activeTab === 'history' ? 'btn-primary' : 'btn-outline-secondary'}`}
                            style={{ borderRadius: '8px', fontWeight: 600, padding: '7px 14px' }}
                        >
                            <span className="d-flex align-items-center gap-1.5">
                                <FileText size={15} />
                                Tüm Giriş/Çıkış Geçmişi
                            </span>
                        </button>
                    </div>

                    <div className="d-flex gap-2">
                        <div className="input-group input-group-sm" style={{ width: 220 }}>
                            <span className="input-group-text bg-white border-end-0">
                                <Search size={14} color="#64748b" />
                            </span>
                            <input
                                type="text"
                                placeholder="Talebe ara..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="form-control border-start-0"
                            />
                            {searchTerm && (
                                <button
                                    className="btn btn-outline-secondary border-start-0 bg-white"
                                    onClick={() => setSearchTerm('')}
                                >
                                    <X size={12} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* TAB 1: LIVE (Şu An Dışarıdakiler) */}
            {activeTab === 'live' && (
                <div className="card shadow-sm border-0" style={{ borderRadius: '12px' }}>
                    <div className="card-body p-3 p-md-4">
                        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                            <h5 className="fw-bold mb-0 d-flex align-items-center gap-2" style={{ color: '#1e293b' }}>
                                <Clock size={19} color="#f59e0b" />
                                Aktif Olarak Dışarıda Olan Talebeler
                            </h5>
                            <span className="text-muted small">
                                Toplam <strong>{filteredOutLogs.length}</strong> talebe dışarıda
                            </span>
                        </div>

                        {loading && (
                            <div className="text-center py-5">
                                <div className="spinner-border text-primary" role="status" />
                                <div className="text-muted small mt-2">Kayıtlar yükleniyor...</div>
                            </div>
                        )}

                        {!loading && filteredOutLogs.length === 0 && (
                            <div className="text-center text-muted py-5 border rounded-3" style={{ borderStyle: 'dashed' }}>
                                <Clock size={36} color="#cbd5e1" className="mb-2" />
                                <div className="fw-semibold">Şu an aktif izinli veya dışarıda talebe bulunmuyor.</div>
                                <div className="small text-muted mt-1">
                                    Yeni bir izin vermek için "Yeni Çıkış / İzin Kaydet" butonunu kullanabilirsiniz.
                                </div>
                            </div>
                        )}

                        {!loading && filteredOutLogs.length > 0 && (
                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0">
                                    <thead className="table-light">
                                        <tr style={{ fontSize: '0.85rem', color: '#475569' }}>
                                            <th>Talebe</th>
                                            <th>Sınıf</th>
                                            <th>Çıkış Nedeni</th>
                                            <th>Çıkış Saati</th>
                                            <th>Dönüş Zaman Eşiği</th>
                                            <th>Kalan / Gecikme</th>
                                            <th className="text-end">İşlem</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredOutLogs.map((log) => {
                                            const hasThreshold = Boolean(log.expected_return_time);
                                            const expectedDate = log.expected_return_time ? new Date(log.expected_return_time) : null;
                                            const now = new Date();
                                            const isOverdue = expectedDate ? now > expectedDate : false;
                                            const diffMinutes = expectedDate
                                                ? Math.round(Math.abs(now.getTime() - expectedDate.getTime()) / 60000)
                                                : 0;

                                            return (
                                                <tr
                                                    key={log.id}
                                                    style={{
                                                        backgroundColor: isOverdue ? '#fff1f2' : undefined,
                                                        transition: 'background-color 0.2s'
                                                    }}
                                                >
                                                    <td>
                                                        <div className="fw-semibold text-dark">
                                                            {log.first_name} {log.last_name}
                                                        </div>
                                                        {log.notes && (
                                                            <small className="text-muted d-block text-truncate" style={{ maxWidth: 220 }}>
                                                                📝 {log.notes}
                                                            </small>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <span className="badge bg-secondary-subtle text-secondary border">
                                                            {log.class_name || '-'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span
                                                            className="badge"
                                                            style={{
                                                                backgroundColor: log.reason.includes('Haftasonu') ? '#f3e8ff' : '#e0f2fe',
                                                                color: log.reason.includes('Haftasonu') ? '#7e22ce' : '#0369a1',
                                                                border: log.reason.includes('Haftasonu') ? '1px solid #d8b4fe' : '1px solid #bae6fd',
                                                            }}
                                                        >
                                                            {log.reason}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className="fw-semibold">{formatTimeOnly(log.exit_time)}</div>
                                                        <small className="text-muted">{formatDateTime(log.exit_time).slice(0, 10)}</small>
                                                    </td>
                                                    <td>
                                                        {hasThreshold ? (
                                                            <div>
                                                                <div className="fw-semibold" style={{ color: isOverdue ? '#dc2626' : '#1e293b' }}>
                                                                    {formatTimeOnly(log.expected_return_time)}
                                                                </div>
                                                                <small className="text-muted">{formatDateTime(log.expected_return_time).slice(0, 10)}</small>
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted small">Süre Sınırı Yok</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        {hasThreshold ? (
                                                            isOverdue ? (
                                                                <span
                                                                    className="badge bg-danger-subtle text-danger border border-danger-subtle d-inline-flex align-items-center gap-1"
                                                                    style={{ padding: '5px 8px' }}
                                                                >
                                                                    <AlertTriangle size={13} />
                                                                    {diffMinutes} dk Gecikti (İhlal)
                                                                </span>
                                                            ) : (
                                                                <span
                                                                    className="badge bg-success-subtle text-success border border-success-subtle"
                                                                    style={{ padding: '5px 8px' }}
                                                                >
                                                                    {diffMinutes} dk kaldı
                                                                </span>
                                                            )
                                                        ) : (
                                                            <span className="badge bg-light text-muted border">Serbest İzin</span>
                                                        )}
                                                    </td>
                                                    <td className="text-end">
                                                        <div className="d-inline-flex gap-1">
                                                            <button
                                                                onClick={() => handleOpenReturnModal(log)}
                                                                className="btn btn-sm btn-success d-inline-flex align-items-center gap-1"
                                                                style={{ borderRadius: '8px', fontWeight: 600, padding: '6px 12px' }}
                                                            >
                                                                <LogIn size={14} />
                                                                <span>Giriş Yap</span>
                                                            </button>
                                                            <button
                                                                onClick={() => handleOpenEditModal(log)}
                                                                className="btn btn-sm btn-outline-secondary"
                                                                style={{ borderRadius: '8px', padding: '6px 8px' }}
                                                                title="Düzenle"
                                                            >
                                                                <Edit2 size={13} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB 2: FOULS SUMMARY (Geç Kalma İhlalleri & Foyalar) */}
            {activeTab === 'fouls' && (
                <div className="card shadow-sm border-0" style={{ borderRadius: '12px' }}>
                    <div className="card-body p-3 p-md-4">
                        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                            <div>
                                <h5 className="fw-bold mb-1 d-flex align-items-center gap-2" style={{ color: '#1e293b' }}>
                                    <ShieldAlert size={19} color="#dc2626" />
                                    Talebe Geç Kalma (Foya) İstatistik Tablosu
                                </h5>
                                <div className="text-muted small">
                                    Belirlenen zaman eşiğini aşarak yurda geç dönen talebelerin ceza ve foya istatistikleri
                                </div>
                            </div>

                            <div className="form-check form-switch mb-0">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id="foulsOnlySwitch"
                                    checked={foulsOnlyFilter}
                                    onChange={(e) => setFoulsOnlyFilter(e.target.checked)}
                                    style={{ cursor: 'pointer' }}
                                />
                                <label className="form-check-label small fw-semibold text-muted" htmlFor="foulsOnlySwitch" style={{ cursor: 'pointer' }}>
                                    Sadece İhlali Olanları Göster
                                </label>
                            </div>
                        </div>

                        {filteredFoulsSummary.length === 0 ? (
                            <div className="text-center text-muted py-5 border rounded-3" style={{ borderStyle: 'dashed' }}>
                                <CheckCircle2 size={36} color="#22c55e" className="mb-2" />
                                <div className="fw-semibold">
                                    {foulsOnlyFilter ? "Kayıtlı geç kalma ihlali (foya) bulunamadı. Tebrikler!" : "Kayıtlı talebe bulunamadı."}
                                </div>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0">
                                    <thead className="table-light">
                                        <tr style={{ fontSize: '0.85rem', color: '#475569' }}>
                                            <th>Sıra</th>
                                            <th>Talebe</th>
                                            <th>Sınıf</th>
                                            <th>Toplam Çıkış İzni</th>
                                            <th>Toplam İhlal (Foya)</th>
                                            <th>Toplam Gecikilen Süre</th>
                                            <th>Son İhlal Tarihi</th>
                                            <th>Durum</th>
                                            <th className="text-end">İşlem</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredFoulsSummary.map((f, index) => {
                                            const hasFouls = Number(f.total_late_fouls) > 0;
                                            return (
                                                <tr key={f.studentid} style={{ backgroundColor: hasFouls ? '#fffbfb' : undefined }}>
                                                    <td className="text-muted fw-semibold" style={{ width: 40 }}>
                                                        #{index + 1}
                                                    </td>
                                                    <td>
                                                        <div className="fw-bold text-dark">{f.first_name} {f.last_name}</div>
                                                    </td>
                                                    <td>
                                                        <span className="badge bg-secondary-subtle text-secondary border">
                                                            {f.class_name || '-'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className="fw-semibold text-secondary">{f.total_exits || 0}</span> kez
                                                    </td>
                                                    <td>
                                                        {hasFouls ? (
                                                            <span
                                                                className="badge bg-danger-subtle text-danger border border-danger-subtle"
                                                                style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                                                            >
                                                                🚨 {f.total_late_fouls} İhlal
                                                            </span>
                                                        ) : (
                                                            <span className="badge bg-success-subtle text-success border border-success-subtle">
                                                                ✅ Temiz (0)
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <span className="fw-semibold" style={{ color: hasFouls ? '#b91c1c' : '#64748b' }}>
                                                            {formatDuration(Number(f.total_late_minutes || 0))}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {f.last_foul_date ? (
                                                            <small className="text-muted">{formatDateTime(f.last_foul_date)}</small>
                                                        ) : (
                                                            <span className="text-muted small">-</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        {f.is_currently_out ? (
                                                            <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle">
                                                                Şu an Dışarıda
                                                            </span>
                                                        ) : (
                                                            <span className="badge bg-light text-muted border">Yurtta</span>
                                                        )}
                                                    </td>
                                                    <td className="text-end">
                                                        <button
                                                            onClick={() => handleOpenStudentHistory(f.studentid)}
                                                            className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1"
                                                            style={{ borderRadius: '8px', padding: '5px 10px', fontWeight: 600 }}
                                                        >
                                                            <FileText size={13} />
                                                            <span>Detaylar</span>
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB 3: COMPLETE HISTORY (Tüm Giriş / Çıkış Geçmişi) */}
            {activeTab === 'history' && (
                <div className="card shadow-sm border-0" style={{ borderRadius: '12px' }}>
                    <div className="card-body p-3 p-md-4">
                        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                            <h5 className="fw-bold mb-0 d-flex align-items-center gap-2" style={{ color: '#1e293b' }}>
                                <FileText size={19} color="#2563eb" />
                                Tüm Çıkış ve Giriş Hareket Geçmişi
                            </h5>
                            <span className="text-muted small">
                                Toplam <strong>{filteredHistoryLogs.length}</strong> hareket listeleniyor
                            </span>
                        </div>

                        {/* Filter toolbar */}
                        <div className="card bg-light border-0 mb-3" style={{ borderRadius: '10px' }}>
                            <div className="card-body p-2 p-md-3 d-flex flex-wrap align-items-center gap-2">
                                <div className="d-flex align-items-center gap-1 small text-muted me-1">
                                    <Filter size={14} /> Filtreler:
                                </div>

                                {/* Date Filter */}
                                <select
                                    value={historyDateFilter}
                                    onChange={(e: any) => setHistoryDateFilter(e.target.value)}
                                    className="form-select form-select-sm"
                                    style={{ width: 'auto', minWidth: 120 }}
                                >
                                    <option value="all">Tüm Zamanlar</option>
                                    <option value="today">Bugün</option>
                                    <option value="yesterday">Dün</option>
                                    <option value="week">Son 7 Gün</option>
                                    <option value="month">Son 30 Gün</option>
                                </select>

                                {/* Reason Filter */}
                                <select
                                    value={historyReasonFilter}
                                    onChange={(e) => setHistoryReasonFilter(e.target.value)}
                                    className="form-select form-select-sm"
                                    style={{ width: 'auto', minWidth: 140 }}
                                >
                                    <option value="all">Tüm Nedenler</option>
                                    <option value="Market/Kişisel">Market / Kişisel</option>
                                    <option value="Haftasonu Tatili">Haftasonu Tatili</option>
                                    <option value="Aile İzni">Aile İzni</option>
                                    <option value="Doktor/Hastane">Doktor / Hastane</option>
                                    <option value="Okul/Kurs">Okul / Kurs</option>
                                </select>

                                {/* Status Filter */}
                                <select
                                    value={historyStatusFilter}
                                    onChange={(e: any) => setHistoryStatusFilter(e.target.value)}
                                    className="form-select form-select-sm"
                                    style={{ width: 'auto', minWidth: 140 }}
                                >
                                    <option value="all">Tüm Durumlar</option>
                                    <option value="late">🚨 Yalnızca İhlaller (Geç Kalanlar)</option>
                                    <option value="ontime">✅ Zamanında Dönenler</option>
                                    <option value="out">⏳ Halen Dışarıda</option>
                                </select>

                                {(historyDateFilter !== 'all' || historyReasonFilter !== 'all' || historyStatusFilter !== 'all') && (
                                    <button
                                        onClick={() => {
                                            setHistoryDateFilter('all');
                                            setHistoryReasonFilter('all');
                                            setHistoryStatusFilter('all');
                                        }}
                                        className="btn btn-sm btn-link text-muted p-0 ms-2 small"
                                    >
                                        Filtreleri Temizle
                                    </button>
                                )}
                            </div>
                        </div>

                        {filteredHistoryLogs.length === 0 ? (
                            <div className="text-center text-muted py-5 border rounded-3" style={{ borderStyle: 'dashed' }}>
                                Aradığınız kriterlere uygun hareket kaydı bulunamadı.
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0">
                                    <thead className="table-light">
                                        <tr style={{ fontSize: '0.85rem', color: '#475569' }}>
                                            <th>Talebe</th>
                                            <th>Neden</th>
                                            <th>Çıkış Saati & Tarihi</th>
                                            <th>Belirlenen Eşik</th>
                                            <th>Fiili Dönüş Saati</th>
                                            <th>Sonuç / Durum</th>
                                            <th className="text-end">İşlemler</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredHistoryLogs.map((log) => {
                                            const isLate = Boolean(log.is_late);
                                            return (
                                                <tr key={log.id} style={{ backgroundColor: isLate ? '#fff5f5' : undefined }}>
                                                    <td>
                                                        <div className="fw-semibold text-dark">
                                                            {log.first_name} {log.last_name}
                                                        </div>
                                                        <small className="text-muted">{log.class_name || '-'}</small>
                                                        {log.notes && (
                                                            <div className="text-muted small mt-0.5 text-truncate" style={{ maxWidth: 220 }}>
                                                                📝 {log.notes}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <span className="badge bg-light text-dark border">
                                                            {log.reason}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className="fw-semibold">{formatDateTime(log.exit_time)}</div>
                                                    </td>
                                                    <td>
                                                        {log.expected_return_time ? (
                                                            <div className="small fw-semibold text-secondary">
                                                                {formatDateTime(log.expected_return_time)}
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted small">Eşik Yok</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        {log.actual_return_time ? (
                                                            <div className="fw-semibold text-dark">
                                                                {formatDateTime(log.actual_return_time)}
                                                            </div>
                                                        ) : (
                                                            <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle">
                                                                Dışarıda
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        {log.status === 'OUT' ? (
                                                            <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle">
                                                                ⏳ Dışarıda
                                                            </span>
                                                        ) : isLate ? (
                                                            <span className="badge bg-danger-subtle text-danger border border-danger-subtle">
                                                                🚨 {log.late_minutes} dk Geç (İhlal)
                                                            </span>
                                                        ) : (
                                                            <span className="badge bg-success-subtle text-success border border-success-subtle">
                                                                ✅ Zamanında
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="text-end">
                                                        <div className="d-inline-flex gap-1">
                                                            {log.status === 'OUT' && (
                                                                <button
                                                                    onClick={() => handleOpenReturnModal(log)}
                                                                    className="btn btn-sm btn-success"
                                                                    style={{ borderRadius: '6px', padding: '4px 8px' }}
                                                                    title="Giriş Yap"
                                                                >
                                                                    <LogIn size={13} />
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => handleOpenEditModal(log)}
                                                                className="btn btn-sm btn-outline-secondary"
                                                                style={{ borderRadius: '6px', padding: '4px 8px' }}
                                                                title="Düzenle"
                                                            >
                                                                <Edit2 size={13} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteLog(log.id)}
                                                                className="btn btn-sm btn-outline-danger"
                                                                style={{ borderRadius: '6px', padding: '4px 8px' }}
                                                                title="Sil"
                                                            >
                                                                <Trash2 size={13} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* MODAL: NEW EXIT RECORD */}
            {showNewModal && (
                <div
                    className="modal show d-block"
                    tabIndex={-1}
                    style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)', zIndex: 1050 }}
                >
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px' }}>
                            <div className="modal-header border-0 pb-0">
                                <h5 className="modal-title fw-bold d-flex align-items-center gap-2" style={{ color: '#1e3a8a' }}>
                                    <LogOut size={20} color="#2563eb" />
                                    Yeni Çıkış / İzin Kaydı Oluştur
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowNewModal(false)}
                                />
                            </div>

                            <form onSubmit={handleRecordExit}>
                                <div className="modal-body pt-3 pb-2">
                                    {/* Mode selector */}
                                    <div className="bg-light p-2 rounded-3 mb-3 d-flex gap-2">
                                        <button
                                            type="button"
                                            className={`btn btn-sm flex-fill ${entryMode === 'active' ? 'btn-primary shadow-sm' : 'btn-outline-secondary border-0'}`}
                                            onClick={() => setEntryMode('active')}
                                            style={{ borderRadius: '8px', fontWeight: 600 }}
                                        >
                                            <span className="d-inline-flex align-items-center gap-1">
                                                <Clock size={14} />
                                                Aktif Çıkış Başlat (Şu An / İleriye)
                                            </span>
                                        </button>
                                        <button
                                            type="button"
                                            className={`btn btn-sm flex-fill ${entryMode === 'direct' ? 'btn-primary shadow-sm' : 'btn-outline-secondary border-0'}`}
                                            onClick={() => setEntryMode('direct')}
                                            style={{ borderRadius: '8px', fontWeight: 600 }}
                                        >
                                            <span className="d-inline-flex align-items-center gap-1">
                                                <CheckCircle2 size={14} />
                                                Geçmiş / Tamamlanmış İzin Kaydet
                                            </span>
                                        </button>
                                    </div>

                                    {/* Student Selection (Single or Batch) */}
                                    <div className="mb-3">
                                        <div className="d-flex justify-content-between align-items-center mb-1">
                                            <label className="form-label fw-semibold mb-0">Talebe Seçimi</label>
                                            <div className="btn-group btn-group-sm">
                                                <button
                                                    type="button"
                                                    className={`btn btn-sm ${selectionType === 'single' ? 'btn-secondary' : 'btn-outline-secondary'}`}
                                                    onClick={() => setSelectionType('single')}
                                                >
                                                    <User size={13} className="me-1" /> Tek Talebe
                                                </button>
                                                <button
                                                    type="button"
                                                    className={`btn btn-sm ${selectionType === 'batch' ? 'btn-secondary' : 'btn-outline-secondary'}`}
                                                    onClick={() => setSelectionType('batch')}
                                                >
                                                    <Users size={13} className="me-1" /> Toplu Seçim (Sınıf / Grup)
                                                </button>
                                            </div>
                                        </div>

                                        {selectionType === 'single' ? (
                                            <select
                                                value={selectedStudent}
                                                onChange={(e) => {
                                                    const val = Number(e.target.value);
                                                    setSelectedStudent(Number.isInteger(val) && val > 0 ? val : '');
                                                }}
                                                className="form-select"
                                                required
                                            >
                                                <option value="">-- Talebe Seçin --</option>
                                                {students.map((st: any) => {
                                                    const sId = st.studentid ?? st.id;
                                                    return (
                                                        <option key={sId} value={sId}>
                                                            {st.first_name} {st.last_name} {st.class_name ? `(${st.class_name})` : ''}
                                                        </option>
                                                    );
                                                })}
                                            </select>
                                        ) : (
                                            <div className="border rounded-3 p-2 bg-light">
                                                <div className="d-flex justify-content-between align-items-center gap-2 mb-2">
                                                    <select
                                                        value={classFilter}
                                                        onChange={(e) => setClassFilter(e.target.value)}
                                                        className="form-select form-select-sm"
                                                        style={{ maxWidth: 200 }}
                                                    >
                                                        <option value="all">Tüm Sınıflar</option>
                                                        {classesList.map((cls) => (
                                                            <option key={cls} value={cls}>{cls}</option>
                                                        ))}
                                                    </select>
                                                    <button
                                                        type="button"
                                                        onClick={handleSelectAllInClass}
                                                        className="btn btn-sm btn-outline-primary"
                                                        style={{ borderRadius: '6px' }}
                                                    >
                                                        Sınıfın Tümünü Seç / Kaldır
                                                    </button>
                                                </div>

                                                <div
                                                    style={{
                                                        maxHeight: 160,
                                                        overflowY: 'auto',
                                                        backgroundColor: 'white',
                                                        borderRadius: '8px',
                                                        border: '1px solid #e2e8f0',
                                                        padding: '8px'
                                                    }}
                                                >
                                                    {students
                                                        .filter(st => classFilter === 'all' || st.class_name === classFilter)
                                                        .map((st) => {
                                                            const isChecked = selectedStudentIds.includes(st.studentid);
                                                            return (
                                                                <div
                                                                    key={st.studentid}
                                                                    className="form-check py-1 px-3 d-flex align-items-center justify-content-between"
                                                                    style={{
                                                                        cursor: 'pointer',
                                                                        backgroundColor: isChecked ? '#eff6ff' : undefined,
                                                                        borderRadius: '6px'
                                                                    }}
                                                                    onClick={() => handleToggleStudentSelection(st.studentid)}
                                                                >
                                                                    <div className="form-check-label user-select-none" style={{ cursor: 'pointer' }}>
                                                                        <span className="fw-semibold">{st.first_name} {st.last_name}</span>
                                                                        {st.class_name && <small className="text-muted ms-1">({st.class_name})</small>}
                                                                    </div>
                                                                    <input
                                                                        className="form-check-input ms-2"
                                                                        type="checkbox"
                                                                        checked={isChecked}
                                                                        onChange={() => { }}
                                                                        style={{ cursor: 'pointer' }}
                                                                    />
                                                                </div>
                                                            );
                                                        })}
                                                </div>
                                                <div className="small text-muted mt-1 text-end">
                                                    Seçilen Talebe: <strong>{selectedStudentIds.length}</strong> kişi
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Reason */}
                                    <div className="mb-3">
                                        <label className="form-label fw-semibold">Çıkış Nedeni</label>
                                        <div className="d-flex flex-wrap gap-1.5 mb-2">
                                            {[
                                                { label: 'Market / Kişisel', icon: '🛒', val: 'Market/Kişisel' },
                                                { label: 'Haftasonu Tatili', icon: '🏡', val: 'Haftasonu Tatili' },
                                                { label: 'Aile İzni', icon: '👨‍👩‍👧', val: 'Aile İzni' },
                                                { label: 'Doktor / Hastane', icon: '🏥', val: 'Doktor/Hastane' },
                                                { label: 'Okul / Kurs', icon: '📚', val: 'Okul/Kurs' },
                                                { label: 'Diğer', icon: '✏️', val: 'Diğer' },
                                            ].map((r) => (
                                                <button
                                                    key={r.val}
                                                    type="button"
                                                    onClick={() => {
                                                        setReason(r.val);
                                                        if (r.val === 'Haftasonu Tatili') setSundayPreset();
                                                    }}
                                                    className={`btn btn-sm ${reason === r.val ? 'btn-primary' : 'btn-outline-secondary'}`}
                                                    style={{ borderRadius: '8px', fontSize: '0.82rem' }}
                                                >
                                                    {r.icon} {r.label}
                                                </button>
                                            ))}
                                        </div>

                                        {reason === 'Diğer' && (
                                            <input
                                                type="text"
                                                placeholder="Özel çıkış nedeni yazınız..."
                                                value={customReason}
                                                onChange={(e) => setCustomReason(e.target.value)}
                                                className="form-control"
                                                required
                                            />
                                        )}
                                    </div>

                                    <div className="row g-3 mb-3">
                                        {/* Exit Time */}
                                        <div className="col-12 col-md-6">
                                            <label className="form-label fw-semibold d-flex justify-content-between align-items-center">
                                                <span>Çıkış Tarihi ve Saati</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setExitTime(toDateTimeLocal())}
                                                    className="btn btn-sm btn-link p-0 text-decoration-none small"
                                                >
                                                    Şu Anı Ayarla
                                                </button>
                                            </label>
                                            <input
                                                type="datetime-local"
                                                value={exitTime}
                                                onChange={(e) => setExitTime(e.target.value)}
                                                className="form-control"
                                                required
                                            />
                                        </div>

                                        {/* If direct mode, entrance time */}
                                        {entryMode === 'direct' && (
                                            <div className="col-12 col-md-6">
                                                <label className="form-label fw-semibold d-flex justify-content-between align-items-center">
                                                    <span>Fiili Dönüş Tarihi ve Saati</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setActualReturnTimeDirect(toDateTimeLocal())}
                                                        className="btn btn-sm btn-link p-0 text-decoration-none small"
                                                    >
                                                        Şu Anı Ayarla
                                                    </button>
                                                </label>
                                                <input
                                                    type="datetime-local"
                                                    value={actualReturnTimeDirect}
                                                    onChange={(e) => setActualReturnTimeDirect(e.target.value)}
                                                    className="form-control"
                                                    required
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* Return Threshold (Dönüş Zaman Eşiği) */}
                                    <div className="card bg-light border-0 p-3 rounded-3 mb-3">
                                        <label className="form-label fw-semibold mb-2 d-flex align-items-center gap-1.5" style={{ color: '#1e3a8a' }}>
                                            <SlidersHorizontal size={15} />
                                            Dönüş Zaman Eşiği (Opsiyonel Ceza / Foya Kuralı)
                                        </label>

                                        <div className="d-flex flex-wrap gap-2 mb-2.5">
                                            <div className="form-check">
                                                <input
                                                    className="form-check-input"
                                                    type="radio"
                                                    name="thresholdRadio"
                                                    id="threshDuration"
                                                    checked={thresholdType === 'duration'}
                                                    onChange={() => setThresholdType('duration')}
                                                />
                                                <label className="form-check-label small fw-semibold" htmlFor="threshDuration">
                                                    Süre Sınırı (Dakika)
                                                </label>
                                            </div>

                                            <div className="form-check">
                                                <input
                                                    className="form-check-input"
                                                    type="radio"
                                                    name="thresholdRadio"
                                                    id="threshDatetime"
                                                    checked={thresholdType === 'datetime'}
                                                    onChange={() => setThresholdType('datetime')}
                                                />
                                                <label className="form-check-label small fw-semibold" htmlFor="threshDatetime">
                                                    Belirli Tarih ve Saat (Eşik / Deadline)
                                                </label>
                                            </div>

                                            <div className="form-check">
                                                <input
                                                    className="form-check-input"
                                                    type="radio"
                                                    name="thresholdRadio"
                                                    id="threshNone"
                                                    checked={thresholdType === 'none'}
                                                    onChange={() => setThresholdType('none')}
                                                />
                                                <label className="form-check-label small fw-semibold" htmlFor="threshNone">
                                                    Eşik Yok (Süre Sınırı Yok)
                                                </label>
                                            </div>
                                        </div>

                                        {thresholdType === 'duration' && (
                                            <div>
                                                <div className="d-flex align-items-center gap-2 mb-2">
                                                    <input
                                                        type="number"
                                                        value={durationMinutes}
                                                        onChange={(e) => setDurationMinutes(Number(e.target.value))}
                                                        min={5}
                                                        max={10080}
                                                        className="form-control"
                                                        style={{ maxWidth: 140 }}
                                                        required
                                                    />
                                                    <span className="small text-muted">dakika içinde dönmeli</span>
                                                </div>
                                                <div className="d-flex gap-1">
                                                    {[30, 45, 60, 90, 120, 180].map((mins) => (
                                                        <button
                                                            key={mins}
                                                            type="button"
                                                            onClick={() => setDurationMinutes(mins)}
                                                            className={`btn btn-sm ${durationMinutes === mins ? 'btn-secondary' : 'btn-outline-secondary'}`}
                                                            style={{ fontSize: '0.75rem', padding: '2px 8px' }}
                                                        >
                                                            {mins} dk
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {thresholdType === 'datetime' && (
                                            <div>
                                                <input
                                                    type="datetime-local"
                                                    value={expectedReturnTime}
                                                    onChange={(e) => setExpectedReturnTime(e.target.value)}
                                                    className="form-control mb-2"
                                                    required
                                                />
                                                <div className="d-flex flex-wrap gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={setSundayPreset}
                                                        className="btn btn-sm btn-outline-primary"
                                                        style={{ fontSize: '0.75rem', padding: '3px 8px' }}
                                                    >
                                                        🏡 Pazar Akşamı 20:00
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={setTonightPreset}
                                                        className="btn btn-sm btn-outline-secondary"
                                                        style={{ fontSize: '0.75rem', padding: '3px 8px' }}
                                                    >
                                                        🌙 Bu Akşam 21:00
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setPlusHoursPreset(1)}
                                                        className="btn btn-sm btn-outline-secondary"
                                                        style={{ fontSize: '0.75rem', padding: '3px 8px' }}
                                                    >
                                                        +1 Saat
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setPlusHoursPreset(2)}
                                                        className="btn btn-sm btn-outline-secondary"
                                                        style={{ fontSize: '0.75rem', padding: '3px 8px' }}
                                                    >
                                                        +2 Saat
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {thresholdType === 'none' && (
                                            <div className="text-muted small">
                                                Bu izin için geç kalma eşiği belirlenmeyecek. Talebe geç kalsa dahi foya (ceza) yazılmaz.
                                            </div>
                                        )}
                                    </div>

                                    {/* Notes */}
                                    <div className="mb-2">
                                        <label className="form-label fw-semibold">Not / Açıklama (Opsiyonel)</label>
                                        <textarea
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            placeholder="Gidilecek yer, kimin izni vb..."
                                            rows={2}
                                            className="form-control"
                                        />
                                    </div>
                                </div>

                                <div className="modal-footer border-0 pt-0">
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary"
                                        onClick={() => setShowNewModal(false)}
                                    >
                                        İptal
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary fw-semibold px-4"
                                        style={{ background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)', border: 'none' }}
                                    >
                                        {entryMode === 'direct' ? 'Çıkış ve Girişi Birlikte Kaydet' : 'Çıkış İznini Başlat'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: RECORD RETURN (Manuel Giriş Saati Girişi) */}
            {returnModalLog && (
                <div
                    className="modal show d-block"
                    tabIndex={-1}
                    style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)', zIndex: 1050 }}
                >
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px' }}>
                            <div className="modal-header border-0 pb-0">
                                <h5 className="modal-title fw-bold d-flex align-items-center gap-2" style={{ color: '#16a34a' }}>
                                    <LogIn size={20} color="#16a34a" />
                                    Talebe Giriş Kaydı Al
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setReturnModalLog(null)}
                                />
                            </div>

                            <form onSubmit={handleSubmitReturn}>
                                <div className="modal-body pt-3 pb-2">
                                    {/* Student Card */}
                                    <div className="bg-light p-3 rounded-3 mb-3">
                                        <div className="fw-bold fs-6 text-dark">
                                            {returnModalLog.first_name} {returnModalLog.last_name}
                                        </div>
                                        <div className="small text-muted mb-2">
                                            Sınıf: <strong>{returnModalLog.class_name || '-'}</strong> • Neden: <strong>{returnModalLog.reason}</strong>
                                        </div>
                                        <div className="d-flex justify-content-between small text-secondary">
                                            <span>Çıkış Saati: <strong>{formatDateTime(returnModalLog.exit_time)}</strong></span>
                                            {returnModalLog.expected_return_time && (
                                                <span>Eşik: <strong>{formatDateTime(returnModalLog.expected_return_time)}</strong></span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Return Time Input */}
                                    <div className="mb-3">
                                        <label className="form-label fw-semibold d-flex justify-content-between align-items-center">
                                            <span>Fiili Dönüş Tarihi ve Saati</span>
                                            <button
                                                type="button"
                                                onClick={() => setReturnInputTime(toDateTimeLocal())}
                                                className="btn btn-sm btn-link p-0 text-decoration-none small"
                                            >
                                                Şu Anı Ayarla
                                            </button>
                                        </label>
                                        <input
                                            type="datetime-local"
                                            value={returnInputTime}
                                            onChange={(e) => setReturnInputTime(e.target.value)}
                                            className="form-control mb-2"
                                            required
                                        />

                                        {/* Quick adjustment pills */}
                                        <div className="d-flex gap-1 flex-wrap">
                                            <button
                                                type="button"
                                                onClick={() => setReturnInputTime(toDateTimeLocal())}
                                                className="btn btn-sm btn-outline-secondary"
                                                style={{ fontSize: '0.75rem', padding: '2px 8px' }}
                                            >
                                                Tam Şu An
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const d = new Date();
                                                    d.setMinutes(d.getMinutes() - 15);
                                                    setReturnInputTime(toDateTimeLocal(d));
                                                }}
                                                className="btn btn-sm btn-outline-secondary"
                                                style={{ fontSize: '0.75rem', padding: '2px 8px' }}
                                            >
                                                15 dk önce
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const d = new Date();
                                                    d.setMinutes(d.getMinutes() - 30);
                                                    setReturnInputTime(toDateTimeLocal(d));
                                                }}
                                                className="btn btn-sm btn-outline-secondary"
                                                style={{ fontSize: '0.75rem', padding: '2px 8px' }}
                                            >
                                                30 dk önce
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const d = new Date();
                                                    d.setHours(d.getHours() - 1);
                                                    setReturnInputTime(toDateTimeLocal(d));
                                                }}
                                                className="btn btn-sm btn-outline-secondary"
                                                style={{ fontSize: '0.75rem', padding: '2px 8px' }}
                                            >
                                                1 saat önce
                                            </button>
                                        </div>
                                    </div>

                                    {/* Live evaluation preview */}
                                    {(() => {
                                        if (!returnModalLog.expected_return_time) {
                                            return (
                                                <div className="alert alert-light border small text-muted mb-0">
                                                    ℹ️ Bu izin için eşik saati belirlenmemişti. Giriş doğrudan kaydedilecektir.
                                                </div>
                                            );
                                        }

                                        const expDate = new Date(returnModalLog.expected_return_time);
                                        const retDate = new Date(returnInputTime);
                                        if (retDate > expDate) {
                                            const diffM = Math.round((retDate.getTime() - expDate.getTime()) / 60000);
                                            return (
                                                <div className="alert alert-danger border-0 small d-flex align-items-center gap-2 mb-0" style={{ backgroundColor: '#fef2f2', color: '#991b1b' }}>
                                                    <AlertTriangle size={18} color="#dc2626" />
                                                    <div>
                                                        <strong>Dikkat:</strong> Talebe eşikten <strong>{diffM} dakika geç</strong> girdi. Bu durum <strong>1 foya/ihlal</strong> olarak kaydedilecek.
                                                    </div>
                                                </div>
                                            );
                                        }

                                        return (
                                            <div className="alert alert-success border-0 small d-flex align-items-center gap-2 mb-0" style={{ backgroundColor: '#f0fdf4', color: '#166534' }}>
                                                <CheckCircle2 size={18} color="#16a34a" />
                                                <div>
                                                    Talebe belirlenen eşik dahilinde <strong>zamanında</strong> döndü. İhlal yazılmayacak.
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>

                                <div className="modal-footer border-0 pt-0">
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary"
                                        onClick={() => setReturnModalLog(null)}
                                    >
                                        İptal
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-success fw-semibold px-4"
                                    >
                                        Girişi Onayla
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: EDIT LOG */}
            {editLog && (
                <div
                    className="modal show d-block"
                    tabIndex={-1}
                    style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)', zIndex: 1050 }}
                >
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px' }}>
                            <div className="modal-header border-0 pb-0">
                                <h5 className="modal-title fw-bold d-flex align-items-center gap-2" style={{ color: '#1e3a8a' }}>
                                    <Edit2 size={18} color="#2563eb" />
                                    İzin / Hareket Kaydını Düzenle
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setEditLog(null)}
                                />
                            </div>

                            <form onSubmit={handleSubmitEdit}>
                                <div className="modal-body pt-3 pb-2">
                                    <div className="bg-light p-2 rounded-2 mb-3 small">
                                        Talebe: <strong>{editLog.first_name} {editLog.last_name}</strong> ({editLog.class_name || '-'})
                                    </div>

                                    <div className="mb-2">
                                        <label className="form-label fw-semibold small">Çıkış Nedeni</label>
                                        <input
                                            type="text"
                                            value={editReason}
                                            onChange={(e) => setEditReason(e.target.value)}
                                            className="form-control form-control-sm"
                                            required
                                        />
                                    </div>

                                    <div className="mb-2">
                                        <label className="form-label fw-semibold small">Çıkış Saati ve Tarihi</label>
                                        <input
                                            type="datetime-local"
                                            value={editExitTime}
                                            onChange={(e) => setEditExitTime(e.target.value)}
                                            className="form-control form-control-sm"
                                            required
                                        />
                                    </div>

                                    <div className="mb-2">
                                        <div className="form-check form-switch mb-1">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                id="editThreshSwitch"
                                                checked={editHasThreshold}
                                                onChange={(e) => setEditHasThreshold(e.target.checked)}
                                            />
                                            <label className="form-check-label small fw-semibold" htmlFor="editThreshSwitch">
                                                Dönüş Eşiği Var
                                            </label>
                                        </div>
                                        {editHasThreshold && (
                                            <input
                                                type="datetime-local"
                                                value={editExpectedReturn}
                                                onChange={(e) => setEditExpectedReturn(e.target.value)}
                                                className="form-control form-control-sm"
                                            />
                                        )}
                                    </div>

                                    <div className="mb-2">
                                        <label className="form-label fw-semibold small">Durum</label>
                                        <select
                                            value={editStatus}
                                            onChange={(e: any) => setEditStatus(e.target.value)}
                                            className="form-select form-select-sm"
                                        >
                                            <option value="OUT">Dışarıda (OUT)</option>
                                            <option value="RETURNED">Döndü (RETURNED)</option>
                                        </select>
                                    </div>

                                    {editStatus === 'RETURNED' && (
                                        <div className="mb-2">
                                            <label className="form-label fw-semibold small">Fiili Dönüş Saati</label>
                                            <input
                                                type="datetime-local"
                                                value={editActualReturn}
                                                onChange={(e) => setEditActualReturn(e.target.value)}
                                                className="form-control form-control-sm"
                                            />
                                        </div>
                                    )}

                                    <div className="mb-2">
                                        <label className="form-label fw-semibold small">Not / Açıklama</label>
                                        <textarea
                                            value={editNotes}
                                            onChange={(e) => setEditNotes(e.target.value)}
                                            rows={2}
                                            className="form-control form-control-sm"
                                        />
                                    </div>
                                </div>

                                <div className="modal-footer border-0 pt-0">
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-outline-secondary"
                                        onClick={() => setEditLog(null)}
                                    >
                                        İptal
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-sm btn-primary fw-semibold px-3"
                                    >
                                        Değişiklikleri Kaydet
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: STUDENT FOUL HISTORY DETAILS */}
            {selectedStudentForHistory && (
                <div
                    className="modal show d-block"
                    tabIndex={-1}
                    style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)', zIndex: 1050 }}
                >
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px' }}>
                            <div className="modal-header border-0 pb-0">
                                <div>
                                    <h5 className="modal-title fw-bold text-dark d-flex align-items-center gap-2">
                                        <ShieldAlert size={20} color="#dc2626" />
                                        {selectedStudentForHistory.first_name} {selectedStudentForHistory.last_name}
                                    </h5>
                                    <small className="text-muted">
                                        Sınıf: {selectedStudentForHistory.class_name || '-'} • İzin ve Geç Kalma Geçmişi
                                    </small>
                                </div>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setSelectedStudentForHistory(null)}
                                />
                            </div>

                            <div className="modal-body pt-3">
                                {loadingStudentHistory ? (
                                    <div className="text-center py-4">
                                        <div className="spinner-border text-primary" role="status" />
                                    </div>
                                ) : studentHistoryLogs.length === 0 ? (
                                    <div className="text-center text-muted py-4">
                                        Kayıtlı çıkış veya izin hareketi bulunmuyor.
                                    </div>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="table table-sm table-hover align-middle mb-0">
                                            <thead className="table-light">
                                                <tr style={{ fontSize: '0.8rem' }}>
                                                    <th>Neden</th>
                                                    <th>Çıkış Saati</th>
                                                    <th>Belirlenen Eşik</th>
                                                    <th>Fiili Dönüş</th>
                                                    <th>Sonuç</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {studentHistoryLogs.map((l) => (
                                                    <tr key={l.id} style={{ backgroundColor: l.is_late ? '#fff5f5' : undefined }}>
                                                        <td>
                                                            <div className="fw-semibold">{l.reason}</div>
                                                            {l.notes && <small className="text-muted d-block">{l.notes}</small>}
                                                        </td>
                                                        <td>{formatDateTime(l.exit_time)}</td>
                                                        <td>{l.expected_return_time ? formatDateTime(l.expected_return_time) : 'Eşik Yok'}</td>
                                                        <td>{l.actual_return_time ? formatDateTime(l.actual_return_time) : 'Dışarıda'}</td>
                                                        <td>
                                                            {l.status === 'OUT' ? (
                                                                <span className="badge bg-warning-subtle text-warning-emphasis border">Dışarıda</span>
                                                            ) : l.is_late ? (
                                                                <span className="badge bg-danger-subtle text-danger border">
                                                                    🚨 {l.late_minutes} dk Geç Döndü
                                                                </span>
                                                            ) : (
                                                                <span className="badge bg-success-subtle text-success border">
                                                                    ✅ Zamanında
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            <div className="modal-footer border-0 pt-0">
                                <button
                                    type="button"
                                    className="btn btn-sm btn-outline-secondary"
                                    onClick={() => setSelectedStudentForHistory(null)}
                                >
                                    Kapat
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExitTracking;

