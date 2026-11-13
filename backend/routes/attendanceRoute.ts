import express, { Request, Response } from 'express';
import { AttendanceController } from '../controller/attendanceController';
import { AttendanceService } from '../business/services/attendanceService';
import AttendanceData from '../data/attendanceData';
import { authenticateJWT, requireRoles } from '../middleware/authMiddleware';
import { validateYurtAccess } from '../middleware/validateYurtAccess';
import Attendance from '../data/models/Attendance';
import { activityLogService } from './activityLogRoute';
import Student from '../data/models/Student';
import { QueryTypes } from 'sequelize';
import { sequelize } from '../data/sequelize';

export const attendanceRouter = express.Router();

const attendanceData = new AttendanceData();
const attendanceService = new AttendanceService(attendanceData);
const attendanceController = new AttendanceController(attendanceService);

attendanceRouter.use(authenticateJWT);
attendanceRouter.use(validateYurtAccess); // Add yurt access validation

// Test route to verify DELETE is working at all
attendanceRouter.delete('/test', (req: Request, res: Response) => {
    console.log('TEST DELETE route hit');
    res.json({ message: 'DELETE test successful' });
});

attendanceRouter.get('/all', (req: Request, res: Response) => {
    attendanceController.getAllAttendance(req, res);
});

attendanceRouter.delete('/delete', requireRoles(['admin', 'hoca', 'yoklamaci']), async (req: Request, res: Response) => {
    console.log('DELETE /delete route HIT with query:', req.query);
    console.log('User:', req.user);

    try {
        // Get student info before deleting
        const { studentid, date, program_name } = req.query;
        let studentName = 'Bilinmeyen';
        let previousStatus = 'izinli';

        if (studentid) {
            const student = await Student.findByPk(Number(studentid));
            if (student) {
                studentName = `${student.first_name} ${student.last_name || ''}`.trim();
            }

            // Get attendance record before deletion
            const attendance = await Attendance.findOne({
                where: {
                    studentid: Number(studentid),
                    date: date as string,
                    program_name: program_name as string,
                }
            });
            if (attendance) {
                previousStatus = attendance.attendance_type_name;
            }
        }

        await attendanceController.deleteAttendance(req, res);

        // Log the activity after successful delete
        if (res.statusCode === 200) {
            await activityLogService.createLog({
                userid: req.user!.accountid,
                username: req.user!.username,
                action: 'delete',
                entity_type: 'izinli',
                entity_id: JSON.stringify({ studentid, date, program_name, studentName }),
                details: JSON.stringify({
                    studentName,
                    previousStatus,
                    description: `${studentName} - ${previousStatus} kaydı silindi`
                }),
                ip_address: req.ip || req.socket.remoteAddress || null,
                yurtid: req.user!.yurtid,
            });
        }
    } catch (error) {
        console.error('Delete error:', error);
    }
});

// Delete all attendance records for a program on a specific date
attendanceRouter.delete('/delete-program', requireRoles(['admin']), async (req: Request, res: Response) => {
    console.log('DELETE /delete-program route HIT with query:', req.query);
    console.log('User:', req.user);

    try {
        const { date, program_name } = req.query;

        await attendanceController.deleteAllAttendanceByProgram(req, res);

        // Log the activity after successful delete
        if (res.statusCode === 200) {
            await activityLogService.createLog({
                userid: req.user!.accountid,
                username: req.user!.username,
                action: 'delete',
                entity_type: 'attendance',
                entity_id: JSON.stringify({ date, program_name }),
                details: JSON.stringify({
                    description: `${program_name} programı için tüm yoklama kayıtları silindi (${date})`
                }),
                ip_address: req.ip || req.socket.remoteAddress || null,
                yurtid: req.user!.yurtid,
            });
        }
    } catch (error) {
        console.error('Delete program error:', error);
    }
});

attendanceRouter.get('/', (req: Request, res: Response) => {
    attendanceController.getAttendance(req, res);
});

attendanceRouter.get('/statistics', (req: Request, res: Response) => {
    attendanceController.getAttendanceStatistics(req, res);
});

attendanceRouter.get('/dailyprogram', (req: Request, res: Response) => {
    attendanceController.getAttendanceByDateAndProgram(req, res);
});

