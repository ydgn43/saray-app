import { StudentData } from "../../data/studentData";
import { Student } from "../models/Student";
import StudentSequelize from "../../data/models/Student";

export class StudentService {

    public constructor(private studentData: StudentData) {

    }

    public async getAllStudents(): Promise<StudentSequelize[]> {
        return await this.studentData.getAllStudents();
    }

    public async getAllStudentsBySeason(season: string): Promise<StudentSequelize[]> {
        return await this.studentData.getAllStudentsBySeason(season);
    }

    public async getAllStudentsBySeasonAndClass(season: string, className: string): Promise<StudentSequelize[]> {
        return await this.studentData.getAllStudentsBySeasonAndClass(season, className);
    }
    
}