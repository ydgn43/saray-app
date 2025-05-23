import express, { Request, Response } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { userController } from '../controller/userController';

export const seasonRouter = express.Router();

// ...existing /me routes
seasonRouter.get('/me', authMiddleware, userController.getMe);
seasonRouter.put('/me', authMiddleware, userController.updateMe);

// Admin-only user management
seasonRouter.get('/', authMiddleware, userController.getAllUsers);
seasonRouter.get('/:id', authMiddleware, userController.getUserById);
seasonRouter.post('/', authMiddleware, userController.createUser);
seasonRouter.put('/:id', authMiddleware, userController.updateUserById);
seasonRouter.delete('/:id', authMiddleware, userController.deleteUserById);