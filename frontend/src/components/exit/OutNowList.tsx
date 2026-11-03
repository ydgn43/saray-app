// src/components/exit/OutNowList.tsx
// "Dışarıda" tab: students who are out right now, most urgent first, with one-click return.

import { useMemo, useState } from 'react';
import { Edit2, LogIn, Search } from 'lucide-react';
import { ExitLog } from './exitTypes';
import { formatDateTime } from './exitTime';
import StatusBadge from './StatusBadge';

interface Props {
    logs: ExitLog[]; // only status 'OUT'
    tz: string;
    now: Date;
    busy: boolean;
    onReturn: (logIds: number[]) => void;
    onEdit: (log: ExitLog) => void;
}

/** Most urgent first: overdue, then nearest deadline, then students without a deadline. */
const urgency = (log: ExitLog, now: Date): number => {
    if (!log.expected_return_time) return Number.MAX_SAFE_INTEGER;
    return new Date(log.expected_return_time).getTime() - now.getTime();
};

export default function OutNowList({ logs, tz, now, busy, onReturn, onEdit }: Props) {
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<Set<number>>(new Set());

    const visible = useMemo(() => {
        const q = search.trim().toLocaleLowerCase('tr-TR');
        return logs
            .filter((l) => !q || `${l.first_name} ${l.last_name} ${l.class_name ?? ''} ${l.reason}`.toLocaleLowerCase('tr-TR').includes(q))
            .sort((a, b) => urgency(a, now) - urgency(b, now));
    }, [logs, search, now]);

    const toggle = (id: number) => {
        const next = new Set(selected);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelected(next);
    };
    const allSelected = visible.length > 0 && visible.every((l) => selected.has(l.id));
    const toggleAll = () => setSelected(allSelected ? new Set() : new Set(visible.map((l) => l.id)));

    // forget ids that are no longer in the list (returned meanwhile)
    const selectedIds = visible.filter((l) => selected.has(l.id)).map((l) => l.id);

    const returnSelected = () => {
        onReturn(selectedIds);
        setSelected(new Set());
    };

    return (
        <div>
            <div className="d-flex flex-wrap gap-2 align-items-center mb-3">
                <div className="input-group input-group-sm" style={{ maxWidth: 320 }}>
                    <span className="input-group-text"><Search size={14} /></span>
                    <input
                        className="form-control"
                        placeholder="Ara: isim, sınıf, neden"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                {selectedIds.length > 0 && (
                    <button className="btn btn-success btn-sm" disabled={busy} onClick={returnSelected}>
                        <LogIn size={14} className="me-1" />
                        Seçilenleri giriş yap ({selectedIds.length})
                    </button>
                )}
            </div>

            {visible.length === 0 ? (
                <div className="text-center text-muted py-5">
                    {logs.length === 0 ? 'Şu an dışarıda talebe yok.' : 'Aramaya uyan kayıt yok.'}
                </div>
            ) : (
                <>
                <div className="table-responsive d-none d-md-block">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="table-light">
                            <tr>
                                <th style={{ width: 36 }}>
                                    <input type="checkbox" className="form-check-input" checked={allSelected} onChange={toggleAll} aria-label="Hepsini seç" />
                                </th>
                                <th>Talebe</th>
                                <th>Neden</th>
                                <th>Çıkış</th>
                                <th>Süre sınırı</th>
                                <th>Durum</th>
                                <th style={{ width: 130 }} />
                            </tr>
                        </thead>
                        <tbody>
                            {visible.map((log) => (
                                <tr key={log.id} className={log.expected_return_time && urgency(log, now) < 0 ? 'table-danger' : undefined}>
                                    <td>
                                        <input
                                            type="checkbox"
                                            className="form-check-input"
                                            checked={selected.has(log.id)}
                                            onChange={() => toggle(log.id)}
                                            aria-label={`${log.first_name} ${log.last_name} seç`}
                                        />
                                    </td>
                                    <td>
                                        <div className="fw-semibold">{log.first_name} {log.last_name}</div>
                                        {log.class_name && <div className="text-muted small">{log.class_name}</div>}
                                    </td>
                                    <td>
                                        {log.reason}
                                        {log.notes && <div className="text-muted small">{log.notes}</div>}
                                    </td>
                                    <td className="text-nowrap">{formatDateTime(log.exit_time, tz)}</td>
                                    <td className="text-nowrap">{formatDateTime(log.expected_return_time, tz)}</td>
                                    <td><StatusBadge log={log} now={now} /></td>
                                    <td className="text-end text-nowrap">
                                        <button className="btn btn-success btn-sm me-1" disabled={busy} onClick={() => onReturn([log.id])}>
                                            <LogIn size={14} className="me-1" />Giriş
                                        </button>
                                        <button className="btn btn-outline-secondary btn-sm" onClick={() => onEdit(log)} aria-label="Düzenle">
                                            <Edit2 size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Phones: one card per student, so the deadline and the buttons are always visible. */}
                <div className="d-md-none">
                    <div className="form-check mb-2">
                        <input type="checkbox" className="form-check-input" id="out-all-mobile" checked={allSelected} onChange={toggleAll} />
                        <label className="form-check-label small" htmlFor="out-all-mobile">Hepsini seç</label>
                    </div>
                    {visible.map((log) => (
                        <div key={log.id} className={`card mb-2 ${log.expected_return_time && urgency(log, now) < 0 ? 'border-danger' : ''}`}>
                            <div className="card-body py-2 px-3">
                                <div className="d-flex align-items-start gap-2">
                                    <input
                                        type="checkbox"
                                        className="form-check-input mt-1"
                                        checked={selected.has(log.id)}
                                        onChange={() => toggle(log.id)}
                                        aria-label={`${log.first_name} ${log.last_name} seç`}
                                    />
                                    <div className="flex-grow-1">
                                        <div className="fw-semibold">{log.first_name} {log.last_name}</div>
                                        <div className="text-muted small">{[log.class_name, log.reason].filter(Boolean).join(' · ')}</div>
                                    </div>
                                    <StatusBadge log={log} now={now} />
                                </div>
                                <div className="small mt-2">
                                    <div><span className="text-muted">Çıkış:</span> {formatDateTime(log.exit_time, tz)}</div>
                                    <div><span className="text-muted">Süre sınırı:</span> {formatDateTime(log.expected_return_time, tz)}</div>
                                    {log.notes && <div className="text-muted">{log.notes}</div>}
                                </div>
                                <div className="d-flex gap-2 mt-2">
                                    <button className="btn btn-success btn-sm flex-grow-1" disabled={busy} onClick={() => onReturn([log.id])}>
                                        <LogIn size={14} className="me-1" />Giriş
                                    </button>
                                    <button className="btn btn-outline-secondary btn-sm" onClick={() => onEdit(log)} aria-label="Düzenle">
                                        <Edit2 size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                </>
            )}
        </div>
    );
}
