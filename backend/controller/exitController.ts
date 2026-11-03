// backend/controller/exitController.ts
//
// Student exit / return logs.
//
// Rules this file follows:
//  1. The yurt ALWAYS comes from getYurt(res) (set by the middleware), never from the request body.
//  2. Every query contains `yurtid`.
//  3. "Late" is never stored. It is computed by computeLateness() in utils/exitTime.ts.
//  4. All times are absolute instants (UTC in the DB). The API only accepts ISO strings with a zone.

import { Request, Response } from 'express';
import { QueryTypes, Transaction } from 'sequelize';
import { sequelize } from '../data/sequelize';
import { computeLateness, nextDeadline } from '../utils/exitTime';
import {
    FUTURE_TOLERANCE_MS,
    NO_END,
    LOG_SELECT,
    LogRow,
    getYurt,
    isDuplicateError,
    parseId,
    parseIdList,
    parseInstant,
    toDbDate,
    toLogDto,
} from './exitShared';

const MAX_BATCH = 500;
const MAX_REASON_LENGTH = 100;
const MAX_NOTES_LENGTH = 255;

interface RuleRow {
    id: number;
    name: string;
    deadline_weekday: number;
    deadline_time: string;
    is_active: number;
}

/** Loads a rule, but only if it belongs to this yurt. */
const loadRule = async (yurtid: number, ruleId: number, t?: Transaction): Promise<RuleRow | null> => {
    const [rule] = await sequelize.query<RuleRow>(
        `SELECT id, name, deadline_weekday, deadline_time, is_active
         FROM exit_rules WHERE id = :ruleId AND yurtid = :yurtid LIMIT 1`,
        { replacements: { ruleId, yurtid }, type: QueryTypes.SELECT, transaction: t }
    );
    return rule ?? null;
};

/**
 * Which of these students already have a log that overlaps the time range [from, to)?
 * `to = null` means "still open / no end". Returns studentid -> true if the overlap is an OPEN exit.
 */
const findOverlaps = async (
    yurtid: number,
    studentIds: number[],
    from: Date,
    to: Date | null,
    t: Transaction,
    ignoreLogId: number | null = null
): Promise<Map<number, boolean>> => {
    if (studentIds.length === 0) return new Map();
    const rows = await sequelize.query<{ studentid: number; has_open: number }>(
        `SELECT studentid, MAX(actual_return_time IS NULL) AS has_open
         FROM student_out_logs
         WHERE yurtid = :yurtid
           AND studentid IN (:studentIds)
           AND id <> :ignoreLogId
           AND exit_time < COALESCE(:to, '${NO_END}')
           AND COALESCE(actual_return_time, '${NO_END}') > :from
         GROUP BY studentid`,
        {
            replacements: { yurtid, studentIds, ignoreLogId: ignoreLogId ?? 0, to: toDbDate(to), from: toDbDate(from) },
            type: QueryTypes.SELECT,
            transaction: t,
        }
    );
    return new Map(rows.map((r) => [r.studentid, Boolean(r.has_open)]));
};

const fetchLog = async (yurtid: number, logId: number, t?: Transaction) => {
    const [row] = await sequelize.query<LogRow>(
        `${LOG_SELECT} WHERE l.id = :logId AND l.yurtid = :yurtid LIMIT 1`,
        { replacements: { logId, yurtid }, type: QueryTypes.SELECT, transaction: t }
    );
    return row ? toLogDto(row) : null;
};

