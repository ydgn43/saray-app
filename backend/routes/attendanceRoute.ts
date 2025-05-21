import express, { Request, Response } from 'express';
import { AttendanceController } from '../controller/attendanceController';
import { AttendanceService } from '../business/services/attendanceService';
import AttendanceData from '../data/attendanceData';
import { authenticateJWT, requireRoles } from '../middleware/authMiddleware';


export const attendanceRoute = express.Router();

const attendanceData = new AttendanceData();
const attendanceService = new AttendanceService(attendanceData);
const attendanceController = new AttendanceController(attendanceService);

attendanceRoute.use(authenticateJWT);

attendanceRoute.get('/all', (req: Request, res: Response) => {
    attendanceController.getAllAttendance(req, res);
});

attendanceRoute.get('/', (req: Request, res: Response) => {
    attendanceController.getAttendance(req, res);
});

attendanceRoute.get('/statistics', (req: Request, res: Response) => {
    attendanceController.getAttendanceStatistics(req, res);
});

attendanceRoute.get('/dailyprogram', (req: Request, res: Response) => {
    attendanceController.getAttendanceByDateAndProgram(req, res);
});

attendanceRoute.post('/create', requireRoles(['admin', 'hoca', 'yoklamaci']), (req: Request, res: Response) => {
    attendanceController.createAttendance(req, res);
});

attendanceRoute.put('/put', requireRoles(['admin', 'hoca', 'yoklamaci']), (req: Request, res: Response) => {
    attendanceController.updateAttendance(req, res);
});

attendanceRoute.delete('/', requireRoles(['admin', 'hoca', 'yoklamaci']), (req: Request, res: Response) => {
    res.status(501).json({ message: 'DELETE not implemented yet' });
});