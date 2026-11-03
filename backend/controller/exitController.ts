import { Request, Response } from 'express';
import { QueryTypes } from 'sequelize';
import { sequelize } from '../data/sequelize';

export interface OutLogRow {
    id: number;
    studentid: number;
    first_name: string;
    last_name: string;
    class_name: string | null;
    reason: string;
    notes: string | null;
    exit_time: Date;
    expected_return_time: Date | null;
    actual_return_time: Date | null;
    is_late: number;
    late_minutes: number;
    status: 'OUT' | 'RETURNED';
    max_allowed_minutes?: number;
    created_at?: Date;
    updated_at?: Date;
}

const DEFAULT_MAX_MINUTES = 60;

const getScopedYurtId = (req: Request): number | null => {
    if (req.selectedYurtId && Number.isInteger(req.selectedYurtId)) {
        return req.selectedYurtId;
    }
    return req.user?.yurtid ?? null;
};

let schemaEnsured = false;
export const ensureExitTrackingSchema = async () => {
    if (schemaEnsured) return;
    try {
        await sequelize.query(`
            CREATE TABLE IF NOT EXISTS student_out_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                studentid INT NOT NULL,
                yurtid INT NOT NULL,
                reason VARCHAR(128) NOT NULL DEFAULT 'Market',
                notes TEXT NULL,
                exit_time DATETIME NOT NULL,
                expected_return_time DATETIME NULL,
                actual_return_time DATETIME NULL,
                max_allowed_minutes INT NOT NULL DEFAULT 60,
                is_late TINYINT(1) NOT NULL DEFAULT 0,
                late_minutes INT NOT NULL DEFAULT 0,
                status ENUM('OUT', 'RETURNED') NOT NULL DEFAULT 'OUT',
                created_by INT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_out_logs_student (studentid),
                INDEX idx_out_logs_yurt_status (yurtid, status),
                INDEX idx_out_logs_exit_time (exit_time)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        try {
            await sequelize.query(`ALTER TABLE student_out_logs MODIFY COLUMN expected_return_time DATETIME NULL;`);
        } catch (_) {}

        schemaEnsured = true;
    } catch (err) {
        console.error('ensureExitTrackingSchema error:', err);
    }
};

// Record Exit (Tekli veya Toplu Çıkış Kaydı, Manuel Çıkış/Giriş Saati ve Opsiyonel Eşik Destekli)
export const recordExit = async (req: Request, res: Response) => {
    try {
        await ensureExitTrackingSchema();

        const {
            studentid,
            studentids,
            reason,
            customMaxMinutes,
            notes,
            exitTime,
            thresholdType, // 'duration' | 'datetime' | 'none'
            expectedReturnTime,
            directReturn, // boolean: true if entering both exit and return times retroactively
            actualReturnTime,
        } = req.body;

        const yurtId = getScopedYurtId(req);
        if (!yurtId) {
            return res.status(400).json({ error: 'Yurt bilgisi bulunamadı.' });
        }

        // Determine list of student IDs
        let targetStudentIds: number[] = [];
        if (Array.isArray(studentids) && studentids.length > 0) {
            targetStudentIds = studentids
                .map((id: any) => Number(id))
                .filter((id: number) => Number.isInteger(id) && id > 0);
        } else if (studentid) {
            const parsedId = Number(studentid);
            if (Number.isInteger(parsedId) && parsedId > 0) {
                targetStudentIds = [parsedId];
            }
        }

        if (targetStudentIds.length === 0) {
            return res.status(400).json({ error: 'Lütfen en az bir geçerli talebe seçiniz.' });
        }

        // Determine exit date
        const exitDate = exitTime ? new Date(exitTime) : new Date();
        const validExitDate = isNaN(exitDate.getTime()) ? new Date() : exitDate;

        // Determine expected return time / threshold
        let expectedReturn: Date | null = null;
        let maxMinutes = DEFAULT_MAX_MINUTES;

        if (thresholdType === 'none') {
            expectedReturn = null;
            maxMinutes = 0;
        } else if (thresholdType === 'datetime' || expectedReturnTime) {
            if (expectedReturnTime) {
                const parsedExpected = new Date(expectedReturnTime);
                if (!isNaN(parsedExpected.getTime())) {
                    expectedReturn = parsedExpected;
                    maxMinutes = Math.max(0, Math.round((expectedReturn.getTime() - validExitDate.getTime()) / 60000));
                }
            }
        } else {
            // Default or duration-based
            const requestedDuration = Number(customMaxMinutes);
            const duration = Number.isFinite(requestedDuration) && requestedDuration > 0
                ? Math.min(Math.round(requestedDuration), 30 * 24 * 60) // max 30 days
                : DEFAULT_MAX_MINUTES;
            maxMinutes = duration;
            expectedReturn = new Date(validExitDate.getTime() + duration * 60000);
        }

        // Handle direct completed entry (both exit and entrance recorded together)
        const isDirect = Boolean(directReturn);
        let validActualReturn: Date | null = null;
        let isLate = 0;
        let lateMinutes = 0;
        const status = isDirect ? 'RETURNED' : 'OUT';

        if (isDirect) {
            const retDate = actualReturnTime ? new Date(actualReturnTime) : new Date();
            validActualReturn = isNaN(retDate.getTime()) ? new Date() : retDate;

            if (expectedReturn && validActualReturn.getTime() > expectedReturn.getTime()) {
                isLate = 1;
                lateMinutes = Math.round((validActualReturn.getTime() - expectedReturn.getTime()) / 60000);
            }
        }

        const createdBy = req.user?.accountid ?? null;
        const insertedIds: number[] = [];
        const skippedStudents: number[] = [];

        for (const sid of targetStudentIds) {
            // Verify student belongs to this yurt
            const [student] = await sequelize.query<{ studentid: number }>(
                `SELECT studentid FROM student WHERE studentid = ? AND yurtid = ? LIMIT 1`,
                { replacements: [sid, yurtId], type: QueryTypes.SELECT }
            );

            if (!student) {
                skippedStudents.push(sid);
                continue;
            }

            // If not direct return, check if student already has an active OUT record
            if (!isDirect) {
                const [activeLog] = await sequelize.query<{ id: number }>(
                    `SELECT id FROM student_out_logs WHERE studentid = ? AND yurtid = ? AND status = 'OUT' LIMIT 1`,
                    { replacements: [sid, yurtId], type: QueryTypes.SELECT }
                );

                if (activeLog) {
                    skippedStudents.push(sid);
                    continue;
                }
            }

            const [result] = await sequelize.query(
                `INSERT INTO student_out_logs
                    (studentid, yurtid, reason, notes, exit_time, expected_return_time, actual_return_time, max_allowed_minutes, is_late, late_minutes, status, created_by)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                {
                    replacements: [
                        sid,
                        yurtId,
                        reason || 'Market/Kişisel',
                        notes || null,
                        validExitDate,
                        expectedReturn,
                        validActualReturn,
                        maxMinutes,
                        isLate,
                        lateMinutes,
                        status,
                        createdBy,
                    ],
                }
            );

            const insertId = typeof (result as any)?.insertId === 'number' ? (result as any).insertId : null;
            if (insertId) insertedIds.push(insertId);
        }

        if (insertedIds.length === 0) {
            return res.status(409).json({
                error: skippedStudents.length > 0
                    ? 'Seçilen talebe(ler) zaten dışarıda veya bulunamadı.'
                    : 'Kayıt oluşturulamadı.',
                skippedStudents
            });
        }

        res.status(201).json({
            success: true,
            message: insertedIds.length > 1
                ? `${insertedIds.length} talebe için çıkış kaydı başarıyla oluşturuldu.`
                : (isDirect ? 'Çıkış ve dönüş kaydı işlendi.' : 'Çıkış kaydı oluşturuldu.'),
            insertedCount: insertedIds.length,
            insertedIds,
            skippedCount: skippedStudents.length,
            expectedReturnTime: expectedReturn,
            isLate: Boolean(isLate),
            lateMinutes,
        });
    } catch (err) {
        console.error('recordExit error:', err);
        res.status(500).json({ error: 'Çıkış kaydı oluşturulamadı.' });
    }
};

