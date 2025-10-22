import { Router } from 'express';
import yurtController from '../controller/yurtController';
import { authenticateJWT, requireRoles } from '../middleware/authMiddleware';

const yurtRouter = Router();

// All routes require authentication
yurtRouter.use(authenticateJWT);

// Only super-admin can manage yurts, but admins can create their own yurts
// GET /yurts/active - Get active yurts (all authenticated users can see this for selection)
yurtRouter.get('/active', yurtController.getActiveYurts);

// GET /yurts - Get all yurts (including inactive)
yurtRouter.get('/', requireRoles(['super-admin']), yurtController.getAllYurts);

// GET /yurts/:yurtid - Get yurt by ID
yurtRouter.get('/:yurtid', requireRoles(['super-admin', 'admin']), yurtController.getYurtById);

// GET /yurts/:yurtid/stats - Get yurt statistics
yurtRouter.get('/:yurtid/stats', requireRoles(['super-admin', 'admin']), yurtController.getYurtStats);

// POST /yurts - Create new yurt (admins can create their own yurts)
yurtRouter.post('/', requireRoles(['super-admin', 'admin']), yurtController.createYurt);

// PUT /yurts/:yurtid - Update yurt
yurtRouter.put('/:yurtid', requireRoles(['super-admin', 'admin']), yurtController.updateYurt);

// DELETE /yurts/:yurtid - Delete (deactivate) yurt (admins can delete their own yurts)
yurtRouter.delete('/:yurtid', requireRoles(['super-admin', 'admin']), yurtController.deleteYurt);

export default yurtRouter;
