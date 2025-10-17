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
exports.StudentData = void 0;
const Student_1 = __importDefault(require("./models/Student"));
const Attendance_1 = __importDefault(require("./models/Attendance"));
class StudentData {
    getAllStudents() {
        return __awaiter(this, void 0, void 0, function* () {
            const allStudents = yield Student_1.default.findAll();
            return allStudents;
        });
    }
    getAllStudentsBySeason(seasonYear) {
        return __awaiter(this, void 0, void 0, function* () {
            const allStudentsBySeason = yield Student_1.default.findAll({
                where: {
                    season_year: seasonYear
                }
            });
            return allStudentsBySeason;
        });
    }
    getAllStudentsBySeasonAndClass(season, className) {
        return __awaiter(this, void 0, void 0, function* () {
            const allStudentsBySeasonAndClass = yield Student_1.default.findAll({
                where: {
                    season_year: season,
                    class_name: className
                }
            });
            return allStudentsBySeasonAndClass;
        });
    }
    createStudent(student) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const [newStudent, created] = yield Student_1.default.findOrCreate({
                    where: {
                        first_name: student.firstName,
                        last_name: student.lastName,
                        birth_date: student.birthDate,
                        season_year: student.seasonYear,
                        class_name: student.className
                    }, defaults: {
                        first_name: student.firstName,
                        last_name: student.lastName,
                        birth_date: student.birthDate,
                        season_year: student.seasonYear,
                        class_name: student.className
                    }
                });
                if (created) {
                    return "Student succesfully created";
                }
                else {
                    return "Student already exists";
                }
            }
            catch (error) {
                if (error.name === 'SequelizeForeignKeyConstraintError' &&
                    ((_b = (_a = error.parent) === null || _a === void 0 ? void 0 : _a.sqlMessage) === null || _b === void 0 ? void 0 : _b.includes('season'))) {
                    throw new Error("Seçilen sezon mevcut değil. Lütfen önce sezonu ekleyin.");
                }
                throw new Error("Could not create new student");
            }
        });
    }
    updateStudent(student) {
        return __awaiter(this, void 0, void 0, function* () {
            const existing = yield Student_1.default.findByPk(student.studentId);
            if (!existing)
                return false;
            existing.first_name = student.firstName;
            existing.last_name = student.lastName;
            existing.birth_date = student.birthDate;
            existing.season_year = student.seasonYear;
            existing.class_name = student.className;
            yield existing.save();
            return true;
        });
    }
    deleteStudent(studentId) {
        return __awaiter(this, void 0, void 0, function* () {
            const test = yield Student_1.default.destroy({
                where: {
                    studentid: studentId
                }
            });
            console.log(test);
        });
    }
    deleteAttendanceByStudentId(studentId) {
        return __awaiter(this, void 0, void 0, function* () {
            const deleted = yield Attendance_1.default.destroy({
                where: {
                    studentid: studentId
                }
            });
            console.log(`Deleted ${deleted} attendance records for studentid=${studentId}`);
        });
    }
    getStudentById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield Student_1.default.findByPk(id);
        });
    }
}
exports.StudentData = StudentData;