// Record Return (Giriş Kaydı ve Geç Kalma Hesaplama, Manuel Giriş Saati Destekli)
export const recordReturn = async (req: Request, res: Response) => {
    try {
        await ensureExitTrackingSchema();

        const { logId, actualReturnTime } = req.body;
        const yurtId = getScopedYurtId(req);

        if (!yurtId) {
            return res.status(400).json({ error: 'Yurt bilgisi bulunamadı.' });
        }

        const parsedLogId = Number(logId);
        if (!Number.isInteger(parsedLogId) || parsedLogId <= 0) {
            return res.status(400).json({ error: 'Geçerli bir kayıt seçiniz.' });
        }

        // Manual entrance time or now
        const retDate = actualReturnTime ? new Date(actualReturnTime) : new Date();
        const validActualReturn = isNaN(retDate.getTime()) ? new Date() : retDate;

        // Fetch log details
        const [log] = await sequelize.query<OutLogRow>(
            `SELECT id, studentid, exit_time, expected_return_time
             FROM student_out_logs
             WHERE id = ? AND yurtid = ? AND status = 'OUT'
             LIMIT 1`,
            {
                replacements: [parsedLogId, yurtId],
                type: QueryTypes.SELECT,
            }
        );

        if (!log) {
            return res.status(404).json({ error: 'Aktif çıkış kaydı bulunamadı.' });
        }

        let isLate = false;
        let lateMinutes = 0;

        if (log.expected_return_time) {
            const expectedReturn = new Date(log.expected_return_time);
            if (!isNaN(expectedReturn.getTime()) && validActualReturn.getTime() > expectedReturn.getTime()) {
                isLate = true;
                lateMinutes = Math.round((validActualReturn.getTime() - expectedReturn.getTime()) / 60000);
            }
        }

        await sequelize.query(
            `UPDATE student_out_logs 
             SET actual_return_time = ?, is_late = ?, late_minutes = ?, status = 'RETURNED'
             WHERE id = ? AND yurtid = ? AND status = 'OUT'`,
            { replacements: [validActualReturn, isLate ? 1 : 0, lateMinutes, parsedLogId, yurtId] }
        );

        res.json({
            success: true,
            isLate,
            lateMinutes,
            actualReturnTime: validActualReturn,
            message: isLate ? `Talebe ${lateMinutes} dakika geç döndü (Kural İhlali).` : 'Giriş kaydı alındı.'
        });
    } catch (err) {
        console.error('recordReturn error:', err);
        res.status(500).json({ error: 'Giriş kaydı işlenemedi.' });
    }
};

