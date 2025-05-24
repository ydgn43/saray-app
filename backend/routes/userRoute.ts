import express, { Request, Response } from 'express';
import { userController } from '../controller/userController';
import { authenticateJWT } from '../middleware/authMiddleware';

export const userRouter = express.Router();

userRouter.use(authenticateJWT);

// ...existing /me routes
userRouter.get('/me', userController.getMe);
userRouter.put('/me', userController.updateMe);

// Admin-only user management
userRouter.get('/', userController.getAllUsers);
userRouter.get('/:id', userController.getUserById);
userRouter.post('/', userController.createUser);
userRouter.put('/:id', userController.updateUserById);
userRouter.delete('/:id', userController.deleteUserById);