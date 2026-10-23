import React, { useState, useEffect } from 'react';
import { LogOut, LogIn, AlertTriangle, Clock, Search, ShieldAlert, Filter } from 'lucide-react';
import { toast } from 'react-toastify';

// API Base URL - matches your current app configuration
const API = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

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

export const ExitTracking: React.FC = () => {
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

    const token = localStorage.getItem('token');
    const authHeaders = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
    };

    // Load initial data
    useEffect(() => {
        fetchStudents();
        fetchLogs();
        fetchFoulsSummary();
    }, []);

    const fetchStudents = async () => {
        try {
            const res = await fetch(`${API}/student`, { headers: authHeaders });
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
            const res = await fetch(`${API}/exit/logs`, { headers: authHeaders });
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
            const res = await fetch(`${API}/exit/fouls-summary`, { headers: authHeaders });
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
            const res = await fetch(`${API}/exit/record-exit`, {
                method: 'POST',
                headers: authHeaders,
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
            const res = await fetch(`${API}/exit/record-return`, {
                method: 'POST',
                headers: authHeaders,
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
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Clock className="w-7 h-7 text-indigo-600" />
                        Talebe Dışarı Çıkış - Giriş & İhlal Takibi
                    </h1>
                    <p className="text-gray-500 text-sm">
                        Market, izin ve haftasonu çıkış saatlerini takip edin; geç kalma sürelerini otomatik hesaplayın.
                    </p>
                </div>

                {/* Tab Controls */}
                <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('live')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'live' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        Dışarıdakiler ({activeOutLogs.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('fouls')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'fouls' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        Geç Kalma İhlalleri
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'history' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        Tüm Geçmiş
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            {activeTab === 'live' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Record Exit Form Card */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-fit">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <LogOut className="w-5 h-5 text-indigo-600" />
                            Yeni Çıkış İzni Ver
                        </h2>
                        <form onSubmit={handleRecordExit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Talebe Seçin</label>
                                <select
                                    value={selectedStudent}
                                    onChange={(e) => setSelectedStudent(Number(e.target.value) || '')}
                                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Çıkış Nedeni</label>
                                <select
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                >
                                    <option value="Market/Kişisel">Market / Kişisel İhtiyaç</option>
                                    <option value="Aile İzni">Aile İzni</option>
                                    <option value="Haftasonu Tatili">Haftasonu Tatili</option>
                                    <option value="Doktor/Hastane">Doktor / Hastane</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    İzin Süresi (Dakika)
                                </label>
                                <input
                                    type="number"
                                    value={durationMinutes}
                                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                                    min={10}
                                    max={1440}
                                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Not / Açıklama</label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Opsiyonel ek bilgi..."
                                    rows={2}
                                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg text-sm transition-all shadow-sm flex items-center justify-center gap-2"
                            >
                                <LogOut className="w-4 h-4" />
                                Çıkış İznini Kaydet
                            </button>
                        </form>
                    </div>

                    {/* Currently Outside List */}
                    <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                <Clock className="w-5 h-5 text-amber-500" />
                                Şu An Dışarıda Olan Talebeler
                            </h2>
                            <div className="relative w-64">
                                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Talebe ara..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                            </div>
                        </div>

                        {filteredOutLogs.length === 0 ? (
                            <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-100 rounded-lg">
                                Dışarıda aktif izinli talebe bulunmuyor.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-200 bg-gray-50 text-gray-600">
                                            <th className="p-3">Talebe</th>
                                            <th className="p-3">Neden</th>
                                            <th className="p-3">Çıkış Saati</th>
                                            <th className="p-3">Beklenen Dönüş</th>
                                            <th className="p-3 text-right">İşlem</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredOutLogs.map((log) => {
                                            const isOverdue = new Date() > new Date(log.expected_return_time);
                                            return (
                                                <tr key={log.id} className={isOverdue ? 'bg-red-50/60' : 'hover:bg-gray-50'}>
                                                    <td className="p-3 font-medium text-gray-900">
                                                        {log.first_name} {log.last_name}
                                                        <span className="block text-xs text-gray-400">{log.class_name}</span>
                                                    </td>
                                                    <td className="p-3 text-gray-600">
                                                        <span className="inline-block px-2 py-1 bg-gray-100 rounded text-xs font-medium text-gray-700">
                                                            {log.reason}
                                                        </span>
                                                    </td>
                                                    <td className="p-3 text-gray-600">
                                                        {new Date(log.exit_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </td>
                                                    <td className="p-3">
                                                        <span className={`font-semibold ${isOverdue ? 'text-red-600 flex items-center gap-1' : 'text-gray-700'}`}>
                                                            {isOverdue && <AlertTriangle className="w-3.5 h-3.5" />}
                                                            {new Date(log.expected_return_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </td>
                                                    <td className="p-3 text-right">
                                                        <button
                                                            onClick={() => handleRecordReturn(log.id)}
                                                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-all shadow-sm inline-flex items-center gap-1"
                                                        >
                                                            <LogIn className="w-3.5 h-3.5" />
                                                            Giriş Yap
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

            {/* Fouls / Late Returns Tab */}
            {activeTab === 'fouls' && (
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5 text-red-600" />
                        Talebe Geç Kalma (Foya) İstatistik Özet Listesi
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead>
                                <tr className="border-b border-gray-200 bg-gray-50 text-gray-600">
                                    <th className="p-3">Talebe</th>
                                    <th className="p-3">Sınıf</th>
                                    <th className="p-3">Toplam Çıkış Sayısı</th>
                                    <th className="p-3">Toplam İhlal (Geç Kalma)</th>
                                    <th className="p-3">Toplam Gecikilen Süre</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {foulsSummary.map((f) => (
                                    <tr key={f.studentid} className="hover:bg-gray-50">
                                        <td className="p-3 font-medium text-gray-900">{f.first_name} {f.last_name}</td>
                                        <td className="p-3 text-gray-500">{f.class_name || '-'}</td>
                                        <td className="p-3 text-gray-700">{f.total_exits || 0}</td>
                                        <td className="p-3 font-bold text-red-600">
                                            {f.total_late_fouls > 0 ? (
                                                <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">
                                                    {f.total_late_fouls} İhlal
                                                </span>
                                            ) : (
                                                <span className="text-emerald-600 text-xs">Temiz</span>
                                            )}
                                        </td>
                                        <td className="p-3 text-gray-600">{f.total_late_minutes || 0} dakika</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Complete History Tab */}
            {activeTab === 'history' && (
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Tüm Çıkış ve Giriş Hareket Geçmişi</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead>
                                <tr className="border-b border-gray-200 bg-gray-50 text-gray-600">
                                    <th className="p-3">Talebe</th>
                                    <th className="p-3">Neden</th>
                                    <th className="p-3">Çıkış</th>
                                    <th className="p-3">Giriş</th>
                                    <th className="p-3">Durum</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {outLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50">
                                        <td className="p-3 font-medium text-gray-900">{log.first_name} {log.last_name}</td>
                                        <td className="p-3 text-gray-600">{log.reason}</td>
                                        <td className="p-3 text-gray-600">{new Date(log.exit_time).toLocaleString()}</td>
                                        <td className="p-3 text-gray-600">
                                            {log.actual_return_time ? new Date(log.actual_return_time).toLocaleString() : 'Devam ediyor'}
                                        </td>
                                        <td className="p-3">
                                            {log.status === 'OUT' ? (
                                                <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded text-xs font-medium">Dışarıda</span>
                                            ) : log.is_late ? (
                                                <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
                                                    {log.late_minutes} dk Geç Döndü
                                                </span>
                                            ) : (
                                                <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded text-xs font-medium">Zamanında</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};