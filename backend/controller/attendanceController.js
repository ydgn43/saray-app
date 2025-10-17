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
exports.AttendanceController = void 0;
const Attendance_1 = require("../business/models/Attendance");
class AttendanceController {
    constructor(attendanceService) {
        this.attendanceService = attendanceService;
    }
    getAllAttendance(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const attendance = yield this.attendanceService.getAllAttendance();
                res.status(202).json(attendance);
            }
            catch (_a) {
                res.status(404).end();
            }
        });
    }
    getAttendance(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const attendanceData = new Attendance_1.Attendance(+req.query.studentid, new Date(req.query.date), undefined, req.query.program_name);
                const attendance = yield this.attendanceService.getAttendance(attendanceData);
                res.status(202).json(attendance);
            }
            catch (error) {
                console.log(error);
                res.status(404).json({ message: 'Attendance not found or bad request' });
            }
        });
    }
    getAttendanceStatistics(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const start = req.query.startDate;
                const end = req.query.endDate;
                if (!start || !end) {
                    return res.status(400).json({ message: 'start and end date required' });
                }
                const stats = yield this.attendanceService.getAttendanceStatisticsByDateRange(start, end);
                res.status(200).json(stats);
            }
            catch (err) {
                console.error('Error generating stats:', err);
                res.status(500).json({ message: 'Could not generate statistics' });
            }
        });
    }
    getAttendanceByDateAndProgram(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const date = req.query.date;
                const programName = req.query.program_name;
                const attendance = yield this.attendanceService.getAttendanceByDateAndProgram(date, programName);
                res.status(202).json(attendance);
            }
            catch (error) {
                console.log(error);
                res.status(404).json({ message: 'Attendance not found or bad request' });
            }
        });
    }
    createAttendance(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Accept single record or array of records
                const payloads = Array.isArray(req.body) ? req.body : [req.body];
                for (const entry of payloads) {
                    const { studentid, date, attendance_type_name, program_name, sebep } = entry;
                    if (!studentid || !date || !program_name) {
                        return res.status(400).json({ message: 'Missing required fields' });
                    }
                    const attendanceData = new Attendance_1.Attendance(studentid, new Date(date), attendance_type_name, program_name);
                    attendanceData.sebep = sebep || null;
                    // Use upsert logic
                    yield this.attendanceService.createOrUpdateAttendance(attendanceData);
                }
                res.status(202).json({ message: 'Attendance records created/updated successfully' });
            }
            catch (error) {
                console.log('Create Attendance error:', error);
                res.status(500).json({ message: 'Failed to create/update attendance' });
            }
        });
    }
    updateAttendance(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { studentid, date, attendance_type_name, program_name, sebep } = req.body;
                if (!studentid || !date || !program_name) {
                    return res.status(400).json({ message: 'Missing required fields' });
                }
                const attendanceData = new Attendance_1.Attendance(studentid, new Date(date), attendance_type_name, program_name);
                attendanceData.sebep = sebep || null;
                yield this.attendanceService.updateAttendance(attendanceData);
                res.status(202).json({ message: 'Attendance successfully updated' });
            }
            catch (error) {
                console.log('Update Attendance error:', error);
                res.status(500).json({ message: 'Failed to update attendance' });
            }
        });
    }
}
exports.AttendanceController = AttendanceController;
