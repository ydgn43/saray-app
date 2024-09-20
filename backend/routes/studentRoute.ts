import express, { Request, Response } from 'express';
import { StudentData } from '../data/studentData';

export const studentRouter = express.Router();

const studentData = new StudentData();

studentRouter.get('/', (req: Request, res: Response) => {
    studentData.getAllStudent(req, res);
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