import express, { Request, Response } from 'express';
import { AttendanceController } from '../controller/attendanceController';
import { AttendanceService } from '../business/services/attendanceService';
import AttendanceData from '../data/attendanceData';
import { authenticateJWT, requireRoles } from '../middleware/authMiddleware';
import Attendance from '../data/models/Attendance'; // Make sure this path is correct


export const attendanceRouter = express.Router();

const attendanceData = new AttendanceData();
const attendanceService = new AttendanceService(attendanceData);
const attendanceController = new AttendanceController(attendanceService);

attendanceRouter.use(authenticateJWT);

// Test route to verify DELETE is working at all
attendanceRouter.delete('/test', (req: Request, res: Response) => {
    console.log('🧪 TEST DELETE route hit');
    res.json({ message: 'DELETE test successful' });
});

attendanceRouter.get('/all', (req: Request, res: Response) => {
    attendanceController.getAllAttendance(req, res);
});

attendanceRouter.delete('/delete', requireRoles(['admin', 'hoca', 'yoklamaci']), (req: Request, res: Response) => {
    console.log('🔥 DELETE /delete route HIT with query:', req.query);
    console.log('🔥 User:', req.user);
    attendanceController.deleteAttendance(req, res);
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

attendanceRouter.post('/create', requireRoles(['admin', 'hoca', 'yoklamaci']), (req: Request, res: Response) => {
    attendanceController.createAttendance(req, res);
});

attendanceRouter.put('/put', requireRoles(['admin', 'hoca', 'yoklamaci']), (req: Request, res: Response) => {
    attendanceController.updateAttendance(req, res);
});

attendanceRouter.post('/izinli', requireRoles(['admin', 'hoca']), async (req, res) => {
    console.log("POST /attendance/izinli hit");
    try {
        const { studentid, date, program_name, sebep } = req.body;
        if (!studentid || !date || !program_name) {
            return res.status(400).json({ message: 'Eksik bilgi.' });
        }
        // Create attendance record as "izinli"
        const attendanceEntity = {
            _studentId: studentid,
            _date: new Date(date),
            _attendanceTypeName: 'izinli',
            _programName: program_name,
            _sebep: sebep || null,
            // Add other required properties with default values if needed
        } as any; // Replace 'any' with your Attendance entity type if imported

        await attendanceService.createOrUpdateAttendance(attendanceEntity);
        res.status(201).json({ message: 'İzinli kaydı eklendi.' });
    } catch (err) {
        res.status(500).json({ message: 'İzinli kaydı eklenemedi.' });
    }
});

attendanceRouter.get('/izinli', requireRoles(['admin', 'hoca', 'yoklamaci']), async (req, res) => {
    try {
        const { date, program_name } = req.query;
        if (!date || !program_name) {
            return res.status(400).json({ message: 'Eksik bilgi.' });
        }
        const records = await attendanceService.getAttendanceByDateAndProgram(date as string, program_name as string);
        const izinliler = records.filter(r => r.attendance_type_name === 'izinli');
        res.json(izinliler);
    } catch (err) {
        res.status(500).json({ message: 'İzinli listesi alınamadı.' });
    }
});