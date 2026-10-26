import { Request, Response } from 'express';
import { QueryTypes } from 'sequelize';
import { sequelize } from '../data/sequelize';

interface OutLogRow {
    id: number;
    studentid: number;
    first_name: string;
    last_name: string;
    class_name: string | null;
    reason: string;
    notes: string | null;
    exit_time: Date;
    expected_return_time: Date;
    actual_return_time: Date | null;
    is_late: number;
    late_minutes: number;
    status: 'OUT' | 'RETURNED';
}

const DEFAULT_MAX_MINUTES = 60;

const getScopedYurtId = (req: Request): number | null => {
    if (req.selectedYurtId && Number.isInteger(req.selectedYurtId)) {
        return req.selectedYurtId;
    }
    return req.user?.yurtid ?? null;
};

// Record Exit (Çıkış Kaydı)
export const recordExit = async (req: Request, res: Response) => {
    try {
        const { studentid, reason, customMaxMinutes, notes } = req.body;
        const yurtId = getScopedYurtId(req);

        if (!yurtId) {
            return res.status(400).json({ error: 'Yurt bilgisi bulunamadı.' });
        }

        const parsedStudentId = Number(studentid);
        if (!Number.isInteger(parsedStudentId) || parsedStudentId <= 0) {
            return res.status(400).json({ error: 'Geçerli bir talebe seçiniz.' });
        }

        const requestedDuration = Number(customMaxMinutes);
        const duration = Number.isFinite(requestedDuration) && requestedDuration > 0
            ? Math.min(Math.round(requestedDuration), 7 * 24 * 60)
            : DEFAULT_MAX_MINUTES;

        const [student] = await sequelize.query<{ studentid: number }>(
            `SELECT studentid
             FROM student
             WHERE studentid = ? AND yurtid = ?
             LIMIT 1`,
            {
                replacements: [parsedStudentId, yurtId],
                type: QueryTypes.SELECT,
            }
        );

        if (!student) {
            return res.status(404).json({ error: 'Talebe bulunamadı veya bu yurda ait değil.' });
        }

        const [activeLog] = await sequelize.query<{ id: number }>(
            `SELECT id
             FROM student_out_logs
             WHERE studentid = ? AND yurtid = ? AND status = 'OUT'
             LIMIT 1`,
            {
                replacements: [parsedStudentId, yurtId],
                type: QueryTypes.SELECT,
            }
        );

        if (activeLog) {
            return res.status(409).json({ error: 'Talebe için zaten aktif çıkış kaydı var.' });
        }

        const exitTime = new Date();

        // Calculate expected return time based on setting or custom parameter
        const expectedReturn = new Date(exitTime.getTime() + duration * 60000);

        const [result] = await sequelize.query(
            `INSERT INTO student_out_logs
                (studentid, yurtid, reason, notes, exit_time, expected_return_time, status)
             VALUES (?, ?, ?, ?, ?, ?, 'OUT')`,
            {
                replacements: [
                    parsedStudentId,
                    yurtId,
                    reason || 'Market',
                    notes || null,
                    exitTime,
                    expectedReturn,
                ],
            }
        );

        const insertId = typeof (result as any)?.insertId === 'number' ? (result as any).insertId : null;

        res.status(201).json({
            success: true,
            message: 'Çıkış kaydı oluşturuldu.',
            logId: insertId,
            expectedReturnTime: expectedReturn,
            maxAllowedMinutes: duration,
        });
    } catch (err) {
        console.error('recordExit error:', err);
        res.status(500).json({ error: 'Çıkış kaydı oluşturulamadı.' });
    }
};

