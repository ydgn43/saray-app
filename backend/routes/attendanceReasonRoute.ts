// backend/routes/attendanceReasonRoute.ts
//
// Mounted in app.ts as: app.use('/attendance-reasons', attendanceReasonRouter)
// The list of sebepler for the yoklama page, one list per yurt.
//   everyone who works with yoklama may READ it; only Admin / SuperAdmin may change it.

import express from 'express';
import {
    addDefaultReasons,
    createReason,
    deleteReason,
    getReasons,
    renameReason,
    reorderReasons,
} from '../controller/attendanceReasonController';
import { loadYurtContext } from '../controller/exitShared';
import { authenticateJWT, requireRoles } from '../middleware/authMiddleware';
import { validateYurtAccess } from '../middleware/validateYurtAccess';

const READ_ROLES = ['super-admin', 'admin', 'hoca', 'yoklamaci'];
const MANAGER_ROLES = ['super-admin', 'admin'];

export const attendanceReasonRouter = express.Router();

attendanceReasonRouter.use(authenticateJWT);
attendanceReasonRouter.use(validateYurtAccess);
attendanceReasonRouter.use(loadYurtContext); // checks that the yurt exists (it also loads the exit time zone, unused here)

attendanceReasonRouter.get('/', requireRoles(READ_ROLES), getReasons);
attendanceReasonRouter.post('/', requireRoles(MANAGER_ROLES), createReason);
attendanceReasonRouter.post('/defaults', requireRoles(MANAGER_ROLES), addDefaultReasons);
attendanceReasonRouter.put('/reorder', requireRoles(MANAGER_ROLES), reorderReasons); // before '/:id'
attendanceReasonRouter.put('/:id', requireRoles(MANAGER_ROLES), renameReason);
attendanceReasonRouter.delete('/:id', requireRoles(MANAGER_ROLES), deleteReason);

export default attendanceReasonRouter;
