import ActivityLog from './models/ActivityLog';
import { Op } from 'sequelize';

export interface CreateActivityLogParams {
    userid: number;
    username: string;
    action: 'create' | 'update' | 'delete';
    entity_type: string;
    entity_id: string;
    details?: string | null;
    ip_address?: string | null;
}

export default class ActivityLogData {
    public async createLog(params: CreateActivityLogParams): Promise<void> {
        try {
            await ActivityLog.create({
                userid: params.userid,
                username: params.username,
                action: params.action,
                entity_type: params.entity_type,
                entity_id: params.entity_id,
                details: params.details || null,
                ip_address: params.ip_address || null,
            });
        } catch (error) {
            console.error('Failed to create activity log:', error);
        }
    }

    public async getAllLogs(limit: number = 100, offset: number = 0) {
        return ActivityLog.findAll({
            limit,
            offset,
            order: [['created_at', 'DESC']],
        });
    }

    public async getLogsByDateRange(startDate: string, endDate: string, limit: number = 100) {
        return ActivityLog.findAll({
            where: {
                created_at: {
                    [Op.between]: [startDate, endDate],
                },
            },
            limit,
            order: [['created_at', 'DESC']],
        });
    }

    public async getLogsByUser(userid: number, limit: number = 100) {
        return ActivityLog.findAll({
            where: { userid },
            limit,
            order: [['created_at', 'DESC']],
        });
    }

    public async getLogsByEntityType(entity_type: string, limit: number = 100) {
        return ActivityLog.findAll({
            where: { entity_type },
            limit,
            order: [['created_at', 'DESC']],
        });
    }

    public async getLogCount(): Promise<number> {
        return ActivityLog.count();
    }
}
