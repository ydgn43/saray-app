"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.programRouter = void 0;
// backend/routes/programRoute.ts
const express_1 = __importDefault(require("express"));
const programController_1 = require("../controller/programController");
const authMiddleware_1 = require("../middleware/authMiddleware");
exports.programRouter = express_1.default.Router();
exports.programRouter.use(authMiddleware_1.authenticateJWT);
exports.programRouter.get('/', programController_1.programController.getAll); // Allow all authenticated users
exports.programRouter.post('/create', (0, authMiddleware_1.requireRoles)(['admin']), programController_1.programController.create);
exports.programRouter.put('/update/:program_name', (0, authMiddleware_1.requireRoles)(['admin']), programController_1.programController.update);
exports.programRouter.delete('/delete/:program_name', (0, authMiddleware_1.requireRoles)(['admin']), programController_1.programController.delete);
