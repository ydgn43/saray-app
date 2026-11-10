// Settings > Sezonlar. One list per yurt, newest first.
//  - "Güncel sezon": the season new talebeler start in (exactly one per yurt).
//  - Renaming a season also renames it on that yurt's talebeler.
//  - A season that still has talebeler (or is the current one) cannot be deleted; the page says why.

import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Plus, Star } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import ListEditor, { ListItem } from './ListEditor';
import { settingsApi } from './settingsApi';

interface Season {
    season_year: string;
    is_current: number | boolean;
    student_count: number | string;
}

/** "2026" -> "2026/2027"; anything else is passed on as typed (the server validates the format). */
export const normalizeSeason = (value: string): string => {
    const v = value.trim();
    return /^\d{4}$/.test(v) ? `${v}/${Number(v) + 1}` : v;
};

const SeasonsManagement: React.FC = () => {
    const { user, selectedYurt } = useAuth();
    const yurtKey = selectedYurt?.yurtId ?? user?.yurtid ?? 0;
    const [seasons, setSeasons] = useState<Season[]>([]);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [newValue, setNewValue] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const list = await settingsApi<Season[]>('GET', '/season');
            setSeasons(Array.isArray(list) ? list : []);
        } catch (e) {
            toast.error((e as Error).message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load, yurtKey]);

    // one place for every change: run it, show the new list, report errors
    const run = async (action: () => Promise<unknown>, okText?: string) => {
        setBusy(true);
        try {
            const list = await action();
            // the server answers with the new list; anything else (e.g. an old backend) -> reload it
            if (Array.isArray(list)) setSeasons(list);
            else await load();
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
    const count = (s: Season) => Number(s.student_count) || 0;
    const preview = normalizeSeason(newValue);

    const add = async () => {
        if (!newValue.trim()) return;
        if (await run(() => settingsApi('POST', '/season/create', { season_year: preview }), `${preview} sezonu eklendi.`)) setNewValue('');
    };

    const items: ListItem[] = seasons.map((s) => ({
        key: s.season_year,
        label: s.season_year,
        badge: s.is_current ? <span className="badge bg-success">Güncel</span> : undefined,
        meta: `${count(s)} talebe`,
    }));
    const byKey = (key: string) => seasons.find((s) => s.season_year === key)!;

    return (
        <div>
            <div className="input-group mb-1" style={{ maxWidth: 460 }}>
                <input
                    className="form-control"
                    placeholder="Başlangıç yılı (örn. 2027)"
                    value={newValue}
                    maxLength={9}
                    onChange={(e) => setNewValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') add(); }}
                />
                <button className="btn btn-primary" disabled={busy || !newValue.trim()} onClick={add}>
                    <Plus size={16} className="me-1" />Sezon ekle
                </button>
            </div>
            <div className="form-text mb-3" style={{ minHeight: 20 }}>
                {/^\d{4}$/.test(newValue.trim()) ? <>Eklenecek sezon: <strong>{preview}</strong></> : 'Yalnızca yılı yazmanız yeterli: 2027 → 2027/2028'}
            </div>

            <ListEditor
                items={items}
                loading={loading}
                busy={busy}
                emptyText="Henüz sezon yok. Yukarıdan ilk sezonu ekleyin."
                editPlaceholder="örn. 2027 veya 2027/2028"
                onRename={(item, value) =>
                    run(() => settingsApi('PUT', `/season/update/${enc(item.key)}`, { season_year: normalizeSeason(value) }),
                        'Sezon güncellendi. Talebelerin sezonu da değişti.')
                }
                blockDelete={(item) => {
                    const s = byKey(item.key);
                    if (count(s) > 0) return `${item.label} sezonunda ${count(s)} talebe var. Önce talebeleri başka bir sezona taşıyın.`;
                    if (s.is_current && seasons.length > 1) return 'Güncel sezon silinemez. Önce başka bir sezonu güncel yapın.';
                    return null;
                }}
                onBlocked={(m) => toast.info(m)}
                onDelete={async (item) => { await run(() => settingsApi('DELETE', `/season/delete/${enc(item.key)}`), 'Sezon silindi.'); }}
                extraActions={(item) =>
                    byKey(item.key).is_current ? null : (
                        <button
                            className="btn btn-outline-success btn-sm d-inline-flex align-items-center gap-1"
                            disabled={busy}
                            title="Güncel yap"
                            aria-label="Güncel yap"
                            onClick={() => run(() => settingsApi('PUT', `/season/current/${enc(item.key)}`), `${item.label} artık güncel sezon.`)}
                        >
                            <Star size={14} /><span className="d-none d-sm-inline">Güncel yap</span>
                        </button>
                    )
                }
            />
        </div>
    );
};

export default SeasonsManagement;
