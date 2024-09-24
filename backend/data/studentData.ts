// test
import StudentSequelize from "./models/Student";
import {Request, Response} from 'express';

export class StudentData {
    public async getAllStudent(){
        const result = await StudentSequelize.findAll();
        return result;
    }
}