// src/hooks/useClassLabels.ts
// The levels ("Dahili Seviye") of the selected yurt, as set up in Settings > Dahili Seviyeler,
// plus one function that turns a stored class_name into the name shown on screen.
// Pages use this instead of keeping their own list, so a level added, renamed or deleted in Settings
// is reflected everywhere.

import { useCallback, useEffect, useState } from 'react';
import config from '../config';
import { authFetch } from '../utils/authFetch';
import { useAuth } from '../auth/AuthContext';

export interface ClassInfo {
    class_name: string;
    display_name?: string | null;
    display_order?: number | null;
}

// Labels of the original levels, used only when a level has no display name in the database.
const LEGACY_LABELS: Record<string, string> = {
    kuranikerim: "Kur'an-ı Kerim",
    hazirlik: 'Hazırlık',
    ibtidai: 'İbtidai',
    ihzari: 'İhzari',
    mezun_tekamul_alti: 'Mezun Tekamul Altı',
    tekamul_alti: 'Tekamul Altı',
};

export function useClassLabels() {
    const { user, selectedYurt } = useAuth();
    const yurtKey = selectedYurt?.yurtId ?? user?.yurtid ?? 0;
    const [classes, setClasses] = useState<ClassInfo[]>([]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await authFetch(`${config.API_BASE_URL}/class`);
                if (!res.ok) return;
                const data = await res.json();
                if (!cancelled && Array.isArray(data)) setClasses(data);
            } catch {
                /* keep what we have; labels fall back to the stored name */
            }
        })();
        return () => { cancelled = true; };
    }, [yurtKey]);

    /** Name to show for a stored class_name. */
    const label = useCallback(
        (className: string): string =>
            classes.find((c) => c.class_name === className)?.display_name || LEGACY_LABELS[className] || className,
        [classes]
    );

    return { classes, label };
}
