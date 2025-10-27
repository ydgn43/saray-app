import AttendanceData from "../../data/attendanceData";
import AttendanceSequelize from "../../data/models/Attendance";
import { Attendance } from "../models/Attendance";

export class AttendanceService {
    private attendanceData: AttendanceData;

    constructor(attendanceData: AttendanceData) {
        this.attendanceData = attendanceData;
    }

    public async getAllAttendance(yurtid: number): Promise<AttendanceSequelize[]> {
        return this.attendanceData.getAllAttendance(yurtid);
    }

    public async getAttendance(attendance: Attendance, yurtid: number): Promise<AttendanceSequelize | null> {
        return this.attendanceData.getAttendance(attendance, yurtid);
    }

    public async getAttendanceStatisticsByDateRange(start: string, end: string, yurtid: number) {
        return this.attendanceData.getAttendanceStatisticsByDateRange(start, end, yurtid);
    }

    public async getAttendanceByDateAndProgram(date: string, programName: string, yurtid: number): Promise<AttendanceSequelize[]> {
        return this.attendanceData.getAttendanceByDateAndProgram(date, programName, yurtid);
    }

    public async createOrUpdateAttendance(attendance: Attendance): Promise<void> {
        return this.attendanceData.createOrUpdateAttendance(attendance);
    }

    public async updateAttendance(attendance: Attendance, yurtid: number): Promise<void> {
        return this.attendanceData.updateAttendance(attendance, yurtid);
    }

    public async deleteAttendance(studentId: number, date: string, programName: string, yurtid: number): Promise<boolean> {
        return this.attendanceData.deleteAttendance(studentId, date, programName, yurtid);
    }

    public async deleteAllAttendanceByProgram(date: string, programName: string, yurtid: number): Promise<number> {
        return this.attendanceData.deleteAllAttendanceByProgram(date, programName, yurtid);
    }
}