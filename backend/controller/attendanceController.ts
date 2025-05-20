import { Request, Response } from 'express';
import AttendanceSequelize from '../data/models/Attendance';
import { Attendance } from '../business/models/Attendance';
import { AttendanceService } from '../business/services/attendanceService';

export class AttendanceController {

    public constructor(private attendanceService: AttendanceService) {

    }

    public async getAllAttendance(req: Request, res: Response) {
        try {
            const attendance: AttendanceSequelize[] = await this.attendanceService.getAllAttendance();
            res.status(202).json(attendance);
        } catch (error) {
            res.status(404).end();
        }
    }

    public async getAttendance(req: Request, res: Response) {
        try {
            const attendanceData: Attendance = new Attendance(+(req.query.studentid as string), new Date(req.query.date as string), undefined, req.query.program_name as string);

            const attendance: AttendanceSequelize | null = await this.attendanceService.getAttendance(attendanceData);

            res.status(202).json(attendance);
        } catch (error) {
            console.log(error);
            res.status(404).json({ message: "Attendance not found or bad request" });
        }
    }

    public async getAttendanceStatistics(req: Request, res: Response) {
        try {
            const start = req.query.startDate as string;
            const end = req.query.endDate as string;

            if (!start || !end) {
                return res.status(400).json({ message: 'start and end date required' });
            }

            const stats = await this.attendanceService.getAttendanceStatisticsByDateRange(start as string, end as string);
            res.status(200).json(stats);
        } catch (err) {
            console.error("Error generating stats:", err);
            res.status(500).json({ message: "Could not generate statistics" });
        }
    }



    public async getAttendanceByDateAndProgram(req: Request, res: Response) {
        try {
            const date: string = req.query.date as string;
            const programName: string = req.query.program_name as string;

            const attendance: AttendanceSequelize[] = await this.attendanceService.getAttendanceByDateAndProgram(date, programName);
            res.status(202).json(attendance);
        } catch (error) {
            console.log(error);
            res.status(404).json({ message: "Attendance not found or bad request" });
        }
    }

    public async createAttendance(req: Request, res: Response) {
        try {
            const attendanceData: Attendance = new Attendance(req.body.studentid, req.body.date, req.body.attendance_type_name, req.body.program_name);
            await this.attendanceService.createAttendance(attendanceData);

            res.status(202).json({ message: "Attendance succesfully saved" });
        } catch (error) {
            console.log(error);
            res.status(404).json({ message: "Bad request" });
        }
    }

    public async updateAttendance(req: Request, res: Response) {
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