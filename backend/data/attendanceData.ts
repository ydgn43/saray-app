import { Request, Response } from 'express';
import AttendanceSequelize from '../data/models/Attendance';
import StudentSequelize from '../data/models/Student';
import { Attendance } from '../business/models/Attendance';
import { AttendanceService } from '../business/services/attendanceService';
import { Op } from 'sequelize';

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
        const records = await AttendanceSequelize.findAll({
            where: {
                date: {
                    [Op.between]: [start, end],
                },
            },
        });

        const grouped: Record<number, Record<string, number>> = {};
        const totalCounts: Record<number, number> = {};

        for (const record of records) {
            const id = record.studentid;
            const type = record.attendance_type_name;

            if (!grouped[id]) grouped[id] = {};
            if (!totalCounts[id]) totalCounts[id] = 0;

            grouped[id][type] = (grouped[id][type] || 0) + 1;
            totalCounts[id]++;
        }

        const result = await Promise.all(
            Object.entries(grouped).map(async ([studentId, types]) => {
                const total = totalCounts[+studentId];
                const percentages = Object.entries(types).reduce((acc, [type, count]) => {
                    acc[type] = Number(((count / total) * 100).toFixed(2));
                    return acc;
                }, {} as Record<string, number>);

                const student = await StudentSequelize.findByPk(+studentId);

                return {
                    studentid: +studentId,
                    name: student ? `${student.first_name} ${student.last_name}` : 'Bilinmeyen',
                    class_name: student?.class_name || '',
                    total,
                    percentages,
                };
            })
        );

        return result;
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
