// test
import { Student } from "../business/models/Student";
import StudentSequelize from "./models/Student";
import AttendanceSequelize from "./models/Attendance";
import { Request, Response } from 'express';

export class StudentData {
    public async getAllStudents() {
        const allStudents = await StudentSequelize.findAll();
        return allStudents;
    }

    public async getAllStudentsBySeason(seasonYear: string) {
        const allStudentsBySeason = await StudentSequelize.findAll({
            where: {
                season_year: seasonYear
            }
        });
        return allStudentsBySeason;
    }

    public async getAllStudentsBySeasonAndClass(season: string, className: string) {
        const allStudentsBySeasonAndClass = await StudentSequelize.findAll({
            where: {
                season_year: season,
                class_name: className
            }
        });
        return allStudentsBySeasonAndClass;
    }

    public async createStudent(student: Student): Promise<string> {
        try {
            // Generate unique reference code for the student
            const referenceCode = this.generateStudentReferenceCode();

            console.log(`🔵 Creating student with reference code: ${referenceCode}`);

            const [newStudent, created] = await StudentSequelize.findOrCreate({
                where: {
                    first_name: student.firstName,
                    last_name: student.lastName,
                    birth_date: student.birthDate,
                    season_year: student.seasonYear,
                    class_name: student.className
                }, defaults: {
                    first_name: student.firstName,
                    last_name: student.lastName,
                    birth_date: student.birthDate,
                    season_year: student.seasonYear,
                    class_name: student.className,
                    reference_code: referenceCode
                }
            });

            if (created) {
                console.log(`✅ Student created with reference code: ${referenceCode}`);
                console.log(`Student ID: ${(newStudent as any).studentid}`);
                console.log(`Reference code in DB: ${(newStudent as any).reference_code}`);
                return `Student successfully created with reference code: ${referenceCode}`;
            } else {
                console.log('⚠️ Student already exists');
                return "Student already exists";
            }
        } catch (error: any) {
            console.error('❌ Error creating student:', error);
            if (
                error.name === 'SequelizeForeignKeyConstraintError' &&
                error.parent?.sqlMessage?.includes('season')
            ) {
                throw new Error("Seçilen sezon mevcut değil. Lütfen önce sezonu ekleyin.");
            }
            throw new Error("Could not create new student");
        }
    }

    private generateStudentReferenceCode(): string {
        // Generate a unique code: STU-XXXXXX (STU + 6 random alphanumeric)
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluded similar chars: I,O,0,1
        let code = 'STU-';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    public async updateStudent(student: Student): Promise<boolean> {
        const existing = await StudentSequelize.findByPk(student.studentId);
        if (!existing) return false;

        existing.first_name = student.firstName;
        existing.last_name = student.lastName;
        existing.birth_date = student.birthDate;
        existing.season_year = student.seasonYear;
        existing.class_name = student.className;

        await existing.save();
        return true;
    }


    public async deleteStudent(studentId: number): Promise<void> {
        const test = await StudentSequelize.destroy({
            where: {
                studentid: studentId
            }
        });
        console.log(test);
    }

    public async deleteAttendanceByStudentId(studentId: number): Promise<void> {
        const deleted = await AttendanceSequelize.destroy({
            where: {
                studentid: studentId
            }
        });
        console.log(`Deleted ${deleted} attendance records for studentid=${studentId}`);
    }

    public async getStudentById(id: number) {
        return await StudentSequelize.findByPk(id);
    }


}