attendanceRouter.post('/create', requireRoles(['admin', 'hoca', 'yoklamaci']), async (req: Request, res: Response) => {
    try {
        await attendanceController.createAttendance(req, res);

        // Log the activity after successful creation
        if (res.statusCode === 202) {
            const payloads = Array.isArray(req.body) ? req.body : [req.body];

            // Only log if it's a bulk operation (more than 1 record) or if it's a new izinli record
            // Individual updates should go through PUT route
            if (payloads.length > 1) {
                // Get student names for all records
                const recordsWithNames = await Promise.all(
                    payloads.map(async (p: any) => {
                        const student = await Student.findByPk(Number(p.studentid));
                        const studentName = student
                            ? `${student.first_name} ${student.last_name || ''}`.trim()
                            : 'Bilinmeyen';
                        return {
                            studentid: p.studentid,
                            studentName,
                            date: p.date,
                            program: p.program_name,
                            status: p.attendance_type_name || 'gelmedi'
                        };
                    })
                );

                const description = recordsWithNames
                    .map(r => `${r.studentName} - ${r.status}`)
                    .join(', ');

                // Get first record's date and program for display
                const firstRecord = payloads[0];
                const dateStr = firstRecord.date;
                const programName = firstRecord.program_name;

                await activityLogService.createLog({
                    userid: req.user!.accountid,
                    username: req.user!.username,
                    action: 'create',
                    entity_type: 'attendance',
                    entity_id: JSON.stringify(recordsWithNames.map(r => ({
                        studentid: r.studentid,
                        studentName: r.studentName,
                        date: r.date,
                        program: r.program
                    }))),
                    details: JSON.stringify({
                        count: payloads.length,
                        date: dateStr,
                        program_name: programName,
                        description: `${programName} - ${dateStr} için ${payloads.length} kayıt oluşturuldu`,
                        records: recordsWithNames
                    }),
                    ip_address: req.ip || req.socket.remoteAddress || null,
                    yurtid: req.user!.yurtid,
                });
            }
        }
    } catch (error) {
        console.error('Create attendance error:', error);
    }
});

attendanceRouter.put('/put', requireRoles(['admin', 'hoca', 'yoklamaci']), async (req: Request, res: Response) => {
    try {
        // Get previous state before update
        const { studentid, date, program_name, attendance_type_name } = req.body;
        let studentName = 'Bilinmeyen';
        let previousStatus = null;

        if (studentid && date && program_name) {
            const student = await Student.findByPk(Number(studentid));
            if (student) {
                studentName = `${student.first_name} ${student.last_name || ''}`.trim();
            }

            const existingAttendance = await Attendance.findOne({
                where: {
                    studentid: Number(studentid),
                    date: date,
                    program_name: program_name,
                }
            });
            if (existingAttendance) {
                previousStatus = existingAttendance.attendance_type_name;
            }
        }

        await attendanceController.updateAttendance(req, res);

        // Log the activity after successful update
        if (res.statusCode === 200 && studentid && previousStatus !== attendance_type_name) {
            const changeDescription = previousStatus
                ? `${studentName} - ${previousStatus} → ${attendance_type_name}`
                : `${studentName} - ${attendance_type_name}`;

            await activityLogService.createLog({
                userid: req.user!.accountid,
                username: req.user!.username,
                action: 'update',
                entity_type: 'attendance',
                entity_id: JSON.stringify({ studentid, date, program_name, studentName }),
                details: JSON.stringify({
                    studentName,
                    date,
                    program_name,
                    previousStatus,
                    newStatus: attendance_type_name,
                    description: `${program_name} - ${date} için ${changeDescription}`
                }),
                ip_address: req.ip || req.socket.remoteAddress || null,
                yurtid: req.user!.yurtid,
            });
        }
    } catch (error) {
        console.error('Update attendance error:', error);
    }
});

