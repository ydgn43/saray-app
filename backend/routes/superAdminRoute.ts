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

export default router;
