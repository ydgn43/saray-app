import yurtData from '../../data/yurtData';

class YurtService {
    async createYurt(yurt_name: string, description?: string, location?: string) {
        // Validate yurt name is unique
        const existing = await yurtData.getYurtByName(yurt_name);
        if (existing) {
            throw new Error('Yurt with this name already exists');
        }

        return await yurtData.createYurt(yurt_name, description, location);
    }

    async getAllYurts() {
        return await yurtData.getAllYurts();
    }

    async getActiveYurts() {
        return await yurtData.getActiveYurts();
    }

    async getYurtById(yurtid: number) {
        return await yurtData.getYurtById(yurtid);
    }

    async updateYurt(yurtid: number, updates: {
        yurt_name?: string;
        description?: string;
        location?: string;
        is_active?: boolean;
    }) {
        // If updating name, check uniqueness
        if (updates.yurt_name) {
            const existing = await yurtData.getYurtByName(updates.yurt_name);
            if (existing && existing.yurtid !== yurtid) {
                throw new Error('Yurt with this name already exists');
            }
        }

        return await yurtData.updateYurt(yurtid, updates);
    }

    async deleteYurt(yurtid: number) {
        // Prevent deletion of default yurt
        if (yurtid === 1) {
            throw new Error('Cannot delete the default yurt');
        }

        return await yurtData.deleteYurt(yurtid);
    }

    async getYurtStats(yurtid: number) {
        return await yurtData.getYurtStats(yurtid);
    }
}

export default new YurtService();
