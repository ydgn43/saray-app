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
exports.StudentController = void 0;
const Student_1 = require("../business/models/Student");
class StudentController {
    constructor(studentService) {
        this.studentService = studentService;
    }
    getAllStudents(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const students = yield this.studentService.getAllStudents();
                res.status(202).json(students);
            }
            catch (error) {
                res.status(404).end();
            }
        });
    }
    getAllStudentsBySeason(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const season = req.query.season;
                const students = yield this.studentService.getAllStudentsBySeason(season);
                res.status(202).json(students);
            }
            catch (error) {
                res.status(404).end();
            }
        });
    }
    getAllStudentsBySeasonAndClass(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const season = req.query.season;
                const className = req.query.className;
                const students = yield this.studentService.getAllStudentsBySeasonAndClass(season, className);
                res.status(202).json(students);
            }
            catch (error) {
                res.status(404).end();
            }
        });
    }
    createStudent(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const student = new Student_1.Student(undefined, req.body.first_name, req.body.last_name, req.body.birth_date, req.body.season_year, req.body.class_name);
                const createdResponse = yield this.studentService.createStudent(student);
                console.log('📤 Sending response to frontend:', createdResponse);
                res.status(202).json({ message: createdResponse });
            }
            catch (error) {
                console.error('Error creating student:', error);
                if (error instanceof Error) {
                    res.status(400).json({ message: error.message });
                }
                else {
                    res.status(400).json({ message: 'Unknown error' });
                }
            }
        });
    }
    updateStudent(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const student = new Student_1.Student(req.body.studentid, req.body.first_name, req.body.last_name, req.body.birth_date, req.body.season_year, req.body.class_name);
                const result = yield this.studentService.updateStudent(student);
                if (result) {
                    res.status(200).json({ message: "Student updated successfully" });
                }
                else {
                    res.status(404).json({ message: "Student not found" });
                }
            }
            catch (error) {
                console.error('Error updating student:', error);
                res.status(500).json({ message: 'Internal server error' });
            }
        });
    }
    deleteStudent(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.studentService.deleteStudent(+req.query.studentid);
                res.status(202).json({ message: "Student succesfully deleted" });
            }
            catch (error) {
                console.error('Error deleting student:', error);
                res.status(404).end();
            }
        });
    }
    getStudentById(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const id = +req.params.id;
                const student = yield this.studentService.getStudentById(id);
                if (!student) {
                    return res.status(404).json({ message: 'Student not found' });
                }
                res.status(200).json(student);
            }
            catch (error) {
                console.error('Error fetching student by ID:', error);
                res.status(500).json({ message: 'Internal server error' });
            }
        });
    }
}
exports.StudentController = StudentController;
