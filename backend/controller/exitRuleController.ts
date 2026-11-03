// backend/controller/exitRuleController.ts
//
// Izin rules (name + deadline weekday + deadline time) and the yurt's time zone.
// Reading is allowed for every exit role, writing only for admin / super-admin (see exitRoute.ts).
// The yurt ALWAYS comes from getYurt(res), never from the request body.

import { Request, Response } from 'express';
import { QueryTypes } from 'sequelize';
import { sequelize } from '../data/sequelize';
import { isValidTimeZone, parseTime } from '../utils/exitTime';
import { getYurt, isDuplicateError, parseId } from './exitShared';

const MAX_NAME_LENGTH = 100;

interface RuleRow {
    id: number;
    name: string;
    deadline_weekday: number;
    deadline_time: string; // 'HH:MM:SS'
    is_active: number;
}

/** 'HH:MM:SS' -> 'HH:MM' for the API */
const toRuleDto = (row: RuleRow) => ({
    id: row.id,
    name: row.name,
    deadline_weekday: row.deadline_weekday,
    deadline_time: String(row.deadline_time).slice(0, 5),
    is_active: Boolean(row.is_active),
});

/** Validates weekday (0 = Sunday ... 6 = Saturday). */
const readWeekday = (value: unknown): number | null =>
    typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 6 ? value : null;

/** Validates "HH:MM" / "HH:MM:SS" and returns "HH:MM:00". */
const readTime = (value: unknown): string | null => {
    if (typeof value !== 'string') return null;
    const t = parseTime(value);
    if (!t) return null;
    return `${String(t.hour).padStart(2, '0')}:${String(t.minute).padStart(2, '0')}:00`;
};

const fetchRule = async (yurtid: number, id: number) => {
    const [row] = await sequelize.query<RuleRow>(
        `SELECT id, name, deadline_weekday, deadline_time, is_active
         FROM exit_rules WHERE id = :id AND yurtid = :yurtid LIMIT 1`,
        { replacements: { id, yurtid }, type: QueryTypes.SELECT }
    );
    return row ? toRuleDto(row) : null;
};

// GET /exit/rules?activeOnly=true
export const getRules = async (req: Request, res: Response) => {
    try {
        const yurt = getYurt(res);
        const activeOnly = req.query.activeOnly === 'true';
        const rows = await sequelize.query<RuleRow>(
            `SELECT id, name, deadline_weekday, deadline_time, is_active
             FROM exit_rules WHERE yurtid = :yurtid ${activeOnly ? 'AND is_active = 1' : ''}
             ORDER BY name ASC`,
            { replacements: { yurtid: yurt.yurtid }, type: QueryTypes.SELECT }
        );
        res.json(rows.map(toRuleDto));
    } catch (err) {
        console.error('getRules error:', err);
        res.status(500).json({ error: 'İzin kuralları alınamadı.' });
    }
};

// POST /exit/rules   body: { name, deadlineWeekday, deadlineTime, isActive? }
export const createRule = async (req: Request, res: Response) => {
    try {
        const yurt = getYurt(res);
        const { name, deadlineWeekday, deadlineTime, isActive } = req.body ?? {};

        const nameText = typeof name === 'string' ? name.trim() : '';
        if (!nameText || nameText.length > MAX_NAME_LENGTH) {
            return res.status(400).json({ error: `Kural adı 1-${MAX_NAME_LENGTH} karakter olmalı.` });
        }
        const weekday = readWeekday(deadlineWeekday);
        if (weekday === null) {
            return res.status(400).json({ error: 'Gün 0 (Pazar) ile 6 (Cumartesi) arasında olmalı.' });
        }
        const time = readTime(deadlineTime);
        if (!time) {
            return res.status(400).json({ error: 'Saat SS:DD biçiminde olmalı.' });
        }

        try {
            await sequelize.query(
                `INSERT INTO exit_rules (yurtid, name, deadline_weekday, deadline_time, is_active, created_by)
                 VALUES (:yurtid, :name, :weekday, :time, :isActive, :createdBy)`,
                {
                    replacements: {
                        yurtid: yurt.yurtid, name: nameText, weekday, time,
                        isActive: isActive === false ? 0 : 1, createdBy: req.user?.accountid ?? null,
                    },
                }
            );
        } catch (err) {
            if (isDuplicateError(err)) {
                return res.status(409).json({ error: 'Bu isimde bir kural zaten var.' });
            }
            throw err;
        }

        const [row] = await sequelize.query<RuleRow>(
            `SELECT id, name, deadline_weekday, deadline_time, is_active
             FROM exit_rules WHERE yurtid = :yurtid AND name = :name LIMIT 1`,
            { replacements: { yurtid: yurt.yurtid, name: nameText }, type: QueryTypes.SELECT }
        );
        res.status(201).json({ success: true, rule: row ? toRuleDto(row) : null });
    } catch (err) {
        console.error('createRule error:', err);
        res.status(500).json({ error: 'Kural oluşturulamadı.' });
    }
};

