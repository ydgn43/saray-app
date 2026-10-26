import React, { useState, useEffect } from 'react';
import { LogOut, LogIn, AlertTriangle, Clock, Search, ShieldAlert } from 'lucide-react';
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
    expected_return_time: string;
    actual_return_time?: string;
    is_late: boolean;
    late_minutes: number;
    status: 'OUT' | 'RETURNED';
}

interface FoulSummary {
    studentid: number;
    first_name: string;
    last_name: string;
    class_name: string;
    total_exits: number;
    total_late_fouls: number;
    total_late_minutes: number;
}

const ExitTracking: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'live' | 'fouls' | 'history'>('live');
    const [students, setStudents] = useState<Student[]>([]);
    const [outLogs, setOutLogs] = useState<OutLog[]>([]);
    const [foulsSummary, setFoulsSummary] = useState<FoulSummary[]>([]);
    const [loading, setLoading] = useState(false);

    // Form states for creating exit record
    const [selectedStudent, setSelectedStudent] = useState<number | ''>('');
    const [reason, setReason] = useState<string>('Market/Kişisel');
    const [durationMinutes, setDurationMinutes] = useState<number>(60);
    const [notes, setNotes] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState<string>('');

    // Load initial data
    useEffect(() => {
        fetchStudents();
        fetchLogs();
        fetchFoulsSummary();
    }, []);

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

    // Record Student Exit (Dışarı Çıkış İzni Oluştur)
    const handleRecordExit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStudent) {
            toast.warning("Lütfen bir talebe seçin.");
            return;
        }

        try {
            const res = await authFetch(`${API}/exit/record-exit`, {
                method: 'POST',
                body: JSON.stringify({
                    studentid: selectedStudent,
                    reason,
                    customMaxMinutes: Number(durationMinutes),
                    notes
                })
            });

            if (res.ok) {
                toast.success("Çıkış kaydı oluşturuldu.");
                setSelectedStudent('');
                setNotes('');
                fetchLogs();
                fetchFoulsSummary();
            } else {
                toast.error("Çıkış kaydı oluşturulamadı.");
            }
        } catch {
            toast.error("Sunucu hatası.");
        }
    };

    // Record Student Return (Giriş Yap / Teslim Al)
    const handleRecordReturn = async (logId: number) => {
        try {
            const res = await authFetch(`${API}/exit/record-return`, {
                method: 'POST',
                body: JSON.stringify({ logId })
            });

            const data = await res.json();
            if (res.ok) {
                if (data.isLate) {
                    toast.warning(`Talebe ${data.lateMinutes} dakika geç kaldı (Kural İhlali).`);
                } else {
                    toast.success("Giriş kaydı alındı.");
                }
                fetchLogs();
                fetchFoulsSummary();
            } else {
                toast.error(data.error || "Giriş kaydı alınamadı.");
            }
        } catch {
            toast.error("Sunucu hatası.");
        }
    };

    // Filtered lists
    const activeOutLogs = outLogs.filter(log => log.status === 'OUT');
    const filteredOutLogs = activeOutLogs.filter(log =>
        `${log.first_name} ${log.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="container" style={{ padding: '0 12px', maxWidth: 1200 }}>
            <ToastContainer />
            <PageHeader
                icon=""
                title="Çıkış / Giriş Takibi"
                subtitle="Market, izin veya tatil çıkışlarını ve geç kalma ihlallerini yönetin"
                color="#1e40af"
            />

            <div className="card shadow border-0 mb-3" style={{ borderRadius: '12px' }}>
                <div className="card-body p-2 p-md-3 d-flex flex-wrap gap-2">
                    <button
                        onClick={() => setActiveTab('live')}
                        className={`btn btn-sm ${activeTab === 'live' ? 'btn-primary' : 'btn-outline-secondary'}`}
                        style={{ borderRadius: '8px', fontWeight: 600 }}
                    >
                        Dışarıdakiler ({activeOutLogs.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('fouls')}
                        className={`btn btn-sm ${activeTab === 'fouls' ? 'btn-primary' : 'btn-outline-secondary'}`}
                        style={{ borderRadius: '8px', fontWeight: 600 }}
                    >
                        Geç Kalma İhlalleri
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`btn btn-sm ${activeTab === 'history' ? 'btn-primary' : 'btn-outline-secondary'}`}
                        style={{ borderRadius: '8px', fontWeight: 600 }}
                    >
                        Tüm Geçmiş
                    </button>
                </div>
            </div>

            {activeTab === 'live' && (
                <div className="row g-3">
                    <div className="col-12 col-lg-4">
                        <div className="card shadow border-0" style={{ borderRadius: '12px' }}>
                            <div className="card-body p-3 p-md-4">
                                <h5 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: '#334155' }}>
                                    <LogOut size={18} color="#2563eb" />
                                    Yeni Çıkış İzni Ver
                                </h5>
                                <form onSubmit={handleRecordExit}>
                                    <div className="mb-3">
                                        <label className="form-label fw-semibold">Talebe Seçin</label>
                                        <select
                                            value={selectedStudent}
                                            onChange={(e) => setSelectedStudent(Number(e.target.value) || '')}
                                            className="form-select"
                                            required
                                        >
                                            <option value="">-- Talebe Seçin --</option>
                                            {students.map((st) => (
                                                <option key={st.studentid} value={st.studentid}>
                                                    {st.first_name} {st.last_name} {st.class_name ? `(${st.class_name})` : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label fw-semibold">Çıkış Nedeni</label>
                                        <select
                                            value={reason}
                                            onChange={(e) => setReason(e.target.value)}
                                            className="form-select"
                                        >
                                            <option value="Market/Kişisel">Market / Kişisel İhtiyaç</option>
                                            <option value="Aile İzni">Aile İzni</option>
                                            <option value="Haftasonu Tatili">Haftasonu Tatili</option>
                                            <option value="Doktor/Hastane">Doktor / Hastane</option>
                                        </select>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label fw-semibold">İzin Süresi (Dakika)</label>
                                        <input
                                            type="number"
                                            value={durationMinutes}
                                            onChange={(e) => setDurationMinutes(Number(e.target.value))}
                                            min={10}
                                            max={1440}
                                            className="form-control"
                                            required
                                        />
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label fw-semibold">Not / Açıklama</label>
                                        <textarea
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            placeholder="Opsiyonel ek bilgi..."
                                            rows={2}
                                            className="form-control"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        className="btn w-100"
                                        style={{
                                            borderRadius: '8px',
                                            padding: '10px 16px',
                                            fontWeight: 600,
                                            background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
                                            border: 'none',
                                            color: 'white'
                                        }}
                                    >
                                        <span className="d-inline-flex align-items-center gap-2">
                                            <LogOut size={14} />
                                            Çıkış İznini Kaydet
                                        </span>
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>

                    <div className="col-12 col-lg-8">
                        <div className="card shadow border-0" style={{ borderRadius: '12px' }}>
                            <div className="card-body p-3 p-md-4">
                                <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                                    <h5 className="fw-bold mb-0 d-flex align-items-center gap-2" style={{ color: '#334155' }}>
                                        <Clock size={18} color="#f59e0b" />
                                        Şu An Dışarıda Olan Talebeler
                                    </h5>
                                    <div className="input-group" style={{ maxWidth: 280 }}>
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
                                    </div>
                                </div>

                                {loading && (
                                    <div className="text-center py-4">
                                        <div className="spinner-border text-primary" role="status" />
                                    </div>
                                )}

                                {!loading && filteredOutLogs.length === 0 && (
                                    <div className="text-center text-muted py-5 border rounded" style={{ borderStyle: 'dashed' }}>
                                        Dışarıda aktif izinli talebe bulunmuyor.
                                    </div>
                                )}

                                {!loading && filteredOutLogs.length > 0 && (
                                    <div className="table-responsive">
                                        <table className="table table-hover align-middle mb-0">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>Talebe</th>
                                                    <th>Neden</th>
                                                    <th>Çıkış Saati</th>
                                                    <th>Beklenen Dönüş</th>
                                                    <th className="text-end">İşlem</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredOutLogs.map((log) => {
                                                    const isOverdue = new Date() > new Date(log.expected_return_time);
                                                    return (
                                                        <tr key={log.id} className={isOverdue ? 'table-danger' : ''}>
                                                            <td>
                                                                <div className="fw-semibold">{log.first_name} {log.last_name}</div>
                                                                <small className="text-muted">{log.class_name || '-'}</small>
                                                            </td>
                                                            <td>
                                                                <span className="badge bg-light text-dark border">{log.reason}</span>
                                                            </td>
                                                            <td>{new Date(log.exit_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                                            <td className={isOverdue ? 'text-danger fw-semibold' : 'fw-semibold'}>
                                                                <span className="d-inline-flex align-items-center gap-1">
                                                                    {isOverdue && <AlertTriangle size={14} />}
                                                                    {new Date(log.expected_return_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                            </td>
                                                            <td className="text-end">
                                                                <button
                                                                    onClick={() => handleRecordReturn(log.id)}
                                                                    className="btn btn-sm btn-success"
                                                                    style={{ borderRadius: '8px', fontWeight: 600 }}
                                                                >
                                                                    <span className="d-inline-flex align-items-center gap-1">
                                                                        <LogIn size={14} />
                                                                        Giriş Yap
                                                                    </span>
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
                    </div>
                </div>
            )}

            {activeTab === 'fouls' && (
                <div className="card shadow border-0" style={{ borderRadius: '12px' }}>
                    <div className="card-body p-3 p-md-4">
                        <h5 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: '#334155' }}>
                            <ShieldAlert size={18} color="#dc2626" />
                            Talebe Geç Kalma (Foya) İstatistik Özet Listesi
                        </h5>
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th>Talebe</th>
                                        <th>Sınıf</th>
                                        <th>Toplam Çıkış Sayısı</th>
                                        <th>Toplam İhlal (Geç Kalma)</th>
                                        <th>Toplam Gecikilen Süre</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {foulsSummary.map((f) => (
                                        <tr key={f.studentid}>
                                            <td className="fw-semibold">{f.first_name} {f.last_name}</td>
                                            <td>{f.class_name || '-'}</td>
                                            <td>{f.total_exits || 0}</td>
                                            <td>
                                                {f.total_late_fouls > 0 ? (
                                                    <span className="badge bg-danger-subtle text-danger border border-danger-subtle">
                                                        {f.total_late_fouls} İhlal
                                                    </span>
                                                ) : (
                                                    <span className="badge bg-success-subtle text-success border border-success-subtle">
                                                        Temiz
                                                    </span>
                                                )}
                                            </td>
                                            <td>{f.total_late_minutes || 0} dakika</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'history' && (
                <div className="card shadow border-0" style={{ borderRadius: '12px' }}>
                    <div className="card-body p-3 p-md-4">
                        <h5 className="fw-bold mb-3" style={{ color: '#334155' }}>Tüm Çıkış ve Giriş Hareket Geçmişi</h5>
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th>Talebe</th>
                                        <th>Neden</th>
                                        <th>Çıkış</th>
                                        <th>Giriş</th>
                                        <th>Durum</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {outLogs.map((log) => (
                                        <tr key={log.id}>
                                            <td className="fw-semibold">{log.first_name} {log.last_name}</td>
                                            <td>{log.reason}</td>
                                            <td>{new Date(log.exit_time).toLocaleString()}</td>
                                            <td>{log.actual_return_time ? new Date(log.actual_return_time).toLocaleString() : 'Devam ediyor'}</td>
                                            <td>
                                                {log.status === 'OUT' ? (
                                                    <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle">Dışarıda</span>
                                                ) : log.is_late ? (
                                                    <span className="badge bg-danger-subtle text-danger border border-danger-subtle">{log.late_minutes} dk Geç Döndü</span>
                                                ) : (
                                                    <span className="badge bg-success-subtle text-success border border-success-subtle">Zamanında</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExitTracking;