// backend/controller/seasonController.ts
//
// Seasons ("Sezon") of a yurt, e.g. "2025/2026". Editable in Settings by Admin only; everyone can read.
//
// Rules this file follows:
//  1. The yurt ALWAYS comes from req.selectedYurtId (set by validateYurtAccess), never from the body.
//  2. Every query contains `yurtid`. We use raw queries on purpose: the Sequelize model declares
//     season_year as primary key, so instance.destroy() would delete that season name in ALL yurts.
//  3. Students keep their season as plain text (student.season_year), so renaming a season also
//     renames it on the yurt's students (in one transaction), and a season that still has
//     students cannot be deleted.
//  4. Exactly one season per yurt can be "current" (Güncel sezon).

import { Request, Response } from 'express';
import { QueryTypes } from 'sequelize';
import { sequelize } from '../data/sequelize';

interface SeasonRow {
    seasonid: number;
    season_year: string;
    is_current: number;
    student_count: number;
}

const FORMAT_HELP = 'Sezon "2025/2026" biçiminde olmalı (ikinci yıl, birinci yılın bir fazlası).';

/** Trimmed season name if it has the form YYYY/YYYY with the second year = first + 1. */
const cleanSeason = (value: unknown): string | null => {
    if (typeof value !== 'string') return null;
    const name = value.trim();
    const m = /^(\d{4})\/(\d{4})$/.exec(name);
    if (!m || Number(m[2]) !== Number(m[1]) + 1) return null;
    return name;
};

const isDup = (e: any) => e?.original?.code === 'ER_DUP_ENTRY' || e?.parent?.code === 'ER_DUP_ENTRY';

/** Seasons of the yurt, newest first, with the number of students in each. */
const listSeasons = (yurtid: number): Promise<SeasonRow[]> =>
    sequelize.query<SeasonRow>(
        `SELECT s.seasonid, s.season_year, s.is_current,
                (SELECT COUNT(*) FROM student st
                  WHERE st.yurtid = s.yurtid AND st.season_year = s.season_year) AS student_count
           FROM season s
          WHERE s.yurtid = :yurtid
          ORDER BY s.season_year DESC`,
        { replacements: { yurtid }, type: QueryTypes.SELECT }
    );

const findSeason = async (yurtid: number, season_year: string) => {
    const rows = await sequelize.query<{ seasonid: number; is_current: number }>(
        'SELECT seasonid, is_current FROM season WHERE yurtid = :yurtid AND season_year = :season_year LIMIT 1',
        { replacements: { yurtid, season_year }, type: QueryTypes.SELECT }
    );
    return rows[0] ?? null;
};

const countStudents = async (yurtid: number, season_year: string): Promise<number> => {
    const rows = await sequelize.query<{ n: number }>(
        'SELECT COUNT(*) AS n FROM student WHERE yurtid = :yurtid AND season_year = :season_year',
        { replacements: { yurtid, season_year }, type: QueryTypes.SELECT }
    );
    return Number(rows[0]?.n ?? 0);
};

export const seasonController = {
    async getAll(req: Request, res: Response) {
        try {
            res.json(await listSeasons(req.selectedYurtId!));
        } catch {
            res.status(500).json({ message: 'Sezonlar alınamadı.' });
        }
    },

    async create(req: Request, res: Response) {
        const yurtid = req.selectedYurtId!;
        const season_year = cleanSeason(req.body?.season_year);
        if (!season_year) return res.status(400).json({ message: FORMAT_HELP });

        try {
            if (await findSeason(yurtid, season_year)) {
                return res.status(409).json({ message: `${season_year} sezonu zaten mevcut.` });
            }
            // The first season of a yurt becomes the current one.
            const [{ n }] = await sequelize.query<{ n: number }>(
                'SELECT COUNT(*) AS n FROM season WHERE yurtid = :yurtid',
                { replacements: { yurtid }, type: QueryTypes.SELECT }
            );
            await sequelize.query(
                'INSERT INTO season (yurtid, season_year, is_current) VALUES (:yurtid, :season_year, :cur)',
                { replacements: { yurtid, season_year, cur: Number(n) === 0 ? 1 : 0 }, type: QueryTypes.INSERT }
            );
            res.status(201).json(await listSeasons(yurtid));
        } catch (e) {
            if (isDup(e)) return res.status(409).json({ message: `${season_year} sezonu zaten mevcut.` });
            res.status(500).json({ message: 'Sezon oluşturulamadı.' });
        }
    },

    /** Rename. The yurt's students move to the new name in the same transaction. */
    async update(req: Request, res: Response) {
        const yurtid = req.selectedYurtId!;
        const oldName = String(req.params.season_year ?? '');
        const newName = cleanSeason(req.body?.season_year);
        if (!newName) return res.status(400).json({ message: FORMAT_HELP });

        try {
            if (!(await findSeason(yurtid, oldName))) return res.status(404).json({ message: 'Sezon bulunamadı.' });
            if (newName === oldName) return res.json(await listSeasons(yurtid));
            if (await findSeason(yurtid, newName)) {
                return res.status(409).json({ message: `${newName} sezonu zaten mevcut.` });
            }
            await sequelize.transaction(async (transaction) => {
                await sequelize.query(
                    'UPDATE season SET season_year = :newName WHERE yurtid = :yurtid AND season_year = :oldName',
                    { replacements: { yurtid, oldName, newName }, transaction }
                );
                await sequelize.query(
                    'UPDATE student SET season_year = :newName WHERE yurtid = :yurtid AND season_year = :oldName',
                    { replacements: { yurtid, oldName, newName }, transaction }
                );
            });
            res.json(await listSeasons(yurtid));
        } catch (e) {
            if (isDup(e)) return res.status(409).json({ message: `${newName} sezonu zaten mevcut.` });
            res.status(500).json({ message: 'Sezon güncellenemedi.' });
        }
    },

    /** Make this season the yurt's current season (the previous one stops being current). */
    async setCurrent(req: Request, res: Response) {
        const yurtid = req.selectedYurtId!;
        const season_year = String(req.params.season_year ?? '');
        try {
            if (!(await findSeason(yurtid, season_year))) return res.status(404).json({ message: 'Sezon bulunamadı.' });
            await sequelize.transaction(async (transaction) => {
                await sequelize.query('UPDATE season SET is_current = 0 WHERE yurtid = :yurtid', {
                    replacements: { yurtid }, transaction,
                });
                await sequelize.query(
                    'UPDATE season SET is_current = 1 WHERE yurtid = :yurtid AND season_year = :season_year',
                    { replacements: { yurtid, season_year }, transaction }
                );
            });
            res.json(await listSeasons(yurtid));
        } catch {
            res.status(500).json({ message: 'Güncel sezon ayarlanamadı.' });
        }
    },

    /** Only an empty season can be deleted, and not the current one while other seasons exist. */
    async delete(req: Request, res: Response) {
        const yurtid = req.selectedYurtId!;
        const season_year = String(req.params.season_year ?? '');
        try {
            const season = await findSeason(yurtid, season_year);
            if (!season) return res.status(404).json({ message: 'Sezon bulunamadı.' });

            const students = await countStudents(yurtid, season_year);
            if (students > 0) {
                return res.status(409).json({
                    message: `${season_year} sezonunda ${students} talebe var. Önce talebeleri başka bir sezona taşıyın.`,
                    student_count: students,
                });
            }
            const all = await listSeasons(yurtid);
            if (season.is_current && all.length > 1) {
                return res.status(409).json({
                    message: 'Güncel sezon silinemez. Önce başka bir sezonu güncel yapın.',
                });
            }
            await sequelize.query('DELETE FROM season WHERE yurtid = :yurtid AND season_year = :season_year', {
                replacements: { yurtid, season_year },
            });
            res.json(await listSeasons(yurtid));
        } catch {
            res.status(500).json({ message: 'Sezon silinemedi.' });
        }
    },
};
