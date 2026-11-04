// src/components/exit/exitTime.ts
//
// Time helpers for the exit pages.
// Rule of thumb: the API talks in absolute instants (ISO strings with "Z"), but PEOPLE read and type
// times in the YURT's time zone (set on the "Kurallar" tab). These helpers convert between the two,
// so a browser in another country still shows the yurt's wall-clock time.

export const WEEKDAYS_TR = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

interface Parts { year: number; month: number; day: number; hour: number; minute: number; second: number }

/** Wall-clock parts of an instant in the given time zone. */
const partsInZone = (instant: Date, tz: string): Parts => {
    const fmt = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        hourCycle: 'h23',
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
    const p: Record<string, number> = {};
    fmt.formatToParts(instant).forEach((part) => {
        if (part.type !== 'literal') p[part.type] = Number(part.value);
    });
    return { year: p.year, month: p.month, day: p.day, hour: p.hour, minute: p.minute, second: p.second };
};

/** Milliseconds the zone is ahead of UTC at this instant. */
const offsetMs = (instant: Date, tz: string): number => {
    const l = partsInZone(instant, tz);
    return Date.UTC(l.year, l.month - 1, l.day, l.hour, l.minute, l.second) - Math.floor(instant.getTime() / 1000) * 1000;
};

const pad = (n: number) => String(n).padStart(2, '0');

/** "2026-11-08T18:30" typed in the yurt's zone -> the real instant (or null if invalid). */
export const zonedLocalToDate = (local: string, tz: string): Date | null => {
    const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local);
    if (!m) return null;
    const [y, mo, d, h, mi] = m.slice(1).map(Number);
    const naive = Date.UTC(y, mo - 1, d, h, mi, 0);
    let result = naive - offsetMs(new Date(naive), tz);
    result = naive - offsetMs(new Date(result), tz); // second pass: daylight-saving edge
    const date = new Date(result);
    return isNaN(date.getTime()) ? null : date;
};

/** An instant -> "2026-11-08T18:30" in the yurt's zone (value for <input type="datetime-local">). */
export const dateToZonedLocal = (date: Date, tz: string): string => {
    const l = partsInZone(date, tz);
    return `${l.year}-${pad(l.month)}-${pad(l.day)}T${pad(l.hour)}:${pad(l.minute)}`;
};

/** ISO string (from the API) -> datetime-local value in the yurt's zone. Empty string if null. */
export const isoToLocalInput = (iso: string | null, tz: string): string =>
    iso ? dateToZonedLocal(new Date(iso), tz) : '';

/** datetime-local value (yurt zone) -> ISO string with "Z" for the API. Null if empty/invalid. */
export const localInputToIso = (local: string, tz: string): string | null => {
    const d = local ? zonedLocalToDate(local, tz) : null;
    return d ? d.toISOString() : null;
};

/** "2026-11-08" (a day in the yurt's zone) + addDays -> ISO of that day's 00:00 in the yurt's zone. */
export const dayStartIso = (day: string, tz: string, addDays = 0): string | null => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
    if (!m) return null;
    const shifted = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]) + addDays));
    const local = `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}T00:00`;
    return localInputToIso(local, tz);
};

/** "02.11.2026 Paz 18:30" in the yurt's zone. */
export const formatDateTime = (value: string | Date | null, tz: string): string => {
    if (!value) return '—';
    const date = typeof value === 'string' ? new Date(value) : value;
    if (isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('tr-TR', {
        timeZone: tz,
        day: '2-digit', month: '2-digit', year: 'numeric',
        weekday: 'short',
        hour: '2-digit', minute: '2-digit',
        hourCycle: 'h23',
    }).format(date);
};

/** 135 -> "2 sa 15 dk", 3000 -> "2 g 1 sa 20 dk". */
export const formatMinutes = (minutes: number): string => {
    const total = Math.max(0, Math.round(minutes));
    if (total < 1) return '0 dk';
    const days = Math.floor(total / 1440);
    const hours = Math.floor((total % 1440) / 60);
    const mins = total % 60;
    const out: string[] = [];
    if (days) out.push(`${days} g`);
    if (hours) out.push(`${hours} sa`);
    if (mins && days === 0) out.push(`${mins} dk`);
    return out.join(' ');
};

/** Whole minutes between two instants (rounded down, never negative). Used for the live "outside for" counter. */
export const minutesBetween = (fromIso: string, until: Date): number =>
    Math.max(0, Math.floor((until.getTime() - new Date(fromIso).getTime()) / 60000));

/** 45 -> "45 dk", 135 -> "2 sa 15 dk", 3000 -> "2 g 2 sa" (parts that are zero are left out). */
export const formatDuration = (minutes: number): string => {
    const total = Math.max(0, Math.floor(minutes));
    if (total < 60) return `${total} dk`;
    const days = Math.floor(total / 1440);
    const hours = Math.floor((total % 1440) / 60);
    const mins = total % 60;
    const parts: string[] = [];
    if (days) parts.push(`${days} g`);
    if (hours) parts.push(`${hours} sa`);
    if (mins) parts.push(`${mins} dk`);
    return parts.join(' ');
};
