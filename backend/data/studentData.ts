// test
import StudentSequelize from "./models/Student";
import {Request, Response} from 'express';

export class StudentData {
    public async getAllStudent(req: Request, res: Response){
        const result = await StudentSequelize.findAll();
        res.status(202).json(result);
        console.log(result);
    }
}