// ---------------------------------------------------------------------
// POST /exit/record-exit
// body: { studentids: number[], reason?: string, ruleId?: number|null, notes?: string|null,
//         exitTime?: ISO (default now), actualReturnTime?: ISO (retroactive: exit AND return) }
// ---------------------------------------------------------------------
export const recordExit = async (req: Request, res: Response) => {
    try {
        const yurt = getYurt(res);
        const { studentids, reason, ruleId, notes, exitTime, actualReturnTime } = req.body ?? {};
        const now = new Date();

        // --- students
        const studentIds = parseIdList(studentids);
        if (!studentIds || studentIds.length === 0) {
            return res.status(400).json({ error: 'Lütfen en az bir geçerli talebe seçiniz.' });
        }
        if (studentIds.length > MAX_BATCH) {
            return res.status(400).json({ error: `En fazla ${MAX_BATCH} talebe seçilebilir.` });
        }

        // --- times
        const exit = exitTime === undefined || exitTime === null ? now : parseInstant(exitTime);
        if (!exit) {
            return res.status(400).json({ error: 'exitTime geçerli bir ISO zaman damgası olmalı (ör. 2026-11-06T15:00:00Z).' });
        }
        if (exit.getTime() > now.getTime() + FUTURE_TOLERANCE_MS) {
            return res.status(400).json({ error: 'Çıkış zamanı gelecekte olamaz.' });
        }

        let actualReturn: Date | null = null;
        if (actualReturnTime !== undefined && actualReturnTime !== null) {
            actualReturn = parseInstant(actualReturnTime);
            if (!actualReturn) {
                return res.status(400).json({ error: 'actualReturnTime geçerli bir ISO zaman damgası olmalı.' });
            }
            if (actualReturn.getTime() < exit.getTime()) {
                return res.status(400).json({ error: 'Giriş zamanı çıkış zamanından önce olamaz.' });
            }
            if (actualReturn.getTime() > now.getTime() + FUTURE_TOLERANCE_MS) {
                return res.status(400).json({ error: 'Giriş zamanı gelecekte olamaz.' });
            }
        }

        // --- rule (optional) -> deadline snapshot
        let rule: RuleRow | null = null;
        if (ruleId !== undefined && ruleId !== null) {
            const id = parseId(ruleId);
            rule = id ? await loadRule(yurt.yurtid, id) : null;
            if (!rule || !rule.is_active) {
                return res.status(400).json({ error: 'Geçerli ve aktif bir izin kuralı seçiniz.' });
            }
        }
        const expectedReturn = rule
            ? nextDeadline(exit, rule.deadline_weekday, rule.deadline_time, yurt.timezone)
            : null;

        // --- reason / notes
        const reasonText = (typeof reason === 'string' ? reason.trim() : '') || rule?.name || '';
        if (!reasonText) {
            return res.status(400).json({ error: 'Lütfen bir neden yazınız veya bir izin kuralı seçiniz.' });
        }
        if (reasonText.length > MAX_REASON_LENGTH) {
            return res.status(400).json({ error: `Neden en fazla ${MAX_REASON_LENGTH} karakter olabilir.` });
        }
        const notesText = typeof notes === 'string' && notes.trim() !== '' ? notes.trim() : null;
        if (notesText && notesText.length > MAX_NOTES_LENGTH) {
            return res.status(400).json({ error: `Not en fazla ${MAX_NOTES_LENGTH} karakter olabilir.` });
        }

        const status = actualReturn ? 'RETURNED' : 'OUT';
        const createdBy = req.user?.accountid ?? null;

        // --- all or nothing
        const { created, skipped } = await sequelize.transaction(async (t) => {
            // Only students of THIS yurt are accepted.
            const found = await sequelize.query<{ studentid: number }>(
                `SELECT studentid FROM student WHERE yurtid = :yurtid AND studentid IN (:studentIds)`,
                { replacements: { yurtid: yurt.yurtid, studentIds }, type: QueryTypes.SELECT, transaction: t }
            );
            const inYurt = new Set(found.map((r) => r.studentid));
            const overlaps = await findOverlaps(yurt.yurtid, studentIds.filter((id) => inYurt.has(id)), exit, actualReturn, t);

            const createdIds: number[] = [];
            const skippedList: Array<{ studentid: number; reason: 'not_in_yurt' | 'already_out' | 'overlaps_existing' }> = [];

            for (const studentid of studentIds) {
                if (!inYurt.has(studentid)) {
                    skippedList.push({ studentid, reason: 'not_in_yurt' });
                    continue;
                }
                if (overlaps.has(studentid)) {
                    skippedList.push({ studentid, reason: overlaps.get(studentid) ? 'already_out' : 'overlaps_existing' });
                    continue;
                }
                try {
                    await sequelize.query(
                        `INSERT INTO student_out_logs
                            (studentid, yurtid, reason, rule_id, notes, exit_time, expected_return_time,
                             actual_return_time, status, created_by)
                         VALUES (:studentid, :yurtid, :reason, :ruleId, :notes, :exit, :expected,
                                 :actualReturn, :status, :createdBy)`,
                        {
                            replacements: {
                                studentid, yurtid: yurt.yurtid, reason: reasonText, ruleId: rule?.id ?? null,
                                notes: notesText, exit: toDbDate(exit), expected: toDbDate(expectedReturn),
                                actualReturn: toDbDate(actualReturn), status, createdBy,
                            },
                            transaction: t,
                        }
                    );
                    const [idRow] = await sequelize.query<{ id: number }>(
                        `SELECT LAST_INSERT_ID() AS id`,
                        { type: QueryTypes.SELECT, transaction: t }
                    );
                    createdIds.push(Number(idRow.id));
                } catch (err) {
                    // Two requests at the same moment: the unique index lets only one win.
                    if (isDuplicateError(err)) {
                        skippedList.push({ studentid, reason: 'already_out' });
                    } else {
                        throw err;
                    }
                }
            }
            return { created: createdIds, skipped: skippedList };
        });

        if (created.length === 0) {
            return res.status(409).json({ error: 'Seçilen talebe(ler) için kayıt oluşturulamadı.', skipped });
        }

        const lateness = actualReturn ? computeLateness(expectedReturn, actualReturn) : null;
        res.status(201).json({
            success: true,
            created,
            skipped,
            expected_return_time: expectedReturn,
            is_late: lateness ? lateness.isLate : false,
            late_minutes: lateness ? lateness.lateMinutes : 0,
        });
    } catch (err) {
        console.error('recordExit error:', err);
        res.status(500).json({ error: 'Çıkış kaydı oluşturulamadı.' });
    }
};

