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
                const yurtid = req.selectedYurtId;
                const attendance = yield this.attendanceService.getAllAttendance(yurtid);
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
                const yurtid = req.selectedYurtId;
                const attendanceData = new Attendance_1.Attendance(+req.query.studentid, new Date(req.query.date), undefined, req.query.program_name, yurtid);
                const attendance = yield this.attendanceService.getAttendance(attendanceData, yurtid);
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
                const yurtid = req.selectedYurtId;
                if (!start || !end) {
                    return res.status(400).json({ message: 'start and end date required' });
                }
                const stats = yield this.attendanceService.getAttendanceStatisticsByDateRange(start, end, yurtid);
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
                const yurtid = req.selectedYurtId;
                const attendance = yield this.attendanceService.getAttendanceByDateAndProgram(date, programName, yurtid);
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
                const yurtid = req.selectedYurtId;
                // Accept single record or array of records
                const payloads = Array.isArray(req.body) ? req.body : [req.body];
                for (const entry of payloads) {
                    const { studentid, date, attendance_type_name, program_name, sebep } = entry;
                    if (!studentid || !date || !program_name) {
                        return res.status(400).json({ message: 'Missing required fields' });
                    }
                    const attendanceData = new Attendance_1.Attendance(studentid, new Date(date), attendance_type_name, program_name, yurtid);
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
                const yurtid = req.selectedYurtId;
                const { studentid, date, attendance_type_name, program_name, sebep } = req.body;
                if (!studentid || !date || !program_name) {
                    return res.status(400).json({ message: 'Missing required fields' });
                }
                const attendanceData = new Attendance_1.Attendance(studentid, new Date(date), attendance_type_name, program_name, yurtid);
                attendanceData.sebep = sebep || null;
                yield this.attendanceService.updateAttendance(attendanceData, yurtid);
                res.status(202).json({
                    message: 'Attendance successfully updated',
                    studentid,
                    date,
                    attendance_type_name,
                    program_name
                });
            }
            catch (error) {
                console.log('Update Attendance error:', error);
                res.status(500).json({ message: 'Failed to update attendance' });
            }
        });
    }
    deleteAttendance(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('🗑️ DELETE /attendance/delete hit with query:', req.query);
                const { studentid, date, program_name } = req.query;
                const yurtid = req.selectedYurtId;
                if (!studentid || !date || !program_name) {
                    console.log('❌ Missing required fields');
                    return res.status(400).json({ message: 'Missing required fields: studentid, date, program_name' });
                }
                console.log(`🔍 Attempting to delete: studentid=${studentid}, date=${date}, program=${program_name}, yurtid=${yurtid}`);
                // First, check if the record exists
                const attendanceData = new Attendance_1.Attendance(Number(studentid), new Date(date), undefined, program_name, yurtid);
                const existing = yield this.attendanceService.getAttendance(attendanceData, yurtid);
                console.log(`📋 Existing record:`, existing ? JSON.stringify(existing) : 'NOT FOUND');
                const deleted = yield this.attendanceService.deleteAttendance(Number(studentid), date, program_name, yurtid);
                console.log(`✅ Delete result: ${deleted ? 'SUCCESS' : 'NOT FOUND'}`);
                if (deleted) {
                    res.status(200).json({ message: 'Attendance successfully deleted' });
                }
                else {
                    res.status(404).json({ message: 'Attendance record not found' });
                }
            }
            catch (error) {
                console.log('❌ Delete Attendance error:', error);
                res.status(500).json({ message: 'Failed to delete attendance' });
            }
        });
    }
    deleteAllAttendanceByProgram(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('🗑️ DELETE ALL /attendance/delete-program hit with query:', req.query);
                const { date, program_name } = req.query;
                const yurtid = req.selectedYurtId;
                if (!date || !program_name) {
                    console.log('❌ Missing required fields');
                    return res.status(400).json({ message: 'Missing required fields: date, program_name' });
                }
                console.log(`🔍 Attempting to delete all records: date=${date}, program=${program_name}, yurtid=${yurtid}`);
                const deletedCount = yield this.attendanceService.deleteAllAttendanceByProgram(date, program_name, yurtid);
                console.log(`✅ Deleted ${deletedCount} records`);
                res.status(200).json({
                    message: `${deletedCount} yoklama kaydı silindi`,
                    deletedCount
                });
            }
            catch (error) {
                console.log('❌ Delete All Attendance error:', error);
                res.status(500).json({ message: 'Failed to delete attendance records' });
            }
        });
    }
}
exports.AttendanceController = AttendanceController;
