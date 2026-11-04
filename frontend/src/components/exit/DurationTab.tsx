// src/components/exit/DurationTab.tsx
// "Süre özeti" tab: how long students were outside. Works for every exit, with or without a deadline.
//
// Kept calm on purpose:
//   - Rule-based izinler (e.g. "Haftalık İzin") are kept apart from normal exits (market, doctor, ...),
//     because they are much longer. Switch at the top: "Normal çıkışlar" | "İzinler".
//   - ONE sebep (reason) at a time ("Tümü" = all), optionally ONE class.
//   - The big numbers are behind "Daha fazla istatistik". Search is behind the small search icon.
// Only returned records are counted. A student who is still out is noted separately.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { Search } from 'lucide-react';
import { exitApi } from './exitApi';
import { DurationSummary, ReasonTotal } from './exitTypes';
import { dayStartIso, formatDuration } from './exitTime';

interface Props {
    tz: string;
    refreshKey: number;
    onShowStudent: (studentid: number, name: string) => void;
}

interface Row {
    studentid: number;
    name: string;
    class_name: string | null;
    minutes: number;
    exits: number;
    average: number; // minutes per exit
    ongoing_minutes: number;
    is_currently_out: boolean;
}

type Sort = 'time' | 'name';
type Kind = 'normal' | 'izin';

const KIND_LABEL: Record<Kind, string> = { normal: 'Normal çıkışlar', izin: 'İzinler' };

/** Small number card (shown under "Daha fazla istatistik"). */
function Stat({ label, value, testId }: { label: string; value: string; testId?: string }) {
    return (
        <div className="col-4">
            <div className="card border-0 shadow-sm h-100">
                <div className="card-body py-2">
                    <div className="text-muted small">{label}</div>
                    <div className="fs-5 fw-bold" data-testid={testId}>{value}</div>
                </div>
            </div>
        </div>
    );
}

