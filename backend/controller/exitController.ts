import { Request, Response } from 'express';
import { Sequelize, QueryTypes } from 'sequelize';

// Record Exit (Çıkış Kaydı)
export const recordExit = async (req: Request, res: Response) => {
    try {
        const { studentid, reason, customMaxMinutes, notes } = req.body;
        const exitTime = new Date();

        // Calculate expected return time based on setting or custom parameter
        const duration = customMaxMinutes || 60;
        const expectedReturn = new Date(exitTime.getTime() + duration * 60000);

        const [result] = await sequelize.query(
            `INSERT INTO student_out_logs (studentid, reason, notes, exit_time, expected_return_time, status)
             VALUES (?, ?, ?, ?, ?, 'OUT')`,
            { replacements: [studentid, reason || 'Market', notes || null, exitTime, expectedReturn] }
        );

        res.json({ success: true, message: 'Çıkış kaydı oluşturuldu.', logId: result });
    } catch (err) {
        res.status(500).json({ error: 'Çıkış kaydı oluşturulamadı.' });
    }
};

// Record Return (Giriş Kaydı ve Geç Kalma Hesaplama)
export const recordReturn = async (req: Request, res: Response) => {
    try {
        const { logId } = req.body;
        const actualReturn = new Date();

        // Fetch log details
        const [logs]: any = await sequelize.query(
            `SELECT * FROM student_out_logs WHERE id = ? AND status = 'OUT'`,
            { replacements: [logId], type: QueryTypes.SELECT }
        );

        if (!logs) return res.status(404).json({ error: 'Aktif çıkış kaydı bulunamadı.' });

        const expectedReturn = new Date(logs.expected_return_time);
        let isLate = false;
        let lateMinutes = 0;

        if (actualReturn > expectedReturn) {
            isLate = true;
            lateMinutes = Math.round((actualReturn.getTime() - expectedReturn.getTime()) / 60000);
        }

        await sequelize.query(
            `UPDATE student_out_logs 
             SET actual_return_time = ?, is_late = ?, late_minutes = ?, status = 'RETURNED'
             WHERE id = ?`,
            { replacements: [actualReturn, isLate ? 1 : 0, lateMinutes, logId] }
        );

        res.json({
            success: true,
            isLate,
            lateMinutes,
            message: isLate ? `Talebe ${lateMinutes} dakika geç döndü (Kural İhlali).` : 'Giriş kaydı alındı.'
        });
    } catch (err) {
        res.status(500).json({ error: 'Giriş kaydı işlenemedi.' });
    }
};

// Summary of Student Late Returns / Fouls
export const getFoulsSummary = async (req: Request, res: Response) => {
    try {
        const fouls = await sequelize.query(
            `SELECT 
                s.studentid, s.first_name, s.last_name, s.class_name,
                COUNT(l.id) as total_exits,
                SUM(CASE WHEN l.is_late = 1 THEN 1 ELSE 0 END) as total_late_fouls,
                SUM(l.late_minutes) as total_late_minutes
             FROM student s
             LEFT JOIN student_out_logs l ON s.studentid = l.studentid
             GROUP BY s.studentid, s.first_name, s.last_name, s.class_name
             ORDER BY total_late_fouls DESC`,
            { type: QueryTypes.SELECT }
        );
        res.json(fouls);
    } catch (err) {
        res.status(500).json({ error: 'İhlal özeti alınamadı.' });
    }
};