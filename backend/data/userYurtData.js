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
exports.getUserYurtCount = exports.getYurtUsers = exports.setPrimaryYurt = exports.removeUserFromYurt = exports.assignUserToYurt = exports.hasAccessToYurt = exports.getPrimaryYurt = exports.getUserYurts = void 0;
// backend/data/userYurtData.ts
const UserYurt_1 = __importDefault(require("./models/UserYurt"));
const User_1 = __importDefault(require("./models/User"));
const Yurt_1 = __importDefault(require("./models/Yurt"));
const sequelize_1 = require("sequelize");
const getUserYurts = (accountid) => __awaiter(void 0, void 0, void 0, function* () {
    return yield UserYurt_1.default.findAll({
        where: { accountid },
        include: [
            {
                model: Yurt_1.default,
                attributes: ['yurtid', 'yurt_name', 'location', 'description', 'is_active']
            }
        ],
        order: [['is_primary', 'DESC'], ['assigned_at', 'ASC']]
    });
});
exports.getUserYurts = getUserYurts;
const getPrimaryYurt = (accountid) => __awaiter(void 0, void 0, void 0, function* () {
    return yield UserYurt_1.default.findOne({
        where: {
            accountid,
            is_primary: true
        },
        include: [
            {
                model: Yurt_1.default,
                attributes: ['yurtid', 'yurt_name', 'location', 'description', 'is_active']
            }
        ]
    });
});
exports.getPrimaryYurt = getPrimaryYurt;
const hasAccessToYurt = (accountid, yurtid) => __awaiter(void 0, void 0, void 0, function* () {
    const access = yield UserYurt_1.default.findOne({
        where: { accountid, yurtid }
    });
    return !!access;
});
exports.hasAccessToYurt = hasAccessToYurt;
const assignUserToYurt = (accountid, yurtid, isPrimary = false, assignedBy) => __awaiter(void 0, void 0, void 0, function* () {
    // If setting as primary, unset other primary yurts for this user
    if (isPrimary) {
        yield UserYurt_1.default.update({ is_primary: false }, { where: { accountid } });
    }
    const [userYurt, created] = yield UserYurt_1.default.findOrCreate({
        where: { accountid, yurtid },
        defaults: {
            accountid,
            yurtid,
            is_primary: isPrimary,
            assigned_by: assignedBy,
            assigned_at: new Date()
        }
    });
    if (!created && isPrimary) {
        yield userYurt.update({ is_primary: true });
    }
    return userYurt;
});
exports.assignUserToYurt = assignUserToYurt;
const removeUserFromYurt = (accountid, yurtid) => __awaiter(void 0, void 0, void 0, function* () {
    const userYurt = yield UserYurt_1.default.findOne({
        where: { accountid, yurtid }
    });
    if (!userYurt) {
        return false;
    }
    // If removing primary yurt, find another yurt to make primary
    if (userYurt.is_primary) {
        const otherYurt = yield UserYurt_1.default.findOne({
            where: {
                accountid,
                yurtid: { [sequelize_1.Op.ne]: yurtid }
            }
        });
        if (otherYurt) {
            yield otherYurt.update({ is_primary: true });
        }
    }
    yield userYurt.destroy();
    return true;
});
exports.removeUserFromYurt = removeUserFromYurt;
const setPrimaryYurt = (accountid, yurtid) => __awaiter(void 0, void 0, void 0, function* () {
    // First check if user has access to this yurt
    const hasAccess = yield (0, exports.hasAccessToYurt)(accountid, yurtid);
    if (!hasAccess) {
        throw new Error('User does not have access to this yurt');
    }
    // Unset all primary flags for this user
    yield UserYurt_1.default.update({ is_primary: false }, { where: { accountid } });
    // Set the new primary yurt
    yield UserYurt_1.default.update({ is_primary: true }, { where: { accountid, yurtid } });
    return true;
});
exports.setPrimaryYurt = setPrimaryYurt;
const getYurtUsers = (yurtid) => __awaiter(void 0, void 0, void 0, function* () {
    return yield UserYurt_1.default.findAll({
        where: { yurtid },
        include: [
            {
                model: User_1.default,
                attributes: ['accountid', 'username', 'role']
            }
        ],
        order: [['assigned_at', 'DESC']]
    });
});
exports.getYurtUsers = getYurtUsers;
const getUserYurtCount = (accountid) => __awaiter(void 0, void 0, void 0, function* () {
    return yield UserYurt_1.default.count({
        where: { accountid }
    });
});
exports.getUserYurtCount = getUserYurtCount;
