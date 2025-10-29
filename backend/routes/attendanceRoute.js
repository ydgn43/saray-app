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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.attendanceRouter = void 0;
const express_1 = __importDefault(require("express"));
const attendanceController_1 = require("../controller/attendanceController");
const attendanceService_1 = require("../business/services/attendanceService");
const attendanceData_1 = __importDefault(require("../data/attendanceData"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const validateYurtAccess_1 = require("../middleware/validateYurtAccess");
const Attendance_1 = __importDefault(require("../data/models/Attendance"));
const activityLogRoute_1 = require("./activityLogRoute");
const Student_1 = __importDefault(require("../data/models/Student"));
exports.attendanceRouter = express_1.default.Router();
const attendanceData = new attendanceData_1.default();
const attendanceService = new attendanceService_1.AttendanceService(attendanceData);
const attendanceController = new attendanceController_1.AttendanceController(attendanceService);
exports.attendanceRouter.use(authMiddleware_1.authenticateJWT);
exports.attendanceRouter.use(validateYurtAccess_1.validateYurtAccess); // Add yurt access validation
// Test route to verify DELETE is working at all
exports.attendanceRouter.delete('/test', (req, res) => {
    console.log('🧪 TEST DELETE route hit');
    res.json({ message: 'DELETE test successful' });
});
exports.attendanceRouter.get('/all', (req, res) => {
    attendanceController.getAllAttendance(req, res);
});
exports.attendanceRouter.delete('/delete', (0, authMiddleware_1.requireRoles)(['admin', 'hoca', 'yoklamaci']), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('🔥 DELETE /delete route HIT with query:', req.query);
    console.log('🔥 User:', req.user);
    try {
        // Get student info before deleting
        const { studentid, date, program_name } = req.query;
        let studentName = 'Bilinmeyen';
        let previousStatus = 'izinli';
        if (studentid) {
            const student = yield Student_1.default.findByPk(Number(studentid));
            if (student) {
                studentName = `${student.first_name} ${student.last_name || ''}`.trim();
            }
            // Get attendance record before deletion
            const attendance = yield Attendance_1.default.findOne({
                where: {
                    studentid: Number(studentid),
                    date: date,
                    program_name: program_name,
                }
            });
            if (attendance) {
                previousStatus = attendance.attendance_type_name;
            }
        }
        yield attendanceController.deleteAttendance(req, res);
        // Log the activity after successful delete
        if (res.statusCode === 200) {
            yield activityLogRoute_1.activityLogService.createLog({
                userid: req.user.accountid,
                username: req.user.username,
                action: 'delete',
                entity_type: 'izinli',
                entity_id: JSON.stringify({ studentid, date, program_name, studentName }),
                details: JSON.stringify({
                    studentName,
                    previousStatus,
                    description: `${studentName} - ${previousStatus} kaydı silindi`
                }),
                ip_address: req.ip || req.socket.remoteAddress || null,
                yurtid: req.user.yurtid,
            });
        }
    }
    catch (error) {
        console.error('Delete error:', error);
    }
}));
// Delete all attendance records for a program on a specific date
exports.attendanceRouter.delete('/delete-program', (0, authMiddleware_1.requireRoles)(['admin']), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('🔥 DELETE /delete-program route HIT with query:', req.query);
    console.log('🔥 User:', req.user);
    try {
        const { date, program_name } = req.query;
        yield attendanceController.deleteAllAttendanceByProgram(req, res);
        // Log the activity after successful delete
        if (res.statusCode === 200) {
            yield activityLogRoute_1.activityLogService.createLog({
                userid: req.user.accountid,
                username: req.user.username,
                action: 'delete',
                entity_type: 'attendance',
                entity_id: JSON.stringify({ date, program_name }),
                details: JSON.stringify({
                    description: `${program_name} programı için tüm yoklama kayıtları silindi (${date})`
                }),
                ip_address: req.ip || req.socket.remoteAddress || null,
                yurtid: req.user.yurtid,
            });
        }
    }
    catch (error) {
        console.error('Delete program error:', error);
    }
}));
exports.attendanceRouter.get('/', (req, res) => {
    attendanceController.getAttendance(req, res);
});
exports.attendanceRouter.get('/statistics', (req, res) => {
    attendanceController.getAttendanceStatistics(req, res);
});
exports.attendanceRouter.get('/dailyprogram', (req, res) => {
    attendanceController.getAttendanceByDateAndProgram(req, res);
});
exports.attendanceRouter.post('/create', (0, authMiddleware_1.requireRoles)(['admin', 'hoca', 'yoklamaci']), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield attendanceController.createAttendance(req, res);
        // Log the activity after successful creation
        if (res.statusCode === 202) {
            const payloads = Array.isArray(req.body) ? req.body : [req.body];
            // Only log if it's a bulk operation (more than 1 record) or if it's a new izinli record
            // Individual updates should go through PUT route
            if (payloads.length > 1) {
                // Get student names for all records
                const recordsWithNames = yield Promise.all(payloads.map((p) => __awaiter(void 0, void 0, void 0, function* () {
                    const student = yield Student_1.default.findByPk(Number(p.studentid));
                    const studentName = student
                        ? `${student.first_name} ${student.last_name || ''}`.trim()
                        : 'Bilinmeyen';
                    return {
                        studentid: p.studentid,
                        studentName,
                        date: p.date,
                        program: p.program_name,
                        status: p.attendance_type_name || 'gelmedi'
                    };
                })));
                const description = recordsWithNames
                    .map(r => `${r.studentName} - ${r.status}`)
                    .join(', ');
                // Get first record's date and program for display
                const firstRecord = payloads[0];
                const dateStr = firstRecord.date;
                const programName = firstRecord.program_name;
                yield activityLogRoute_1.activityLogService.createLog({
                    userid: req.user.accountid,
                    username: req.user.username,
                    action: 'create',
                    entity_type: 'attendance',
                    entity_id: JSON.stringify(recordsWithNames.map(r => ({
                        studentid: r.studentid,
                        studentName: r.studentName,
                        date: r.date,
                        program: r.program
                    }))),
                    details: JSON.stringify({
                        count: payloads.length,
                        date: dateStr,
                        program_name: programName,
                        description: `${programName} - ${dateStr} için ${payloads.length} kayıt oluşturuldu`,
                        records: recordsWithNames
                    }),
                    ip_address: req.ip || req.socket.remoteAddress || null,
                    yurtid: req.user.yurtid,
                });
            }
        }
    }
    catch (error) {
        console.error('Create attendance error:', error);
    }
}));
exports.attendanceRouter.put('/put', (0, authMiddleware_1.requireRoles)(['admin', 'hoca', 'yoklamaci']), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Get previous state before update
        const { studentid, date, program_name, attendance_type_name } = req.body;
        let studentName = 'Bilinmeyen';
        let previousStatus = null;
        if (studentid && date && program_name) {
            const student = yield Student_1.default.findByPk(Number(studentid));
            if (student) {
                studentName = `${student.first_name} ${student.last_name || ''}`.trim();
            }
            const existingAttendance = yield Attendance_1.default.findOne({
                where: {
                    studentid: Number(studentid),
                    date: date,
                    program_name: program_name,
                }
            });
            if (existingAttendance) {
                previousStatus = existingAttendance.attendance_type_name;
            }
        }
        yield attendanceController.updateAttendance(req, res);
        // Log the activity after successful update
        if (res.statusCode === 200 && studentid && previousStatus !== attendance_type_name) {
            const changeDescription = previousStatus
                ? `${studentName} - ${previousStatus} → ${attendance_type_name}`
                : `${studentName} - ${attendance_type_name}`;
            yield activityLogRoute_1.activityLogService.createLog({
                userid: req.user.accountid,
                username: req.user.username,
                action: 'update',
                entity_type: 'attendance',
                entity_id: JSON.stringify({ studentid, date, program_name, studentName }),
                details: JSON.stringify({
                    studentName,
                    date,
                    program_name,
                    previousStatus,
                    newStatus: attendance_type_name,
                    description: `${program_name} - ${date} için ${changeDescription}`
                }),
                ip_address: req.ip || req.socket.remoteAddress || null,
                yurtid: req.user.yurtid,
            });
        }
    }
    catch (error) {
        console.error('Update attendance error:', error);
    }
}));
exports.attendanceRouter.post('/izinli', (0, authMiddleware_1.requireRoles)(['admin', 'hoca']), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("POST /attendance/izinli hit");
    try {
        const { studentid, date, program_name, sebep } = req.body;
        if (!studentid || !date || !program_name) {
            return res.status(400).json({ message: 'Eksik bilgi.' });
        }
        // Get student info
        let studentName = 'Bilinmeyen';
        let previousStatus = null;
        const student = yield Student_1.default.findByPk(Number(studentid));
        if (student) {
            studentName = `${student.first_name} ${student.last_name || ''}`.trim();
        }
        // Check if there's an existing attendance record
        const existingAttendance = yield Attendance_1.default.findOne({
            where: {
                studentid: Number(studentid),
                date: date,
                program_name: program_name,
            }
        });
        if (existingAttendance) {
            previousStatus = existingAttendance.attendance_type_name;
        }
        // Create attendance record as "izinli"
        const attendanceEntity = {
            _studentId: studentid,
            _date: new Date(date),
            _attendanceTypeName: 'izinli',
            _programName: program_name,
            _sebep: sebep || null,
        };
        yield attendanceService.createOrUpdateAttendance(attendanceEntity);
        // Log the activity
        const changeDescription = previousStatus
            ? `${studentName} - ${previousStatus} → İzinli`
            : `${studentName} - Yeni izinli kaydı`;
        yield activityLogRoute_1.activityLogService.createLog({
            userid: req.user.accountid,
            username: req.user.username,
            action: previousStatus ? 'update' : 'create',
            entity_type: 'izinli',
            entity_id: JSON.stringify({ studentid, date, program_name, studentName }),
            details: JSON.stringify({
                studentName,
                date,
                program_name,
                sebep,
                previousStatus,
                newStatus: 'izinli',
                description: `${program_name} - ${date} için ${changeDescription}`
            }),
            ip_address: req.ip || req.socket.remoteAddress || null,
            yurtid: req.user.yurtid,
        });
        res.status(201).json({ message: 'İzinli kaydı eklendi.' });
    }
    catch (err) {
        res.status(500).json({ message: 'İzinli kaydı eklenemedi.' });
    }
}));
exports.attendanceRouter.get('/izinli', (0, authMiddleware_1.requireRoles)(['admin', 'hoca', 'yoklamaci']), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { date, program_name } = req.query;
        const yurtid = req.user.yurtid;
        if (!date || !program_name) {
            return res.status(400).json({ message: 'Eksik bilgi.' });
        }
        const records = yield attendanceService.getAttendanceByDateAndProgram(date, program_name, yurtid);
        const izinliler = records.filter(r => r.attendance_type_name === 'izinli');
        res.json(izinliler);
    }
    catch (err) {
        res.status(500).json({ message: 'İzinli listesi alınamadı.' });
    }
}));
