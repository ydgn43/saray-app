import { StudentData } from "../../data/studentData";
import { Student } from "../models/Student";
import StudentSequelize from "../../data/models/Student";

export class StudentService {

    public constructor(private studentData: StudentData) {

    }

    public async getAllStudents(): Promise<StudentSequelize[]> {
        return await this.studentData.getAllStudent();
    }
}