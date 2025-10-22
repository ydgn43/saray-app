// backend/routes/seasonRoute.ts
import express, { Request, Response } from 'express';
import { seasonController } from '../controller/seasonController';
import { authenticateJWT, requireRoles } from '../middleware/authMiddleware';
import { validateYurtAccess } from '../middleware/validateYurtAccess';

export const seasonRouter = express.Router();

seasonRouter.use(authenticateJWT);
seasonRouter.use(validateYurtAccess); // Add yurt access validation

seasonRouter.get('/', seasonController.getAll); // Allow all authenticated users
seasonRouter.post('/create', requireRoles(['admin']), seasonController.create);
seasonRouter.delete('/delete/:season_year', requireRoles(['admin']), seasonController.delete);

