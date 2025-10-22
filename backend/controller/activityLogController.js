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
exports.ActivityLogController = void 0;
class ActivityLogController {
    constructor(activityLogService) {
        this.activityLogService = activityLogService;
    }
    getAllLogs(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const limit = req.query.limit ? Number(req.query.limit) : 100;
                const offset = req.query.offset ? Number(req.query.offset) : 0;
                const logs = yield this.activityLogService.getAllLogs(limit, offset);
                res.status(200).json(logs);
            }
            catch (error) {
                console.error('Error fetching logs:', error);
                res.status(500).json({ message: 'Failed to fetch activity logs' });
            }
        });
    }
    getLogsByDateRange(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { startDate, endDate } = req.query;
                if (!startDate || !endDate) {
                    return res.status(400).json({ message: 'startDate and endDate are required' });
                }
                const limit = req.query.limit ? Number(req.query.limit) : 100;
                const logs = yield this.activityLogService.getLogsByDateRange(startDate, endDate, limit);
                res.status(200).json(logs);
            }
            catch (error) {
                console.error('Error fetching logs by date range:', error);
                res.status(500).json({ message: 'Failed to fetch activity logs' });
            }
        });
    }
    getLogsByUser(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { userid } = req.query;
                if (!userid) {
                    return res.status(400).json({ message: 'userid is required' });
                }
                const limit = req.query.limit ? Number(req.query.limit) : 100;
                const logs = yield this.activityLogService.getLogsByUser(Number(userid), limit);
                res.status(200).json(logs);
            }
            catch (error) {
                console.error('Error fetching logs by user:', error);
                res.status(500).json({ message: 'Failed to fetch activity logs' });
            }
        });
    }
    getLogsByEntityType(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { entity_type } = req.query;
                if (!entity_type) {
                    return res.status(400).json({ message: 'entity_type is required' });
                }
                const limit = req.query.limit ? Number(req.query.limit) : 100;
                const logs = yield this.activityLogService.getLogsByEntityType(entity_type, limit);
                res.status(200).json(logs);
            }
            catch (error) {
                console.error('Error fetching logs by entity type:', error);
                res.status(500).json({ message: 'Failed to fetch activity logs' });
            }
        });
    }
    getLogCount(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const count = yield this.activityLogService.getLogCount();
                res.status(200).json({ count });
            }
            catch (error) {
                console.error('Error fetching log count:', error);
                res.status(500).json({ message: 'Failed to fetch log count' });
            }
        });
    }
}
exports.ActivityLogController = ActivityLogController;
