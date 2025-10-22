import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface UserPayload {
    accountid: number;
    username: string;
    role: string;
    yurtid: number;
    studentid?: number | null;
}

export interface AuthRequest extends Request {
    user?: UserPayload;
}

declare global {
    namespace Express {
        interface Request {
            user?: UserPayload;
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

    jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey', (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid or expired token' });
        }
        // Attach user info to the request
        req.user = decoded as UserPayload;
        next();
    });
};

export const requireRoles = (roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Forbidden: Insufficient role' });
        }
        next();
    };
};

// Helper middleware for admin-only routes
export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden: Admin access required' });
    }
    next();
};
