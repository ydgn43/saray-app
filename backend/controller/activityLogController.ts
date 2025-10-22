import { Request, Response } from 'express';
import { ActivityLogService } from '../business/services/activityLogService';

export class ActivityLogController {
    constructor(private activityLogService: ActivityLogService) { }

    public async getAllLogs(req: Request, res: Response) {
        try {
            const limit = req.query.limit ? Number(req.query.limit) : 100;
            const offset = req.query.offset ? Number(req.query.offset) : 0;

            const logs = await this.activityLogService.getAllLogs(limit, offset);
            res.status(200).json(logs);
        } catch (error) {
            console.error('Error fetching logs:', error);
            res.status(500).json({ message: 'Failed to fetch activity logs' });
        }
    }

    public async getLogsByDateRange(req: Request, res: Response) {
        try {
            const { startDate, endDate } = req.query;

            if (!startDate || !endDate) {
                return res.status(400).json({ message: 'startDate and endDate are required' });
            }

            const limit = req.query.limit ? Number(req.query.limit) : 100;
            const logs = await this.activityLogService.getLogsByDateRange(startDate as string, endDate as string, limit);
            res.status(200).json(logs);
        } catch (error) {
            console.error('Error fetching logs by date range:', error);
            res.status(500).json({ message: 'Failed to fetch activity logs' });
        }
    }

    public async getLogsByUser(req: Request, res: Response) {
        try {
            const { userid } = req.query;

            if (!userid) {
                return res.status(400).json({ message: 'userid is required' });
            }

            const limit = req.query.limit ? Number(req.query.limit) : 100;
            const logs = await this.activityLogService.getLogsByUser(Number(userid), limit);
            res.status(200).json(logs);
        } catch (error) {
            console.error('Error fetching logs by user:', error);
            res.status(500).json({ message: 'Failed to fetch activity logs' });
        }
    }

    public async getLogsByEntityType(req: Request, res: Response) {
        try {
            const { entity_type } = req.query;

            if (!entity_type) {
                return res.status(400).json({ message: 'entity_type is required' });
            }

            const limit = req.query.limit ? Number(req.query.limit) : 100;
            const logs = await this.activityLogService.getLogsByEntityType(entity_type as string, limit);
            res.status(200).json(logs);
        } catch (error) {
            console.error('Error fetching logs by entity type:', error);
            res.status(500).json({ message: 'Failed to fetch activity logs' });
        }
    }

    public async getLogCount(req: Request, res: Response) {
        try {
            const count = await this.activityLogService.getLogCount();
            res.status(200).json({ count });
        } catch (error) {
            console.error('Error fetching log count:', error);
            res.status(500).json({ message: 'Failed to fetch log count' });
        }
    }
}
