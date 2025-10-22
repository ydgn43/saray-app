import ActivityLogData, { CreateActivityLogParams } from '../../data/activityLogData';

export class ActivityLogService {
    private activityLogData: ActivityLogData;

    constructor(activityLogData: ActivityLogData) {
        this.activityLogData = activityLogData;
    }

    public async createLog(params: CreateActivityLogParams): Promise<void> {
        return this.activityLogData.createLog(params);
    }

    public async getAllLogs(limit?: number, offset?: number) {
        return this.activityLogData.getAllLogs(limit, offset);
    }

    public async getLogsByDateRange(startDate: string, endDate: string, limit?: number) {
        return this.activityLogData.getLogsByDateRange(startDate, endDate, limit);
    }

    public async getLogsByUser(userid: number, limit?: number) {
        return this.activityLogData.getLogsByUser(userid, limit);
    }

    public async getLogsByEntityType(entity_type: string, limit?: number) {
        return this.activityLogData.getLogsByEntityType(entity_type, limit);
    }

    public async getLogCount(): Promise<number> {
        return this.activityLogData.getLogCount();
    }
}
