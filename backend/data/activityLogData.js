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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ActivityLog_1 = __importDefault(require("./models/ActivityLog"));
const sequelize_1 = require("sequelize");
class ActivityLogData {
    createLog(params) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield ActivityLog_1.default.create({
                    userid: params.userid,
                    username: params.username,
                    action: params.action,
                    entity_type: params.entity_type,
                    entity_id: params.entity_id,
                    details: params.details || null,
                    ip_address: params.ip_address || null,
                    yurtid: params.yurtid,
                });
            }
            catch (error) {
                console.error('Failed to create activity log:', error);
            }
        });
    }
    getAllLogs(limit = 100, offset = 0) {
        return __awaiter(this, void 0, void 0, function* () {
            return ActivityLog_1.default.findAll({
                limit,
                offset,
                order: [['created_at', 'DESC']],
            });
        });
    }
    getLogsByDateRange(startDate, endDate, limit = 100) {
        return __awaiter(this, void 0, void 0, function* () {
            return ActivityLog_1.default.findAll({
                where: {
                    created_at: {
                        [sequelize_1.Op.between]: [startDate, endDate],
                    },
                },
                limit,
                order: [['created_at', 'DESC']],
            });
        });
    }
    getLogsByUser(userid, limit = 100) {
        return __awaiter(this, void 0, void 0, function* () {
            return ActivityLog_1.default.findAll({
                where: { userid },
                limit,
                order: [['created_at', 'DESC']],
            });
        });
    }
    getLogsByEntityType(entity_type, limit = 100) {
        return __awaiter(this, void 0, void 0, function* () {
            return ActivityLog_1.default.findAll({
                where: { entity_type },
                limit,
                order: [['created_at', 'DESC']],
            });
        });
    }
    getLogCount() {
        return __awaiter(this, void 0, void 0, function* () {
            return ActivityLog_1.default.count();
        });
    }
}
exports.default = ActivityLogData;
