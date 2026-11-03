// src/components/exit/useNow.ts
import { useEffect, useState } from 'react';

/** Returns the current time and refreshes it every `everyMs` (for live countdowns). */
export function useNow(everyMs = 30000): Date {
    const [now, setNow] = useState(() => new Date());
    useEffect(() => {
        const id = setInterval(() => setNow(new Date()), everyMs);
        return () => clearInterval(id);
    }, [everyMs]);
    return now;
}
