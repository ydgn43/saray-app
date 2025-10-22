"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.classRouter = void 0;
// backend/routes/classRoute.ts
const express_1 = __importDefault(require("express"));
const classController_1 = require("../controller/classController");
const authMiddleware_1 = require("../middleware/authMiddleware");
exports.classRouter = express_1.default.Router();
exports.classRouter.use(authMiddleware_1.authenticateJWT);
exports.classRouter.get('/', classController_1.classController.getAll); // Allow all authenticated users
exports.classRouter.post('/create', (0, authMiddleware_1.requireRoles)(['admin']), classController_1.classController.create);
exports.classRouter.delete('/delete/:class_name', (0, authMiddleware_1.requireRoles)(['admin']), classController_1.classController.delete);