// Record Return (Giriş Kaydı ve Geç Kalma Hesaplama)
export const recordReturn = async (req: Request, res: Response) => {
    try {
        const { logId } = req.body;
        const yurtId = getScopedYurtId(req);

        if (!yurtId) {
            return res.status(400).json({ error: 'Yurt bilgisi bulunamadı.' });
        }

        const parsedLogId = Number(logId);
        if (!Number.isInteger(parsedLogId) || parsedLogId <= 0) {
            return res.status(400).json({ error: 'Geçerli bir kayıt seçiniz.' });
        }

        const actualReturn = new Date();

        // Fetch log details
        const [log] = await sequelize.query<OutLogRow>(
            `SELECT id, studentid, expected_return_time
             FROM student_out_logs
             WHERE id = ? AND yurtid = ? AND status = 'OUT'
             LIMIT 1`,
            {
                replacements: [parsedLogId, yurtId],
                type: QueryTypes.SELECT,
            }
        );

        if (!log) return res.status(404).json({ error: 'Aktif çıkış kaydı bulunamadı.' });

        const expectedReturn = new Date(log.expected_return_time);
        let isLate = false;
        let lateMinutes = 0;

        if (actualReturn > expectedReturn) {
            isLate = true;
            lateMinutes = Math.round((actualReturn.getTime() - expectedReturn.getTime()) / 60000);
        }

        await sequelize.query(
            `UPDATE student_out_logs 
             SET actual_return_time = ?, is_late = ?, late_minutes = ?, status = 'RETURNED'
             WHERE id = ? AND yurtid = ? AND status = 'OUT'`,
            { replacements: [actualReturn, isLate ? 1 : 0, lateMinutes, parsedLogId, yurtId] }
        );

        res.json({
            success: true,
            isLate,
            lateMinutes,
            actualReturnTime: actualReturn,
            message: isLate ? `Talebe ${lateMinutes} dakika geç döndü (Kural İhlali).` : 'Giriş kaydı alındı.'
        });
    } catch (err) {
        console.error('recordReturn error:', err);
        res.status(500).json({ error: 'Giriş kaydı işlenemedi.' });
    }
};

// List all exit/return logs (latest first)
export const getExitLogs = async (req: Request, res: Response) => {
    try {
        const yurtId = getScopedYurtId(req);
        if (!yurtId) {
            return res.status(400).json({ error: 'Yurt bilgisi bulunamadı.' });
        }

        const logs = await sequelize.query<OutLogRow>(
            `SELECT
                l.id,
                l.studentid,
                s.first_name,
                s.last_name,
                s.class_name,
                l.reason,
                l.notes,
                l.exit_time,
                l.expected_return_time,
                l.actual_return_time,
                l.is_late,
                l.late_minutes,
                l.status
             FROM student_out_logs l
             INNER JOIN student s ON s.studentid = l.studentid
             WHERE l.yurtid = ?
             ORDER BY l.exit_time DESC`,
            {
                replacements: [yurtId],
                type: QueryTypes.SELECT,
            }
        );

        res.json(logs);
    } catch (err) {
        console.error('getExitLogs error:', err);
        res.status(500).json({ error: 'Çıkış/Giriş kayıtları alınamadı.' });
    }
};

// Summary of Student Late Returns / Fouls
export const getFoulsSummary = async (req: Request, res: Response) => {
    try {
        const yurtId = getScopedYurtId(req);
        if (!yurtId) {
            return res.status(400).json({ error: 'Yurt bilgisi bulunamadı.' });
        }

        const fouls = await sequelize.query(
            `SELECT 
                s.studentid, s.first_name, s.last_name, s.class_name,
                COUNT(l.id) as total_exits,
                COALESCE(SUM(CASE WHEN l.is_late = 1 THEN 1 ELSE 0 END), 0) as total_late_fouls,
                COALESCE(SUM(l.late_minutes), 0) as total_late_minutes
             FROM student s
             LEFT JOIN student_out_logs l ON s.studentid = l.studentid AND l.yurtid = ?
             WHERE s.yurtid = ?
             GROUP BY s.studentid, s.first_name, s.last_name, s.class_name
             ORDER BY total_late_fouls DESC, total_late_minutes DESC, total_exits DESC`,
            { replacements: [yurtId, yurtId], type: QueryTypes.SELECT }
        );
        res.json(fouls);
    } catch (err) {
        console.error('getFoulsSummary error:', err);
        res.status(500).json({ error: 'İhlal özeti alınamadı.' });
    }
};