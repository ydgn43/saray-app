"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const authController_1 = require("../controller/authController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const validateYurtAccess_1 = require("../middleware/validateYurtAccess");
exports.authRouter = (0, express_1.Router)();
exports.authRouter.post('/login', authController_1.login);
exports.authRouter.post('/signup', authController_1.signup);
exports.authRouter.post('/request-password-reset', authController_1.requestPasswordReset);
exports.authRouter.post('/reset-password', authController_1.resetPassword);
// Admin-only: Generate reset token for a user
exports.authRouter.post('/admin/generate-reset-token', authMiddleware_1.authenticateJWT, validateYurtAccess_1.validateYurtAccess, authController_1.generatePasswordResetToken);
