// src/components/exit/ExitDialog.tsx
// "Çıkış kaydı" dialog: pick one or many students, a reason or an izin rule, and save.
// Optional: a past time ("geçmiş zamanlı kayıt"), and optionally also the return time.

import { useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { LogOut } from 'lucide-react';
import Modal from './Modal';
import { ApiError, exitApi, SKIP_REASON_TEXT } from './exitApi';
import { ExitRule, StudentLite } from './exitTypes';
import { WEEKDAYS_TR, dateToZonedLocal, formatDateTime, localInputToIso } from './exitTime';

const REASON_PRESETS = ['Market', 'Aile İzni', 'Doktor', 'Alışveriş', 'Diğer'];

interface Props {
    students: StudentLite[];
    outStudentIds: Set<number>; // students who are out right now (cannot be selected)
    rules: ExitRule[];
    tz: string;
    onClose: () => void;
    onDone: () => void;
}

export default function ExitDialog({ students, outStudentIds, rules, tz, onClose, onDone }: Props) {
    const activeRules = rules.filter((r) => r.is_active);

    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [search, setSearch] = useState('');
    const [classFilter, setClassFilter] = useState('');
    const [reason, setReason] = useState('');
    const [ruleId, setRuleId] = useState<number | ''>('');
    const [notes, setNotes] = useState('');
    const [retro, setRetro] = useState(false);
    const [exitLocal, setExitLocal] = useState(() => dateToZonedLocal(new Date(Date.now() - 60 * 60000), tz));
    const [hasReturned, setHasReturned] = useState(false);
    const [returnLocal, setReturnLocal] = useState(() => dateToZonedLocal(new Date(), tz));
    const [saving, setSaving] = useState(false);

    const classes = useMemo(
        () => Array.from(new Set(students.map((s) => s.class_name).filter((c): c is string => !!c))).sort(),
        [students]
    );

    const filtered = useMemo(() => {
        const q = search.trim().toLocaleLowerCase('tr-TR');
        return students
            .filter((s) => !classFilter || s.class_name === classFilter)
            .filter((s) => !q || `${s.first_name} ${s.last_name}`.toLocaleLowerCase('tr-TR').includes(q))
            .sort((a, b) => `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`, 'tr'));
    }, [students, search, classFilter]);

    const selectable = filtered.filter((s) => !outStudentIds.has(s.studentid));
    const allFilteredSelected = selectable.length > 0 && selectable.every((s) => selected.has(s.studentid));

    const toggle = (id: number) => {
        const next = new Set(selected);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelected(next);
    };
    const toggleFiltered = () => {
        const next = new Set(selected);
        selectable.forEach((s) => (allFilteredSelected ? next.delete(s.studentid) : next.add(s.studentid)));
        setSelected(next);
    };

    const chosenRule = ruleId === '' ? null : activeRules.find((r) => r.id === ruleId) ?? null;

    const submit = async () => {
        if (selected.size === 0) return toast.error('Lütfen en az bir talebe seçiniz.');
        if (!reason.trim() && !chosenRule) return toast.error('Lütfen bir neden yazınız veya bir izin kuralı seçiniz.');

        const exitIso = retro ? localInputToIso(exitLocal, tz) : null;
        const returnIso = retro && hasReturned ? localInputToIso(returnLocal, tz) : null;
        if (retro && !exitIso) return toast.error('Çıkış zamanı geçersiz.');
        if (retro && hasReturned && !returnIso) return toast.error('Giriş zamanı geçersiz.');

        setSaving(true);
        try {
            const res = await exitApi.recordExit({
                studentids: Array.from(selected),
                reason: reason.trim() || undefined,
                ruleId: chosenRule ? chosenRule.id : null,
                notes: notes.trim() || null,
                exitTime: exitIso ?? undefined,
                actualReturnTime: returnIso ?? undefined,
            });
            const deadline = res.expected_return_time ? ` Süre sınırı: ${formatDateTime(res.expected_return_time, tz)}.` : '';
            toast.success(`${res.created.length} talebe için kayıt oluşturuldu.${deadline}`);
            reportSkipped(res.skipped);
            onDone();
        } catch (e) {
            if (e instanceof ApiError && Array.isArray(e.data?.skipped)) reportSkipped(e.data.skipped);
            toast.error((e as Error).message);
        } finally {
            setSaving(false);
        }
    };

    const reportSkipped = (skipped: { studentid: number; reason: keyof typeof SKIP_REASON_TEXT }[]) => {
        skipped.forEach((s) => {
            const st = students.find((x) => x.studentid === s.studentid);
            const name = st ? `${st.first_name} ${st.last_name}` : `#${s.studentid}`;
            toast.warn(`${name}: ${SKIP_REASON_TEXT[s.reason]}`);
        });
    };

    return (
        <Modal
            title="Çıkış kaydı"
            size="lg"
            onClose={onClose}
            footer={
                <>
                    <button className="btn btn-outline-secondary" onClick={onClose}>Vazgeç</button>
                    <button className="btn btn-primary" disabled={saving} onClick={submit}>
                        <LogOut size={16} className="me-1" />
                        {saving ? 'Kaydediliyor…' : `Çıkış yaptır (${selected.size})`}
                    </button>
                </>
            }
        >
            {/* ---- students */}
            <label className="form-label fw-bold small">Talebeler</label>
            <div className="d-flex flex-wrap gap-2 mb-2">
                <input className="form-control form-control-sm" style={{ maxWidth: 220 }} placeholder="İsim ara" value={search} onChange={(e) => setSearch(e.target.value)} />
                <select className="form-select form-select-sm" style={{ maxWidth: 160 }} value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
                    <option value="">Tüm sınıflar</option>
                    {classes.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <button type="button" className="btn btn-outline-primary btn-sm" onClick={toggleFiltered} disabled={selectable.length === 0}>
                    {allFilteredSelected ? 'Seçimi kaldır' : `Listeyi seç (${selectable.length})`}
                </button>
            </div>
            <div className="border rounded mb-3" style={{ maxHeight: 220, overflowY: 'auto' }}>
                {filtered.length === 0 && <div className="text-muted small p-3">Talebe bulunamadı.</div>}
                {filtered.map((s) => {
                    const isOut = outStudentIds.has(s.studentid);
                    return (
                        <label key={s.studentid} className={`d-flex align-items-center gap-2 px-3 py-1 border-bottom ${isOut ? 'text-muted' : ''}`} style={{ cursor: isOut ? 'not-allowed' : 'pointer' }}>
                            <input type="checkbox" className="form-check-input mt-0" disabled={isOut} checked={selected.has(s.studentid)} onChange={() => toggle(s.studentid)} />
                            <span className="flex-grow-1">{s.first_name} {s.last_name}</span>
                            {s.class_name && <span className="small text-muted">{s.class_name}</span>}
                            {isOut && <span className="badge bg-secondary">Dışarıda</span>}
                        </label>
                    );
                })}
            </div>

            {/* ---- reason / rule */}
            <div className="row g-3">
                <div className="col-md-6">
                    <label className="form-label fw-bold small">Neden</label>
                    <input className="form-control form-control-sm mb-2" placeholder={chosenRule ? chosenRule.name : 'Örn. Market'} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={100} />
                    <div className="d-flex flex-wrap gap-1">
                        {REASON_PRESETS.map((p) => (
                            <button key={p} type="button" className={`btn btn-sm ${reason === p ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setReason(p)}>{p}</button>
                        ))}
                    </div>
                </div>
                <div className="col-md-6">
                    <label className="form-label fw-bold small">İzin kuralı (süre sınırı)</label>
                    <select className="form-select form-select-sm" value={ruleId} onChange={(e) => setRuleId(e.target.value === '' ? '' : Number(e.target.value))}>
                        <option value="">Kural yok (süre sınırı yok)</option>
                        {activeRules.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                    {chosenRule && (
                        <div className="form-text">
                            Çıkıştan sonraki ilk <strong>{WEEKDAYS_TR[chosenRule.deadline_weekday]} {chosenRule.deadline_time}</strong>'e kadar (yurt saati: {tz}).
                        </div>
                    )}
                </div>
                <div className="col-12">
                    <label className="form-label fw-bold small">Not (isteğe bağlı)</label>
                    <input className="form-control form-control-sm" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={255} />
                </div>
            </div>

            {/* ---- retroactive */}
            <div className="form-check form-switch mt-3">
                <input className="form-check-input" type="checkbox" id="retro" checked={retro} onChange={(e) => setRetro(e.target.checked)} />
                <label className="form-check-label" htmlFor="retro">Geçmiş zamanlı kayıt</label>
            </div>
            {retro && (
                <div className="row g-3 mt-0">
                    <div className="col-md-6">
                        <label className="form-label small">Çıkış zamanı ({tz})</label>
                        <input type="datetime-local" className="form-control form-control-sm" value={exitLocal} onChange={(e) => setExitLocal(e.target.value)} />
                    </div>
                    <div className="col-md-6">
                        <div className="form-check mb-1">
                            <input className="form-check-input" type="checkbox" id="returned" checked={hasReturned} onChange={(e) => setHasReturned(e.target.checked)} />
                            <label className="form-check-label small" htmlFor="returned">Talebe döndü</label>
                        </div>
                        <input type="datetime-local" className="form-control form-control-sm" disabled={!hasReturned} value={returnLocal} onChange={(e) => setReturnLocal(e.target.value)} />
                    </div>
                </div>
            )}
        </Modal>
    );
}
