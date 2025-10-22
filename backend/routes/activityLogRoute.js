"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.activityLogService = exports.activityLogRouter = void 0;
const express_1 = __importDefault(require("express"));
const activityLogController_1 = require("../controller/activityLogController");
const activityLogService_1 = require("../business/services/activityLogService");
const activityLogData_1 = __importDefault(require("../data/activityLogData"));
const authMiddleware_1 = require("../middleware/authMiddleware");
exports.activityLogRouter = express_1.default.Router();
const activityLogData = new activityLogData_1.default();
const activityLogService = new activityLogService_1.ActivityLogService(activityLogData);
exports.activityLogService = activityLogService;
const activityLogController = new activityLogController_1.ActivityLogController(activityLogService);
// All routes require authentication and admin role
exports.activityLogRouter.use(authMiddleware_1.authenticateJWT);
exports.activityLogRouter.use((0, authMiddleware_1.requireRoles)(['admin']));
exports.activityLogRouter.get('/', (req, res) => {
    activityLogController.getAllLogs(req, res);
});
exports.activityLogRouter.get('/date-range', (req, res) => {
    activityLogController.getLogsByDateRange(req, res);
});
exports.activityLogRouter.get('/by-user', (req, res) => {
    activityLogController.getLogsByUser(req, res);
});
exports.activityLogRouter.get('/by-entity', (req, res) => {
    activityLogController.getLogsByEntityType(req, res);
});
exports.activityLogRouter.get('/count', (req, res) => {
    activityLogController.getLogCount(req, res);
});
