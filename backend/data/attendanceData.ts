import AttendanceSequelize from './models/Attendance';
import { Attendance } from '../business/models/Attendance';
import StudentSequelize from './models/Student';
import { Request, Response } from 'express';
import { Op } from 'sequelize';

export class AttendanceData {
    public async getAllAttendance() {
        const attendance = await AttendanceSequelize.findAll();
        return attendance;
    }

    public async getAttendance(attendanceData: Attendance) {
        try {
            const attendance = await AttendanceSequelize.findOne({
                where: {
                    studentid: attendanceData.studentId,
                    date: attendanceData.date,
                    program_name: attendanceData.programName
                }
            })
            return attendance;
        } catch (error) {
            throw new Error("Could not find attendance")
        }
    }

    public async getAttendanceStatisticsByDateRange(start: string, end: string) {
        const records = await AttendanceSequelize.findAll({
            where: {
                date: {
                    [Op.between]: [start, end]
                }
            },
            include: [
                {
                    model: StudentSequelize,
                    attributes: ['first_name', 'last_name']
                }
            ]
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
            const attendance = await AttendanceSequelize.findAll({
                where: {
                    date: date,
                    program_name: programName
                }
            })
            return attendance;
        } catch (error) {
            throw new Error("Could not find attendance")
        }
    }

    public async createAttendance(attendance: Attendance) {
        try {
            console.log("Trying to create attendance with:", attendance);

            await AttendanceSequelize.create({
                studentid: attendance.studentId,
                date: attendance.date,
                attendance_type_name: attendance.attendanceTypeName,
                program_name: attendance.programName
            });
        } catch (error) {
            console.error("Insert failed:", error); // 🔍 log the real cause
            throw new Error("Could not create new attendance");
        }
    }

    public async updateAttendance(attendance: Attendance) {
        try {
            await AttendanceSequelize.update({
                attendance_type_name: attendance.attendanceTypeName,
            },
                {
                    where: {
                        studentid: attendance.studentId,
                        date: attendance.date,
                        program_name: attendance.programName
                    }
                });
        } catch {
            throw new Error("Could not update attendance")
        }
    }
}