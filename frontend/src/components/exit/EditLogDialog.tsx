// src/components/exit/EditLogDialog.tsx
// Edit or delete one exit record: reason, note, times, rule / deadline, return.

import { useState } from 'react';
import { toast } from 'react-toastify';
import { Trash2 } from 'lucide-react';
import Modal from './Modal';
import { exitApi } from './exitApi';
import { ExitLog, ExitRule, UpdateLogPayload } from './exitTypes';
import { WEEKDAYS_TR, isoToLocalInput, localInputToIso } from './exitTime';

type DeadlineMode = 'keep' | 'manual' | 'none';

interface Props {
    log: ExitLog;
    rules: ExitRule[];
    tz: string;
    onClose: () => void;
    onDone: () => void;
}

export default function EditLogDialog({ log, rules, tz, onClose, onDone }: Props) {
    const [reason, setReason] = useState(log.reason);
    const [notes, setNotes] = useState(log.notes ?? '');
    const [ruleId, setRuleId] = useState<number | ''>(log.rule_id ?? '');
    const [exitLocal, setExitLocal] = useState(isoToLocalInput(log.exit_time, tz));
    const [deadlineMode, setDeadlineMode] = useState<DeadlineMode>('keep');
    const [deadlineLocal, setDeadlineLocal] = useState(isoToLocalInput(log.expected_return_time, tz));
    const [returned, setReturned] = useState(log.status === 'RETURNED');
    const [returnLocal, setReturnLocal] = useState(isoToLocalInput(log.actual_return_time, tz));
    const [saving, setSaving] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);

    // Rules to offer: all active ones, plus the one this log already uses (even if inactive/deleted from list)
    const ruleOptions = rules.filter((r) => r.is_active || r.id === log.rule_id);
    const ruleChanged = (ruleId === '' ? null : ruleId) !== log.rule_id;
    const exitChanged = exitLocal !== isoToLocalInput(log.exit_time, tz);

    const save = async () => {
        if (!reason.trim()) return toast.error('Neden boş olamaz.');
        const payload: UpdateLogPayload = { reason: reason.trim(), notes: notes.trim() || null };

        if (exitChanged) {
            const iso = localInputToIso(exitLocal, tz);
            if (!iso) return toast.error('Çıkış zamanı geçersiz.');
            payload.exitTime = iso;
        }
        if (ruleChanged) payload.ruleId = ruleId === '' ? null : ruleId;

        if (deadlineMode === 'none') {
            payload.expectedReturnTime = null;
        } else if (deadlineMode === 'manual') {
            const iso = localInputToIso(deadlineLocal, tz);
            if (!iso) return toast.error('Süre sınırı zamanı geçersiz.');
            payload.expectedReturnTime = iso;
        }

        if (!returned) {
            if (log.status === 'RETURNED') payload.actualReturnTime = null; // reopen: student is out again
        } else {
            const iso = localInputToIso(returnLocal, tz);
            if (!iso) return toast.error('Giriş zamanı geçersiz.');
            if (iso !== log.actual_return_time && (log.status !== 'RETURNED' || returnLocal !== isoToLocalInput(log.actual_return_time, tz))) {
                payload.actualReturnTime = iso;
            }
        }

        setSaving(true);
        try {
            await exitApi.updateLog(log.id, payload);
            toast.success('Kayıt güncellendi.');
            onDone();
        } catch (e) {
            toast.error((e as Error).message);
        } finally {
            setSaving(false);
        }
    };

    const remove = async () => {
        setSaving(true);
        try {
            await exitApi.deleteLog(log.id);
            toast.success('Kayıt silindi.');
            onDone();
        } catch (e) {
            toast.error((e as Error).message);
            setSaving(false);
        }
    };

    return (
        <Modal
            title={`Kaydı düzenle: ${log.first_name} ${log.last_name}`}
            onClose={onClose}
            footer={
                <>
                    {confirmDelete ? (
                        <div className="me-auto d-flex align-items-center gap-2">
                            <span className="small text-danger">Bu kayıt kalıcı olarak silinsin mi?</span>
                            <button className="btn btn-danger btn-sm" disabled={saving} onClick={remove}>Evet, sil</button>
                            <button className="btn btn-outline-secondary btn-sm" onClick={() => setConfirmDelete(false)}>Hayır</button>
                        </div>
                    ) : (
                        <button className="btn btn-outline-danger me-auto" onClick={() => setConfirmDelete(true)}>
                            <Trash2 size={16} className="me-1" />Sil
                        </button>
                    )}
                    <button className="btn btn-outline-secondary" onClick={onClose}>Vazgeç</button>
                    <button className="btn btn-primary" disabled={saving} onClick={save}>Kaydet</button>
                </>
            }
        >
            <div className="row g-3">
                <div className="col-12">
                    <label className="form-label fw-bold small">Neden</label>
                    <input className="form-control form-control-sm" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={100} />
                </div>
                <div className="col-12">
                    <label className="form-label fw-bold small">Not</label>
                    <input className="form-control form-control-sm" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={255} />
                </div>

                <div className="col-md-6">
                    <label className="form-label fw-bold small">Çıkış zamanı ({tz})</label>
                    <input type="datetime-local" className="form-control form-control-sm" value={exitLocal} onChange={(e) => setExitLocal(e.target.value)} />
                </div>
                <div className="col-md-6">
                    <label className="form-label fw-bold small">İzin kuralı</label>
                    <select className="form-select form-select-sm" value={ruleId} onChange={(e) => setRuleId(e.target.value === '' ? '' : Number(e.target.value))}>
                        <option value="">Kural yok</option>
                        {ruleOptions.map((r) => (
                            <option key={r.id} value={r.id}>{r.name} ({WEEKDAYS_TR[r.deadline_weekday]} {r.deadline_time})</option>
                        ))}
                    </select>
                </div>

                <div className="col-12">
                    <label className="form-label fw-bold small">Süre sınırı</label>
                    <div className="small text-muted mb-1">
                        {(ruleChanged || exitChanged) && deadlineMode === 'keep' && ruleId !== ''
                            ? 'Kural veya çıkış zamanı değiştiği için süre sınırı kurala göre yeniden hesaplanır.'
                            : ruleChanged && ruleId === '' && deadlineMode === 'keep'
                                ? 'Kural kaldırıldığı için süre sınırı da kalkar.'
                                : 'Kayıtlı süre sınırı korunur.'}
                    </div>
                    <div className="d-flex flex-wrap gap-3 align-items-center">
                        <div className="form-check">
                            <input className="form-check-input" type="radio" id="dl-keep" checked={deadlineMode === 'keep'} onChange={() => setDeadlineMode('keep')} />
                            <label className="form-check-label small" htmlFor="dl-keep">Otomatik / değiştirme</label>
                        </div>
                        <div className="form-check">
                            <input className="form-check-input" type="radio" id="dl-manual" checked={deadlineMode === 'manual'} onChange={() => setDeadlineMode('manual')} />
                            <label className="form-check-label small" htmlFor="dl-manual">Elle belirle (istisna)</label>
                        </div>
                        <div className="form-check">
                            <input className="form-check-input" type="radio" id="dl-none" checked={deadlineMode === 'none'} onChange={() => setDeadlineMode('none')} />
                            <label className="form-check-label small" htmlFor="dl-none">Süre sınırı yok</label>
                        </div>
                    </div>
                    {deadlineMode === 'manual' && (
                        <input type="datetime-local" className="form-control form-control-sm mt-2" style={{ maxWidth: 260 }} value={deadlineLocal} onChange={(e) => setDeadlineLocal(e.target.value)} />
                    )}
                </div>

                <div className="col-12">
                    <div className="form-check mb-1">
                        <input className="form-check-input" type="checkbox" id="edit-returned" checked={returned} onChange={(e) => {
                            setReturned(e.target.checked);
                            if (e.target.checked && !returnLocal) setReturnLocal(isoToLocalInput(new Date().toISOString(), tz));
                        }} />
                        <label className="form-check-label fw-bold small" htmlFor="edit-returned">Talebe döndü</label>
                    </div>
                    {returned && (
                        <input type="datetime-local" className="form-control form-control-sm" style={{ maxWidth: 260 }} value={returnLocal} onChange={(e) => setReturnLocal(e.target.value)} />
                    )}
                </div>
            </div>
        </Modal>
    );
}