// ---------------------------------------------------------------------
// POST /exit/record-return
// body: { logIds: number[] (or logId: number), actualReturnTime?: ISO (default now) }
// ---------------------------------------------------------------------
export const recordReturn = async (req: Request, res: Response) => {
    try {
        const yurt = getYurt(res);
        const { logId, logIds, actualReturnTime } = req.body ?? {};
        const now = new Date();

        const ids = parseIdList(logIds !== undefined ? logIds : [logId]);
        if (!ids || ids.length === 0) {
            return res.status(400).json({ error: 'Geçerli bir kayıt seçiniz.' });
        }
        if (ids.length > MAX_BATCH) {
            return res.status(400).json({ error: `En fazla ${MAX_BATCH} kayıt seçilebilir.` });
        }

        const actual = actualReturnTime === undefined || actualReturnTime === null ? now : parseInstant(actualReturnTime);
        if (!actual) {
            return res.status(400).json({ error: 'actualReturnTime geçerli bir ISO zaman damgası olmalı.' });
        }
        if (actual.getTime() > now.getTime() + FUTURE_TOLERANCE_MS) {
            return res.status(400).json({ error: 'Giriş zamanı gelecekte olamaz.' });
        }

        const { returned, skipped } = await sequelize.transaction(async (t) => {
            const returnedList: Array<{ id: number; is_late: boolean; late_minutes: number }> = [];
            const skippedList: Array<{ id: number; reason: 'not_open' | 'before_exit' }> = [];

            for (const id of ids) {
                // FOR UPDATE: nobody else can change this row until we are done.
                const [log] = await sequelize.query<{ id: number; exit_time: Date; expected_return_time: Date | null }>(
                    `SELECT id, exit_time, expected_return_time FROM student_out_logs
                     WHERE id = :id AND yurtid = :yurtid AND status = 'OUT' FOR UPDATE`,
                    { replacements: { id, yurtid: yurt.yurtid }, type: QueryTypes.SELECT, transaction: t }
                );
                if (!log) {
                    skippedList.push({ id, reason: 'not_open' });
                    continue;
                }
                if (actual.getTime() < new Date(log.exit_time).getTime()) {
                    skippedList.push({ id, reason: 'before_exit' });
                    continue;
                }
                await sequelize.query(
                    `UPDATE student_out_logs SET actual_return_time = :actual, status = 'RETURNED'
                     WHERE id = :id AND yurtid = :yurtid AND status = 'OUT'`,
                    { replacements: { actual: toDbDate(actual), id, yurtid: yurt.yurtid }, transaction: t }
                );
                const { isLate, lateMinutes } = computeLateness(log.expected_return_time, actual);
                returnedList.push({ id, is_late: isLate, late_minutes: lateMinutes });
            }
            return { returned: returnedList, skipped: skippedList };
        });

        if (returned.length === 0) {
            return res.status(409).json({ error: 'Aktif çıkış kaydı bulunamadı.', skipped });
        }
        res.json({ success: true, returned, skipped, actual_return_time: actual });
    } catch (err) {
        console.error('recordReturn error:', err);
        res.status(500).json({ error: 'Giriş kaydı işlenemedi.' });
    }
};

