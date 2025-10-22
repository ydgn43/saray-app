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
exports.getYurtUsers = exports.removeUserFromYurt = exports.assignUserToYurt = exports.setMyPrimaryYurt = exports.getMyPrimaryYurt = exports.getMyYurts = void 0;
const yurtManagementService = __importStar(require("../business/services/yurtManagementService"));
// Get all yurts accessible by the current user
const getMyYurts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const accountid = req.user.accountid;
        const yurts = yield yurtManagementService.getUserYurts(accountid);
        res.status(200).json({
            success: true,
            data: yurts
        });
    }
    catch (error) {
        console.error('Error getting user yurts:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving yurts'
        });
    }
});
exports.getMyYurts = getMyYurts;
// Get the user's primary yurt
const getMyPrimaryYurt = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const accountid = req.user.accountid;
        const primaryYurt = yield yurtManagementService.getPrimaryYurt(accountid);
        if (!primaryYurt) {
            return res.status(404).json({
                success: false,
                message: 'No primary yurt found'
            });
        }
        res.status(200).json({
            success: true,
            data: primaryYurt
        });
    }
    catch (error) {
        console.error('Error getting primary yurt:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving primary yurt'
        });
    }
});
exports.getMyPrimaryYurt = getMyPrimaryYurt;
// Set a yurt as primary for the current user
const setMyPrimaryYurt = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const accountid = req.user.accountid;
        const { yurtid } = req.body;
        if (!yurtid) {
            return res.status(400).json({
                success: false,
                message: 'yurtid is required'
            });
        }
        yield yurtManagementService.setPrimaryYurt(accountid, yurtid);
        res.status(200).json({
            success: true,
            message: 'Primary yurt updated successfully'
        });
    }
    catch (error) {
        console.error('Error setting primary yurt:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error setting primary yurt'
        });
    }
});
exports.setMyPrimaryYurt = setMyPrimaryYurt;
// Admin/Super-admin: Assign a user to a yurt
const assignUserToYurt = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { accountid, yurtid, isPrimary } = req.body;
        const assignedBy = req.user.accountid;
        if (!accountid || !yurtid) {
            return res.status(400).json({
                success: false,
                message: 'accountid and yurtid are required'
            });
        }
        yield yurtManagementService.assignUserToYurt(accountid, yurtid, isPrimary || false, assignedBy);
        res.status(200).json({
            success: true,
            message: 'User assigned to yurt successfully'
        });
    }
    catch (error) {
        console.error('Error assigning user to yurt:', error);
        res.status(500).json({
            success: false,
            message: 'Error assigning user to yurt'
        });
    }
});
exports.assignUserToYurt = assignUserToYurt;
// Admin/Super-admin: Remove a user from a yurt
const removeUserFromYurt = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { accountid, yurtid } = req.body;
        if (!accountid || !yurtid) {
            return res.status(400).json({
                success: false,
                message: 'accountid and yurtid are required'
            });
        }
        const removed = yield yurtManagementService.removeUserFromYurt(accountid, yurtid);
        if (!removed) {
            return res.status(404).json({
                success: false,
                message: 'User yurt assignment not found'
            });
        }
        res.status(200).json({
            success: true,
            message: 'User removed from yurt successfully'
        });
    }
    catch (error) {
        console.error('Error removing user from yurt:', error);
        res.status(500).json({
            success: false,
            message: 'Error removing user from yurt'
        });
    }
});
exports.removeUserFromYurt = removeUserFromYurt;
// Admin/Super-admin: Get all users assigned to a yurt
const getYurtUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const yurtid = parseInt(req.params.yurtid);
        if (isNaN(yurtid)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid yurtid'
            });
        }
        const users = yield yurtManagementService.getYurtUsers(yurtid);
        res.status(200).json({
            success: true,
            data: users
        });
    }
    catch (error) {
        console.error('Error getting yurt users:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving yurt users'
        });
    }
});
exports.getYurtUsers = getYurtUsers;
