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
exports.getYurtUsers = exports.setPrimaryYurt = exports.removeUserFromYurt = exports.assignUserToYurt = exports.getPrimaryYurt = exports.getUserYurts = void 0;
// backend/business/services/yurtManagementService.ts
const userYurtData = __importStar(require("../../data/userYurtData"));
const getUserYurts = (accountid) => __awaiter(void 0, void 0, void 0, function* () {
    const userYurts = yield userYurtData.getUserYurts(accountid);
    return userYurts.map(uy => {
        var _a, _b, _c, _d;
        return ({
            yurtId: uy.yurtid,
            yurtName: (_a = uy.yurt) === null || _a === void 0 ? void 0 : _a.yurt_name,
            location: (_b = uy.yurt) === null || _b === void 0 ? void 0 : _b.location,
            description: (_c = uy.yurt) === null || _c === void 0 ? void 0 : _c.description,
            isActive: (_d = uy.yurt) === null || _d === void 0 ? void 0 : _d.is_active,
            isPrimary: uy.is_primary,
            assignedAt: uy.assigned_at
        });
    });
});
exports.getUserYurts = getUserYurts;
const getPrimaryYurt = (accountid) => __awaiter(void 0, void 0, void 0, function* () {
    const primaryYurt = yield userYurtData.getPrimaryYurt(accountid);
    if (!primaryYurt || !primaryYurt.yurt) {
        return null;
    }
    return {
        yurtId: primaryYurt.yurtid,
        yurtName: primaryYurt.yurt.yurt_name,
        location: primaryYurt.yurt.location,
        description: primaryYurt.yurt.description,
        isActive: primaryYurt.yurt.is_active,
        isPrimary: primaryYurt.is_primary,
        assignedAt: primaryYurt.assigned_at
    };
});
exports.getPrimaryYurt = getPrimaryYurt;
const assignUserToYurt = (accountid, yurtid, isPrimary = false, assignedBy) => __awaiter(void 0, void 0, void 0, function* () {
    return yield userYurtData.assignUserToYurt(accountid, yurtid, isPrimary, assignedBy);
});
exports.assignUserToYurt = assignUserToYurt;
const removeUserFromYurt = (accountid, yurtid) => __awaiter(void 0, void 0, void 0, function* () {
    return yield userYurtData.removeUserFromYurt(accountid, yurtid);
});
exports.removeUserFromYurt = removeUserFromYurt;
const setPrimaryYurt = (accountid, yurtid) => __awaiter(void 0, void 0, void 0, function* () {
    return yield userYurtData.setPrimaryYurt(accountid, yurtid);
});
exports.setPrimaryYurt = setPrimaryYurt;
const getYurtUsers = (yurtid) => __awaiter(void 0, void 0, void 0, function* () {
    const yurtUsers = yield userYurtData.getYurtUsers(yurtid);
    return yurtUsers.map(yu => {
        var _a, _b;
        return ({
            accountId: yu.accountid,
            username: (_a = yu.user) === null || _a === void 0 ? void 0 : _a.username,
            role: (_b = yu.user) === null || _b === void 0 ? void 0 : _b.role,
            isPrimary: yu.is_primary,
            assignedAt: yu.assigned_at,
            assignedBy: yu.assigned_by
        });
    });
});
exports.getYurtUsers = getYurtUsers;