// ---------------------------------------------------------------------
// PUT /exit/logs/:id
// Any of: reason, notes, exitTime, ruleId (null = no rule), expectedReturnTime (null = no deadline),
//         actualReturnTime (null = reopen: student is out again)
// Deadline handling:
//   - expectedReturnTime in body        -> used as given (manual exception)
//   - ruleId or exitTime changed + rule -> deadline is recalculated from the rule
//   - ruleId set to null                -> deadline removed
//   - otherwise                         -> saved deadline stays as it is
// ---------------------------------------------------------------------
export const updateExitLog = async (req: Request, res: Response) => {
    try {
        const yurt = getYurt(res);
        const logId = parseId(req.params.id);
        if (!logId) {
            return res.status(400).json({ error: 'Geçersiz kayıt ID.' });
        }
        const body = req.body ?? {};
        const has = (key: string) => Object.prototype.hasOwnProperty.call(body, key);
        const now = new Date();

        const outcome = await sequelize.transaction(async (t) => {
            const [existing] = await sequelize.query<{
                id: number; studentid: number; reason: string; rule_id: number | null; notes: string | null;
                exit_time: Date; expected_return_time: Date | null; actual_return_time: Date | null;
            }>(
                `SELECT id, studentid, reason, rule_id, notes, exit_time, expected_return_time, actual_return_time
                 FROM student_out_logs WHERE id = :logId AND yurtid = :yurtid FOR UPDATE`,
                { replacements: { logId, yurtid: yurt.yurtid }, type: QueryTypes.SELECT, transaction: t }
            );
            if (!existing) return { status: 404 as const, error: 'Kayıt bulunamadı.' };

            // --- times
            let exit = new Date(existing.exit_time);
            if (has('exitTime')) {
                const parsed = parseInstant(body.exitTime);
                if (!parsed) return { status: 400 as const, error: 'exitTime geçerli bir ISO zaman damgası olmalı.' };
                exit = parsed;
            }
            let actual: Date | null = existing.actual_return_time ? new Date(existing.actual_return_time) : null;
            if (has('actualReturnTime')) {
                if (body.actualReturnTime === null) {
                    actual = null;
                } else {
                    const parsed = parseInstant(body.actualReturnTime);
                    if (!parsed) return { status: 400 as const, error: 'actualReturnTime geçerli bir ISO zaman damgası olmalı.' };
                    actual = parsed;
                }
            }
            if (exit.getTime() > now.getTime() + FUTURE_TOLERANCE_MS) {
                return { status: 400 as const, error: 'Çıkış zamanı gelecekte olamaz.' };
            }
            if (actual && actual.getTime() > now.getTime() + FUTURE_TOLERANCE_MS) {
                return { status: 400 as const, error: 'Giriş zamanı gelecekte olamaz.' };
            }
            if (actual && actual.getTime() < exit.getTime()) {
                return { status: 400 as const, error: 'Giriş zamanı çıkış zamanından önce olamaz.' };
            }

            // --- rule + deadline
            let ruleIdNew: number | null = existing.rule_id;
            let rule: RuleRow | null = null;
            if (has('ruleId')) {
                if (body.ruleId === null) {
                    ruleIdNew = null;
                } else {
                    const id = parseId(body.ruleId);
                    rule = id ? await loadRule(yurt.yurtid, id, t) : null;
                    if (!rule) return { status: 400 as const, error: 'Geçerli bir izin kuralı seçiniz.' };
                    ruleIdNew = rule.id;
                }
            } else if (has('exitTime') && existing.rule_id) {
                rule = await loadRule(yurt.yurtid, existing.rule_id, t); // may be null if deleted
            }

            let expected: Date | null = existing.expected_return_time ? new Date(existing.expected_return_time) : null;
            if (has('expectedReturnTime')) {
                if (body.expectedReturnTime === null) {
                    expected = null;
                } else {
                    const parsed = parseInstant(body.expectedReturnTime);
                    if (!parsed) return { status: 400 as const, error: 'expectedReturnTime geçerli bir ISO zaman damgası olmalı.' };
                    expected = parsed;
                }
            } else if (rule) {
                expected = nextDeadline(exit, rule.deadline_weekday, rule.deadline_time, yurt.timezone);
            } else if (has('ruleId') && body.ruleId === null) {
                expected = null;
            }

            // --- text fields
            let reasonText = existing.reason;
            if (has('reason')) {
                reasonText = typeof body.reason === 'string' ? body.reason.trim() : '';
                if (!reasonText || reasonText.length > MAX_REASON_LENGTH) {
                    return { status: 400 as const, error: `Neden 1-${MAX_REASON_LENGTH} karakter olmalı.` };
                }
            }
            let notesText = existing.notes;
            if (has('notes')) {
                notesText = typeof body.notes === 'string' && body.notes.trim() !== '' ? body.notes.trim() : null;
                if (notesText && notesText.length > MAX_NOTES_LENGTH) {
                    return { status: 400 as const, error: `Not en fazla ${MAX_NOTES_LENGTH} karakter olabilir.` };
                }
            }

            // --- must not overlap another log of the same student
            const overlaps = await findOverlaps(yurt.yurtid, [existing.studentid], exit, actual, t, logId);
            if (overlaps.has(existing.studentid)) {
                return { status: 409 as const, error: 'Bu talebenin bu zaman aralığında başka bir kaydı var.' };
            }

            try {
                await sequelize.query(
                    `UPDATE student_out_logs
                     SET reason = :reason, rule_id = :ruleId, notes = :notes, exit_time = :exit,
                         expected_return_time = :expected, actual_return_time = :actual, status = :status
                     WHERE id = :logId AND yurtid = :yurtid`,
                    {
                        replacements: {
                            reason: reasonText, ruleId: ruleIdNew, notes: notesText, exit: toDbDate(exit),
                            expected: toDbDate(expected), actual: toDbDate(actual),
                            status: actual ? 'RETURNED' : 'OUT', logId, yurtid: yurt.yurtid,
                        },
                        transaction: t,
                    }
                );
            } catch (err) {
                if (isDuplicateError(err)) return { status: 409 as const, error: 'Talebe zaten dışarıda.' };
                throw err;
            }
            return { status: 200 as const, log: await fetchLog(yurt.yurtid, logId, t) };
        });

        if (outcome.status !== 200) {
            return res.status(outcome.status).json({ error: outcome.error });
        }
        res.json({ success: true, log: outcome.log });
    } catch (err) {
        console.error('updateExitLog error:', err);
        res.status(500).json({ error: 'Kayıt güncellenemedi.' });
    }
};

