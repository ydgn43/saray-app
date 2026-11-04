// backend/routes/exitRoute.ts
//
// Mounted in app.ts as: app.use('/exit', exitRouter)
//
// Order of the middleware (each one needs the one before):
//   authenticateJWT   -> who is the user (req.user)
//   validateYurtAccess -> which yurt may this user use (req.selectedYurtId)
//   loadYurtContext   -> does that yurt exist; load its time zone (res.locals.yurt)

import express from 'express';
import {
    deleteExitLog,
    getDurationSummary,
    getExitLogs,
    getFoulsSummary,
    getStudentExitHistory,
    recordExit,
    recordReturn,
    updateExitLog,
} from '../controller/exitController';
import {
    createRule,
    deleteRule,
    getRules,
    getSettings,
    updateRule,
    updateSettings,
} from '../controller/exitRuleController';
import { loadYurtContext } from '../controller/exitShared';
import { authenticateJWT, requireRoles } from '../middleware/authMiddleware';
import { validateYurtAccess } from '../middleware/validateYurtAccess';

// Everyone who works with exits (record, return, edit, delete, read).
const EXIT_ROLES = ['super-admin', 'admin', 'hoca', 'yoklamaci'];
// Only these may create / change / delete izin rules and the yurt time zone.
const MANAGER_ROLES = ['super-admin', 'admin'];

export const exitRouter = express.Router();

exitRouter.use(authenticateJWT);
exitRouter.use(validateYurtAccess);
exitRouter.use(loadYurtContext);

// Logs
exitRouter.get('/logs', requireRoles(EXIT_ROLES), getExitLogs);
exitRouter.get('/fouls-summary', requireRoles(EXIT_ROLES), getFoulsSummary);
exitRouter.get('/duration-summary', requireRoles(EXIT_ROLES), getDurationSummary);
exitRouter.get('/student/:studentid', requireRoles(EXIT_ROLES), getStudentExitHistory);
exitRouter.post('/record-exit', requireRoles(EXIT_ROLES), recordExit);
exitRouter.post('/record-return', requireRoles(EXIT_ROLES), recordReturn);
exitRouter.put('/logs/:id', requireRoles(EXIT_ROLES), updateExitLog);
exitRouter.delete('/logs/:id', requireRoles(EXIT_ROLES), deleteExitLog);

// Izin rules
exitRouter.get('/rules', requireRoles(EXIT_ROLES), getRules);
exitRouter.post('/rules', requireRoles(MANAGER_ROLES), createRule);
exitRouter.put('/rules/:id', requireRoles(MANAGER_ROLES), updateRule);
exitRouter.delete('/rules/:id', requireRoles(MANAGER_ROLES), deleteRule);

// Yurt time zone
exitRouter.get('/settings', requireRoles(EXIT_ROLES), getSettings);
exitRouter.put('/settings', requireRoles(MANAGER_ROLES), updateSettings);

export default exitRouter;
