import Yurt from './models/Yurt';

class YurtData {
    async createYurt(yurt_name: string, description?: string, location?: string) {
        return await Yurt.create({
            yurt_name,
            description,
            location,
            is_active: true,
            created_at: new Date()
        });
    }

    async getAllYurts() {
        return await Yurt.findAll({
            order: [['created_at', 'DESC']]
        });
    }

    async getActiveYurts() {
        return await Yurt.findAll({
            where: { is_active: true },
            order: [['yurt_name', 'ASC']]
        });
    }

    async getYurtById(yurtid: number) {
        return await Yurt.findByPk(yurtid);
    }

    async getYurtByName(yurt_name: string) {
        return await Yurt.findOne({
            where: { yurt_name }
        });
    }

    async updateYurt(yurtid: number, updates: {
        yurt_name?: string;
        description?: string;
        location?: string;
        is_active?: boolean;
    }) {
        const yurt = await Yurt.findByPk(yurtid);
        if (!yurt) {
            throw new Error('Yurt not found');
        }
        return await yurt.update(updates);
    }

    async deleteYurt(yurtid: number) {
        const yurt = await Yurt.findByPk(yurtid);
        if (!yurt) {
            throw new Error('Yurt not found');
        }

        // Soft delete - mark as inactive instead of deleting
        // This preserves data integrity
        return await yurt.update({ is_active: false });
    }

    async hardDeleteYurt(yurtid: number) {
        // Only use this if you're absolutely sure
        // This will fail if there are foreign key references
        const yurt = await Yurt.findByPk(yurtid);
        if (!yurt) {
            throw new Error('Yurt not found');
        }
        return await yurt.destroy();
    }

    async getYurtStats(yurtid: number) {
        // This will be useful for dashboard
        // TODO: Add counts for students, users, etc.
        const yurt = await Yurt.findByPk(yurtid);
        return {
            yurt,
            // We'll add more stats here later when we update other data layers
        };
    }
}

export default new YurtData();
