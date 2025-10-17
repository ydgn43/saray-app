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
exports.attendanceRouter = express_1.default.Router();
const attendanceData = new attendanceData_1.default();
const attendanceService = new attendanceService_1.AttendanceService(attendanceData);
const attendanceController = new attendanceController_1.AttendanceController(attendanceService);
exports.attendanceRouter.use(authMiddleware_1.authenticateJWT);
exports.attendanceRouter.get('/all', (req, res) => {
    attendanceController.getAllAttendance(req, res);
});
exports.attendanceRouter.get('/', (req, res) => {
    attendanceController.getAttendance(req, res);
});
exports.attendanceRouter.get('/statistics', (req, res) => {
    attendanceController.getAttendanceStatistics(req, res);
});
exports.attendanceRouter.get('/dailyprogram', (req, res) => {
    attendanceController.getAttendanceByDateAndProgram(req, res);
});
exports.attendanceRouter.post('/create', (0, authMiddleware_1.requireRoles)(['admin', 'hoca', 'yoklamaci']), (req, res) => {
    attendanceController.createAttendance(req, res);
});
exports.attendanceRouter.put('/put', (0, authMiddleware_1.requireRoles)(['admin', 'hoca', 'yoklamaci']), (req, res) => {
    attendanceController.updateAttendance(req, res);
});
exports.attendanceRouter.delete('/', (0, authMiddleware_1.requireRoles)(['admin', 'hoca', 'yoklamaci']), (req, res) => {
    res.status(501).json({ message: 'DELETE not implemented yet' });
});
exports.attendanceRouter.post('/izinli', (0, authMiddleware_1.requireRoles)(['admin', 'hoca']), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("POST /attendance/izinli hit");
    try {
        const { studentid, date, program_name, sebep } = req.body;
        if (!studentid || !date || !program_name) {
            return res.status(400).json({ message: 'Eksik bilgi.' });
        }
        // Create attendance record as "izinli"
        const attendanceEntity = {
            _studentId: studentid,
            _date: new Date(date),
            _attendanceTypeName: 'izinli',
            _programName: program_name,
            _sebep: sebep || null,
            // Add other required properties with default values if needed
        }; // Replace 'any' with your Attendance entity type if imported
        yield attendanceService.createOrUpdateAttendance(attendanceEntity);
        res.status(201).json({ message: 'İzinli kaydı eklendi.' });
    }
    catch (err) {
        res.status(500).json({ message: 'İzinli kaydı eklenemedi.' });
    }
}));
exports.attendanceRouter.get('/izinli', (0, authMiddleware_1.requireRoles)(['admin', 'hoca', 'yoklamaci']), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { date, program_name } = req.query;
        if (!date || !program_name) {
            return res.status(400).json({ message: 'Eksik bilgi.' });
        }
        const records = yield attendanceService.getAttendanceByDateAndProgram(date, program_name);
        const izinliler = records.filter(r => r.attendance_type_name === 'izinli');
        res.json(izinliler);
    }
    catch (err) {
        res.status(500).json({ message: 'İzinli listesi alınamadı.' });
    }
}));
