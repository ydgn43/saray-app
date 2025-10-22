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
/**
 * POST /super-admin/create-admin
 * Create an admin user directly and assign to a yurt
 * Body: { username, password, yurtid }
 */
router.post('/create-admin', superAdminController.createAdminUser);
/**
 * POST /super-admin/assign-admin
 * Assign an existing admin user to a yurt
 * Body: { accountid, yurtid, isPrimary }
 */
router.post('/assign-admin', superAdminController.assignAdminToYurt);
/**
 * GET /super-admin/admins
 * Get all admin users
 */
router.get('/admins', superAdminController.getAllAdmins);
/**
 * GET /super-admin/users
 * Get all users with yurt information
 * Query params: role (optional filter)
 */
router.get('/users', superAdminController.getAllUsers);
/**
 * PUT /super-admin/users/:accountid
 * Update user details
 * Body: { username?, role_name?, password? }
 */
router.put('/users/:accountid', superAdminController.updateUser);
/**
 * DELETE /super-admin/users/:accountid
 * Delete user and related records
 */
router.delete('/users/:accountid', superAdminController.deleteUser);
exports.default = router;
