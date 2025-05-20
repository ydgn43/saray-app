// test
import { Student } from "../business/models/Student";
import StudentSequelize from "./models/Student";
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
                    class_name: student.className
                }
            });

            if (created) {
                return "Student succesfully created";
            } else {
                return "Student already exists";
            }
        } catch (error) {
            console.error('StudentSequelize findOrCreate failed:', error);
            throw new Error("Could not create new student");
        }
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

    public async getStudentById(id: number) {
        return await StudentSequelize.findByPk(id);
    }


}