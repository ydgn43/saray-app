// src/pages/ExitTracking.tsx
//
// Student out / in tracking ("Dışarı Çıkış - Giriş ve Geç Takibi").
// This page only holds the shared state and the tabs; the real work is in src/components/exit/*.
//
//   Dışarıda     who is out now, live countdown to the deadline, one-click return
//   Geçmiş       all records, filters, edit / delete
//   Geç özeti   late returns per student
//   Süre özeti   minutes outside per student, per reason and in total
//   Kurallar     izin rules + yurt time zone (Admin / SuperAdmin only)

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AlertTriangle, LogOut, RefreshCw, Users } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../auth/AuthContext';
import { ApiError, SKIP_REASON_TEXT, exitApi } from '../components/exit/exitApi';
import { ExitLog, ExitRule, StudentLite } from '../components/exit/exitTypes';
import { formatMinutes } from '../components/exit/exitTime';
import { useNow } from '../components/exit/useNow';
import OutNowList from '../components/exit/OutNowList';
import ExitDialog from '../components/exit/ExitDialog';
import EditLogDialog from '../components/exit/EditLogDialog';
import HistoryTab from '../components/exit/HistoryTab';
import FoulsTab from '../components/exit/FoulsTab';
import DurationTab from '../components/exit/DurationTab';
import RulesTab from '../components/exit/RulesTab';

type Tab = 'out' | 'history' | 'fouls' | 'duration' | 'rules';

const DEFAULT_TZ = 'Europe/Berlin';

