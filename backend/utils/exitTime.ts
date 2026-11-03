// backend/utils/exitTime.ts
//
// Everything about deadlines and lateness lives here, in one place.
// Rules:
//  - All Date values are absolute instants (stored in the DB as UTC).
//  - A rule says "weekday + local time" in the YURT's time zone (IANA name, e.g. "Europe/Berlin").
//  - No external library: only the built-in Intl API (handles daylight saving time).

/** True if `tz` is a valid IANA time zone name, e.g. "Europe/Berlin". */
export const isValidTimeZone = (tz: string): boolean => {
    try {
        new Intl.DateTimeFormat('en-US', { timeZone: tz });
        return true;
    } catch {
        return false;
    }
};

/** Parses "HH:MM" or "HH:MM:SS". Returns null if invalid. */
export const parseTime = (value: string): { hour: number; minute: number } | null => {
    const m = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(String(value).trim());
    if (!m) return null;
    const hour = Number(m[1]);
    const minute = Number(m[2]);
    if (hour > 23 || minute > 59) return null;
    return { hour, minute };
};

interface LocalParts {
    year: number;
    month: number; // 1-12
    day: number;
    hour: number;
    minute: number;
    second: number;
}

/** Wall-clock parts of an instant in the given time zone. */
const localParts = (instant: Date, tz: string): LocalParts => {
    // `as any` / the cast below: the project's tsconfig only has lib "es6", whose typings do not
    // know `hourCycle` or `formatToParts`. Both exist at runtime in every Node version we use.
    const fmt = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        hourCycle: 'h23',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    } as any);
    const p: Record<string, number> = {};
    const parts = (fmt as any).formatToParts(instant) as Array<{ type: string; value: string }>;
    for (const part of parts) {
        if (part.type !== 'literal') p[part.type] = Number(part.value);
    }
    return { year: p.year, month: p.month, day: p.day, hour: p.hour, minute: p.minute, second: p.second };
};

/** How many ms the zone is ahead of UTC at this instant (e.g. Berlin in winter: +3600000). */
const zoneOffsetMs = (instant: Date, tz: string): number => {
    const l = localParts(instant, tz);
    const asIfUtc = Date.UTC(l.year, l.month - 1, l.day, l.hour, l.minute, l.second);
    return asIfUtc - Math.floor(instant.getTime() / 1000) * 1000;
};

/** Converts a wall-clock time in `tz` to the matching instant. */
const zonedToInstant = (year: number, month: number, day: number, hour: number, minute: number, tz: string): Date => {
    const naive = Date.UTC(year, month - 1, day, hour, minute, 0);
    let result = naive - zoneOffsetMs(new Date(naive), tz);
    // The offset can differ at the real instant (around a daylight-saving switch): correct once.
    result = naive - zoneOffsetMs(new Date(result), tz);
    return new Date(result);
};

/**
 * The next occurrence of `weekday` (0 = Sunday ... 6 = Saturday) at `time` (local time of `tz`)
 * STRICTLY AFTER `exitTime`.
 *
 * Example (Sunday 18:30): a Friday exit gets this Sunday 18:30; an exit on Sunday 19:00
 * (after the deadline) gets NEXT Sunday 18:30; an exit exactly at 18:30 also gets next Sunday.
 */
export const nextDeadline = (exitTime: Date, weekday: number, time: string, tz: string): Date => {
    const t = parseTime(time);
    if (!t) throw new Error(`Invalid time "${time}"`);
    if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) throw new Error(`Invalid weekday ${weekday}`);
    if (!isValidTimeZone(tz)) throw new Error(`Invalid time zone "${tz}"`);

    const local = localParts(exitTime, tz);
    // Weekday of the local calendar date (computed on a UTC date so the server's own zone is irrelevant).
    const localWeekday = new Date(Date.UTC(local.year, local.month - 1, local.day)).getUTCDay();
    const daysAhead = (weekday - localWeekday + 7) % 7;

    const candidateFor = (extraDays: number): Date => {
        const d = new Date(Date.UTC(local.year, local.month - 1, local.day + daysAhead + extraDays));
        return zonedToInstant(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), t.hour, t.minute, tz);
    };

    let candidate = candidateFor(0);
    if (candidate.getTime() <= exitTime.getTime()) candidate = candidateFor(7);
    return candidate;
};

export interface Lateness {
    isLate: boolean;
    lateMinutes: number;
}

/**
 * The ONE place that decides "late".
 *  - no deadline (expected is null)          -> never late
 *  - late when `until` is strictly after the deadline
 *  - lateMinutes = started minutes (1 second late = 1 minute)
 * `until` is the actual return time, or "now" for a student who is still out.
 */
export const computeLateness = (expected: Date | null | undefined, until: Date): Lateness => {
    if (!expected) return { isLate: false, lateMinutes: 0 };
    const diffMs = until.getTime() - expected.getTime();
    if (diffMs <= 0) return { isLate: false, lateMinutes: 0 };
    return { isLate: true, lateMinutes: Math.ceil(diffMs / 60000) };
};
