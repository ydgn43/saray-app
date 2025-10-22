import express, { Request, Response } from 'express';
import { ActivityLogController } from '../controller/activityLogController';
import { ActivityLogService } from '../business/services/activityLogService';
import ActivityLogData from '../data/activityLogData';
import { authenticateJWT, requireRoles } from '../middleware/authMiddleware';

export const activityLogRouter = express.Router();

const activityLogData = new ActivityLogData();
const activityLogService = new ActivityLogService(activityLogData);
const activityLogController = new ActivityLogController(activityLogService);

// All routes require authentication and admin role
activityLogRouter.use(authenticateJWT);
activityLogRouter.use(requireRoles(['admin']));

activityLogRouter.get('/', (req: Request, res: Response) => {
    activityLogController.getAllLogs(req, res);
});

activityLogRouter.get('/date-range', (req: Request, res: Response) => {
    activityLogController.getLogsByDateRange(req, res);
});

activityLogRouter.get('/by-user', (req: Request, res: Response) => {
    activityLogController.getLogsByUser(req, res);
});

activityLogRouter.get('/by-entity', (req: Request, res: Response) => {
    activityLogController.getLogsByEntityType(req, res);
});

activityLogRouter.get('/count', (req: Request, res: Response) => {
    activityLogController.getLogCount(req, res);
});

export { activityLogService };
