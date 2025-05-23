import express, { Request, Response } from 'express';
import { userController } from '../controller/userController';
import { authMiddleware } from '../middleware/authMiddleware';

export const userRouter = express.Router();

// ...existing /me routes
userRouter.get('/me', authMiddleware, userController.getMe);
userRouter.put('/me', authMiddleware, userController.updateMe);

// Admin-only user management
userRouter.get('/', authMiddleware, userController.getAllUsers);
userRouter.get('/:id', authMiddleware, userController.getUserById);
userRouter.post('/', authMiddleware, userController.createUser);
userRouter.put('/:id', authMiddleware, userController.updateUserById);
userRouter.delete('/:id', authMiddleware, userController.deleteUserById);