// ---------------------------------------------------------------------
// DELETE /exit/logs/:id
// ---------------------------------------------------------------------
export const deleteExitLog = async (req: Request, res: Response) => {
    try {
        const yurt = getYurt(res);
        const logId = parseId(req.params.id);
        if (!logId) {
            return res.status(400).json({ error: 'Geçersiz kayıt ID.' });
        }

        const [existing] = await sequelize.query<{ id: number }>(
            `SELECT id FROM student_out_logs WHERE id = :logId AND yurtid = :yurtid LIMIT 1`,
            { replacements: { logId, yurtid: yurt.yurtid }, type: QueryTypes.SELECT }
        );
        if (!existing) {
            return res.status(404).json({ error: 'Kayıt bulunamadı.' });
        }

        await sequelize.query(
            `DELETE FROM student_out_logs WHERE id = :logId AND yurtid = :yurtid`,
            { replacements: { logId, yurtid: yurt.yurtid } }
        );
        res.json({ success: true });
    } catch (err) {
        console.error('deleteExitLog error:', err);
        res.status(500).json({ error: 'Kayıt silinemedi.' });
    }
};

// ---------------------------------------------------------------------
// GET /exit/logs?status=OUT|RETURNED&studentid=&from=ISO&to=ISO&limit=500
// (from / to filter on the exit time)
// ---------------------------------------------------------------------
export const getExitLogs = async (req: Request, res: Response) => {
    try {
        const yurt = getYurt(res);
        const conditions = ['l.yurtid = :yurtid'];
        const replacements: Record<string, any> = { yurtid: yurt.yurtid };

        if (req.query.status !== undefined) {
            if (req.query.status !== 'OUT' && req.query.status !== 'RETURNED') {
                return res.status(400).json({ error: "status 'OUT' veya 'RETURNED' olmalı." });
            }
            conditions.push('l.status = :status');
            replacements.status = req.query.status;
        }
        if (req.query.studentid !== undefined) {
            const studentid = parseId(req.query.studentid);
            if (!studentid) return res.status(400).json({ error: 'Geçersiz talebe ID.' });
            conditions.push('l.studentid = :studentid');
            replacements.studentid = studentid;
        }
        if (req.query.from !== undefined) {
            const from = parseInstant(req.query.from);
            if (!from) return res.status(400).json({ error: 'from geçerli bir ISO zaman damgası olmalı.' });
            conditions.push('l.exit_time >= :from');
            replacements.from = toDbDate(from);
        }
        if (req.query.to !== undefined) {
            const to = parseInstant(req.query.to);
            if (!to) return res.status(400).json({ error: 'to geçerli bir ISO zaman damgası olmalı.' });
            conditions.push('l.exit_time < :to');
            replacements.to = toDbDate(to);
        }
        const limitParam = req.query.limit === undefined ? 500 : parseId(req.query.limit);
        if (!limitParam) return res.status(400).json({ error: 'Geçersiz limit.' });
        replacements.limit = Math.min(limitParam, 2000);

        const rows = await sequelize.query<LogRow>(
            `${LOG_SELECT} WHERE ${conditions.join(' AND ')} ORDER BY l.exit_time DESC, l.id DESC LIMIT :limit`,
            { replacements, type: QueryTypes.SELECT }
        );
        const now = new Date();
        res.json(rows.map((row) => toLogDto(row, now)));
    } catch (err) {
        console.error('getExitLogs error:', err);
        res.status(500).json({ error: 'Çıkış/Giriş kayıtları alınamadı.' });
    }
};

