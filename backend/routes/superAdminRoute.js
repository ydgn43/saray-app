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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const superAdminController = __importStar(require("../controller/superAdminController"));
const router = express_1.default.Router();
// All routes require authentication and super-admin role
router.use(authMiddleware_1.authenticateJWT);
router.use((0, authMiddleware_1.requireRoles)(['super-admin']));
/**
 * POST /super-admin/admin-reference-codes
 * Create a new reference code for admin role
 * Body: { expiresAt, maxUses, description }
 */
router.post('/admin-reference-codes', superAdminController.createAdminReferenceCode);
/**
 * GET /super-admin/admin-reference-codes
 * Get all admin reference codes
 * Query params: status (active, expired, used)
 */
router.get('/admin-reference-codes', superAdminController.getAdminReferenceCodes);
/**
 * DELETE /super-admin/admin-reference-codes/:id
 * Delete an admin reference code
 */
router.delete('/admin-reference-codes/:id', superAdminController.deleteAdminReferenceCode);
/**
 * GET /super-admin/yurts
 * Get all yurts with their admin information
 */
router.get('/yurts', superAdminController.getAllYurtsWithAdmins);
/**
 * GET /super-admin/statistics
 * Get system-wide statistics
 */
router.get('/statistics', superAdminController.getSystemStatistics);
exports.default = router;
