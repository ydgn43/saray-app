import {Request, Response} from 'express';
import { StudentService } from '../business/services/studentService';
import { Student } from '../business/models/Student';
import StudentSequelize from '../data/models/Student';

export class StudentController {

    public constructor(private studentService: StudentService){
    }

    public async getAllStudents(req: Request, res: Response){
        try {
            const students: StudentSequelize[] = await this.studentService.getAllStudents();
            res.status(202).json(students);
        } catch (error) {
            res.status(404).end();
        }
    }

    public async getAllStudentsBySeason(req: Request, res: Response){
        try {
            const season: string = req.query.season as string;

            const students: StudentSequelize[] = await this.studentService.getAllStudentsBySeason(season);
            res.status(202).json(students);
        } catch (error) {
            res.status(404).end();
        }
    }

    public async getAllStudentsBySeasonAndClass(req: Request, res: Response){
        try {
            const season: string = req.query.season as string;
            const className: string = req.query.className as string;
            
            const students: StudentSequelize[] = await this.studentService.getAllStudentsBySeasonAndClass(season, className);
            res.status(202).json(students);
        } catch (error) {
            res.status(404).end();
        }
    }

    public async createStudent(req: Request, res: Response){
        try {
            const student: Student = new Student(undefined, req.body.first_name, req.body.last_name, req.body.birth_date, req.body.season_year, req.body.class_name)

            const createdResponse: string = await this.studentService.createStudent(student);

            res.status(202).json(createdResponse);
        } catch (error) {
            console.error('Error creating student:', error);
            res.status(404).end();
        }
    }
}