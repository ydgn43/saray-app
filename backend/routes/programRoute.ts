// backend/routes/programRoute.ts
import express, { Request, Response } from 'express';
import { programController } from '../controller/programController';
import {authenticateJWT, requireRoles} from '../middleware/authMiddleware';

export const programRouter = express.Router();

programRouter.use(authenticateJWT);

programRouter.get('/', requireRoles(['admin']), programController.getAll);
programRouter.post('/create', requireRoles(['admin']), programController.create);
programRouter.delete('/delete/:program_name', requireRoles(['admin']), programController.delete);

