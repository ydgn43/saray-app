import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
    user?: any; // You can define a UserPayload type for stronger typing
}

declare global {
    namespace Express {
        interface Request {
            user?: any;
        }
    }
}

export const authenticateJWT = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1]; // Format: "Bearer <token>"
    if (!token) {
        return res.status(401).json({ message: 'Malformed token' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey', (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid or expired token' });
        }
        // Attach user info to the request
        req.user = user;
        next();
    });
};

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey');
        req.user = decoded; // This should have accountid, username, role, etc.
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Invalid token' });
    }
};

export const requireRoles = (roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Forbidden: Insufficient role' });
        }
        next();
    };
};
