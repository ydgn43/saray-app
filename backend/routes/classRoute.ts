// backend/routes/classRoute.ts
import express, { Request, Response } from 'express';
import { classController } from '../controller/classController';
import { authenticateJWT, requireRoles } from '../middleware/authMiddleware';
import { validateYurtAccess } from '../middleware/validateYurtAccess';

export const classRouter = express.Router();

classRouter.use(authenticateJWT);
classRouter.use(validateYurtAccess); // Add yurt access validation

classRouter.get('/', classController.getAll); // Allow all authenticated users
classRouter.post('/create', requireRoles(['admin']), classController.create);
classRouter.delete('/delete/:class_name', requireRoles(['admin']), classController.delete);

