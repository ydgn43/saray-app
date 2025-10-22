// backend/middleware/validateYurtAccess.ts
import { Request, Response, NextFunction } from 'express';
import * as userYurtData from '../data/userYurtData';

// Extend Express Request to include selectedYurtId
declare global {
    namespace Express {
        interface Request {
            selectedYurtId?: number;
        }
    }
}

export const validateYurtAccess = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = req.user;

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        // Super-admins have access to all yurts
        if (user.role === 'super-admin') {
            // Get yurtid from header or use default
            const yurtIdFromHeader = req.headers['x-yurt-id'] as string;
            req.selectedYurtId = yurtIdFromHeader ? parseInt(yurtIdFromHeader) : user.yurtid;
            return next();
        }

        // For admins, check if they have access to the requested yurt
        if (user.role === 'admin') {
            const yurtIdFromHeader = req.headers['x-yurt-id'] as string;
            const requestedYurtId = yurtIdFromHeader ? parseInt(yurtIdFromHeader) : user.yurtid;

            // Validate that the admin has access to this yurt
            const hasAccess = await userYurtData.hasAccessToYurt(user.accountid, requestedYurtId);

            if (!hasAccess) {
                return res.status(403).json({
                    success: false,
                    message: 'You do not have access to this yurt'
                });
            }

            req.selectedYurtId = requestedYurtId;
            return next();
        }

        // For other roles (hoca, yoklamaci, talebe), they only have access to their assigned yurt
        // They cannot switch yurts via header
        req.selectedYurtId = user.yurtid;
        next();

    } catch (error) {
        console.error('Error in validateYurtAccess middleware:', error);
        res.status(500).json({
            success: false,
            message: 'Error validating yurt access'
        });
    }
};

// Middleware to ensure user has specified a yurt (for operations that require it)
export const requireYurtSelection = (req: Request, res: Response, next: NextFunction) => {
    if (!req.selectedYurtId) {
        return res.status(400).json({
            success: false,
            message: 'Yurt selection is required. Please specify X-Yurt-Id header.'
        });
    }
    next();
};
