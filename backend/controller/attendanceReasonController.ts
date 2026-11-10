// backend/controller/attendanceReasonController.ts
//
// The list of sebepler ("reasons") offered on the yoklama page, one list per yurt.
// Editable in Settings by Admin / SuperAdmin; every yoklama role can read it.
//
// Rules this file follows:
//  1. The yurt ALWAYS comes from getYurt(res) (set by the middleware), never from the request body.
//  2. Every query contains `yurtid`.
//  3. Attendance records keep their sebep as plain text. Editing or deleting a list entry
//     never changes old records.

import { Request, Response } from 'express';
import { QueryTypes } from 'sequelize';
import { sequelize } from '../data/sequelize';
import { getYurt, isDuplicateError, parseId, parseIdList } from './exitShared';

const MAX_NAME_LENGTH = 100;
const MAX_REASONS = 50;
const DEFAULT_REASONS = ['Banyo', 'Hasta', 'Rahatsiz', 'Okul'];

interface ReasonRow {
    id: number;
    name: string;
    sort_order: number;
}

/** Trimmed, inner spaces collapsed. Returns an error text instead if the name is not allowed. */
const cleanName = (value: unknown): { name: string } | { error: string } => {
    if (typeof value !== 'string') return { error: 'Sebep adı gerekli.' };
    const name = value.trim().replace(/\s+/g, ' ');
    if (name.length === 0) return { error: 'Sebep adı boş olamaz.' };
    if (name.length > MAX_NAME_LENGTH) return { error: `Sebep adı en fazla ${MAX_NAME_LENGTH} karakter olabilir.` };
    // "Diğer" is always offered by the page itself (free text); "__diger__" is used internally.
    const key = name.toLocaleLowerCase('tr-TR');
    if (key === 'diğer' || key === 'diger' || key === '__diger__') {
        return { error: '"Diğer" zaten her zaman seçenek olarak vardır.' };
    }
    return { name };
};

const listReasons = (yurtid: number) =>
    sequelize.query<ReasonRow>(
        `SELECT id, name, sort_order FROM attendance_reasons WHERE yurtid = :yurtid ORDER BY sort_order, id`,
        { replacements: { yurtid }, type: QueryTypes.SELECT }
    );

/** GET /attendance-reasons */
export const getReasons = async (_req: Request, res: Response) => {
    try {
        res.json(await listReasons(getYurt(res).yurtid));
    } catch (err) {
        console.error('getReasons error:', err);
        res.status(500).json({ error: 'Sebep listesi alınamadı.' });
    }
};

/** POST /attendance-reasons  { name } */
export const createReason = async (req: Request, res: Response) => {
    try {
        const yurt = getYurt(res);
        const cleaned = cleanName(req.body?.name);
        if ('error' in cleaned) return res.status(400).json({ error: cleaned.error });

        const [count] = await sequelize.query<{ n: number }>(
            `SELECT COUNT(*) AS n FROM attendance_reasons WHERE yurtid = :yurtid`,
            { replacements: { yurtid: yurt.yurtid }, type: QueryTypes.SELECT }
        );
        if (Number(count.n) >= MAX_REASONS) {
            return res.status(400).json({ error: `En fazla ${MAX_REASONS} sebep eklenebilir.` });
        }

        await sequelize.query(
            `INSERT INTO attendance_reasons (yurtid, name, sort_order)
             SELECT :yurtid, :name, COALESCE(MAX(sort_order), 0) + 1 FROM attendance_reasons WHERE yurtid = :yurtid`,
            { replacements: { yurtid: yurt.yurtid, name: cleaned.name }, type: QueryTypes.INSERT }
        );
        res.status(201).json(await listReasons(yurt.yurtid));
    } catch (err) {
        if (isDuplicateError(err)) return res.status(409).json({ error: 'Bu sebep zaten listede var.' });
        console.error('createReason error:', err);
        res.status(500).json({ error: 'Sebep eklenemedi.' });
    }
};

