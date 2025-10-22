// backend/controller/yurtManagementController.ts
import { Request, Response } from 'express';
import * as yurtManagementService from '../business/services/yurtManagementService';

// Get all yurts accessible by the current user
export const getMyYurts = async (req: Request, res: Response) => {
    try {
        const accountid = req.user!.accountid;
        const yurts = await yurtManagementService.getUserYurts(accountid);

        res.status(200).json({
            success: true,
            data: yurts
        });
    } catch (error) {
        console.error('Error getting user yurts:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving yurts'
        });
    }
};

// Get the user's primary yurt
export const getMyPrimaryYurt = async (req: Request, res: Response) => {
    try {
        const accountid = req.user!.accountid;
        const primaryYurt = await yurtManagementService.getPrimaryYurt(accountid);

        if (!primaryYurt) {
            return res.status(404).json({
                success: false,
                message: 'No primary yurt found'
            });
        }

        res.status(200).json({
            success: true,
            data: primaryYurt
        });
    } catch (error) {
        console.error('Error getting primary yurt:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving primary yurt'
        });
    }
};

// Set a yurt as primary for the current user
export const setMyPrimaryYurt = async (req: Request, res: Response) => {
    try {
        const accountid = req.user!.accountid;
        const { yurtid } = req.body;

        if (!yurtid) {
            return res.status(400).json({
                success: false,
                message: 'yurtid is required'
            });
        }

        await yurtManagementService.setPrimaryYurt(accountid, yurtid);

        res.status(200).json({
            success: true,
            message: 'Primary yurt updated successfully'
        });
    } catch (error: any) {
        console.error('Error setting primary yurt:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error setting primary yurt'
        });
    }
};

// Admin/Super-admin: Assign a user to a yurt
export const assignUserToYurt = async (req: Request, res: Response) => {
    try {
        const { accountid, yurtid, isPrimary } = req.body;
        const assignedBy = req.user!.accountid;

        if (!accountid || !yurtid) {
            return res.status(400).json({
                success: false,
                message: 'accountid and yurtid are required'
            });
        }

        await yurtManagementService.assignUserToYurt(
            accountid,
            yurtid,
            isPrimary || false,
            assignedBy
        );

        res.status(200).json({
            success: true,
            message: 'User assigned to yurt successfully'
        });
    } catch (error) {
        console.error('Error assigning user to yurt:', error);
        res.status(500).json({
            success: false,
            message: 'Error assigning user to yurt'
        });
    }
};

// Admin/Super-admin: Remove a user from a yurt
export const removeUserFromYurt = async (req: Request, res: Response) => {
    try {
        const { accountid, yurtid } = req.body;

        if (!accountid || !yurtid) {
            return res.status(400).json({
                success: false,
                message: 'accountid and yurtid are required'
            });
        }

        const removed = await yurtManagementService.removeUserFromYurt(accountid, yurtid);

        if (!removed) {
            return res.status(404).json({
                success: false,
                message: 'User yurt assignment not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'User removed from yurt successfully'
        });
    } catch (error) {
        console.error('Error removing user from yurt:', error);
        res.status(500).json({
            success: false,
            message: 'Error removing user from yurt'
        });
    }
};

// Admin/Super-admin: Get all users assigned to a yurt
export const getYurtUsers = async (req: Request, res: Response) => {
    try {
        const yurtid = parseInt(req.params.yurtid);

        if (isNaN(yurtid)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid yurtid'
            });
        }

        const users = await yurtManagementService.getYurtUsers(yurtid);

        res.status(200).json({
            success: true,
            data: users
        });
    } catch (error) {
        console.error('Error getting yurt users:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving yurt users'
        });
    }
};
