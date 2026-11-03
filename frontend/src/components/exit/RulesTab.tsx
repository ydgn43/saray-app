// src/components/exit/RulesTab.tsx
// "Kurallar" tab (Admin / SuperAdmin only):
//   1. the yurt's time zone (deadlines are calculated in it)
//   2. izin rules: a free name + a deadline weekday + a deadline time
// A rule is chosen when an exit is recorded. The deadline becomes the first matching weekday/time
// AFTER the exit and is saved on that record, so changing a rule later never changes old records.

import { useState } from 'react';
import { toast } from 'react-toastify';
import { Edit2, Plus, Trash2 } from 'lucide-react';
import Modal from './Modal';
import { exitApi } from './exitApi';
import { ExitRule } from './exitTypes';
import { WEEKDAYS_TR } from './exitTime';

interface Props {
    rules: ExitRule[];
    timezone: string;
    timezones: string[];
    onChanged: () => void; // reload rules / settings
}

const COMMON_ZONES = ['Europe/Berlin', 'Europe/Istanbul', 'Europe/Amsterdam', 'Europe/Vienna', 'Europe/London', 'UTC'];

interface Draft { id: number | null; name: string; weekday: number; time: string; active: boolean }
const emptyDraft: Draft = { id: null, name: '', weekday: 0, time: '18:30', active: true };

