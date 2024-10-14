// test
import StudentSequelize from "./models/Student";
import {Request, Response} from 'express';

export class StudentData {
    public async getAllStudents(){
        const allStudents = await StudentSequelize.findAll();
        return allStudents;
    }

    public async getAllStudentsBySeason(seasonYear: string){
        const allStudentsBySeason = await StudentSequelize.findAll({ where: {
            season_year: seasonYear
        }});
        return allStudentsBySeason;
    }

    public async getAllStudentsBySeasonAndClass(season: string, className: string){
        const allStudentsBySeasonAndClass = await StudentSequelize.findAll({ where: {
            season_year: season,
            class_name: className
        }});
        return allStudentsBySeasonAndClass;
    }
}