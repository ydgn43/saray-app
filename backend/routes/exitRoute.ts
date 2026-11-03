import express from 'express';
import {
    getExitLogs,
    getFoulsSummary,
    getStudentExitHistory,
    recordExit,
    recordReturn,
    updateExitLog,
    deleteExitLog,
} from '../controller/exitController';
import { authenticateJWT, requireRoles } from '../middleware/authMiddleware';
import { validateYurtAccess } from '../middleware/validateYurtAccess';

const ALLOWED_ROLES = ['super-admin', 'admin', 'hoca', 'yoklamaci'];

export const exitRouter = express.Router();

exitRouter.use(authenticateJWT);
exitRouter.use(validateYurtAccess);

exitRouter.get('/logs', requireRoles(ALLOWED_ROLES), getExitLogs);
exitRouter.get('/fouls-summary', requireRoles(ALLOWED_ROLES), getFoulsSummary);
exitRouter.get('/student/:studentid', requireRoles(ALLOWED_ROLES), getStudentExitHistory);
exitRouter.post('/record-exit', requireRoles(ALLOWED_ROLES), recordExit);
exitRouter.post('/record-return', requireRoles(ALLOWED_ROLES), recordReturn);
exitRouter.put('/logs/:id', requireRoles(ALLOWED_ROLES), updateExitLog);
exitRouter.delete('/logs/:id', requireRoles(ALLOWED_ROLES), deleteExitLog);

export default exitRouter;
