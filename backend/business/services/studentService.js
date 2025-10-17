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
    getAllStudents() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.studentData.getAllStudents();
        });
    }
    getAllStudentsBySeason(season) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.studentData.getAllStudentsBySeason(season);
        });
    }
    getAllStudentsBySeasonAndClass(season, className) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.studentData.getAllStudentsBySeasonAndClass(season, className);
        });
    }
    createStudent(student) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.studentData.createStudent(student);
        });
    }
    deleteStudent(studentId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.studentData.deleteAttendanceByStudentId(studentId);
            return yield this.studentData.deleteStudent(studentId);
        });
    }
    getStudentById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.studentData.getStudentById(id);
        });
    }
    updateStudent(student) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.studentData.updateStudent(student);
        });
    }
}
exports.StudentService = StudentService;
