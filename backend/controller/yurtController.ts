import { Request, Response } from 'express';
import yurtService from '../business/services/yurtService';
import * as userYurtData from '../data/userYurtData';

class YurtController {
    async createYurt(req: Request, res: Response) {
        try {
            const { yurt_name, description, location } = req.body;
            const creatorAccountId = req.user!.accountid;
            const creatorRole = req.user!.role;

            if (!yurt_name) {
                return res.status(400).json({ message: 'Yurt name is required' });
            }

            const yurt = await yurtService.createYurt(yurt_name, description, location);

            // If an admin creates the yurt, automatically assign them to it
            if (creatorRole === 'admin') {
                await userYurtData.assignUserToYurt(
                    creatorAccountId,
                    yurt.yurtid,
                    false, // Not setting as primary automatically
                    creatorAccountId
                );
            }

            res.status(201).json({
                message: 'Yurt created successfully',
                yurt,
                autoAssigned: creatorRole === 'admin'
            });
        } catch (error: any) {
            console.error('Create yurt error:', error);
            res.status(500).json({ message: error.message || 'Failed to create yurt' });
        }
    }

    async getAllYurts(req: Request, res: Response) {
        try {
            const yurts = await yurtService.getAllYurts();
            res.json(yurts);
        } catch (error: any) {
            console.error('Get all yurts error:', error);
            res.status(500).json({ message: 'Failed to fetch yurts' });
        }
    }

    async getActiveYurts(req: Request, res: Response) {
        try {
            const yurts = await yurtService.getActiveYurts();
            res.json(yurts);
        } catch (error: any) {
            console.error('Get active yurts error:', error);
            res.status(500).json({ message: 'Failed to fetch active yurts' });
        }
    }

    async getYurtById(req: Request, res: Response) {
        try {
            const { yurtid } = req.params;
            const yurt = await yurtService.getYurtById(Number(yurtid));

            if (!yurt) {
                return res.status(404).json({ message: 'Yurt not found' });
            }

            res.json(yurt);
        } catch (error: any) {
            console.error('Get yurt by id error:', error);
            res.status(500).json({ message: 'Failed to fetch yurt' });
        }
    }

    async updateYurt(req: Request, res: Response) {
        try {
            const { yurtid } = req.params;
            const updates = req.body;
            const userId = req.user!.accountid;
            const userRole = req.user!.role;

            // Check if admin has access to this yurt (super-admin bypasses this)
            if (userRole === 'admin') {
                const hasAccess = await userYurtData.hasAccessToYurt(userId, Number(yurtid));

                if (!hasAccess) {
                    return res.status(403).json({
                        message: 'You do not have permission to update this yurt'
                    });
                }
            }

            const yurt = await yurtService.updateYurt(Number(yurtid), updates);
            res.json({
                message: 'Yurt updated successfully',
                yurt
            });
        } catch (error: any) {
            console.error('Update yurt error:', error);
            res.status(500).json({ message: error.message || 'Failed to update yurt' });
        }
    }

    async deleteYurt(req: Request, res: Response) {
        try {
            const { yurtid } = req.params;
            const userId = req.user!.accountid;
            const userRole = req.user!.role;

            // Check if admin has access to this yurt
            if (userRole === 'admin') {
                const hasAccess = await userYurtData.hasAccessToYurt(userId, Number(yurtid));

                if (!hasAccess) {
                    return res.status(403).json({
                        message: 'You do not have permission to delete this yurt'
                    });
                }

                // Check if admin has other yurts
                const yurtCount = await userYurtData.getUserYurtCount(userId);

                if (yurtCount <= 1) {
                    return res.status(400).json({
                        message: 'Cannot delete your last yurt. You must have at least one yurt.'
                    });
                }
            }

            await yurtService.deleteYurt(Number(yurtid));

            res.json({
                message: 'Yurt deleted successfully',
                success: true
            });
        } catch (error: any) {
            console.error('Delete yurt error:', error);
            res.status(500).json({
                message: error.message || 'Failed to delete yurt',
                success: false
            });
        }
    }

    async getYurtStats(req: Request, res: Response) {
        try {
            const { yurtid } = req.params;
            const stats = await yurtService.getYurtStats(Number(yurtid));
            res.json(stats);
        } catch (error: any) {
            console.error('Get yurt stats error:', error);
            res.status(500).json({ message: 'Failed to fetch yurt stats' });
        }
    }
}

export default new YurtController();