// ---------------------------------------------------------------------
// GET /exit/student/:studentid
// ---------------------------------------------------------------------
export const getStudentExitHistory = async (req: Request, res: Response) => {
    try {
        const yurt = getYurt(res);
        const studentid = parseId(req.params.studentid);
        if (!studentid) {
            return res.status(400).json({ error: 'Geçersiz talebe ID.' });
        }

        const [student] = await sequelize.query<{ studentid: number }>(
            `SELECT studentid FROM student WHERE studentid = :studentid AND yurtid = :yurtid LIMIT 1`,
            { replacements: { studentid, yurtid: yurt.yurtid }, type: QueryTypes.SELECT }
        );
        if (!student) {
            return res.status(404).json({ error: 'Talebe bulunamadı.' });
        }

        const rows = await sequelize.query<LogRow>(
            `${LOG_SELECT} WHERE l.yurtid = :yurtid AND l.studentid = :studentid ORDER BY l.exit_time DESC, l.id DESC`,
            { replacements: { yurtid: yurt.yurtid, studentid }, type: QueryTypes.SELECT }
        );
        const now = new Date();
        res.json(rows.map((row) => toLogDto(row, now)));
    } catch (err) {
        console.error('getStudentExitHistory error:', err);
        res.status(500).json({ error: 'Talebe geçmişi alınamadı.' });
    }
};