export default function DurationTab({ tz, refreshKey, onShowStudent }: Props) {
    const [data, setData] = useState<DurationSummary | null>(null);
    const [loading, setLoading] = useState(false);
    const [kind, setKind] = useState<Kind>('normal');
    const [sebep, setSebep] = useState(''); // '' = Tümü
    const [cls, setCls] = useState(''); // '' = all classes
    const [search, setSearch] = useState('');
    const [searchOpen, setSearchOpen] = useState(false);
    const [moreStats, setMoreStats] = useState(false);
    const [fromDay, setFromDay] = useState('');
    const [toDay, setToDay] = useState('');
    const [sort, setSort] = useState<Sort>('time');

    const load = useCallback(async () => {
        setLoading(true);
        try {
            setData(await exitApi.durationSummary({
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

    const view = data ? data[kind] : null;

    const classNames = useMemo(() => {
        const set = new Set<string>();
        (view?.students ?? []).forEach((s) => { if (s.class_name) set.add(s.class_name); });
        return Array.from(set).sort((a, b) => a.localeCompare(b, 'tr', { numeric: true }));
    }, [view]);

    // students after the class + name filter (the sebep filter comes later)
    const students = useMemo(() => {
        const q = search.trim().toLocaleLowerCase('tr-TR');
        return (view?.students ?? []).filter((s) => {
            if (cls && s.class_name !== cls) return false;
            return !q || `${s.first_name} ${s.last_name} ${s.class_name ?? ''}`.toLocaleLowerCase('tr-TR').includes(q);
        });
    }, [view, cls, search]);

    // sebepler of exactly these students (so the list always matches the class / search filter)
    const reasons: ReasonTotal[] = useMemo(() => {
        const map = new Map<string, ReasonTotal>();
        students.forEach((s) => s.reasons.forEach((r) => {
            const e = map.get(r.reason) ?? { reason: r.reason, count: 0, minutes: 0 };
            e.count += r.count;
            e.minutes += r.minutes;
            map.set(r.reason, e);
        }));
        return Array.from(map.values()).sort((a, b) => b.minutes - a.minutes || a.reason.localeCompare(b.reason, 'tr'));
    }, [students]);

    // a chosen sebep / class may disappear (date range, class, switch): fall back to "all"
    useEffect(() => {
        if (sebep && view && !reasons.some((r) => r.reason === sebep)) setSebep('');
    }, [view, reasons, sebep]);
    useEffect(() => {
        if (cls && view && !classNames.includes(cls)) setCls('');
    }, [view, classNames, cls]);

    const rows: Row[] = useMemo(() => {
        const list: Row[] = [];
        students.forEach((s) => {
            const name = `${s.first_name} ${s.last_name}`;
            const make = (minutes: number, exits: number, ongoing = 0, out = false): Row => ({
                studentid: s.studentid, name, class_name: s.class_name, minutes, exits,
                average: exits > 0 ? Math.floor(minutes / exits) : 0, ongoing_minutes: ongoing, is_currently_out: out,
            });
            if (sebep) {
                const r = s.reasons.find((x) => x.reason === sebep);
                if (r) list.push(make(r.minutes, r.count));
                else if (cls) list.push(make(0, 0)); // a class is chosen: show every student of it
            } else {
                const exits = s.reasons.reduce((sum, x) => sum + x.count, 0);
                if (exits > 0 || s.is_currently_out || cls) list.push(make(s.total_minutes, exits, s.ongoing_minutes, s.is_currently_out));
            }
        });
        list.sort((a, b) => (sort === 'time' ? b.minutes - a.minutes || a.name.localeCompare(b.name, 'tr') : a.name.localeCompare(b.name, 'tr')));
        return list;
    }, [students, sebep, cls, sort]);

    const totalMinutes = rows.reduce((sum, r) => sum + r.minutes, 0);
    const totalExits = rows.reduce((sum, r) => sum + r.exits, 0);
    const studentCount = rows.filter((r) => r.exits > 0).length;
    const average = totalExits > 0 ? Math.floor(totalMinutes / totalExits) : 0;
    const maxMinutes = rows.reduce((m, r) => Math.max(m, r.minutes), 0);
    const maxReason = reasons.reduce((m, r) => Math.max(m, r.minutes), 0);
    const ongoing = students.reduce((sum, s) => sum + s.ongoing_minutes, 0);

    const pickKind = (k: Kind) => { setKind(k); setSebep(''); setCls(''); };

    return (
        <div>
            {/* ---- izinler (rule based) are kept apart from normal exits */}
            <div className="btn-group mb-3" role="group" aria-label="Çıkış türü">
                {(['normal', 'izin'] as Kind[]).map((k) => (
                    <button
                        key={k}
                        type="button"
                        className={`btn btn-sm ${kind === k ? 'btn-primary' : 'btn-outline-primary'}`}
                        aria-pressed={kind === k}
                        onClick={() => pickKind(k)}
                    >
                        {KIND_LABEL[k]}
                    </button>
                ))}
            </div>

            {/* ---- filters */}
            <div className="d-flex flex-wrap gap-2 align-items-end mb-3">
                <div>
                    <label className="form-label small mb-0">Sebep</label>
                    <select className="form-select form-select-sm" style={{ minWidth: 170 }} value={sebep} onChange={(e) => setSebep(e.target.value)} aria-label="Sebep">
                        <option value="">Tümü</option>
                        {reasons.map((r) => <option key={r.reason} value={r.reason}>{r.reason} ({r.count})</option>)}
                    </select>
                </div>
                <div>
                    <label className="form-label small mb-0">Sınıf</label>
                    <select className="form-select form-select-sm" style={{ minWidth: 130 }} value={cls} onChange={(e) => setCls(e.target.value)} aria-label="Sınıf">
                        <option value="">Tüm sınıflar</option>
                        {classNames.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div>
                    <label className="form-label small mb-0">Başlangıç</label>
                    <input type="date" className="form-control form-control-sm" value={fromDay} onChange={(e) => setFromDay(e.target.value)} />
                </div>
                <div>
                    <label className="form-label small mb-0">Bitiş</label>
                    <input type="date" className="form-control form-control-sm" value={toDay} onChange={(e) => setToDay(e.target.value)} />
                </div>
                <div>
                    <label className="form-label small mb-0">Sırala</label>
                    <select className="form-select form-select-sm" value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sırala">
                        <option value="time">En uzun süre</option>
                        <option value="name">İsim A-Z</option>
                    </select>
                </div>
                {searchOpen || search ? (
                    <div className="input-group input-group-sm" style={{ maxWidth: 200 }}>
                        <span className="input-group-text"><Search size={14} /></span>
                        <input
                            className="form-control"
                            placeholder="Talebe ara"
                            value={search}
                            autoFocus
                            onChange={(e) => setSearch(e.target.value)}
                            onBlur={() => { if (!search) setSearchOpen(false); }}
                        />
                    </div>
                ) : (
                    <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setSearchOpen(true)} aria-label="Talebe ara">
                        <Search size={14} />
                    </button>
                )}
            </div>

            {/* ---- one calm line; the big numbers are behind "Daha fazla istatistik" */}
            <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                <div className="text-muted small" data-testid="summary-line">
                    {sebep ? `Sebep: ${sebep}` : `Tüm ${kind === 'izin' ? 'izinler' : 'sebepler'}`}
                    {cls ? ` · Sınıf ${cls}` : ''} · <strong className="text-body" data-testid="stat-students">{studentCount}</strong> talebe
                </div>
                <button
                    type="button"
                    className="btn btn-link btn-sm p-0 ms-auto text-decoration-none"
                    aria-expanded={moreStats}
                    onClick={() => setMoreStats(!moreStats)}
                >
                    {moreStats ? 'Daha az istatistik' : 'Daha fazla istatistik'}
                </button>
            </div>
            {moreStats && (
                <div className="row g-3 mb-2">
                    <Stat label="Toplam süre" value={formatDuration(totalMinutes)} testId="stat-total" />
                    <Stat label="Çıkış sayısı" value={String(totalExits)} testId="stat-exits" />
                    <Stat label="Ortalama / çıkış" value={formatDuration(average)} testId="stat-average" />
                </div>
            )}
            {!sebep && ongoing > 0 && (
                <div className="text-muted small mb-3">Şu an dışarıda olanlar: {formatDuration(ongoing)} (henüz toplama dahil değil)</div>
            )}

            {/* ---- sebep ranking: click to select */}
            {reasons.length > 0 && (
                <div className="card border-0 shadow-sm mb-3">
                    <div className="card-body py-2">
                        <div className="small fw-semibold mb-2">Sebepler</div>
                        {reasons.map((r) => (
                            <button
                                key={r.reason}
                                type="button"
                                className={`btn btn-sm w-100 text-start p-1 mb-1 ${sebep === r.reason ? 'btn-light border' : 'btn-link text-decoration-none text-body'}`}
                                onClick={() => setSebep(sebep === r.reason ? '' : r.reason)}
                                aria-pressed={sebep === r.reason}
                            >
                                <div className="d-flex justify-content-between small">
                                    <span className={sebep === r.reason ? 'fw-bold' : ''}>{r.reason} <span className="text-muted">· {r.count}×</span></span>
                                    <span>{formatDuration(r.minutes)}</span>
                                </div>
                                <div className="progress" style={{ height: 5 }}>
                                    <div className="progress-bar" style={{ width: `${maxReason ? (r.minutes / maxReason) * 100 : 0}%` }} />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* ---- students */}
            {rows.length === 0 ? (
                <div className="text-center text-muted py-5">{loading ? 'Yükleniyor…' : 'Kayıt bulunamadı.'}</div>
            ) : (
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="table-light">
                            <tr>
                                <th>Talebe</th>
                                <th style={{ minWidth: 170 }}>Süre</th>
                                <th className="text-center" style={{ width: 90 }}>Çıkış</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((r) => (
                                <tr key={r.studentid} style={{ cursor: 'pointer' }} onClick={() => onShowStudent(r.studentid, r.name)}>
                                    <td>
                                        <div className="fw-semibold">{r.name}</div>
                                        {r.class_name && <div className="text-muted small">{r.class_name}</div>}
                                    </td>
                                    <td>
                                        <div className="d-flex flex-wrap align-items-baseline column-gap-2">
                                            <span className="fw-semibold" title={`${r.minutes} dk`}>{formatDuration(r.minutes)}</span>
                                            {r.exits > 0 && <span className="text-muted small" data-testid="row-average">ort. {formatDuration(r.average)}</span>}
                                        </div>
                                        <div className="progress mt-1" style={{ height: 4 }}>
                                            <div className="progress-bar bg-secondary" style={{ width: `${maxMinutes ? (r.minutes / maxMinutes) * 100 : 0}%` }} />
                                        </div>
                                        {r.is_currently_out && (
                                            <div className="small text-warning-emphasis mt-1">şu an dışarıda: {formatDuration(r.ongoing_minutes)}</div>
                                        )}
                                    </td>
                                    <td className="text-center">
                                        <span
                                            className={`badge rounded-pill fs-6 fw-bold ${r.exits > 0 ? 'bg-primary' : 'bg-light text-muted border'}`}
                                            data-testid="row-exits"
                                        >
                                            {r.exits}
                                        </span>
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
