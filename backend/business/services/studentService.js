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
exports.StudentService = void 0;
class StudentService {
    constructor(studentData) {
        this.studentData = studentData;
    }
    getAllStudents(yurtid) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.studentData.getAllStudents(yurtid);
        });
    }
    getAllStudentsBySeason(season, yurtid) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.studentData.getAllStudentsBySeason(season, yurtid);
        });
    }
    getAllStudentsBySeasonAndClass(season, className, yurtid) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.studentData.getAllStudentsBySeasonAndClass(season, className, yurtid);
        });
    }
    createStudent(student) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.studentData.createStudent(student);
        });
    }
    deleteStudent(studentId, yurtid) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.studentData.deleteAttendanceByStudentId(studentId, yurtid);
            return yield this.studentData.deleteStudent(studentId, yurtid);
        });
    }
    getStudentById(id, yurtid) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.studentData.getStudentById(id, yurtid);
        });
    }
    updateStudent(student, yurtid) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.studentData.updateStudent(student, yurtid);
        });
    }
}
exports.StudentService = StudentService;
