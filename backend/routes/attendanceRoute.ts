import express, { Request, Response } from 'express';
import { AttendanceController } from '../controller/attendanceController';
import { AttendanceService } from '../business/services/attendanceService';
import { AttendanceData } from '../data/attendanceData';

export const attendanceRoute = express.Router();

const attendanceData: AttendanceData = new AttendanceData();
const attendanceService: AttendanceService = new AttendanceService(attendanceData);
const attendanceController: AttendanceController = new AttendanceController(attendanceService);

attendanceRoute.get('/all', (req: Request, res: Response) => {
    attendanceController.getAllAttendance(req, res);
})

attendanceRoute.get('', (req: Request, res: Response) => {
    attendanceController.getAttendance(req, res);
})

attendanceRoute.put('/', (req: Request, res: Response) => {
    res.send('attendance PUT not yet implemented')
})

attendanceRoute.delete('/', (req: Request, res: Response) => {
    res.send('attendance DELETE not yet implemented')
})