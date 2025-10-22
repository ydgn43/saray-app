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
exports.requireYurtSelection = exports.validateYurtAccess = void 0;
const userYurtData = __importStar(require("../data/userYurtData"));
const validateYurtAccess = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }
        // Super-admins have access to all yurts
        if (user.role === 'super-admin') {
            // Get yurtid from header or use default
            const yurtIdFromHeader = req.headers['x-yurt-id'];
            req.selectedYurtId = yurtIdFromHeader ? parseInt(yurtIdFromHeader) : user.yurtid;
            return next();
        }
        // For admins, check if they have access to the requested yurt
        if (user.role === 'admin') {
            const yurtIdFromHeader = req.headers['x-yurt-id'];
            const requestedYurtId = yurtIdFromHeader ? parseInt(yurtIdFromHeader) : user.yurtid;
            // Validate that the admin has access to this yurt
            const hasAccess = yield userYurtData.hasAccessToYurt(user.accountid, requestedYurtId);
            if (!hasAccess) {
                return res.status(403).json({
                    success: false,
                    message: 'You do not have access to this yurt'
                });
            }
            req.selectedYurtId = requestedYurtId;
            return next();
        }
        // For other roles (hoca, yoklamaci, talebe), they only have access to their assigned yurt
        // They cannot switch yurts via header
        req.selectedYurtId = user.yurtid;
        next();
    }
    catch (error) {
        console.error('Error in validateYurtAccess middleware:', error);
        res.status(500).json({
            success: false,
            message: 'Error validating yurt access'
        });
    }
});
exports.validateYurtAccess = validateYurtAccess;
// Middleware to ensure user has specified a yurt (for operations that require it)
const requireYurtSelection = (req, res, next) => {
    if (!req.selectedYurtId) {
        return res.status(400).json({
            success: false,
            message: 'Yurt selection is required. Please specify X-Yurt-Id header.'
        });
    }
    next();
};
exports.requireYurtSelection = requireYurtSelection;
