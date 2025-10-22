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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const yurtService_1 = __importDefault(require("../business/services/yurtService"));
const userYurtData = __importStar(require("../data/userYurtData"));
class YurtController {
    createYurt(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { yurt_name, description, location } = req.body;
                const creatorAccountId = req.user.accountid;
                const creatorRole = req.user.role;
                if (!yurt_name) {
                    return res.status(400).json({ message: 'Yurt name is required' });
                }
                const yurt = yield yurtService_1.default.createYurt(yurt_name, description, location);
                // If an admin creates the yurt, automatically assign them to it
                if (creatorRole === 'admin') {
                    yield userYurtData.assignUserToYurt(creatorAccountId, yurt.yurtid, false, // Not setting as primary automatically
                    creatorAccountId);
                }
                res.status(201).json({
                    message: 'Yurt created successfully',
                    yurt,
                    autoAssigned: creatorRole === 'admin'
                });
            }
            catch (error) {
                console.error('Create yurt error:', error);
                res.status(500).json({ message: error.message || 'Failed to create yurt' });
            }
        });
    }
    getAllYurts(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const yurts = yield yurtService_1.default.getAllYurts();
                res.json(yurts);
            }
            catch (error) {
                console.error('Get all yurts error:', error);
                res.status(500).json({ message: 'Failed to fetch yurts' });
            }
        });
    }
    getActiveYurts(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const yurts = yield yurtService_1.default.getActiveYurts();
                res.json(yurts);
            }
            catch (error) {
                console.error('Get active yurts error:', error);
                res.status(500).json({ message: 'Failed to fetch active yurts' });
            }
        });
    }
    getYurtById(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { yurtid } = req.params;
                const yurt = yield yurtService_1.default.getYurtById(Number(yurtid));
                if (!yurt) {
                    return res.status(404).json({ message: 'Yurt not found' });
                }
                res.json(yurt);
            }
            catch (error) {
                console.error('Get yurt by id error:', error);
                res.status(500).json({ message: 'Failed to fetch yurt' });
            }
        });
    }
    updateYurt(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { yurtid } = req.params;
                const updates = req.body;
                const yurt = yield yurtService_1.default.updateYurt(Number(yurtid), updates);
                res.json({
                    message: 'Yurt updated successfully',
                    yurt
                });
            }
            catch (error) {
                console.error('Update yurt error:', error);
                res.status(500).json({ message: error.message || 'Failed to update yurt' });
            }
        });
    }
    deleteYurt(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { yurtid } = req.params;
                const userId = req.user.accountid;
                const userRole = req.user.role;
                // Check if admin has access to this yurt
                if (userRole === 'admin') {
                    const hasAccess = yield userYurtData.hasAccessToYurt(userId, Number(yurtid));
                    if (!hasAccess) {
                        return res.status(403).json({
                            message: 'You do not have permission to delete this yurt'
                        });
                    }
                    // Check if admin has other yurts
                    const yurtCount = yield userYurtData.getUserYurtCount(userId);
                    if (yurtCount <= 1) {
                        return res.status(400).json({
                            message: 'Cannot delete your last yurt. You must have at least one yurt.'
                        });
                    }
                }
                yield yurtService_1.default.deleteYurt(Number(yurtid));
                res.json({
                    message: 'Yurt deleted successfully',
                    success: true
                });
            }
            catch (error) {
                console.error('Delete yurt error:', error);
                res.status(500).json({
                    message: error.message || 'Failed to delete yurt',
                    success: false
                });
            }
        });
    }
    getYurtStats(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { yurtid } = req.params;
                const stats = yield yurtService_1.default.getYurtStats(Number(yurtid));
                res.json(stats);
            }
            catch (error) {
                console.error('Get yurt stats error:', error);
                res.status(500).json({ message: 'Failed to fetch yurt stats' });
            }
        });
    }
}
exports.default = new YurtController();
