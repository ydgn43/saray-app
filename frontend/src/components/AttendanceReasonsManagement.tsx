// src/components/AttendanceReasonsManagement.tsx
// Settings > "Yoklama sebepleri": the list of sebepler offered on the yoklama page
// (for GEÇ, İZİNLİ and YOK). One list per yurt; Admin / SuperAdmin only.
//
// Old yoklama records keep their sebep text, so editing or deleting an entry here never changes them.
// "Diğer" (free text) is always offered by the yoklama page and is not part of this list.

import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { ArrowDown, ArrowUp, Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import config from '../config';
import { authFetch } from '../utils/authFetch';
import { useAuth } from '../auth/AuthContext';

interface Reason {
    id: number;
    name: string;
    sort_order: number;
}

async function api(method: string, path: string, body?: unknown): Promise<Reason[]> {
    const res = await authFetch(`${config.API_BASE_URL}/attendance-reasons${path}`, {
        method,
        body: body === undefined ? undefined : JSON.stringify(body),
    });
    let data: any = null;
    try {
        data = await res.json();
    } catch {
        /* empty body */
    }
    if (!res.ok) throw new Error(data?.error || data?.message || `Hata (${res.status})`);
    return data as Reason[];
}

const AttendanceReasonsManagement: React.FC = () => {
    const { user, selectedYurt } = useAuth();
    const yurtKey = selectedYurt?.yurtId ?? user?.yurtid ?? 0;
    const [reasons, setReasons] = useState<Reason[]>([]);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [newName, setNewName] = useState('');
    const [editId, setEditId] = useState<number | null>(null);
    const [editName, setEditName] = useState('');
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            setReasons(await api('GET', ''));
        } catch (e) {
            toast.error((e as Error).message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load, yurtKey]);

    // one place for every change: run it, show the new list, report errors
    const run = async (action: () => Promise<Reason[]>, okText?: string) => {
        setBusy(true);
        try {
            setReasons(await action());
            if (okText) toast.success(okText);
            return true;
        } catch (e) {
            toast.error((e as Error).message);
            return false;
        } finally {
            setBusy(false);
        }
    };

    const add = async () => {
        if (!newName.trim()) return;
        if (await run(() => api('POST', '', { name: newName }), 'Sebep eklendi.')) setNewName('');
    };

    const saveEdit = async () => {
        if (editId === null) return;
        if (await run(() => api('PUT', `/${editId}`, { name: editName }), 'Sebep güncellendi.')) setEditId(null);
    };

    const remove = async (id: number) => {
        await run(() => api('DELETE', `/${id}`), 'Sebep silindi. Eski yoklama kayıtları değişmedi.');
        setDeleteId(null);
    };

    const move = (index: number, direction: -1 | 1) => {
        const ids = reasons.map((r) => r.id);
        const target = index + direction;
        if (target < 0 || target >= ids.length) return;
        [ids[index], ids[target]] = [ids[target], ids[index]];
        run(() => api('PUT', '/reorder', { ids }));
    };

    return (
        <div>
            <div className="input-group input-group-sm mb-3" style={{ maxWidth: 420 }}>
                <input
                    className="form-control"
                    placeholder="Yeni sebep (örn. Sınav)"
                    value={newName}
                    maxLength={100}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') add(); }}
                />
                <button className="btn btn-primary" disabled={busy || !newName.trim()} onClick={add}>
                    <Plus size={14} className="me-1" />Ekle
                </button>
            </div>

            {loading ? (
                <div className="text-muted py-3">Yükleniyor…</div>
            ) : reasons.length === 0 ? (
                <div className="text-muted py-3">
                    Henüz sebep yok.{' '}
                    <button className="btn btn-link btn-sm p-0 align-baseline" disabled={busy} onClick={() => run(() => api('POST', '/defaults'), 'Varsayılan sebepler eklendi.')}>
                        Varsayılanları ekle (Banyo, Hasta, Rahatsiz, Okul)
                    </button>
                </div>
            ) : (
                <ul className="list-group" style={{ maxWidth: 520 }}>
                    {reasons.map((r, i) => (
                        <li key={r.id} className="list-group-item d-flex align-items-center gap-2" data-testid="reason-row">
                            {editId === r.id ? (
                                <>
                                    <input
                                        className="form-control form-control-sm"
                                        value={editName}
                                        maxLength={100}
                                        autoFocus
                                        onChange={(e) => setEditName(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditId(null); }}
                                    />
                                    <button className="btn btn-success btn-sm" disabled={busy || !editName.trim()} onClick={saveEdit} aria-label="Kaydet"><Check size={14} /></button>
                                    <button className="btn btn-outline-secondary btn-sm" onClick={() => setEditId(null)} aria-label="Vazgeç"><X size={14} /></button>
                                </>
                            ) : (
                                <>
                                    <span className="flex-grow-1">{r.name}</span>
                                    <button className="btn btn-outline-secondary btn-sm" disabled={busy || i === 0} onClick={() => move(i, -1)} aria-label="Yukarı taşı"><ArrowUp size={14} /></button>
                                    <button className="btn btn-outline-secondary btn-sm" disabled={busy || i === reasons.length - 1} onClick={() => move(i, 1)} aria-label="Aşağı taşı"><ArrowDown size={14} /></button>
                                    <button className="btn btn-outline-secondary btn-sm" onClick={() => { setEditId(r.id); setEditName(r.name); setDeleteId(null); }} aria-label="Düzenle"><Pencil size={14} /></button>
                                    {deleteId === r.id ? (
                                        <>
                                            <button className="btn btn-danger btn-sm" disabled={busy} onClick={() => remove(r.id)}>Sil</button>
                                            <button className="btn btn-outline-secondary btn-sm" onClick={() => setDeleteId(null)}>Hayır</button>
                                        </>
                                    ) : (
                                        <button className="btn btn-outline-danger btn-sm" onClick={() => setDeleteId(r.id)} aria-label="Sil"><Trash2 size={14} /></button>
                                    )}
                                </>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default AttendanceReasonsManagement;
