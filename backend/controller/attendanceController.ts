import { Request, Response } from 'express';
import AttendanceSequelize from '../data/models/Attendance';
import { Attendance } from '../business/models/Attendance';
import { AttendanceService } from '../business/services/attendanceService';

export class AttendanceController {
    public constructor(private attendanceService: AttendanceService) { }

    public async getAllAttendance(req: Request, res: Response) {
        try {
            const yurtid = req.selectedYurtId!;
            const attendance = await this.attendanceService.getAllAttendance(yurtid);
            res.status(202).json(attendance);
        } catch {
            res.status(404).end();
        }
    }

    public async getAttendance(req: Request, res: Response) {
        try {
            const yurtid = req.selectedYurtId!;
            const attendanceData = new Attendance(
                +(req.query.studentid as string),
                new Date(req.query.date as string),
                undefined,
                req.query.program_name as string,
                yurtid
            );
            const attendance = await this.attendanceService.getAttendance(attendanceData, yurtid);
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
            const yurtid = req.selectedYurtId!;
            if (!start || !end) {
                return res.status(400).json({ message: 'start and end date required' });
            }
            const stats = await this.attendanceService.getAttendanceStatisticsByDateRange(start, end, yurtid);
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
            const yurtid = req.selectedYurtId!;
            const attendance = await this.attendanceService.getAttendanceByDateAndProgram(date, programName, yurtid);
            res.status(202).json(attendance);
        } catch (error) {
            console.log(error);
            res.status(404).json({ message: 'Attendance not found or bad request' });
        }
    }

    public async createAttendance(req: Request, res: Response) {
        try {
            const yurtid = req.selectedYurtId!;
            // Accept single record or array of records
            const payloads = Array.isArray(req.body) ? req.body : [req.body];

            for (const entry of payloads) {
                const { studentid, date, attendance_type_name, program_name, sebep } = entry;

                if (!studentid || !date || !program_name) {
                    return res.status(400).json({ message: 'Missing required fields' });
                }

                const attendanceData = new Attendance(
                    studentid,
                    new Date(date),
                    attendance_type_name,
                    program_name,
                    yurtid
                );
                attendanceData.sebep = sebep || null;

                // Use upsert logic
                await this.attendanceService.createOrUpdateAttendance(attendanceData);
            }

            res.status(202).json({ message: 'Attendance records created/updated successfully' });
        } catch (error) {
            console.log('Create Attendance error:', error);
            res.status(500).json({ message: 'Failed to create/update attendance' });
        }
    }


    public async updateAttendance(req: Request, res: Response) {
        try {
            const yurtid = req.selectedYurtId!;
            const { studentid, date, attendance_type_name, program_name, sebep } = req.body;

            if (!studentid || !date || !program_name) {
                return res.status(400).json({ message: 'Missing required fields' });
            }

            const attendanceData = new Attendance(
                studentid,
                new Date(date),
                attendance_type_name,
                program_name,
                yurtid
            );

            attendanceData.sebep = sebep || null;

            await this.attendanceService.updateAttendance(attendanceData, yurtid);

            res.status(202).json({
                message: 'Attendance successfully updated',
                studentid,
                date,
                attendance_type_name,
                program_name
            });
        } catch (error) {
            console.log('Update Attendance error:', error);
            res.status(500).json({ message: 'Failed to update attendance' });
        }
    }

    public async deleteAttendance(req: Request, res: Response) {
        try {
            console.log('🗑️ DELETE /attendance/delete hit with query:', req.query);
            const { studentid, date, program_name } = req.query;
            const yurtid = req.selectedYurtId!;

            if (!studentid || !date || !program_name) {
                console.log('❌ Missing required fields');
                return res.status(400).json({ message: 'Missing required fields: studentid, date, program_name' });
            }

            console.log(`🔍 Attempting to delete: studentid=${studentid}, date=${date}, program=${program_name}, yurtid=${yurtid}`);

            // First, check if the record exists
            const attendanceData = new Attendance(
                Number(studentid),
                new Date(date as string),
                undefined,
                program_name as string,
                yurtid
            );
            const existing = await this.attendanceService.getAttendance(attendanceData, yurtid);
            console.log(`📋 Existing record:`, existing ? JSON.stringify(existing) : 'NOT FOUND');

            const deleted = await this.attendanceService.deleteAttendance(
                Number(studentid),
                date as string,
                program_name as string,
                yurtid
            );

            console.log(`✅ Delete result: ${deleted ? 'SUCCESS' : 'NOT FOUND'}`);

            if (deleted) {
                res.status(200).json({ message: 'Attendance successfully deleted' });
            } else {
                res.status(404).json({ message: 'Attendance record not found' });
            }
        } catch (error) {
            console.log('❌ Delete Attendance error:', error);
            res.status(500).json({ message: 'Failed to delete attendance' });
        }
    }

    public async deleteAllAttendanceByProgram(req: Request, res: Response) {
        try {
            console.log('🗑️ DELETE ALL /attendance/delete-program hit with query:', req.query);
            const { date, program_name } = req.query;
            const yurtid = req.selectedYurtId!;

            if (!date || !program_name) {
                console.log('❌ Missing required fields');
                return res.status(400).json({ message: 'Missing required fields: date, program_name' });
            }

            console.log(`🔍 Attempting to delete all records: date=${date}, program=${program_name}, yurtid=${yurtid}`);

            const deletedCount = await this.attendanceService.deleteAllAttendanceByProgram(
                date as string,
                program_name as string,
                yurtid
            );

            console.log(`✅ Deleted ${deletedCount} records`);

            res.status(200).json({
                message: `${deletedCount} yoklama kaydı silindi`,
                deletedCount
            });
        } catch (error) {
            console.log('❌ Delete All Attendance error:', error);
            res.status(500).json({ message: 'Failed to delete attendance records' });
        }
    }

}
