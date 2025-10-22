import express, { Request, Response } from 'express';
import { AttendanceController } from '../controller/attendanceController';
import { AttendanceService } from '../business/services/attendanceService';
import AttendanceData from '../data/attendanceData';
import { authenticateJWT, requireRoles } from '../middleware/authMiddleware';
import { validateYurtAccess } from '../middleware/validateYurtAccess';
import Attendance from '../data/models/Attendance';
import { activityLogService } from './activityLogRoute';
import Student from '../data/models/Student';

export const attendanceRouter = express.Router();

const attendanceData = new AttendanceData();
const attendanceService = new AttendanceService(attendanceData);
const attendanceController = new AttendanceController(attendanceService);

attendanceRouter.use(authenticateJWT);
attendanceRouter.use(validateYurtAccess); // Add yurt access validation

// Test route to verify DELETE is working at all
attendanceRouter.delete('/test', (req: Request, res: Response) => {
    console.log('🧪 TEST DELETE route hit');
    res.json({ message: 'DELETE test successful' });
});

attendanceRouter.get('/all', (req: Request, res: Response) => {
    attendanceController.getAllAttendance(req, res);
});

attendanceRouter.delete('/delete', requireRoles(['admin', 'hoca', 'yoklamaci']), async (req: Request, res: Response) => {
    console.log('🔥 DELETE /delete route HIT with query:', req.query);
    console.log('🔥 User:', req.user);

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
                        description: `Toplu yoklama: ${payloads.length} kayıt`,
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
                    previousStatus,
                    newStatus: attendance_type_name,
                    description: changeDescription
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
                sebep,
                previousStatus,
                newStatus: 'izinli',
                description: changeDescription
            }),
            ip_address: req.ip || req.socket.remoteAddress || null,
            yurtid: req.user!.yurtid,
        });

        res.status(201).json({ message: 'İzinli kaydı eklendi.' });
    } catch (err) {
        res.status(500).json({ message: 'İzinli kaydı eklenemedi.' });
    }
});

attendanceRouter.get('/izinli', requireRoles(['admin', 'hoca', 'yoklamaci']), async (req, res) => {
    try {
        const { date, program_name } = req.query;
        const yurtid = req.user!.yurtid;
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