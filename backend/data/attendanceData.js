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
const Attendance_1 = __importDefault(require("../data/models/Attendance"));
const Student_1 = __importDefault(require("../data/models/Student"));
const sequelize_1 = require("sequelize");
class AttendanceData {
    getAllAttendance(yurtid) {
        return __awaiter(this, void 0, void 0, function* () {
            return Attendance_1.default.findAll({
                where: {
                    yurtid: yurtid
                }
            });
        });
    }
    getAttendance(attendanceData, yurtid) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield Attendance_1.default.findOne({
                    where: {
                        studentid: attendanceData.studentId,
                        date: attendanceData.date,
                        program_name: attendanceData.programName,
                        yurtid: yurtid
                    },
                });
            }
            catch (_a) {
                throw new Error('Could not find attendance');
            }
        });
    }
    getAttendanceStatisticsByDateRange(start, end, yurtid) {
        return __awaiter(this, void 0, void 0, function* () {
            const records = yield Attendance_1.default.findAll({
                where: {
                    date: {
                        [sequelize_1.Op.between]: [start, end],
                    },
                    yurtid: yurtid
                },
            });
            const grouped = {};
            const totalCounts = {};
            for (const record of records) {
                const id = record.studentid;
                const type = record.attendance_type_name;
                if (!grouped[id])
                    grouped[id] = {};
                if (!totalCounts[id])
                    totalCounts[id] = 0;
                grouped[id][type] = (grouped[id][type] || 0) + 1;
                totalCounts[id]++;
            }
            const result = yield Promise.all(Object.entries(grouped).map(([studentId, types]) => __awaiter(this, void 0, void 0, function* () {
                const total = totalCounts[+studentId];
                const percentages = Object.entries(types).reduce((acc, [type, count]) => {
                    acc[type] = Number(((count / total) * 100).toFixed(2));
                    return acc;
                }, {});
                const student = yield Student_1.default.findByPk(+studentId);
                return {
                    studentid: +studentId,
                    name: student ? `${student.first_name} ${student.last_name}` : 'Bilinmeyen',
                    class_name: (student === null || student === void 0 ? void 0 : student.class_name) || '',
                    total,
                    percentages,
                };
            })));
            return result;
        });
    }
    getAttendanceByDateAndProgram(date, programName, yurtid) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield Attendance_1.default.findAll({
                    where: {
                        date,
                        program_name: programName,
                        yurtid: yurtid
                    },
                });
            }
            catch (error) {
                console.error("Database error while fetching attendance:", error);
                throw new Error("Database error");
            }
        });
    }
    createAttendance(attendance) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield Attendance_1.default.create({
                    studentid: attendance.studentId,
                    date: attendance.date,
                    attendance_type_name: attendance.attendanceTypeName,
                    program_name: attendance.programName,
                    sebep: attendance.sebep || null,
                    yurtid: attendance.yurtId
                });
            }
            catch (error) {
                // Add more specific error handling for foreign key constraint
                if (error &&
                    typeof error === 'object' &&
                    'name' in error &&
                    error.name === 'SequelizeForeignKeyConstraintError') {
                    console.error('Foreign key constraint failed:', error);
                    throw new Error('Program adı veritabanında bulunamadı. Lütfen program adını kontrol edin.');
                }
                console.error('Insert failed:', error);
                throw new Error('Could not create new attendance');
            }
        });
    }
    updateAttendance(attendance, yurtid) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield Attendance_1.default.update({
                    attendance_type_name: attendance.attendanceTypeName,
                    sebep: attendance.sebep || null,
                }, {
                    where: {
                        studentid: attendance.studentId,
                        date: attendance.date,
                        program_name: attendance.programName,
                        yurtid: yurtid
                    },
                });
            }
            catch (error) {
                console.error('Update failed:', error);
                throw new Error('Could not update attendance');
            }
        });
    }
    createOrUpdateAttendance(attendance) {
        return __awaiter(this, void 0, void 0, function* () {
            const [record, created] = yield Attendance_1.default.findOrCreate({
                where: {
                    studentid: attendance.studentId,
                    date: attendance.date,
                    program_name: attendance.programName,
                    yurtid: attendance.yurtId
                },
                defaults: {
                    attendance_type_name: attendance.attendanceTypeName,
                    sebep: attendance.sebep || null,
                    yurtid: attendance.yurtId
                }
            });
            if (!created) {
                yield record.update({
                    attendance_type_name: attendance.attendanceTypeName,
                    sebep: attendance.sebep || null,
                });
            }
        });
    }
    deleteAttendance(studentId, date, programName, yurtid) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log(`📊 Data layer DELETE: studentid=${studentId}, date=${date}, program_name=${programName}, yurtid=${yurtid}`);
                // First, let's check what records exist for this student and date
                const existing = yield Attendance_1.default.findAll({
                    where: {
                        studentid: studentId,
                        date: date,
                        yurtid: yurtid
                    }
                });
                console.log(`📊 Found ${existing.length} records for student ${studentId} on ${date}:`, existing.map(r => ({ program: r.program_name, type: r.attendance_type_name })));
                const deleted = yield Attendance_1.default.destroy({
                    where: {
                        studentid: studentId,
                        date: date,
                        program_name: programName,
                        yurtid: yurtid
                    },
                });
                console.log(`📊 Rows deleted: ${deleted}`);
                return deleted > 0;
            }
            catch (error) {
                console.error('❌ Delete failed:', error);
                throw new Error('Could not delete attendance');
            }
        });
    }
}
exports.default = AttendanceData;
