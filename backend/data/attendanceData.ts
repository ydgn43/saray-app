import AttendanceSequelize from './models/Attendance';
import { Attendance } from '../business/models/Attendance';
import {Request, Response} from 'express';

export class AttendanceData {
    public async getAllAttendance(){
        const attendance = await AttendanceSequelize.findAll();
        return attendance;
    }

    public async getAttendance(attendanceData: Attendance){
        try {
            const attendance = await AttendanceSequelize.findOne({ where: {
                studentid: attendanceData.studentId,
                date: attendanceData.date,
                program_name: attendanceData.programName
            }})
            return attendance;
        } catch (error) {
            throw new Error("Could not create new attendance")
        }  
    }

    public async createAttendance(attendance: Attendance){
        try {
            const newAttendance: AttendanceSequelize = await AttendanceSequelize.create({ 
                studentid: attendance.studentId, 
                date: attendance.date,
                attendance_type_name: attendance.attendanceTypeName,
                program_name: attendance.programName
            });
        } catch {
            throw new Error("Could not create new attendance")
        }
    }

    public async updateAttendance(attendance: Attendance){

    }
}