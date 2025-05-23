import express, { Request, Response } from 'express';
import { getMe, updateMe } from '../controller/userController';
import { authMiddleware } from '../middleware/authMiddleware';

export const userRouter = express.Router();

userRouter.get('/me', authMiddleware, getMe);

userRouter.get('/', (_req: Request, res: Response) => {
    res.send('user GET not yet implemented');
});

userRouter.post('/', (_req: Request, res: Response) => {
    res.send('user POST not yet implemented');
});

userRouter.put('/', (_req: Request, res: Response) => {
    res.send('user PUT not yet implemented');
});

userRouter.put('/me', authMiddleware, updateMe);

userRouter.delete('/', (_req: Request, res: Response) => {
    res.send('user DELETE not yet implemented');
});