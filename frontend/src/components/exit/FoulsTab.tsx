// src/components/exit/FoulsTab.tsx
// "Foya özeti" tab: how often each student returned late. A "foya" is a return after the deadline.
// A student who is still out past the deadline is flagged, but only counts once he returns.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { Search } from 'lucide-react';
import { exitApi } from './exitApi';
import { FoulRow } from './exitTypes';
import { dayStartIso, formatDateTime, formatMinutes } from './exitTime';

interface Props {
    tz: string;
    refreshKey: number;
    onShowStudent: (studentid: number, name: string) => void;
}

export default function FoulsTab({ tz, refreshKey, onShowStudent }: Props) {
    const [rows, setRows] = useState<FoulRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [fromDay, setFromDay] = useState('');
    const [toDay, setToDay] = useState('');
    const [onlyFouls, setOnlyFouls] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            setRows(await exitApi.foulsSummary({
                from: fromDay ? dayStartIso(fromDay, tz) ?? undefined : undefined,
                to: toDay ? dayStartIso(toDay, tz, 1) ?? undefined : undefined,
            }));
        } catch (e) {
            toast.error((e as Error).message);
        } finally {
            setLoading(false);
        }
    }, [fromDay, toDay, tz]);

    useEffect(() => {
        load();
    }, [load, refreshKey]);

    const visible = useMemo(() => {
        const q = search.trim().toLocaleLowerCase('tr-TR');
        return rows
            .filter((r) => !onlyFouls || r.total_late > 0 || r.is_currently_overdue)
            .filter((r) => !q || `${r.first_name} ${r.last_name} ${r.class_name ?? ''}`.toLocaleLowerCase('tr-TR').includes(q));
    }, [rows, search, onlyFouls]);

    const totalFouls = visible.reduce((sum, r) => sum + r.total_late, 0);

    return (
        <div>
            <div className="d-flex flex-wrap gap-2 align-items-end mb-3">
                <div className="input-group input-group-sm" style={{ maxWidth: 240 }}>
                    <span className="input-group-text"><Search size={14} /></span>
                    <input className="form-control" placeholder="Ara: isim, sınıf" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <div>
                    <label className="form-label small mb-0">Başlangıç</label>
                    <input type="date" className="form-control form-control-sm" value={fromDay} onChange={(e) => setFromDay(e.target.value)} />
                </div>
                <div>
                    <label className="form-label small mb-0">Bitiş</label>
                    <input type="date" className="form-control form-control-sm" value={toDay} onChange={(e) => setToDay(e.target.value)} />
                </div>
                <div className="form-check mb-1">
                    <input className="form-check-input" type="checkbox" id="only-fouls" checked={onlyFouls} onChange={(e) => setOnlyFouls(e.target.checked)} />
                    <label className="form-check-label small" htmlFor="only-fouls">Sadece foyası olanlar</label>
                </div>
                <div className="ms-auto text-muted small">Toplam foya: <strong>{totalFouls}</strong></div>
            </div>

            {visible.length === 0 ? (
                <div className="text-center text-muted py-5">{loading ? 'Yükleniyor…' : 'Kayıt bulunamadı.'}</div>
            ) : (
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="table-light">
                            <tr>
                                <th>Talebe</th>
                                <th className="text-center">Çıkış</th>
                                <th className="text-center">Foya</th>
                                <th>Toplam gecikme</th>
                                <th>Son foya</th>
                                <th>Şu an</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visible.map((r) => (
                                <tr key={r.studentid} style={{ cursor: 'pointer' }} onClick={() => onShowStudent(r.studentid, `${r.first_name} ${r.last_name}`)}>
                                    <td>
                                        <div className="fw-semibold">{r.first_name} {r.last_name}</div>
                                        {r.class_name && <div className="text-muted small">{r.class_name}</div>}
                                    </td>
                                    <td className="text-center">{r.total_exits}</td>
                                    <td className="text-center">
                                        {r.total_late > 0 ? <span className="badge bg-danger">{r.total_late}</span> : <span className="text-muted">0</span>}
                                    </td>
                                    <td>{r.total_late_minutes > 0 ? formatMinutes(r.total_late_minutes) : '—'}</td>
                                    <td className="text-nowrap">{formatDateTime(r.last_late_at, tz)}</td>
                                    <td>
                                        {r.is_currently_overdue
                                            ? <span className="badge bg-danger">Dışarıda, süresi geçti</span>
                                            : r.is_currently_out
                                                ? <span className="badge bg-warning text-dark">Dışarıda</span>
                                                : <span className="text-muted">İçeride</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
