import { StudentData } from "../../data/studentData";
import { Student } from "../models/Student";
import StudentSequelize from "../../data/models/Student";

export class StudentService {

    public constructor(private studentData: StudentData) {

    }

    public async getAllStudents(yurtid: number): Promise<StudentSequelize[]> {
        return await this.studentData.getAllStudents(yurtid);
    }

    public async getAllStudentsBySeason(season: string, yurtid: number): Promise<StudentSequelize[]> {
        return await this.studentData.getAllStudentsBySeason(season, yurtid);
    }

    public async getAllStudentsBySeasonAndClass(season: string, className: string, yurtid: number): Promise<StudentSequelize[]> {
        return await this.studentData.getAllStudentsBySeasonAndClass(season, className, yurtid);
    }

    public async createStudent(student: Student): Promise<string> {
        return await this.studentData.createStudent(student);
    }

    public async deleteStudent(studentId: number, yurtid: number): Promise<void> {
        await this.studentData.deleteAttendanceByStudentId(studentId, yurtid);
        return await this.studentData.deleteStudent(studentId, yurtid);
    }

    public async getStudentById(id: number, yurtid: number) {
        return this.studentData.getStudentById(id, yurtid);
    }

    public async updateStudent(student: Student, yurtid: number): Promise<boolean> {
        return await this.studentData.updateStudent(student, yurtid);
    }
}