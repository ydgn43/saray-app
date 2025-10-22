"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const yurtController_1 = __importDefault(require("../controller/yurtController"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const yurtRouter = (0, express_1.Router)();
// All routes require authentication
yurtRouter.use(authMiddleware_1.authenticateJWT);
// Only super-admin can manage yurts, but admins can create their own yurts
// GET /yurts/active - Get active yurts (all authenticated users can see this for selection)
yurtRouter.get('/active', yurtController_1.default.getActiveYurts);
// GET /yurts - Get all yurts (including inactive)
yurtRouter.get('/', (0, authMiddleware_1.requireRoles)(['super-admin']), yurtController_1.default.getAllYurts);
// GET /yurts/:yurtid - Get yurt by ID
yurtRouter.get('/:yurtid', (0, authMiddleware_1.requireRoles)(['super-admin', 'admin']), yurtController_1.default.getYurtById);
// GET /yurts/:yurtid/stats - Get yurt statistics
yurtRouter.get('/:yurtid/stats', (0, authMiddleware_1.requireRoles)(['super-admin', 'admin']), yurtController_1.default.getYurtStats);
// POST /yurts - Create new yurt (admins can create their own yurts)
yurtRouter.post('/', (0, authMiddleware_1.requireRoles)(['super-admin', 'admin']), yurtController_1.default.createYurt);
// PUT /yurts/:yurtid - Update yurt
yurtRouter.put('/:yurtid', (0, authMiddleware_1.requireRoles)(['super-admin', 'admin']), yurtController_1.default.updateYurt);
// DELETE /yurts/:yurtid - Delete (deactivate) yurt (admins can delete their own yurts)
yurtRouter.delete('/:yurtid', (0, authMiddleware_1.requireRoles)(['super-admin', 'admin']), yurtController_1.default.deleteYurt);
exports.default = yurtRouter;
