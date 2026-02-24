import AttendanceSequelize from '../data/models/Attendance';
import StudentSequelize from '../data/models/Student';
import { Attendance } from '../business/models/Attendance';
import { Op } from 'sequelize';

export default class AttendanceData {
    public async getAllAttendance(yurtid: number, startDate?: string, endDate?: string): Promise<AttendanceSequelize[]> {
        const whereClause: any = { yurtid: yurtid };

        if (startDate && endDate) {
            whereClause.date = {
                [Op.between]: [startDate, endDate]
            };
        }

        return AttendanceSequelize.findAll({
            where: whereClause
        });
    }

    public async getAttendance(attendanceData: Attendance, yurtid: number): Promise<AttendanceSequelize | null> {
        try {
            return await AttendanceSequelize.findOne({
                where: {
                    studentid: attendanceData.studentId,
                    date: attendanceData.date,
                    program_name: attendanceData.programName,
                    yurtid: yurtid
                },
            });
        } catch {
            throw new Error('Could not find attendance');
        }
    }

    public async getAttendanceStatisticsByDateRange(start: string, end: string, yurtid: number) {
        const records = await AttendanceSequelize.findAll({
            where: {
                date: {
                    [Op.between]: [start, end],
                },
                yurtid: yurtid
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

    public async getAttendanceByDateAndProgram(date: string, programName: string, yurtid: number) {
        try {
            return await AttendanceSequelize.findAll({
                where: {
                    date,
                    program_name: programName,
                    yurtid: yurtid
                },
            });
        } catch (error) {
            console.error("Database error while fetching attendance:", error);
            throw new Error("Database error");
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
                yurtid: attendance.yurtId
            });
        } catch (error) {
            // Add more specific error handling for foreign key constraint
            if (
                error &&
                typeof error === 'object' &&
                'name' in error &&
                error.name === 'SequelizeForeignKeyConstraintError'
            ) {
                console.error('Foreign key constraint failed:', error);
                throw new Error('Program adı veritabanında bulunamadı. Lütfen program adını kontrol edin.');
            }
            console.error('Insert failed:', error);
            throw new Error('Could not create new attendance');
        }
    }

    public async updateAttendance(attendance: Attendance, yurtid: number): Promise<void> {
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
                        yurtid: yurtid
                    },
                }
            );
        } catch (error) {
            console.error('Update failed:', error);
            throw new Error('Could not update attendance');
        }
    }

    public async createOrUpdateAttendance(attendance: Attendance): Promise<void> {
        const [record, created] = await AttendanceSequelize.findOrCreate({
            where: {
                studentid: attendance.studentId,
                date: attendance.date,
                program_name: attendance.programName,
                yurtid: attendance.yurtId
            },
            defaults: {
                attendance_type_name: attendance.attendanceTypeName,
                sebep: attendance.sebep || null,
                yurtid: attendance.yurtId
            }
        });
        if (!created) {
            await record.update({
                attendance_type_name: attendance.attendanceTypeName,
                sebep: attendance.sebep || null,
            });
        }
    }

    public async deleteAttendance(studentId: number, date: string, programName: string, yurtid: number): Promise<boolean> {
        try {
            console.log(`📊 Data layer DELETE: studentid=${studentId}, date=${date}, program_name=${programName}, yurtid=${yurtid}`);

            // First, let's check what records exist for this student and date
            const existing = await AttendanceSequelize.findAll({
                where: {
                    studentid: studentId,
                    date: date,
                    yurtid: yurtid
                }
            });
            console.log(`📊 Found ${existing.length} records for student ${studentId} on ${date}:`,
                existing.map(r => ({ program: r.program_name, type: r.attendance_type_name })));

            const deleted = await AttendanceSequelize.destroy({
                where: {
                    studentid: studentId,
                    date: date,
                    program_name: programName,
                    yurtid: yurtid
                },
            });
            console.log(`📊 Rows deleted: ${deleted}`);
            return deleted > 0;
        } catch (error) {
            console.error('❌ Delete failed:', error);
            throw new Error('Could not delete attendance');
        }
    }

    public async deleteAllAttendanceByProgram(date: string, programName: string, yurtid: number): Promise<number> {
        try {
            console.log(`🗑️ Data layer DELETE ALL: date=${date}, program_name=${programName}, yurtid=${yurtid}`);

            const deleted = await AttendanceSequelize.destroy({
                where: {
                    date: date,
                    program_name: programName,
                    yurtid: yurtid
                },
            });
            console.log(`🗑️ Total rows deleted: ${deleted}`);
            return deleted;
        } catch (error) {
            console.error('❌ Delete all failed:', error);
            throw new Error('Could not delete attendance records for program');
        }
    }
}
