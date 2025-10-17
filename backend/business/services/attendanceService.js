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
    getAllAttendance() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.attendanceData.getAllAttendance();
        });
    }
    getAttendance(attendance) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.attendanceData.getAttendance(attendance);
        });
    }
    getAttendanceStatisticsByDateRange(start, end) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.attendanceData.getAttendanceStatisticsByDateRange(start, end);
        });
    }
    getAttendanceByDateAndProgram(date, programName) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.attendanceData.getAttendanceByDateAndProgram(date, programName);
        });
    }
    createOrUpdateAttendance(attendance) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.attendanceData.createOrUpdateAttendance(attendance);
        });
    }
    updateAttendance(attendance) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.attendanceData.updateAttendance(attendance);
        });
    }
}
exports.AttendanceService = AttendanceService;
