// src/hooks/useAttendanceReasons.ts
// The sebep list of the selected yurt (edited in Settings > "Yoklama sebepleri").
// Falls back to the standard list while loading or if it cannot be loaded, so yoklama always works.

import { useEffect, useState } from 'react';
import config from '../config';
import { authFetch } from '../utils/authFetch';
import { useAuth } from '../auth/AuthContext';
import { DEFAULT_SEBEP_OPTIONS } from '../components/attendanceSebep';

export function useAttendanceReasons(): string[] {
    const { user, selectedYurt } = useAuth();
    const yurtKey = selectedYurt?.yurtId ?? user?.yurtid ?? 0;
    const [names, setNames] = useState<string[]>(DEFAULT_SEBEP_OPTIONS);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await authFetch(`${config.API_BASE_URL}/attendance-reasons`);
                if (!res.ok) return;
                const data = await res.json();
                if (!cancelled && Array.isArray(data)) setNames(data.map((r: { name: string }) => r.name));
            } catch {
                /* keep the standard list */
            }
        })();
        return () => { cancelled = true; };
    }, [yurtKey]);

    return names;
}
