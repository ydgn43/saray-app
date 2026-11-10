// Settings > Programlar and Settings > Dahili Seviyeler.
// Both are "named lists with an order" (the order is used on the yoklama page and in tables),
// so one component serves both; `kind` picks the API.

import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Plus } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { convertToDbName } from '../../constants';
import ListEditor, { ListItem } from './ListEditor';
import { settingsApi } from './settingsApi';

type Kind = 'program' | 'class';

interface Row {
    program_name?: string;
    class_name?: string;
    display_name?: string | null;
    display_order?: number | null;
}

const TEXT: Record<Kind, { placeholder: string; empty: string; added: string; updated: string; deleted: string; orderKey: 'programs' | 'classes' }> = {
    program: {
        placeholder: 'Yeni program (örn. Sabah Namazı)',
        empty: 'Henüz program yok.',
        added: 'Program eklendi.',
        updated: 'Program güncellendi.',
        deleted: 'Program silindi.',
        orderKey: 'programs',
    },
    class: {
        placeholder: 'Yeni dahili seviye (örn. Hazırlık)',
        empty: 'Henüz dahili seviye yok.',
        added: 'Dahili seviye eklendi.',
        updated: 'Dahili seviye güncellendi.',
        deleted: 'Dahili seviye silindi.',
        orderKey: 'classes',
    },
};

const OrderedNamesManagement: React.FC<{ kind: Kind }> = ({ kind }) => {
    const { user, selectedYurt } = useAuth();
    const yurtKey = selectedYurt?.yurtId ?? user?.yurtid ?? 0;
    const t = TEXT[kind];
    const idOf = (r: Row) => (kind === 'program' ? r.program_name : r.class_name) as string;

    const [rows, setRows] = useState<Row[]>([]);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [newName, setNewName] = useState('');

    const load = useCallback(async () => {
        try {
            setRows(await settingsApi<Row[]>('GET', `/${kind}`));
        } catch (e) {
            toast.error((e as Error).message);
        } finally {
            setLoading(false);
        }
    }, [kind]);

    useEffect(() => { setLoading(true); load(); }, [load, yurtKey]);

    // run a change, then reload the list (the server decides the final order)
    const run = async (action: () => Promise<unknown>, okText?: string) => {
        setBusy(true);
        try {
            await action();
            await load();
            if (okText) toast.success(okText);
            return true;
        } catch (e) {
            toast.error((e as Error).message);
            return false;
        } finally {
            setBusy(false);
        }
    };

    const enc = encodeURIComponent;
    const add = async () => {
        const name = newName.trim();
        if (!name) return;
        const body = kind === 'program'
            ? { program_name: convertToDbName(name), display_name: name }
            : { class_name: convertToDbName(name), display_name: name };
        if (await run(() => settingsApi('POST', `/${kind}/create`, body), t.added)) setNewName('');
    };

    const move = (index: number, direction: -1 | 1) => {
        const target = index + direction;
        if (target < 0 || target >= rows.length) return;
        const next = [...rows];
        [next[index], next[target]] = [next[target], next[index]];
        const payload = next.map((r, i) => (kind === 'program'
            ? { program_name: r.program_name, display_order: i + 1 }
            : { class_name: r.class_name, display_order: i + 1 }));
        run(() => settingsApi('PUT', `/${kind}/update-order`, { [t.orderKey]: payload }));
    };

    const items: ListItem[] = rows.map((r) => ({ key: idOf(r), label: r.display_name || idOf(r) }));

    return (
        <div>
            <div className="input-group mb-3" style={{ maxWidth: 460 }}>
                <input
                    className="form-control"
                    placeholder={t.placeholder}
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') add(); }}
                />
                <button className="btn btn-primary" disabled={busy || !newName.trim()} onClick={add}>
                    <Plus size={16} className="me-1" />Ekle
                </button>
            </div>
            <ListEditor
                items={items}
                loading={loading}
                busy={busy}
                numbered
                emptyText={t.empty}
                onMove={move}
                onRename={(item, value) =>
                    run(() => settingsApi('PUT', `/${kind}/update/${enc(item.key)}`, { display_name: value.trim() }), t.updated)
                }
                onDelete={async (item) => { await run(() => settingsApi('DELETE', `/${kind}/delete/${enc(item.key)}`), t.deleted); }}
            />
        </div>
    );
};

export default OrderedNamesManagement;
