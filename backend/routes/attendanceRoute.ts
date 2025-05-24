import express, { Request, Response } from 'express';
import { AttendanceController } from '../controller/attendanceController';
import { AttendanceService } from '../business/services/attendanceService';
import AttendanceData from '../data/attendanceData';
import { authenticateJWT, requireRoles } from '../middleware/authMiddleware';


export const attendanceRouter = express.Router();

const attendanceData = new AttendanceData();
const attendanceService = new AttendanceService(attendanceData);
const attendanceController = new AttendanceController(attendanceService);

attendanceRouter.use(authenticateJWT);

attendanceRouter.get('/all', (req: Request, res: Response) => {
    attendanceController.getAllAttendance(req, res);
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

attendanceRouter.delete('/', requireRoles(['admin', 'hoca', 'yoklamaci']), (req: Request, res: Response) => {
    res.status(501).json({ message: 'DELETE not implemented yet' });
});