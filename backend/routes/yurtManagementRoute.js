"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// backend/routes/yurtManagementRoute.ts
const express_1 = __importDefault(require("express"));
const yurtManagementController = __importStar(require("../controller/yurtManagementController"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
// User routes - accessible by authenticated users
router.get('/my-yurts', authMiddleware_1.authenticateJWT, yurtManagementController.getMyYurts);
router.get('/my-primary-yurt', authMiddleware_1.authenticateJWT, yurtManagementController.getMyPrimaryYurt);
router.put('/my-primary-yurt', authMiddleware_1.authenticateJWT, yurtManagementController.setMyPrimaryYurt);
// Admin/Super-admin routes
router.post('/assign-user', authMiddleware_1.authenticateJWT, (0, authMiddleware_1.requireRoles)(['admin', 'super-admin']), yurtManagementController.assignUserToYurt);
router.post('/remove-user', authMiddleware_1.authenticateJWT, (0, authMiddleware_1.requireRoles)(['admin', 'super-admin']), yurtManagementController.removeUserFromYurt);
router.get('/:yurtid/users', authMiddleware_1.authenticateJWT, (0, authMiddleware_1.requireRoles)(['admin', 'super-admin']), yurtManagementController.getYurtUsers);
exports.default = router;
