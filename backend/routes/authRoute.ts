import { Router } from 'express';
import { login, signup } from '../controller/authController';

export const authRouter = Router();

authRouter.post('/login', login);
authRouter.post('/signup', signup);
