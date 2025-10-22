"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceService = void 0;
class AttendanceService {
    constructor(attendanceData) {
        this.attendanceData = attendanceData;
    }
    getAllAttendance(yurtid) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.attendanceData.getAllAttendance(yurtid);
        });
    }
    getAttendance(attendance, yurtid) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.attendanceData.getAttendance(attendance, yurtid);
        });
    }
    getAttendanceStatisticsByDateRange(start, end, yurtid) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.attendanceData.getAttendanceStatisticsByDateRange(start, end, yurtid);
        });
    }
    getAttendanceByDateAndProgram(date, programName, yurtid) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.attendanceData.getAttendanceByDateAndProgram(date, programName, yurtid);
        });
    }
    createOrUpdateAttendance(attendance) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.attendanceData.createOrUpdateAttendance(attendance);
        });
    }
    updateAttendance(attendance, yurtid) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.attendanceData.updateAttendance(attendance, yurtid);
        });
    }
    deleteAttendance(studentId, date, programName, yurtid) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.attendanceData.deleteAttendance(studentId, date, programName, yurtid);
        });
    }
}
exports.AttendanceService = AttendanceService;
