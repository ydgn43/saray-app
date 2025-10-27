import { Router } from 'express';
import { login, signup, requestPasswordReset, resetPassword, generatePasswordResetToken } from '../controller/authController';
import { authenticateJWT } from '../middleware/authMiddleware';
import { validateYurtAccess } from '../middleware/validateYurtAccess';

export const authRouter = Router();

authRouter.post('/login', login);
authRouter.post('/signup', signup);
authRouter.post('/request-password-reset', requestPasswordReset);
authRouter.post('/reset-password', resetPassword);

// Admin-only: Generate reset token for a user
authRouter.post('/admin/generate-reset-token', authenticateJWT, validateYurtAccess, generatePasswordResetToken);
