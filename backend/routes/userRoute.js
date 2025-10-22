"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRouter = void 0;
const express_1 = __importDefault(require("express"));
const userController_1 = require("../controller/userController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const validateYurtAccess_1 = require("../middleware/validateYurtAccess");
exports.userRouter = express_1.default.Router();
exports.userRouter.use(authMiddleware_1.authenticateJWT);
exports.userRouter.use(validateYurtAccess_1.validateYurtAccess); // Add yurt access validation
// ...existing /me routes
exports.userRouter.get('/me', userController_1.userController.getMe);
exports.userRouter.put('/me', userController_1.userController.updateMe);
// Admin-only user management
exports.userRouter.get('/', userController_1.userController.getAllUsers);
exports.userRouter.get('/:id', userController_1.userController.getUserById);
exports.userRouter.post('/', userController_1.userController.createUser);
exports.userRouter.put('/:id', userController_1.userController.updateUserById);
exports.userRouter.delete('/:id', userController_1.userController.deleteUserById);
