import { Request, Response } from 'express';
import AttendanceSequelize from '../data/models/Attendance';
import { Attendance } from '../business/models/Attendance';
import { AttendanceService } from '../business/services/attendanceService';

export class AttendanceController {
    public constructor(private attendanceService: AttendanceService) { }

    public async getAllAttendance(req: Request, res: Response) {
        try {
            const attendance = await this.attendanceService.getAllAttendance();
            res.status(202).json(attendance);
        } catch {
            res.status(404).end();
        }
    }

    public async getAttendance(req: Request, res: Response) {
        try {
            const attendanceData = new Attendance(
                +(req.query.studentid as string),
                new Date(req.query.date as string),
                undefined,
                req.query.program_name as string
            );
            const attendance = await this.attendanceService.getAttendance(attendanceData);
            res.status(202).json(attendance);
        } catch (error) {
            console.log(error);
            res.status(404).json({ message: 'Attendance not found or bad request' });
        }
    }

    public async getAttendanceStatistics(req: Request, res: Response) {
        try {
            const start = req.query.startDate as string;
            const end = req.query.endDate as string;
            if (!start || !end) {
                return res.status(400).json({ message: 'start and end date required' });
            }
            const stats = await this.attendanceService.getAttendanceStatisticsByDateRange(start, end);
            res.status(200).json(stats);
        } catch (err) {
            console.error('Error generating stats:', err);
            res.status(500).json({ message: 'Could not generate statistics' });
        }
    }

    public async getAttendanceByDateAndProgram(req: Request, res: Response) {
        try {
            const date = req.query.date as string;
            const programName = req.query.program_name as string;
            const attendance = await this.attendanceService.getAttendanceByDateAndProgram(date, programName);
            res.status(202).json(attendance);
        } catch (error) {
            console.log(error);
            res.status(404).json({ message: 'Attendance not found or bad request' });
        }
    }

    public async createAttendance(req: Request, res: Response) {
        try {
            const payload = req.body;

            if (!Array.isArray(payload)) {
                return res.status(400).json({ message: 'Expected an array of attendance records' });
            }

            for (const entry of payload) {
                const { studentid, date, attendance_type_name, program_name } = entry;

                if (!studentid || !date || !program_name) {
                    return res.status(400).json({ message: 'Missing required fields' });
                }

                const attendanceData = new Attendance(
                    studentid,
                    new Date(date),
                    attendance_type_name,
                    program_name
                );

                await this.attendanceService.createAttendance(attendanceData);
            }

            res.status(202).json({ message: 'Attendance records created successfully' });
        } catch (error) {
            console.log('Create Attendance error:', error);
            res.status(500).json({ message: 'Failed to create attendance' });
        }
    }

    public async updateAttendance(req: Request, res: Response) {
        try {
            const { studentid, date, attendance_type_name, program_name, sebep } = req.body;

            if (!studentid || !date || !program_name) {
                return res.status(400).json({ message: 'Missing required fields' });
            }

            const attendanceData = new Attendance(
                studentid,
                new Date(date),
                attendance_type_name,
                program_name
            );

            attendanceData.sebep = sebep || null;

            await this.attendanceService.updateAttendance(attendanceData);

            res.status(202).json({ message: 'Attendance successfully updated' });
        } catch (error) {
            console.log('Update Attendance error:', error);
            res.status(500).json({ message: 'Failed to update attendance' });
        }
    }

}
