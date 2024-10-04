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
}