// backend/routes/classRoute.ts
import express, { Request, Response } from 'express';
import { classController } from '../controller/classController';
import {authenticateJWT, requireRoles} from '../middleware/authMiddleware';

export const classRouter = express.Router();

classRouter.use(authenticateJWT);

classRouter.get('/', requireRoles(['admin']), classController.getAll);
classRouter.post('/create', requireRoles(['admin']), classController.create);
classRouter.delete('/delete/:class_name', requireRoles(['admin']), classController.delete);

