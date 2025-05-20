import { Request, Response } from 'express';
import AttendanceSequelize from '../data/models/Attendance';
import { Attendance } from '../business/models/Attendance';
import { AttendanceService } from '../business/services/attendanceService';

export default class AttendanceData {
    public async getAllAttendance(): Promise<AttendanceSequelize[]> {
        return AttendanceSequelize.findAll();
    }

    public async getAttendance(attendanceData: Attendance): Promise<AttendanceSequelize | null> {
        try {
            return await AttendanceSequelize.findOne({
                where: {
                    studentid: attendanceData.studentId,
                    date: attendanceData.date,
                    program_name: attendanceData.programName,
                },
            });
        } catch {
            throw new Error('Could not find attendance');
        }
    }

    public async getAttendanceStatisticsByDateRange(start: string, end: string) {
        // (same body you have — not changing here)
    }

    public async getAttendanceByDateAndProgram(date: string, programName: string) {
        try {
            return await AttendanceSequelize.findAll({
                where: { date, program_name: programName },
            });
        } catch (error) {
            console.error("Database error while fetching attendance:", error);
            throw new Error("Database error"); // more accurate message
        }
    }


    public async createAttendance(attendance: Attendance): Promise<void> {
        try {
            await AttendanceSequelize.create({
                studentid: attendance.studentId,
                date: attendance.date,
                attendance_type_name: attendance.attendanceTypeName,
                program_name: attendance.programName,
                sebep: attendance.sebep || null,
            });
        } catch (error) {
            console.error('Insert failed:', error);
            throw new Error('Could not create new attendance');
        }
    }

    public async updateAttendance(attendance: Attendance): Promise<void> {
        try {
            await AttendanceSequelize.update(
                {
                    attendance_type_name: attendance.attendanceTypeName,
                    sebep: attendance.sebep || null,
                },
                {
                    where: {
                        studentid: attendance.studentId,
                        date: attendance.date,
                        program_name: attendance.programName,
                    },
                }
            );

        } catch {
            throw new Error('Could not update attendance');
        }
    }
}
