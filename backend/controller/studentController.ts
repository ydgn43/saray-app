import { Request, Response } from 'express';
import { StudentService } from '../business/services/studentService';
import { Student } from '../business/models/Student';
import StudentSequelize from '../data/models/Student';

export class StudentController {

    public constructor(private studentService: StudentService) {
    }

    public async getAllStudents(req: Request, res: Response) {
        try {
            const students: StudentSequelize[] = await this.studentService.getAllStudents();
            res.status(202).json(students);
        } catch (error) {
            res.status(404).end();
        }
    }

    public async getAllStudentsBySeason(req: Request, res: Response) {
        try {
            const season: string = req.query.season as string;

            const students: StudentSequelize[] = await this.studentService.getAllStudentsBySeason(season);
            res.status(202).json(students);
        } catch (error) {
            res.status(404).end();
        }
    }

    public async getAllStudentsBySeasonAndClass(req: Request, res: Response) {
        try {
            const season: string = req.query.season as string;
            const className: string = req.query.className as string;

            const students: StudentSequelize[] = await this.studentService.getAllStudentsBySeasonAndClass(season, className);
            res.status(202).json(students);
        } catch (error) {
            res.status(404).end();
        }
    }

    public async createStudent(req: Request, res: Response) {
        try {
            const student: Student = new Student(undefined, req.body.first_name, req.body.last_name, req.body.birth_date, req.body.season_year, req.body.class_name)

            const createdResponse: string = await this.studentService.createStudent(student);

            res.status(202).json({ message: createdResponse });
        } catch (error) {
            console.error('Error creating student:', error);
            res.status(404).end();
        }
    }

    public async updateStudent(req: Request, res: Response) {
        try {
            const student: Student = new Student(
                req.body.studentid,
                req.body.first_name,
                req.body.last_name,
                req.body.birth_date,
                req.body.season_year,
                req.body.class_name
            );

            const result = await this.studentService.updateStudent(student);

            if (result) {
                res.status(200).json({ message: "Student updated successfully" });
            } else {
                res.status(404).json({ message: "Student not found" });
            }
        } catch (error) {
            console.error('Error updating student:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }


    public async deleteStudent(req: Request, res: Response) {
        try {
            await this.studentService.deleteStudent(+(req.query.studentid as string))
            res.status(202).json({ message: "Student succesfully deleted" });
        } catch (error) {
            console.error('Error deleting student:', error);
            res.status(404).end();
        }

    }

    public async getStudentById(req: Request, res: Response) {
        try {
            const id = +req.params.id;
            const student = await this.studentService.getStudentById(id);

            if (!student) {
                return res.status(404).json({ message: 'Student not found' });
            }

            res.status(200).json(student);
        } catch (error) {
            console.error('Error fetching student by ID:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

}