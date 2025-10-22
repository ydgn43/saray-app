// backend/data/userYurtData.ts
import UserYurt from './models/UserYurt';
import User from './models/User';
import Yurt from './models/Yurt';
import { Op } from 'sequelize';

export const getUserYurts = async (accountid: number) => {
    return await UserYurt.findAll({
        where: { accountid },
        include: [
            {
                model: Yurt,
                attributes: ['yurtid', 'yurt_name', 'location', 'description', 'is_active']
            }
        ],
        order: [['is_primary', 'DESC'], ['assigned_at', 'ASC']]
    });
};

export const getPrimaryYurt = async (accountid: number) => {
    return await UserYurt.findOne({
        where: {
            accountid,
            is_primary: true
        },
        include: [
            {
                model: Yurt,
                attributes: ['yurtid', 'yurt_name', 'location', 'description', 'is_active']
            }
        ]
    });
}; export const hasAccessToYurt = async (accountid: number, yurtid: number): Promise<boolean> => {
    const access = await UserYurt.findOne({
        where: { accountid, yurtid }
    });
    return !!access;
};

export const assignUserToYurt = async (
    accountid: number,
    yurtid: number,
    isPrimary: boolean = false,
    assignedBy?: number
) => {
    // If setting as primary, unset other primary yurts for this user
    if (isPrimary) {
        await UserYurt.update(
            { is_primary: false },
            { where: { accountid } }
        );
    }

    const [userYurt, created] = await UserYurt.findOrCreate({
        where: { accountid, yurtid },
        defaults: {
            accountid,
            yurtid,
            is_primary: isPrimary,
            assigned_by: assignedBy,
            assigned_at: new Date()
        }
    });

    if (!created && isPrimary) {
        await userYurt.update({ is_primary: true });
    }

    return userYurt;
};

export const removeUserFromYurt = async (accountid: number, yurtid: number) => {
    const userYurt = await UserYurt.findOne({
        where: { accountid, yurtid }
    });

    if (!userYurt) {
        return false;
    }

    // If removing primary yurt, find another yurt to make primary
    if (userYurt.is_primary) {
        const otherYurt = await UserYurt.findOne({
            where: {
                accountid,
                yurtid: { [Op.ne]: yurtid }
            }
        });

        if (otherYurt) {
            await otherYurt.update({ is_primary: true });
        }
    }

    await userYurt.destroy();
    return true;
};

export const setPrimaryYurt = async (accountid: number, yurtid: number) => {
    // First check if user has access to this yurt
    const hasAccess = await hasAccessToYurt(accountid, yurtid);
    if (!hasAccess) {
        throw new Error('User does not have access to this yurt');
    }

    // Unset all primary flags for this user
    await UserYurt.update(
        { is_primary: false },
        { where: { accountid } }
    );

    // Set the new primary yurt
    await UserYurt.update(
        { is_primary: true },
        { where: { accountid, yurtid } }
    );

    return true;
};

export const getYurtUsers = async (yurtid: number) => {
    return await UserYurt.findAll({
        where: { yurtid },
        include: [
            {
                model: User,
                attributes: ['accountid', 'username', 'role']
            }
        ],
        order: [['assigned_at', 'DESC']]
    });
};

export const getUserYurtCount = async (accountid: number): Promise<number> => {
    return await UserYurt.count({
        where: { accountid }
    });
};
