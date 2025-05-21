import { Router } from 'express';
import { login } from '../controller/authController';

export const authRouter = Router();

authRouter.post('/login', login);
