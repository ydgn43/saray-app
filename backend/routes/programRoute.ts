// backend/routes/programRoute.ts
import express, { Request, Response } from 'express';
import { programController } from '../controller/programController';
import { authenticateJWT, requireRoles } from '../middleware/authMiddleware';
import { validateYurtAccess } from '../middleware/validateYurtAccess';

export const programRouter = express.Router();

programRouter.use(authenticateJWT);
programRouter.use(validateYurtAccess); // Add yurt access validation

programRouter.get('/', programController.getAll); // Allow all authenticated users
programRouter.post('/create', requireRoles(['admin']), programController.create);
programRouter.put('/update/:program_name', requireRoles(['admin']), programController.update);
programRouter.put('/update-order', requireRoles(['admin']), programController.updateOrder);
programRouter.delete('/delete/:program_name', requireRoles(['admin']), programController.delete);

