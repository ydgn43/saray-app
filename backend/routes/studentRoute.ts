import express, { Request, Response } from 'express';
import { StudentController } from '../controller/studentController';
import { StudentService } from '../business/services/studentService';
import { StudentData } from '../data/studentData';
import { authenticateJWT, requireRoles } from '../middleware/authMiddleware';
import { validateYurtAccess } from '../middleware/validateYurtAccess';

export const studentRouter = express.Router();

const studentData = new StudentData()
const studentService = new StudentService(studentData);
const studentController = new StudentController(studentService);

studentRouter.use(authenticateJWT);
studentRouter.use(validateYurtAccess); // Add yurt access validation

studentRouter.get('/', (req: Request, res: Response) => {
    studentController.getAllStudents(req, res);
})

studentRouter.get('/season/', (req: Request, res: Response) => {
    studentController.getAllStudentsBySeason(req, res);
})

studentRouter.get('/season/class', (req: Request, res: Response) => {
    studentController.getAllStudentsBySeasonAndClass(req, res);
})

studentRouter.get('/:id', (req: Request, res: Response) => {
    studentController.getStudentById(req, res);
});

studentRouter.post('/create', requireRoles(['admin', 'hoca']), (req: Request, res: Response) => {
    studentController.createStudent(req, res);
})

studentRouter.put('/', requireRoles(['admin', 'hoca']), (req: Request, res: Response) => {
    studentController.updateStudent(req, res);
});

studentRouter.delete('/delete', requireRoles(['admin', 'hoca']), (req: Request, res: Response) => {
    studentController.deleteStudent(req, res);
})