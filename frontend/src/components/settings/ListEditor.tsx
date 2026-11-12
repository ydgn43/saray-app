// Shared list for the Settings sections (Sezonlar, Programlar, Gruplar):
// rows with optional badge / meta text, up-down ordering, inline rename and a two-step delete.
// It only shows and reports; each section decides what the actions do.

import React, { useState } from 'react';
import { ArrowDown, ArrowUp, Check, Pencil, Trash2, X } from 'lucide-react';

export interface ListItem {
    key: string;
    label: string;
    badge?: React.ReactNode;   // e.g. "Güncel"
    meta?: string;             // small grey text, e.g. "12 talebe"
}

interface Props {
    items: ListItem[];
    loading: boolean;
    busy: boolean;
    emptyText: string;
    numbered?: boolean;
    onRename: (item: ListItem, value: string) => Promise<boolean>;
    onDelete: (item: ListItem) => Promise<void>;
    onMove?: (index: number, direction: -1 | 1) => void;
    /** Return a text to explain why this item cannot be deleted right now, or null. */
    blockDelete?: (item: ListItem) => string | null;
    onBlocked?: (message: string) => void;
    extraActions?: (item: ListItem) => React.ReactNode;
    editPlaceholder?: string;
}

const ListEditor: React.FC<Props> = ({
    items, loading, busy, emptyText, numbered, onRename, onDelete, onMove, blockDelete, onBlocked, extraActions, editPlaceholder,
}) => {
    const [editKey, setEditKey] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');
    const [deleteKey, setDeleteKey] = useState<string | null>(null);

    if (loading) return <div className="text-muted py-3">Yükleniyor…</div>;
    if (items.length === 0) return <div className="text-muted py-3 text-center border rounded bg-light">{emptyText}</div>;

    const saveEdit = async (item: ListItem) => {
        if (!editValue.trim() || editValue.trim() === item.label) { setEditKey(null); return; }
        if (await onRename(item, editValue)) setEditKey(null);
    };

    return (
        <ul className="list-group">
            {items.map((item, i) => (
                <li key={item.key} className="list-group-item d-flex align-items-center gap-2 flex-wrap" data-testid="list-row">
                    {editKey === item.key ? (
                        <>
                            <input
                                className="form-control form-control-sm"
                                style={{ maxWidth: 320 }}
                                value={editValue}
                                placeholder={editPlaceholder}
                                autoFocus
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(item); if (e.key === 'Escape') setEditKey(null); }}
                            />
                            <button className="btn btn-success btn-sm" disabled={busy || !editValue.trim()} onClick={() => saveEdit(item)} aria-label="Kaydet"><Check size={14} /></button>
                            <button className="btn btn-outline-secondary btn-sm" onClick={() => setEditKey(null)} aria-label="Vazgeç"><X size={14} /></button>
                        </>
                    ) : (
                        <>
                            {numbered && <span className="badge bg-secondary-subtle text-secondary-emphasis">{i + 1}</span>}
                            <span className="fw-medium">{item.label}</span>
                            {item.badge}
                            {item.meta && <span className="text-muted small">{item.meta}</span>}
                            <span className="flex-grow-1" />
                            {extraActions?.(item)}
                            {onMove && (
                                <>
                                    <button className="btn btn-outline-secondary btn-sm" disabled={busy || i === 0} onClick={() => onMove(i, -1)} aria-label="Yukarı taşı"><ArrowUp size={14} /></button>
                                    <button className="btn btn-outline-secondary btn-sm" disabled={busy || i === items.length - 1} onClick={() => onMove(i, 1)} aria-label="Aşağı taşı"><ArrowDown size={14} /></button>
                                </>
                            )}
                            <button
                                className="btn btn-outline-secondary btn-sm"
                                onClick={() => { setEditKey(item.key); setEditValue(item.label); setDeleteKey(null); }}
                                aria-label="Düzenle"
                            ><Pencil size={14} /></button>
                            {deleteKey === item.key ? (
                                <>
                                    <button className="btn btn-danger btn-sm" disabled={busy} onClick={async () => { await onDelete(item); setDeleteKey(null); }}>Sil</button>
                                    <button className="btn btn-outline-secondary btn-sm" onClick={() => setDeleteKey(null)}>Hayır</button>
                                </>
                            ) : (
                                <button
                                    className="btn btn-outline-danger btn-sm"
                                    aria-label="Sil"
                                    onClick={() => {
                                        const blocked = blockDelete?.(item);
                                        if (blocked) onBlocked?.(blocked);
                                        else setDeleteKey(item.key);
                                    }}
                                ><Trash2 size={14} /></button>
                            )}
                        </>
                    )}
                </li>
            ))}
        </ul>
    );
};

export default ListEditor;
