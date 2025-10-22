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
exports.ActivityLogService = void 0;
class ActivityLogService {
    constructor(activityLogData) {
        this.activityLogData = activityLogData;
    }
    createLog(params) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.activityLogData.createLog(params);
        });
    }
    getAllLogs(limit, offset) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.activityLogData.getAllLogs(limit, offset);
        });
    }
    getLogsByDateRange(startDate, endDate, limit) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.activityLogData.getLogsByDateRange(startDate, endDate, limit);
        });
    }
    getLogsByUser(userid, limit) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.activityLogData.getLogsByUser(userid, limit);
        });
    }
    getLogsByEntityType(entity_type, limit) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.activityLogData.getLogsByEntityType(entity_type, limit);
        });
    }
    getLogCount() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.activityLogData.getLogCount();
        });
    }
}
exports.ActivityLogService = ActivityLogService;
