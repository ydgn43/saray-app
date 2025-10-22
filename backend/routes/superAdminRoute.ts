import express from 'express';
import { authenticateJWT, requireRoles } from '../middleware/authMiddleware';
import * as superAdminController from '../controller/superAdminController';

const router = express.Router();

// All routes require authentication and super-admin role
router.use(authenticateJWT);
router.use(requireRoles(['super-admin']));

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

export default router;