/** PUT /attendance-reasons/reorder  { ids: [3, 1, 2] }  (must contain exactly the yurt's reasons) */
export const reorderReasons = async (req: Request, res: Response) => {
    try {
        const yurt = getYurt(res);
        const ids = parseIdList(req.body?.ids);
        if (!ids) return res.status(400).json({ error: 'ids geçerli bir id listesi olmalı.' });

        const current = await listReasons(yurt.yurtid);
        const currentIds = current.map((r) => r.id).sort((a, b) => a - b);
        const sent = [...ids].sort((a, b) => a - b);
        if (currentIds.length !== sent.length || currentIds.some((id, i) => id !== sent[i])) {
            return res.status(400).json({ error: 'Liste güncel değil. Sayfayı yenileyip tekrar deneyin.' });
        }

        await sequelize.transaction(async (transaction) => {
            for (let i = 0; i < ids.length; i++) {
                await sequelize.query(
                    `UPDATE attendance_reasons SET sort_order = :order WHERE id = :id AND yurtid = :yurtid`,
                    { replacements: { order: i + 1, id: ids[i], yurtid: yurt.yurtid }, type: QueryTypes.UPDATE, transaction }
                );
            }
        });
        res.json(await listReasons(yurt.yurtid));
    } catch (err) {
        console.error('reorderReasons error:', err);
        res.status(500).json({ error: 'Sıralama kaydedilemedi.' });
    }
};

/** PUT /attendance-reasons/:id  { name }  (rename; old attendance records keep their old text) */
export const renameReason = async (req: Request, res: Response) => {
    try {
        const yurt = getYurt(res);
        const id = parseId(req.params.id);
        if (id === null) return res.status(400).json({ error: 'Geçersiz id.' });
        const cleaned = cleanName(req.body?.name);
        if ('error' in cleaned) return res.status(400).json({ error: cleaned.error });

        const [exists] = await sequelize.query<{ id: number }>(
            `SELECT id FROM attendance_reasons WHERE id = :id AND yurtid = :yurtid`,
            { replacements: { id, yurtid: yurt.yurtid }, type: QueryTypes.SELECT }
        );
        if (!exists) return res.status(404).json({ error: 'Sebep bulunamadı.' });

        await sequelize.query(
            `UPDATE attendance_reasons SET name = :name WHERE id = :id AND yurtid = :yurtid`,
            { replacements: { name: cleaned.name, id, yurtid: yurt.yurtid }, type: QueryTypes.UPDATE }
        );
        res.json(await listReasons(yurt.yurtid));
    } catch (err) {
        if (isDuplicateError(err)) return res.status(409).json({ error: 'Bu sebep zaten listede var.' });
        console.error('renameReason error:', err);
        res.status(500).json({ error: 'Sebep güncellenemedi.' });
    }
};

/** DELETE /attendance-reasons/:id */
export const deleteReason = async (req: Request, res: Response) => {
    try {
        const yurt = getYurt(res);
        const id = parseId(req.params.id);
        if (id === null) return res.status(400).json({ error: 'Geçersiz id.' });

        const [exists] = await sequelize.query<{ id: number }>(
            `SELECT id FROM attendance_reasons WHERE id = :id AND yurtid = :yurtid`,
            { replacements: { id, yurtid: yurt.yurtid }, type: QueryTypes.SELECT }
        );
        if (!exists) return res.status(404).json({ error: 'Sebep bulunamadı.' });

        await sequelize.query(
            `DELETE FROM attendance_reasons WHERE id = :id AND yurtid = :yurtid`,
            { replacements: { id, yurtid: yurt.yurtid }, type: QueryTypes.DELETE }
        );
        res.json(await listReasons(yurt.yurtid));
    } catch (err) {
        console.error('deleteReason error:', err);
        res.status(500).json({ error: 'Sebep silinemedi.' });
    }
};

/** POST /attendance-reasons/defaults : adds the four standard sebepler that are missing (for a new yurt). */
export const addDefaultReasons = async (_req: Request, res: Response) => {
    try {
        const yurt = getYurt(res);
        for (const name of DEFAULT_REASONS) {
            await sequelize.query(
                `INSERT IGNORE INTO attendance_reasons (yurtid, name, sort_order)
                 SELECT :yurtid, :name, COALESCE(MAX(sort_order), 0) + 1 FROM attendance_reasons WHERE yurtid = :yurtid`,
                { replacements: { yurtid: yurt.yurtid, name }, type: QueryTypes.INSERT }
            );
        }
        res.json(await listReasons(yurt.yurtid));
    } catch (err) {
        console.error('addDefaultReasons error:', err);
        res.status(500).json({ error: 'Varsayılan sebepler eklenemedi.' });
    }
};
