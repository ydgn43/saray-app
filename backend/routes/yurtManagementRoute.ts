// backend/routes/yurtManagementRoute.ts
import express from 'express';
import * as yurtManagementController from '../controller/yurtManagementController';
import { authenticateJWT, requireRoles } from '../middleware/authMiddleware';

const router = express.Router();

// User routes - accessible by authenticated users
router.get('/my-yurts', authenticateJWT, yurtManagementController.getMyYurts);
router.get('/my-primary-yurt', authenticateJWT, yurtManagementController.getMyPrimaryYurt);
router.put('/my-primary-yurt', authenticateJWT, yurtManagementController.setMyPrimaryYurt);

// Admin/Super-admin routes
router.post('/assign-user', authenticateJWT, requireRoles(['admin', 'super-admin']), yurtManagementController.assignUserToYurt);
router.post('/remove-user', authenticateJWT, requireRoles(['admin', 'super-admin']), yurtManagementController.removeUserFromYurt);
router.get('/:yurtid/users', authenticateJWT, requireRoles(['admin', 'super-admin']), yurtManagementController.getYurtUsers);

export default router;
