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
    getAllStudents(yurtid) {
        return __awaiter(this, void 0, void 0, function* () {
            const allStudents = yield Student_1.default.findAll({
                where: {
                    yurtid: yurtid
                }
            });
            return allStudents;
        });
    }
    getAllStudentsBySeason(seasonYear, yurtid) {
        return __awaiter(this, void 0, void 0, function* () {
            const allStudentsBySeason = yield Student_1.default.findAll({
                where: {
                    season_year: seasonYear,
                    yurtid: yurtid
                }
            });
            return allStudentsBySeason;
        });
    }
    getAllStudentsBySeasonAndClass(season, className, yurtid) {
        return __awaiter(this, void 0, void 0, function* () {
            const allStudentsBySeasonAndClass = yield Student_1.default.findAll({
                where: {
                    season_year: season,
                    class_name: className,
                    yurtid: yurtid
                }
            });
            return allStudentsBySeasonAndClass;
        });
    }
    createStudent(student) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Generate unique reference code for the student
                const referenceCode = this.generateStudentReferenceCode();
                console.log(`🔵 Creating student with reference code: ${referenceCode}`);
                const [newStudent, created] = yield Student_1.default.findOrCreate({
                    where: {
                        first_name: student.firstName,
                        last_name: student.lastName,
                        birth_date: student.birthDate,
                        season_year: student.seasonYear,
                        class_name: student.className,
                        yurtid: student.yurtId
                    }, defaults: {
                        first_name: student.firstName,
                        last_name: student.lastName,
                        birth_date: student.birthDate,
                        season_year: student.seasonYear,
                        class_name: student.className,
                        reference_code: referenceCode,
                        yurtid: student.yurtId
                    }
                });
                if (created) {
                    console.log(`✅ Student created with reference code: ${referenceCode}`);
                    console.log(`Student ID: ${newStudent.studentid}`);
                    console.log(`Reference code in DB: ${newStudent.reference_code}`);
                    return `Student successfully created with reference code: ${referenceCode}`;
                }
                else {
                    console.log('⚠️ Student already exists');
                    return "Student already exists";
                }
            }
            catch (error) {
                console.error('❌ Error creating student:', error);
                if (error.name === 'SequelizeForeignKeyConstraintError' &&
                    ((_b = (_a = error.parent) === null || _a === void 0 ? void 0 : _a.sqlMessage) === null || _b === void 0 ? void 0 : _b.includes('season'))) {
                    throw new Error("Seçilen sezon mevcut değil. Lütfen önce sezonu ekleyin.");
                }
                throw new Error("Could not create new student");
            }
        });
    }
    generateStudentReferenceCode() {
        // Generate a unique code: STU-XXXXXX (STU + 6 random alphanumeric)
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluded similar chars: I,O,0,1
        let code = 'STU-';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }
    updateStudent(student, yurtid) {
        return __awaiter(this, void 0, void 0, function* () {
            const existing = yield Student_1.default.findOne({
                where: {
                    studentid: student.studentId,
                    yurtid: yurtid
                }
            });
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
    deleteStudent(studentId, yurtid) {
        return __awaiter(this, void 0, void 0, function* () {
            const test = yield Student_1.default.destroy({
                where: {
                    studentid: studentId,
                    yurtid: yurtid
                }
            });
            console.log(test);
        });
    }
    deleteAttendanceByStudentId(studentId, yurtid) {
        return __awaiter(this, void 0, void 0, function* () {
            const deleted = yield Attendance_1.default.destroy({
                where: {
                    studentid: studentId,
                    yurtid: yurtid
                }
            });
            console.log(`Deleted ${deleted} attendance records for studentid=${studentId}`);
        });
    }
    getStudentById(id, yurtid) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield Student_1.default.findOne({
                where: {
                    studentid: id,
                    yurtid: yurtid
                }
            });
        });
    }
}
exports.StudentData = StudentData;
