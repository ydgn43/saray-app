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

        // Hard delete - actually remove from database with cascading deletes
        const sequelize = Yurt.sequelize!;

        console.log(`🗑️ Deleting yurt ${yurtid} and all related data...`);

        // Delete all related data in the correct order to avoid foreign key issues

        // 1. Delete attendance records
        await sequelize.query(`DELETE FROM attendance WHERE yurtid = :yurtid`, {
            replacements: { yurtid }
        });
        console.log('✅ Deleted attendance records');

        // 2. Delete activity logs
        await sequelize.query(`DELETE FROM activitylog WHERE yurtid = :yurtid`, {
            replacements: { yurtid }
        });
        console.log('✅ Deleted activity logs');

        // 3. Delete students
        await sequelize.query(`DELETE FROM student WHERE yurtid = :yurtid`, {
            replacements: { yurtid }
        });
        console.log('✅ Deleted students');

        // 4. Delete UserYurt associations
        await sequelize.query(`DELETE FROM useryurt WHERE yurtid = :yurtid`, {
            replacements: { yurtid }
        });
        console.log('✅ Deleted user-yurt associations');

        // 5. Delete reference codes associated with this yurt
        await sequelize.query(`DELETE FROM referencecodes WHERE yurtid = :yurtid`, {
            replacements: { yurtid }
        });
        console.log('✅ Deleted reference codes');

        // 6. Update users to remove yurtid reference (set to default)
        await sequelize.query(`UPDATE user SET yurtid = 1 WHERE yurtid = :yurtid`, {
            replacements: { yurtid }
        });
        console.log('✅ Updated user yurtid references');

        // 7. Delete classes, seasons, programs, attendance types for this yurt
        await sequelize.query(`DELETE FROM class WHERE yurtid = :yurtid`, {
            replacements: { yurtid }
        });
        await sequelize.query(`DELETE FROM season WHERE yurtid = :yurtid`, {
            replacements: { yurtid }
        });
        await sequelize.query(`DELETE FROM program WHERE yurtid = :yurtid`, {
            replacements: { yurtid }
        });
        await sequelize.query(`DELETE FROM attendancetype WHERE yurtid = :yurtid`, {
            replacements: { yurtid }
        });
        console.log('✅ Deleted yurt configuration data');

        // 8. Finally, delete the yurt itself
        await yurt.destroy();
        console.log('✅ Yurt deleted successfully');

        return yurt;
    }

    async softDeleteYurt(yurtid: number) {
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
