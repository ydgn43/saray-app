import express, { Request, Response } from 'express';
import { StudentController } from '../controller/studentController';
import { StudentService } from '../business/services/studentService';
import { StudentData } from '../data/studentData';

export const studentRouter = express.Router();

const studentData = new StudentData()
const studentService = new StudentService(studentData);
const studentController = new StudentController(studentService);

studentRouter.get('/', (req: Request, res: Response) => {
    studentController.getAllStudents(req, res);
})

studentRouter.get('/season/', (req: Request, res: Response) => {
    studentController.getAllStudentsBySeason(req, res);
})

studentRouter.get('/season/class', (req: Request, res: Response) => {
    studentController.getAllStudentsBySeasonAndClass(req, res);
})

studentRouter.post('/', (req: Request, res: Response) => {
    res.send('student POST not yet implemented')
})

studentRouter.put('/', (req: Request, res: Response) => {
    res.send('student PUT not yet implemented')
})

studentRouter.delete('/', (req: Request, res: Response) => {
    res.send('student DELETE not yet implemented')
})