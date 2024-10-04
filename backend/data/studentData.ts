// test
import StudentSequelize from "./models/Student";
import {Request, Response} from 'express';

export class StudentData {
    public async getAllStudent(){
        const result = await StudentSequelize.findAll();
        return result;
    }

    public async getAllStudentBySeason(seasonYear: string){
        const result = await StudentSequelize.findAll({ where: {
            season_year: seasonYear
        }});
        return result;
    }

    public async getAllStudentBySeasonAndClass(season: string, className: string){
        const result = await StudentSequelize.findAll({ where: {
            season_year: season,
            class_name: className
        }});
        return result;
    }
}