// PUT /exit/rules/:id   body: any of { name, deadlineWeekday, deadlineTime, isActive }
// Old logs are NOT changed: they keep the deadline that was saved when they were recorded.
export const updateRule = async (req: Request, res: Response) => {
    try {
        const yurt = getYurt(res);
        const id = parseId(req.params.id);
        if (!id) return res.status(400).json({ error: 'Geçersiz kural ID.' });

        const [existing] = await sequelize.query<RuleRow>(
            `SELECT id, name, deadline_weekday, deadline_time, is_active
             FROM exit_rules WHERE id = :id AND yurtid = :yurtid LIMIT 1`,
            { replacements: { id, yurtid: yurt.yurtid }, type: QueryTypes.SELECT }
        );
        if (!existing) return res.status(404).json({ error: 'Kural bulunamadı.' });

        const body = req.body ?? {};
        const has = (key: string) => Object.prototype.hasOwnProperty.call(body, key);

        let name = existing.name;
        if (has('name')) {
            name = typeof body.name === 'string' ? body.name.trim() : '';
            if (!name || name.length > MAX_NAME_LENGTH) {
                return res.status(400).json({ error: `Kural adı 1-${MAX_NAME_LENGTH} karakter olmalı.` });
            }
        }
        let weekday = existing.deadline_weekday;
        if (has('deadlineWeekday')) {
            const w = readWeekday(body.deadlineWeekday);
            if (w === null) return res.status(400).json({ error: 'Gün 0 (Pazar) ile 6 (Cumartesi) arasında olmalı.' });
            weekday = w;
        }
        let time = existing.deadline_time;
        if (has('deadlineTime')) {
            const parsed = readTime(body.deadlineTime);
            if (!parsed) return res.status(400).json({ error: 'Saat SS:DD biçiminde olmalı.' });
            time = parsed;
        }
        const active = has('isActive') ? (body.isActive === false ? 0 : 1) : existing.is_active;

        try {
            await sequelize.query(
                `UPDATE exit_rules
                 SET name = :name, deadline_weekday = :weekday, deadline_time = :time, is_active = :active
                 WHERE id = :id AND yurtid = :yurtid`,
                { replacements: { name, weekday, time, active, id, yurtid: yurt.yurtid } }
            );
        } catch (err) {
            if (isDuplicateError(err)) {
                return res.status(409).json({ error: 'Bu isimde bir kural zaten var.' });
            }
            throw err;
        }
        res.json({ success: true, rule: await fetchRule(yurt.yurtid, id) });
    } catch (err) {
        console.error('updateRule error:', err);
        res.status(500).json({ error: 'Kural güncellenemedi.' });
    }
};

// DELETE /exit/rules/:id   (old logs keep their saved deadline, only the link is cleared)
export const deleteRule = async (req: Request, res: Response) => {
    try {
        const yurt = getYurt(res);
        const id = parseId(req.params.id);
        if (!id) return res.status(400).json({ error: 'Geçersiz kural ID.' });

        const existing = await fetchRule(yurt.yurtid, id);
        if (!existing) return res.status(404).json({ error: 'Kural bulunamadı.' });

        await sequelize.query(
            `DELETE FROM exit_rules WHERE id = :id AND yurtid = :yurtid`,
            { replacements: { id, yurtid: yurt.yurtid } }
        );
        res.json({ success: true });
    } catch (err) {
        console.error('deleteRule error:', err);
        res.status(500).json({ error: 'Kural silinemedi.' });
    }
};

// ---------------------------------------------------------------------
// Yurt time zone (deadlines are calculated in this zone)
// ---------------------------------------------------------------------

/** All IANA time zone names the server knows (Node 18+), with a short fallback list. */
const listTimeZones = (): string[] => {
    try {
        const supported = (Intl as any).supportedValuesOf;
        if (typeof supported === 'function') {
            return supported.call(Intl, 'timeZone') as string[];
        }
    } catch (_) {
        /* fall through */
    }
    return ['Europe/Berlin', 'Europe/Istanbul', 'Europe/Amsterdam', 'Europe/Vienna', 'Europe/London', 'UTC'];
};

// GET /exit/settings  ->  { timezone, timezones: string[] }
export const getSettings = async (_req: Request, res: Response) => {
    const yurt = getYurt(res);
    res.json({ timezone: yurt.timezone, timezones: listTimeZones() });
};

// PUT /exit/settings  body: { timezone }
// Only affects deadlines of NEW exits. Saved deadlines of existing logs never change.
export const updateSettings = async (req: Request, res: Response) => {
    try {
        const yurt = getYurt(res);
        const timezone = typeof req.body?.timezone === 'string' ? req.body.timezone.trim() : '';
        if (!timezone || !isValidTimeZone(timezone)) {
            return res.status(400).json({ error: 'Geçersiz saat dilimi (ör. Europe/Berlin).' });
        }
        await sequelize.query(
            `UPDATE yurt SET timezone = :timezone WHERE yurtid = :yurtid`,
            { replacements: { timezone, yurtid: yurt.yurtid } }
        );
        res.json({ success: true, timezone });
    } catch (err) {
        console.error('updateSettings error:', err);
        res.status(500).json({ error: 'Saat dilimi güncellenemedi.' });
    }
};
