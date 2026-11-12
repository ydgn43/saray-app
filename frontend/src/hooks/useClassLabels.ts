// src/hooks/useClassLabels.ts
// The levels ("Grup") of the selected yurt, as set up in Settings > Gruplar,
// plus one function that turns a stored class_name into the name shown on screen.
// Pages use this instead of keeping their own list, so a level added, renamed or deleted in Settings
// is reflected everywhere.

import { useCallback, useEffect, useState } from 'react';
import config from '../config';
import { authFetch } from '../utils/authFetch';
import { useAuth } from '../auth/AuthContext';
import { prettifyClassName } from '../utils/classNames';

export interface ClassInfo {
    class_name: string;
    display_name?: string | null;
    display_order?: number | null;
}

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
            classes.find((c) => c.class_name === className)?.display_name || prettifyClassName(className),
        [classes]
    );

    return { classes, label };
}
