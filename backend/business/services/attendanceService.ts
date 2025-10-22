import AttendanceData from "../../data/attendanceData";
import AttendanceSequelize from "../../data/models/Attendance";
import { Attendance } from "../models/Attendance";

export class AttendanceService {
    private attendanceData: AttendanceData;

    constructor(attendanceData: AttendanceData) {
        this.attendanceData = attendanceData;
    }

    public async getAllAttendance(): Promise<AttendanceSequelize[]> {
        return this.attendanceData.getAllAttendance();
    }

    public async getAttendance(attendance: Attendance): Promise<AttendanceSequelize | null> {
        return this.attendanceData.getAttendance(attendance);
    }

    public async getAttendanceStatisticsByDateRange(start: string, end: string) {
        return this.attendanceData.getAttendanceStatisticsByDateRange(start, end);
    }

    public async getAttendanceByDateAndProgram(date: string, programName: string): Promise<AttendanceSequelize[]> {
        return this.attendanceData.getAttendanceByDateAndProgram(date, programName);
    }

    public async createOrUpdateAttendance(attendance: Attendance): Promise<void> {
        return this.attendanceData.createOrUpdateAttendance(attendance);
    }

    public async updateAttendance(attendance: Attendance): Promise<void> {
        return this.attendanceData.updateAttendance(attendance);
    }

    public async deleteAttendance(studentId: number, date: string, programName: string): Promise<boolean> {
        return this.attendanceData.deleteAttendance(studentId, date, programName);
    }
}