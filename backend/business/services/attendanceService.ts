import { AttendanceData } from "../../data/attendanceData";
import AttendanceSequelize from "../../data/models/Attendance";
import { Attendance } from "../models/Attendance";

export class AttendanceService {
    public constructor(private attendaceData: AttendanceData) {
    }

    public async getAllAttendance(): Promise<AttendanceSequelize[]> {
        return await this.attendaceData.getAllAttendance();
    }

    public async getAttendance(attendance: Attendance): Promise<AttendanceSequelize | null> {
        return await this.attendaceData.getAttendance(attendance);
    }

    public async getAttendanceStatisticsByDateRange(start: string, end: string) {
        return this.attendaceData.getAttendanceStatisticsByDateRange(start, end);
    }


    public async getAttendanceByDateAndProgram(date: string, programName: string): Promise<AttendanceSequelize[]> {
        return await this.attendaceData.getAttendanceByDateAndProgram(date, programName);
    }

    public async createAttendance(attendance: Attendance): Promise<void> {
        await this.attendaceData.createAttendance(attendance);
    }

    public async updateAttendance(attendance: Attendance): Promise<void> {
        await this.attendaceData.updateAttendance(attendance);
    }
}