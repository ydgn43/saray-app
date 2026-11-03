// src/components/exit/HistoryTab.tsx
// "Geçmiş" tab: all exit records with filters. Click a row to edit it.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { RefreshCw, Search } from 'lucide-react';
import { exitApi } from './exitApi';
import { ExitLog } from './exitTypes';
import { dayStartIso, formatDateTime } from './exitTime';
import StatusBadge from './StatusBadge';

interface Props {
    tz: string;
    now: Date;
    refreshKey: number; // changes when something was saved elsewhere -> reload
    studentFilter: { id: number; name: string } | null;
    onClearStudent: () => void;
    onEdit: (log: ExitLog) => void;
}

export default function HistoryTab({ tz, now, refreshKey, studentFilter, onClearStudent, onEdit }: Props) {
    const [logs, setLogs] = useState<ExitLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState<'' | 'OUT' | 'RETURNED'>('');
    const [onlyLate, setOnlyLate] = useState(false);
    const [fromDay, setFromDay] = useState('');
    const [toDay, setToDay] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await exitApi.logs({
                studentid: studentFilter?.id,
                status: status || undefined,
                from: fromDay ? dayStartIso(fromDay, tz) ?? undefined : undefined,
                to: toDay ? dayStartIso(toDay, tz, 1) ?? undefined : undefined, // up to the END of the chosen day
                limit: 1000,
            });
            setLogs(data);
        } catch (e) {
            toast.error((e as Error).message);
        } finally {
            setLoading(false);
        }
    }, [studentFilter, status, fromDay, toDay, tz]);

    useEffect(() => {
        load();
    }, [load, refreshKey]);

    const visible = useMemo(() => {
        const q = search.trim().toLocaleLowerCase('tr-TR');
        return logs.filter((l) => {
            if (onlyLate && !(l.is_late || l.is_overdue)) return false;
            if (!q) return true;
            return `${l.first_name} ${l.last_name} ${l.class_name ?? ''} ${l.reason}`.toLocaleLowerCase('tr-TR').includes(q);
        });
    }, [logs, search, onlyLate]);

    return (
        <div>
            <div className="d-flex flex-wrap gap-2 align-items-end mb-3">
                <div className="input-group input-group-sm" style={{ maxWidth: 260 }}>
                    <span className="input-group-text"><Search size={14} /></span>
                    <input className="form-control" placeholder="Ara: isim, sınıf, neden" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <select className="form-select form-select-sm" style={{ maxWidth: 150 }} value={status} onChange={(e) => setStatus(e.target.value as '' | 'OUT' | 'RETURNED')}>
                    <option value="">Tüm kayıtlar</option>
                    <option value="OUT">Dışarıda</option>
                    <option value="RETURNED">Döndü</option>
                </select>
                <div>
                    <label className="form-label small mb-0">Başlangıç</label>
                    <input type="date" className="form-control form-control-sm" value={fromDay} onChange={(e) => setFromDay(e.target.value)} />
                </div>
                <div>
                    <label className="form-label small mb-0">Bitiş</label>
                    <input type="date" className="form-control form-control-sm" value={toDay} onChange={(e) => setToDay(e.target.value)} />
                </div>
                <div className="form-check mb-1">
                    <input className="form-check-input" type="checkbox" id="only-late" checked={onlyLate} onChange={(e) => setOnlyLate(e.target.checked)} />
                    <label className="form-check-label small" htmlFor="only-late">Sadece geç kalanlar</label>
                </div>
                <button className="btn btn-outline-secondary btn-sm" onClick={load} disabled={loading} aria-label="Yenile">
                    <RefreshCw size={14} />
                </button>
            </div>

            {studentFilter && (
                <div className="mb-3">
                    <span className="badge bg-primary fs-6 fw-normal">
                        {studentFilter.name}
                        <button className="btn-close btn-close-white ms-2" style={{ fontSize: '0.6rem' }} onClick={onClearStudent} aria-label="Filtreyi kaldır" />
                    </span>
                </div>
            )}

            {visible.length === 0 ? (
                <div className="text-center text-muted py-5">{loading ? 'Yükleniyor…' : 'Kayıt bulunamadı.'}</div>
            ) : (
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="table-light">
                            <tr>
                                <th>Talebe</th>
                                <th>Neden</th>
                                <th>Çıkış</th>
                                <th>Süre sınırı</th>
                                <th>Giriş</th>
                                <th>Durum</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visible.map((log) => (
                                <tr key={log.id} style={{ cursor: 'pointer' }} onClick={() => onEdit(log)}>
                                    <td>
                                        <div className="fw-semibold">{log.first_name} {log.last_name}</div>
                                        {log.class_name && <div className="text-muted small">{log.class_name}</div>}
                                    </td>
                                    <td>{log.reason}</td>
                                    <td className="text-nowrap">{formatDateTime(log.exit_time, tz)}</td>
                                    <td className="text-nowrap">{formatDateTime(log.expected_return_time, tz)}</td>
                                    <td className="text-nowrap">{formatDateTime(log.actual_return_time, tz)}</td>
                                    <td><StatusBadge log={log} now={now} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {logs.length >= 1000 && <div className="text-muted small mt-2">İlk 1000 kayıt gösteriliyor; tarih aralığını daraltın.</div>}
        </div>
    );
}
