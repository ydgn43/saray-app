import express, { Request, Response } from 'express';
import { AttendanceController } from '../controller/attendanceController';
import { AttendanceService } from '../business/services/attendanceService';
import AttendanceData from '../data/attendanceData';
import { authenticateJWT, requireRoles } from '../middleware/authMiddleware';


export const attendanceRoute = express.Router();

const attendanceData = new AttendanceData();
const attendanceService = new AttendanceService(attendanceData);
const attendanceController = new AttendanceController(attendanceService);

attendanceRoute.get('/all', authenticateJWT, (req: Request, res: Response) => {
    attendanceController.getAllAttendance(req, res);
});

attendanceRoute.get('/', authenticateJWT, (req: Request, res: Response) => {
    attendanceController.getAttendance(req, res);
});

attendanceRoute.get('/statistics', authenticateJWT, (req: Request, res: Response) => {
    attendanceController.getAttendanceStatistics(req, res);
});

attendanceRoute.get('/dailyprogram', authenticateJWT, (req: Request, res: Response) => {
    attendanceController.getAttendanceByDateAndProgram(req, res);
});

attendanceRoute.post('/create', authenticateJWT, requireRoles(['admin', 'yoklamaci']), (req: Request, res: Response) => {
    attendanceController.createAttendance(req, res);
});

attendanceRoute.put('/put', authenticateJWT, requireRoles(['admin', 'yoklamaci']), (req: Request, res: Response) => {
    attendanceController.updateAttendance(req, res);
});

attendanceRoute.delete('/', authenticateJWT, requireRoles(['admin', 'yoklamaci']), (req: Request, res: Response) => {
    res.status(501).json({ message: 'DELETE not implemented yet' });
});