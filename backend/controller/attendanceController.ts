import {Request, Response} from 'express';
import AttendanceSequelize from '../data/models/Attendance';
import { Attendance } from '../business/models/Attendance';
import { AttendanceService } from '../business/services/attendanceService';

export class AttendanceController {

    public constructor(private attendanceService: AttendanceService) {

    }

    public async getAllAttendance(req: Request, res: Response){
        try {
            const attendance: AttendanceSequelize[] = await this.attendanceService.getAllAttendance();
            res.status(202).json(attendance);
        } catch (error) {
            res.status(404).end();
        }
    }

    public async getAttendance(req: Request, res: Response){
        try {
            const attendanceData: Attendance = new Attendance(req.body.studentid, req.body.date, undefined, req.body.program_name);

            const attendance: AttendanceSequelize | null = await this.attendanceService.getAttendance(attendanceData);

            res.status(202).json(attendance);
        } catch (error) {
            console.log(error);
            res.status(404).json({ message: "Attendance not found or bad request" });
        }
    }

    public async createAttendance(req: Request, res: Response){
        try {
            const attendanceData: Attendance = new Attendance(req.body.studentid, req.body.date, req.body.attendance_type_name, req.body.program_name);
            await this.attendanceService.createAttendance(attendanceData);

            res.status(202).json({ message: "Attendance succesfully saved" });
        } catch (error) {
            console.log(error);
            res.status(404).json({ message: "Bad request" });
        }
    }

    public async updateAttendance(req: Request, res: Response){
        try {
            const attendanceData: Attendance = new Attendance(req.body.studentid, req.body.date, req.body.attendance_type_name, req.body.program_name);
            await this.attendanceService.updateAttendance(attendanceData);

            res.status(202).json({ message: "Attendance succesfully updated" });
        } catch (error) {
            console.log(error);
            res.status(404).json({ message: "Bad request" });
        }
    }
}