export default function ExitTracking() {
    const { user, selectedYurt } = useAuth();
    const canManage = user?.role === 'admin' || user?.role === 'super-admin';

    const now = useNow(30000);
    const [tab, setTab] = useState<Tab>('out');
    const [students, setStudents] = useState<StudentLite[]>([]);
    const [rules, setRules] = useState<ExitRule[]>([]);
    const [timezone, setTimezone] = useState(DEFAULT_TZ);
    const [timezones, setTimezones] = useState<string[]>([]);
    const [settingsLoaded, setSettingsLoaded] = useState(false);
    const [outLogs, setOutLogs] = useState<ExitLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0); // bump -> history / fouls tabs reload
    const [showExit, setShowExit] = useState(false);
    const [editLog, setEditLog] = useState<ExitLog | null>(null);
    const [studentFilter, setStudentFilter] = useState<{ id: number; name: string } | null>(null);

    const loadOut = useCallback(async () => {
        try {
            setOutLogs(await exitApi.logs({ status: 'OUT', limit: 2000 }));
        } catch (e) {
            toast.error((e as Error).message);
        }
    }, []);

    const loadRulesAndSettings = useCallback(async () => {
        try {
            const [r, s] = await Promise.all([exitApi.rules(), exitApi.settings()]);
            setRules(r);
            setTimezone(s.timezone);
            setTimezones(s.timezones);
            setSettingsLoaded(true);
        } catch (e) {
            toast.error((e as Error).message);
        }
    }, []);

    // Everything is reloaded when the page opens and whenever an admin switches the yurt.
    const yurtKey = selectedYurt?.yurtId ?? user?.yurtid ?? 0;
    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setSettingsLoaded(false);
        setStudentFilter(null);
        Promise.all([exitApi.students(), loadOut(), loadRulesAndSettings()])
            .then(([s]) => { if (!cancelled) setStudents(s); })
            .catch((e) => toast.error((e as Error).message))
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [yurtKey, loadOut, loadRulesAndSettings]);

    // Light auto-refresh, so exits recorded on another device show up.
    useEffect(() => {
        const id = setInterval(loadOut, 60000);
        return () => clearInterval(id);
    }, [loadOut]);

    const refreshAll = useCallback(async () => {
        await loadOut();
        setRefreshKey((k) => k + 1);
    }, [loadOut]);

    const handleReturn = async (logIds: number[]) => {
        if (logIds.length === 0) return;
        setBusy(true);
        try {
            const res = await exitApi.recordReturn(logIds);
            res.returned.forEach((r) => {
                const log = outLogs.find((l) => l.id === r.id);
                const name = log ? `${log.first_name} ${log.last_name}` : `#${r.id}`;
                if (r.is_late) toast.warn(`${name}: ${formatMinutes(r.late_minutes)} geç döndü (Geç).`);
                else toast.success(`${name}: giriş kaydedildi.`);
            });
            res.skipped.forEach((s) => toast.warn(`Kayıt #${s.id}: ${SKIP_REASON_TEXT[s.reason]}`));
        } catch (e) {
            if (e instanceof ApiError && Array.isArray(e.data?.skipped)) {
                e.data.skipped.forEach((s: { id: number; reason: keyof typeof SKIP_REASON_TEXT }) =>
                    toast.warn(`Kayıt #${s.id}: ${SKIP_REASON_TEXT[s.reason]}`));
            }
            toast.error((e as Error).message);
        } finally {
            setBusy(false);
            refreshAll();
        }
    };

    const outStudentIds = useMemo(() => new Set(outLogs.map((l) => l.studentid)), [outLogs]);
    const overdueCount = outLogs.filter((l) => l.expected_return_time && new Date(l.expected_return_time) < now).length;

    const afterSave = () => {
        setShowExit(false);
        setEditLog(null);
        refreshAll();
    };

    const tabs: { id: Tab; label: string }[] = [
        { id: 'out', label: `Dışarıda (${outLogs.length})` },
        { id: 'history', label: 'Geçmiş' },
        { id: 'fouls', label: 'Geç özeti' },
        { id: 'duration', label: 'Süre özeti' },
        ...(canManage ? [{ id: 'rules' as Tab, label: 'Kurallar' }] : []),
    ];

    return (
        <div className="container-fluid px-0">
            <ToastContainer position="top-right" autoClose={4000} />
            <div className="d-flex flex-wrap align-items-start gap-2">
                <PageHeader title="Çıkış / Giriş Takibi" subtitle="Dışarı çıkan talebeler, süre sınırları ve Geç takibi" />
                <button className="btn btn-primary ms-auto" onClick={() => setShowExit(true)} disabled={loading}>
                    <LogOut size={16} className="me-1" />Çıkış kaydı
                </button>
            </div>

            {/* the two cards are hidden on "Süre özeti" to keep that tab calm */}
            {tab !== 'duration' && (
                <div className="row g-3 mb-3">
                    <div className="col-6 col-md-3">
                        <div className="card border-0 shadow-sm h-100"><div className="card-body py-2">
                            <div className="text-muted small"><Users size={14} className="me-1" />Dışarıda</div>
                            <div className="fs-4 fw-bold">{outLogs.length}</div>
                        </div></div>
                    </div>
                    <div className="col-6 col-md-3">
                        <div className="card border-0 shadow-sm h-100"><div className="card-body py-2">
                            <div className="text-muted small"><AlertTriangle size={14} className="me-1" />Süresi geçen</div>
                            <div className={`fs-4 fw-bold ${overdueCount > 0 ? 'text-danger' : ''}`}>{overdueCount}</div>
                        </div></div>
                    </div>
                </div>
            )}

            <ul className="nav nav-tabs mb-3">
                {tabs.map((t) => (
                    <li className="nav-item" key={t.id}>
                        <button className={`nav-link${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id)}>{t.label}</button>
                    </li>
                ))}
                <li className="nav-item ms-auto">
                    <button className="btn btn-sm btn-outline-secondary" onClick={refreshAll} aria-label="Yenile"><RefreshCw size={14} /></button>
                </li>
            </ul>

            {loading ? (
                <div className="text-center text-muted py-5">Yükleniyor…</div>
            ) : (
                <>
                    {tab === 'out' && (
                        <OutNowList logs={outLogs} tz={timezone} now={now} busy={busy} onReturn={handleReturn} onEdit={setEditLog} />
                    )}
                    {tab === 'history' && (
                        <HistoryTab
                            tz={timezone}
                            now={now}
                            refreshKey={refreshKey}
                            studentFilter={studentFilter}
                            onClearStudent={() => setStudentFilter(null)}
                            onEdit={setEditLog}
                        />
                    )}
                    {tab === 'fouls' && (
                        <FoulsTab
                            tz={timezone}
                            refreshKey={refreshKey}
                            onShowStudent={(id, name) => { setStudentFilter({ id, name }); setTab('history'); }}
                        />
                    )}
                    {tab === 'duration' && (
                        <DurationTab
                            tz={timezone}
                            refreshKey={refreshKey}
                            onShowStudent={(id, name) => { setStudentFilter({ id, name }); setTab('history'); }}
                        />
                    )}
                    {tab === 'rules' && canManage && settingsLoaded && (
                        <RulesTab
                            key={timezone}
                            rules={rules}
                            timezone={timezone}
                            timezones={timezones}
                            onChanged={loadRulesAndSettings}
                        />
                    )}
                </>
            )}

            {showExit && (
                <ExitDialog
                    students={students}
                    outStudentIds={outStudentIds}
                    rules={rules}
                    tz={timezone}
                    onClose={() => setShowExit(false)}
                    onDone={afterSave}
                />
            )}
            {editLog && (
                <EditLogDialog log={editLog} rules={rules} tz={timezone} onClose={() => setEditLog(null)} onDone={afterSave} />
            )}
        </div>
    );
}