attendanceRouter.post('/izinli', requireRoles(['admin', 'hoca']), async (req, res) => {
    console.log("POST /attendance/izinli hit");
    try {
        const { studentid, date, program_name, sebep } = req.body;
        if (!studentid || !date || !program_name) {
            return res.status(400).json({ message: 'Eksik bilgi.' });
        }

        // Get student info
        let studentName = 'Bilinmeyen';
        let previousStatus = null;
        const student = await Student.findByPk(Number(studentid));
        if (student) {
            studentName = `${student.first_name} ${student.last_name || ''}`.trim();
        }

        // Check if there's an existing attendance record
        const existingAttendance = await Attendance.findOne({
            where: {
                studentid: Number(studentid),
                date: date,
                program_name: program_name,
            }
        });
        if (existingAttendance) {
            previousStatus = existingAttendance.attendance_type_name;
        }

        // Create attendance record as "izinli"
        const attendanceEntity = {
            _studentId: studentid,
            _date: new Date(date),
            _attendanceTypeName: 'izinli',
            _programName: program_name,
            _sebep: sebep || null,
        } as any;

        await attendanceService.createOrUpdateAttendance(attendanceEntity);

        // Log the activity
        const changeDescription = previousStatus
            ? `${studentName} - ${previousStatus} → İzinli`
            : `${studentName} - Yeni izinli kaydı`;

        await activityLogService.createLog({
            userid: req.user!.accountid,
            username: req.user!.username,
            action: previousStatus ? 'update' : 'create',
            entity_type: 'izinli',
            entity_id: JSON.stringify({ studentid, date, program_name, studentName }),
            details: JSON.stringify({
                studentName,
                date,
                program_name,
                sebep,
                previousStatus,
                newStatus: 'izinli',
                description: `${program_name} - ${date} için ${changeDescription}`
            }),
            ip_address: req.ip || req.socket.remoteAddress || null,
            yurtid: req.user!.yurtid,
        });

        res.status(201).json({ message: 'İzinli kaydı eklendi.' });
    } catch (err) {
        res.status(500).json({ message: 'İzinli kaydı eklenemedi.' });
    }
});