// ---------------------------------------------------------------------
// GET /exit/fouls-summary?from=ISO&to=ISO
// One row per student of the yurt (also students with no exits).
// A "foul" = a RETURNED log that was late. A student who is still out and past the deadline is
// counted separately as is_currently_overdue (it only becomes a foul when he returns).
// ---------------------------------------------------------------------
export const getFoulsSummary = async (req: Request, res: Response) => {
    try {
        const yurt = getYurt(res);
        const conditions = ['l.yurtid = :yurtid'];
        const replacements: Record<string, any> = { yurtid: yurt.yurtid };

        if (req.query.from !== undefined) {
            const from = parseInstant(req.query.from);
            if (!from) return res.status(400).json({ error: 'from geçerli bir ISO zaman damgası olmalı.' });
            conditions.push('l.exit_time >= :from');
            replacements.from = toDbDate(from);
        }
        if (req.query.to !== undefined) {
            const to = parseInstant(req.query.to);
            if (!to) return res.status(400).json({ error: 'to geçerli bir ISO zaman damgası olmalı.' });
            conditions.push('l.exit_time < :to');
            replacements.to = toDbDate(to);
        }

        const students = await sequelize.query<{ studentid: number; first_name: string; last_name: string; class_name: string | null }>(
            `SELECT studentid, first_name, last_name, class_name FROM student WHERE yurtid = :yurtid`,
            { replacements: { yurtid: yurt.yurtid }, type: QueryTypes.SELECT }
        );
        const logs = await sequelize.query<LogRow>(
            `${LOG_SELECT} WHERE ${conditions.join(' AND ')}`,
            { replacements, type: QueryTypes.SELECT }
        );

        const now = new Date();
        const summary = new Map(
            students.map((s) => [s.studentid, {
                studentid: s.studentid,
                first_name: s.first_name,
                last_name: s.last_name,
                class_name: s.class_name,
                total_exits: 0,
                total_late: 0,
                total_late_minutes: 0,
                last_late_at: null as Date | null,
                last_exit_at: null as Date | null,
                is_currently_out: false,
                is_currently_overdue: false,
            }])
        );

        for (const row of logs) {
            const entry = summary.get(row.studentid);
            if (!entry) continue;
            const dto = toLogDto(row, now);
            entry.total_exits += 1;
            if (!entry.last_exit_at || row.exit_time > entry.last_exit_at) entry.last_exit_at = row.exit_time;
            if (dto.is_late) {
                entry.total_late += 1;
                entry.total_late_minutes += dto.late_minutes;
                if (row.actual_return_time && (!entry.last_late_at || row.actual_return_time > entry.last_late_at)) {
                    entry.last_late_at = row.actual_return_time;
                }
            }
            if (row.status === 'OUT') {
                entry.is_currently_out = true;
                if (dto.is_overdue) entry.is_currently_overdue = true;
            }
        }

        const result = Array.from(summary.values()).sort(
            (a, b) =>
                b.total_late - a.total_late ||
                b.total_late_minutes - a.total_late_minutes ||
                b.total_exits - a.total_exits ||
                a.first_name.localeCompare(b.first_name)
        );
        res.json(result);
    } catch (err) {
        console.error('getFoulsSummary error:', err);
        res.status(500).json({ error: 'İhlal özeti alınamadı.' });
    }
};