// Update existing log (Saat/Neden/Not düzeltme)
export const updateExitLog = async (req: Request, res: Response) => {
    try {
        await ensureExitTrackingSchema();

        const { id } = req.params;
        const { reason, notes, exitTime, expectedReturnTime, actualReturnTime, status } = req.body;
        const yurtId = getScopedYurtId(req);

        if (!yurtId) {
            return res.status(400).json({ error: 'Yurt bilgisi bulunamadı.' });
        }

        const logId = Number(id);
        if (!Number.isInteger(logId) || logId <= 0) {
            return res.status(400).json({ error: 'Geçersiz kayıt ID.' });
        }

        const [existing] = await sequelize.query<OutLogRow>(
            `SELECT * FROM student_out_logs WHERE id = ? AND yurtid = ? LIMIT 1`,
            { replacements: [logId, yurtId], type: QueryTypes.SELECT }
        );

        if (!existing) {
            return res.status(404).json({ error: 'Kayıt bulunamadı.' });
        }

        const newExitTime = exitTime ? new Date(exitTime) : new Date(existing.exit_time);
        const newExpectedReturn = expectedReturnTime ? new Date(expectedReturnTime) : (expectedReturnTime === null ? null : (existing.expected_return_time ? new Date(existing.expected_return_time) : null));
        const newActualReturn = actualReturnTime ? new Date(actualReturnTime) : (existing.actual_return_time ? new Date(existing.actual_return_time) : null);
        const newStatus = status === 'OUT' || status === 'RETURNED' ? status : (newActualReturn ? 'RETURNED' : 'OUT');

        let isLate = 0;
        let lateMinutes = 0;

        if (newStatus === 'RETURNED' && newActualReturn && newExpectedReturn) {
            if (newActualReturn.getTime() > newExpectedReturn.getTime()) {
                isLate = 1;
                lateMinutes = Math.round((newActualReturn.getTime() - newExpectedReturn.getTime()) / 60000);
            }
        }

        await sequelize.query(
            `UPDATE student_out_logs
             SET reason = ?, notes = ?, exit_time = ?, expected_return_time = ?, actual_return_time = ?, is_late = ?, late_minutes = ?, status = ?
             WHERE id = ? AND yurtid = ?`,
            {
                replacements: [
                    reason ?? existing.reason,
                    notes ?? existing.notes,
                    newExitTime,
                    newExpectedReturn,
                    newStatus === 'OUT' ? null : newActualReturn,
                    isLate,
                    lateMinutes,
                    newStatus,
                    logId,
                    yurtId
                ]
            }
        );

        res.json({ success: true, message: 'Kayıt başarıyla güncellendi.', isLate: Boolean(isLate), lateMinutes });
    } catch (err) {
        console.error('updateExitLog error:', err);
        res.status(500).json({ error: 'Kayıt güncellenemedi.' });
    }
};