export default function RulesTab({ rules, timezone, timezones, onChanged }: Props) {
    const [zone, setZone] = useState(timezone);
    const [savingZone, setSavingZone] = useState(false);
    const [draft, setDraft] = useState<Draft | null>(null);
    const [saving, setSaving] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const zoneList = Array.from(new Set([...COMMON_ZONES, ...timezones]));

    const saveZone = async () => {
        setSavingZone(true);
        try {
            await exitApi.updateSettings(zone);
            toast.success('Saat dilimi güncellendi. Yeni çıkış kayıtlarının süre sınırı bu saat dilimine göre hesaplanır.');
            onChanged();
        } catch (e) {
            toast.error((e as Error).message);
        } finally {
            setSavingZone(false);
        }
    };

    const saveRule = async () => {
        if (!draft) return;
        if (!draft.name.trim()) return toast.error('Kural adı boş olamaz.');
        if (!/^\d{2}:\d{2}$/.test(draft.time)) return toast.error('Saat SS:DD biçiminde olmalı.');
        setSaving(true);
        try {
            if (draft.id === null) {
                await exitApi.createRule({ name: draft.name.trim(), deadlineWeekday: draft.weekday, deadlineTime: draft.time, isActive: draft.active });
            } else {
                await exitApi.updateRule(draft.id, { name: draft.name.trim(), deadlineWeekday: draft.weekday, deadlineTime: draft.time, isActive: draft.active });
            }
            toast.success('Kural kaydedildi.');
            setDraft(null);
            onChanged();
        } catch (e) {
            toast.error((e as Error).message);
        } finally {
            setSaving(false);
        }
    };

    const toggleActive = async (rule: ExitRule) => {
        try {
            await exitApi.updateRule(rule.id, { isActive: !rule.is_active });
            onChanged();
        } catch (e) {
            toast.error((e as Error).message);
        }
    };

    const removeRule = async (id: number) => {
        try {
            await exitApi.deleteRule(id);
            toast.success('Kural silindi. Eski kayıtlar süre sınırlarını korur.');
            setDeleteId(null);
            onChanged();
        } catch (e) {
            toast.error((e as Error).message);
        }
    };

    return (
        <div>
            {/* ---- time zone */}
            <div className="card mb-4">
                <div className="card-body">
                    <h6 className="fw-bold">Yurt saat dilimi</h6>
                    <p className="text-muted small mb-2">
                        Kuralların gün ve saati bu saat dilimine göre hesaplanır; ekranlardaki saatler de bu saat diliminde gösterilir.
                    </p>
                    <div className="d-flex flex-wrap gap-2 align-items-center">
                        <select className="form-select form-select-sm" style={{ maxWidth: 280 }} value={zone} onChange={(e) => setZone(e.target.value)}>
                            {zoneList.map((z) => <option key={z} value={z}>{z}</option>)}
                        </select>
                        <button className="btn btn-primary btn-sm" disabled={savingZone || zone === timezone} onClick={saveZone}>Kaydet</button>
                    </div>
                </div>
            </div>

            {/* ---- rules */}
            <div className="d-flex align-items-center mb-2">
                <h6 className="fw-bold mb-0">İzin kuralları</h6>
                <button className="btn btn-primary btn-sm ms-auto" onClick={() => setDraft({ ...emptyDraft })}>
                    <Plus size={14} className="me-1" />Yeni kural
                </button>
            </div>
            <p className="text-muted small">
                Örnek: "Haftalık İzin — Pazar 18:30". Çıkış yaparken bu kural seçilirse, talebenin çıkıştan sonraki ilk Pazar 18:30'a kadar dönmesi beklenir; sonra dönerse foya sayılır.
                Kuralsız çıkışlarda (ör. market) süre sınırı yoktur.
            </p>

            {rules.length === 0 ? (
                <div className="text-center text-muted py-4">Henüz kural yok.</div>
            ) : (
                <div className="table-responsive">
                    <table className="table align-middle mb-0">
                        <thead className="table-light">
                            <tr><th>Ad</th><th>Gün</th><th>Saat</th><th>Aktif</th><th style={{ width: 110 }} /></tr>
                        </thead>
                        <tbody>
                            {rules.map((r) => (
                                <tr key={r.id} className={r.is_active ? undefined : 'text-muted'}>
                                    <td className="fw-semibold">{r.name}</td>
                                    <td>{WEEKDAYS_TR[r.deadline_weekday]}</td>
                                    <td>{r.deadline_time}</td>
                                    <td>
                                        <div className="form-check form-switch">
                                            <input className="form-check-input" type="checkbox" checked={r.is_active} onChange={() => toggleActive(r)} aria-label={`${r.name} aktif`} />
                                        </div>
                                    </td>
                                    <td className="text-end text-nowrap">
                                        <button className="btn btn-outline-secondary btn-sm me-1" aria-label="Düzenle"
                                            onClick={() => setDraft({ id: r.id, name: r.name, weekday: r.deadline_weekday, time: r.deadline_time, active: r.is_active })}>
                                            <Edit2 size={14} />
                                        </button>
                                        {deleteId === r.id ? (
                                            <>
                                                <button className="btn btn-danger btn-sm me-1" onClick={() => removeRule(r.id)}>Sil</button>
                                                <button className="btn btn-outline-secondary btn-sm" onClick={() => setDeleteId(null)}>Hayır</button>
                                            </>
                                        ) : (
                                            <button className="btn btn-outline-danger btn-sm" aria-label="Sil" onClick={() => setDeleteId(r.id)}>
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {draft && (
                <Modal
                    title={draft.id === null ? 'Yeni izin kuralı' : 'Kuralı düzenle'}
                    onClose={() => setDraft(null)}
                    footer={
                        <>
                            <button className="btn btn-outline-secondary" onClick={() => setDraft(null)}>Vazgeç</button>
                            <button className="btn btn-primary" disabled={saving} onClick={saveRule}>Kaydet</button>
                        </>
                    }
                >
                    <div className="mb-3">
                        <label className="form-label fw-bold small">Ad</label>
                        <input className="form-control form-control-sm" value={draft.name} maxLength={100} placeholder="Örn. Haftalık İzin" onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
                    </div>
                    <div className="row g-3">
                        <div className="col-6">
                            <label className="form-label fw-bold small">Son dönüş günü</label>
                            <select className="form-select form-select-sm" value={draft.weekday} onChange={(e) => setDraft({ ...draft, weekday: Number(e.target.value) })}>
                                {WEEKDAYS_TR.map((d, i) => <option key={d} value={i}>{d}</option>)}
                            </select>
                        </div>
                        <div className="col-6">
                            <label className="form-label fw-bold small">Saat</label>
                            <input type="time" className="form-control form-control-sm" value={draft.time} onChange={(e) => setDraft({ ...draft, time: e.target.value })} />
                        </div>
                    </div>
                    <div className="form-check form-switch mt-3">
                        <input className="form-check-input" type="checkbox" id="rule-active" checked={draft.active} onChange={(e) => setDraft({ ...draft, active: e.target.checked })} />
                        <label className="form-check-label" htmlFor="rule-active">Aktif (çıkış yaparken seçilebilir)</label>
                    </div>
                </Modal>
            )}
        </div>
    );
}