// Izinli for a date range: every chosen student becomes "izinli" for every day from start_date to end_date
// (both included), in the chosen programs (or all programs of the yurt). Existing yoklama records of those
// days are replaced. With dry_run: true nothing is written and only the counts are returned.
//   body: { studentids: number[], start_date: 'YYYY-MM-DD', end_date: 'YYYY-MM-DD',
//           programs: string[] | 'all', sebep?: string, dry_run?: boolean }
const IZINLI_MAX_DAYS = 60;
attendanceRouter.post('/izinli-range', requireRoles(['admin', 'hoca']), async (req, res) => {
    const yurtid = req.selectedYurtId!; // always the selected yurt, never from the body
    try {
        const { studentids, start_date, end_date, programs, sebep, dry_run } = req.body ?? {};
        const isDay = (v: unknown): v is string =>
            typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(Date.parse(`${v}T00:00:00Z`));

        const ids: number[] = Array.isArray(studentids)
            ? Array.from(new Set(studentids.map(Number).filter((n) => Number.isInteger(n) && n > 0)))
            : [];
        if (ids.length === 0) return res.status(400).json({ message: 'En az bir talebe seçin.' });
        if (!isDay(start_date) || !isDay(end_date)) {
            return res.status(400).json({ message: 'Geçerli bir tarih aralığı girin.' });
        }
        const startMs = Date.parse(`${start_date}T00:00:00Z`);
        const endMs = Date.parse(`${end_date}T00:00:00Z`);
        if (endMs < startMs) {
            return res.status(400).json({ message: 'Bitiş tarihi başlangıç tarihinden önce olamaz.' });
        }
        const days = Math.round((endMs - startMs) / 86400000) + 1;
        if (days > IZINLI_MAX_DAYS) {
            return res.status(400).json({ message: `Tarih aralığı en fazla ${IZINLI_MAX_DAYS} gün olabilir.` });
        }
        const dates: string[] = [];
        for (let i = 0; i < days; i++) dates.push(new Date(startMs + i * 86400000).toISOString().slice(0, 10));

        // Programs must belong to this yurt
        const yurtPrograms = (await sequelize.query<{ program_name: string }>(
            'SELECT program_name FROM program WHERE yurtid = :yurtid',
            { replacements: { yurtid }, type: QueryTypes.SELECT }
        )).map((r) => r.program_name);
        let chosen: string[];
        if (programs === 'all') {
            chosen = yurtPrograms;
        } else if (Array.isArray(programs) && programs.length > 0) {
            chosen = Array.from(new Set(programs.map(String)));
            if (!chosen.every((p) => yurtPrograms.includes(p))) {
                return res.status(400).json({ message: 'Geçersiz program seçildi.' });
            }
        } else {
            return res.status(400).json({ message: 'Program seçin.' });
        }
        if (chosen.length === 0) return res.status(400).json({ message: 'Bu yurtta tanımlı program yok.' });

        // Every student must belong to this yurt
        const students = await sequelize.query<{ studentid: number; first_name: string; last_name: string | null }>(
            'SELECT studentid, first_name, last_name FROM student WHERE yurtid = :yurtid AND studentid IN (:ids)',
            { replacements: { yurtid, ids }, type: QueryTypes.SELECT }
        );
        if (students.length !== ids.length) {
            return res.status(400).json({ message: 'Seçilen talebelerden biri bu yurda ait değil.' });
        }

        const reason = typeof sebep === 'string' ? sebep.trim().slice(0, 255) : '';
        const range = { ids, start: start_date, end: end_date, chosen };

        const existing = await sequelize.query<{ attendance_type_name: string }>(
            `SELECT attendance_type_name FROM attendance
              WHERE studentid IN (:ids) AND date BETWEEN :start AND :end AND program_name IN (:chosen)`,
            { replacements: range, type: QueryTypes.SELECT }
        );
        const total = ids.length * dates.length * chosen.length;
        const alreadyIzinli = existing.filter((r) => r.attendance_type_name === 'izinli').length;
        const summary = {
            days,
            total,
            created: total - existing.length,
            replaced: existing.length - alreadyIzinli, // records of another type that become izinli
            already_izinli: alreadyIzinli,
        };
        if (dry_run) return res.json(summary);

        // Replace everything in the range in one transaction: all of it is saved, or none of it
        await sequelize.transaction(async (transaction) => {
            await sequelize.query(
                `DELETE FROM attendance
                  WHERE studentid IN (:ids) AND date BETWEEN :start AND :end AND program_name IN (:chosen)`,
                { replacements: range, transaction }
            );
            const rows: (string | number | null)[][] = [];
            for (const studentid of ids) {
                for (const date of dates) {
                    for (const program_name of chosen) {
                        rows.push([studentid, date, program_name, 'izinli', reason || null, yurtid]);
                    }
                }
            }
            for (let i = 0; i < rows.length; i += 500) {
                await sequelize.query(
                    'INSERT INTO attendance (studentid, date, program_name, attendance_type_name, sebep, yurtid) VALUES :rows',
                    { replacements: { rows: rows.slice(i, i + 500) }, transaction }
                );
            }
        });

        // One log entry per student (a failed log never undoes the saved records)
        for (const st of students) {
            const studentName = `${st.first_name} ${st.last_name || ''}`.trim();
            try {
                await activityLogService.createLog({
                    userid: req.user!.accountid,
                    username: req.user!.username,
                    action: 'create',
                    entity_type: 'izinli',
                    entity_id: JSON.stringify({ studentid: st.studentid, start_date, end_date, studentName }),
                    details: JSON.stringify({
                        studentName,
                        start_date,
                        end_date,
                        programs: chosen,
                        sebep: reason || null,
                        newStatus: 'izinli',
                        description: `${start_date} - ${end_date} arası ${dates.length * chosen.length} kayıt için ${studentName} - İzinli`,
                    }),
                    ip_address: req.ip || req.socket.remoteAddress || null,
                    yurtid,
                });
            } catch (logError) {
                console.error('Izinli range log failed:', logError);
            }
        }

        res.status(201).json({ message: 'İzinli kayıtları eklendi.', ...summary });
    } catch (err) {
        console.error('Izinli range error:', err);
        res.status(500).json({ message: 'İzinli kayıtları eklenemedi.' });
    }
});

attendanceRouter.get('/izinli', requireRoles(['admin', 'hoca', 'yoklamaci']), async (req, res) => {
    try {
        const { date, program_name } = req.query;
        const yurtid = req.selectedYurtId!; // selected yurt, like every other attendance route
        if (!date || !program_name) {
            return res.status(400).json({ message: 'Eksik bilgi.' });
        }
        const records = await attendanceService.getAttendanceByDateAndProgram(date as string, program_name as string, yurtid);
        const izinliler = records.filter(r => r.attendance_type_name === 'izinli');
        res.json(izinliler);
    } catch (err) {
        res.status(500).json({ message: 'İzinli listesi alınamadı.' });
    }
});