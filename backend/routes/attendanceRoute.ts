import express, { Request, Response } from 'express';
import { AttendanceController } from '../controller/attendanceController';
import { AttendanceService } from '../business/services/attendanceService';
import AttendanceData from '../data/attendanceData';


export const attendanceRoute = express.Router();

const attendanceData = new AttendanceData();
const attendanceService = new AttendanceService(attendanceData);
const attendanceController = new AttendanceController(attendanceService);

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

attendanceRoute.post('/create', (req: Request, res: Response) => {
    attendanceController.createAttendance(req, res);
});

attendanceRoute.put('/put', (req: Request, res: Response) => {
    attendanceController.updateAttendance(req, res);
});

attendanceRoute.delete('/', (req: Request, res: Response) => {
    res.status(501).json({ message: 'DELETE not implemented yet' });
});