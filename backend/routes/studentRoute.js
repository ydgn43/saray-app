"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.studentRouter = void 0;
const express_1 = __importDefault(require("express"));
const studentController_1 = require("../controller/studentController");
const studentService_1 = require("../business/services/studentService");
const studentData_1 = require("../data/studentData");
const authMiddleware_1 = require("../middleware/authMiddleware");
const validateYurtAccess_1 = require("../middleware/validateYurtAccess");
exports.studentRouter = express_1.default.Router();
const studentData = new studentData_1.StudentData();
const studentService = new studentService_1.StudentService(studentData);
const studentController = new studentController_1.StudentController(studentService);
exports.studentRouter.use(authMiddleware_1.authenticateJWT);
exports.studentRouter.use(validateYurtAccess_1.validateYurtAccess); // Add yurt access validation
exports.studentRouter.get('/', (req, res) => {
    studentController.getAllStudents(req, res);
});
exports.studentRouter.get('/season/', (req, res) => {
    studentController.getAllStudentsBySeason(req, res);
});
exports.studentRouter.get('/season/class', (req, res) => {
    studentController.getAllStudentsBySeasonAndClass(req, res);
});
exports.studentRouter.get('/:id', (req, res) => {
    studentController.getStudentById(req, res);
});
exports.studentRouter.post('/create', (0, authMiddleware_1.requireRoles)(['admin', 'hoca']), (req, res) => {
    studentController.createStudent(req, res);
});
exports.studentRouter.put('/', (0, authMiddleware_1.requireRoles)(['admin', 'hoca']), (req, res) => {
    studentController.updateStudent(req, res);
});
exports.studentRouter.delete('/delete', (0, authMiddleware_1.requireRoles)(['admin', 'hoca']), (req, res) => {
    studentController.deleteStudent(req, res);
});