// Delete log
export const deleteExitLog = async (req: Request, res: Response) => {
    try {
        await ensureExitTrackingSchema();

        const { id } = req.params;
        const yurtId = getScopedYurtId(req);

        if (!yurtId) {
            return res.status(400).json({ error: 'Yurt bilgisi bulunamadı.' });
        }

        const logId = Number(id);
        if (!Number.isInteger(logId) || logId <= 0) {
            return res.status(400).json({ error: 'Geçersiz kayıt ID.' });
        }

        await sequelize.query(
            `DELETE FROM student_out_logs WHERE id = ? AND yurtid = ?`,
            { replacements: [logId, yurtId] }
        );

        res.json({ success: true, message: 'Kayıt başarıyla silindi.' });
    } catch (err) {
        console.error('deleteExitLog error:', err);
        res.status(500).json({ error: 'Kayıt silinemedi.' });
    }
};

// List all exit/return logs (latest first)
export const getExitLogs = async (req: Request, res: Response) => {
    try {
        await ensureExitTrackingSchema();

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
                l.max_allowed_minutes,
                l.is_late,
                l.late_minutes,
                l.status,
                l.created_at
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
        await ensureExitTrackingSchema();

        const yurtId = getScopedYurtId(req);
        if (!yurtId) {
            return res.status(400).json({ error: 'Yurt bilgisi bulunamadı.' });
        }

        const fouls = await sequelize.query(
            `SELECT 
                s.studentid, s.first_name, s.last_name, s.class_name,
                COUNT(l.id) as total_exits,
                COALESCE(SUM(CASE WHEN l.is_late = 1 THEN 1 ELSE 0 END), 0) as total_late_fouls,
                COALESCE(SUM(l.late_minutes), 0) as total_late_minutes,
                MAX(CASE WHEN l.is_late = 1 THEN l.actual_return_time ELSE NULL END) as last_foul_date,
                MAX(l.exit_time) as last_exit_date,
                COALESCE(MAX(CASE WHEN l.status = 'OUT' THEN 1 ELSE 0 END), 0) as is_currently_out
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

// Detailed exit history for a single student
export const getStudentExitHistory = async (req: Request, res: Response) => {
    try {
        await ensureExitTrackingSchema();

        const { studentid } = req.params;
        const yurtId = getScopedYurtId(req);

        if (!yurtId) {
            return res.status(400).json({ error: 'Yurt bilgisi bulunamadı.' });
        }

        const parsedStudentId = Number(studentid);
        if (!Number.isInteger(parsedStudentId) || parsedStudentId <= 0) {
            return res.status(400).json({ error: 'Geçersiz talebe ID.' });
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
                l.max_allowed_minutes,
                l.is_late,
                l.late_minutes,
                l.status
             FROM student_out_logs l
             INNER JOIN student s ON s.studentid = l.studentid
             WHERE l.studentid = ? AND l.yurtid = ?
             ORDER BY l.exit_time DESC`,
            {
                replacements: [parsedStudentId, yurtId],
                type: QueryTypes.SELECT,
            }
        );

        res.json(logs);
    } catch (err) {
        console.error('getStudentExitHistory error:', err);
        res.status(500).json({ error: 'Talebe geçmişi alınamadı.' });
    }
};