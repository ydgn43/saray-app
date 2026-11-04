// backend/controller/exitShared.ts
//
// Small helpers shared by the exit controllers: yurt context, input parsing, response shape.

import { Request, Response, NextFunction } from 'express';
import { QueryTypes } from 'sequelize';
import { sequelize } from '../data/sequelize';
import { computeLateness, durationMinutes } from '../utils/exitTime';

// ---------------------------------------------------------------------
// Yurt context
// ---------------------------------------------------------------------

export interface YurtContext {
    yurtid: number;
    timezone: string;
}

/**
 * Middleware. Runs AFTER validateYurtAccess, which already decided which yurt this user may use
 * (header X-Yurt-Id for admins, the user's own yurt for everyone else).
 * Here we only make sure that yurt really exists and load its time zone.
 * Every exit query then uses ONLY this yurtid. It never comes from the request body.
 */
export const loadYurtContext = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const yurtid = req.selectedYurtId;
        if (typeof yurtid !== 'number' || !Number.isInteger(yurtid) || yurtid <= 0) {
            return res.status(400).json({ error: 'Yurt bilgisi bulunamadı.' });
        }

        const [yurt] = await sequelize.query<YurtContext>(
            `SELECT yurtid, timezone FROM yurt WHERE yurtid = ? LIMIT 1`,
            { replacements: [yurtid], type: QueryTypes.SELECT }
        );
        if (!yurt) {
            return res.status(404).json({ error: 'Yurt bulunamadı.' });
        }

        res.locals.yurt = yurt;
        next();
    } catch (err) {
        console.error('loadYurtContext error:', err);
        res.status(500).json({ error: 'Yurt bilgisi alınamadı.' });
    }
};

/** The yurt of the current request (set by loadYurtContext). */
export const getYurt = (res: Response): YurtContext => res.locals.yurt as YurtContext;

// ---------------------------------------------------------------------
// Input parsing
// ---------------------------------------------------------------------

/** How far in the future a time may be (clock differences between devices). */
export const FUTURE_TOLERANCE_MS = 5 * 60 * 1000;

/** Far-future date used as "no end yet" when comparing time ranges. */
export const NO_END = '9999-12-31 00:00:00';

// Only accepts full ISO timestamps WITH a zone ("...Z" or "...+02:00").
// A time like "2026-10-26T19:55" (no zone) is rejected on purpose: the server cannot know
// which zone it means. This was the cause of the mixed-clock problem in the old data.
const ISO_WITH_ZONE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/;

export const parseInstant = (value: unknown): Date | null => {
    if (typeof value !== 'string' || !ISO_WITH_ZONE.test(value)) return null;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
};

/**
 * Date -> 'YYYY-MM-DD HH:MM:SS' in UTC, for use as a query parameter.
 *
 * ALWAYS use this instead of passing a Date to sequelize.query(). A Date parameter is written
 * in the SERVER's local time zone but read back as UTC, so on a server that is not set to UTC
 * (for example a developer's Mac) every stored time shifts by the offset. Strings are exact.
 */
export function toDbDate(date: Date): string;
export function toDbDate(date: Date | null): string | null;
export function toDbDate(date: Date | null): string | null {
    return date ? date.toISOString().slice(0, 19).replace('T', ' ') : null;
}

/** Key used to group reasons: "Market", " market " and "MARKET" are the same reason. */
export const normalizeReason = (reason: string): string =>
    reason.trim().replace(/\s+/g, ' ').toLocaleLowerCase('tr-TR');

/** Positive integer, or null. */
export const parseId = (value: unknown): number | null => {
    const n = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
    return typeof n === 'number' && Number.isInteger(n) && n > 0 ? n : null;
};

/** Array of unique positive integers, or null if anything in it is invalid. */
export const parseIdList = (value: unknown): number[] | null => {
    if (!Array.isArray(value)) return null;
    const ids: number[] = [];
    for (const item of value) {
        const id = parseId(item);
        if (id === null) return null;
        if (ids.indexOf(id) === -1) ids.push(id);
    }
    return ids;
};

/** MySQL "duplicate entry" error (e.g. the one-open-exit-per-student rule). */
export const isDuplicateError = (err: any): boolean => {
    const code = err?.original?.code ?? err?.parent?.code ?? err?.code;
    return code === 'ER_DUP_ENTRY';
};

// ---------------------------------------------------------------------
// Log rows -> API response
// ---------------------------------------------------------------------

export interface LogRow {
    id: number;
    studentid: number;
    first_name: string;
    last_name: string;
    class_name: string | null;
    reason: string;
    rule_id: number | null;
    rule_name: string | null;
    notes: string | null;
    exit_time: Date;
    expected_return_time: Date | null;
    actual_return_time: Date | null;
    status: 'OUT' | 'RETURNED';
    created_by: number | null;
    created_at: Date;
}

/**
 * Base SELECT for logs. The student JOIN also compares yurtid, so a log can never be shown
 * together with a student of another yurt (the database foreign key forbids it as well).
 * Always add `WHERE l.yurtid = :yurtid`.
 */
export const LOG_SELECT = `
    SELECT l.id, l.studentid, s.first_name, s.last_name, s.class_name,
           l.reason, l.rule_id, r.name AS rule_name, l.notes,
           l.exit_time, l.expected_return_time, l.actual_return_time,
           l.status, l.created_by, l.created_at
    FROM student_out_logs l
    INNER JOIN student s ON s.studentid = l.studentid AND s.yurtid = l.yurtid
    LEFT JOIN exit_rules r ON r.id = l.rule_id`;

/**
 * Adds the computed lateness and duration. Neither is stored in the database.
 *  - duration_minutes: time outside in whole minutes. For an open log it is the time so far (until now).
 *  - returned log: is_late / late_minutes (final result, this is a "foul")
 *  - open log    : is_overdue / overdue_minutes (late so far, still out)
 */
export const toLogDto = (row: LogRow, now: Date = new Date()) => {
    const until = row.actual_return_time ?? now;
    const { isLate, lateMinutes } = computeLateness(row.expected_return_time, until);
    const returned = row.status === 'RETURNED';
    return {
        ...row,
        duration_minutes: durationMinutes(row.exit_time, until),
        is_late: returned && isLate,
        late_minutes: returned ? lateMinutes : 0,
        is_overdue: !returned && isLate,
        overdue_minutes: !returned ? lateMinutes : 0,
    };
};
