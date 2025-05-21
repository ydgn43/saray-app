import express, { Request, Response } from 'express';
import { StudentController } from '../controller/studentController';
import { StudentService } from '../business/services/studentService';
import { StudentData } from '../data/studentData';
import { authenticateJWT, requireRoles } from '../middleware/authMiddleware';

export const studentRouter = express.Router();

const studentData = new StudentData()
const studentService = new StudentService(studentData);
const studentController = new StudentController(studentService);

studentRouter.get('/', authenticateJWT, (req: Request, res: Response) => {
    studentController.getAllStudents(req, res);
})

studentRouter.get('/season/', authenticateJWT, (req: Request, res: Response) => {
    studentController.getAllStudentsBySeason(req, res);
})

studentRouter.get('/season/class', authenticateJWT, (req: Request, res: Response) => {
    studentController.getAllStudentsBySeasonAndClass(req, res);
})

studentRouter.get('/:id', authenticateJWT, (req: Request, res: Response) => {
    studentController.getStudentById(req, res);
});

studentRouter.post('/create', authenticateJWT, requireRoles(['admin', 'hoca']), (req: Request, res: Response) => {
    studentController.createStudent(req, res);
})

studentRouter.put('/', authenticateJWT, requireRoles(['admin', 'hoca']), (req: Request, res: Response) => {
    studentController.updateStudent(req, res);
});

studentRouter.delete('/delete', authenticateJWT, requireRoles(['admin', 'hoca']), (req: Request, res: Response) => {
    studentController.deleteStudent(req, res);
})