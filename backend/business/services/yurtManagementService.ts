// backend/business/services/yurtManagementService.ts
import * as userYurtData from '../../data/userYurtData';

export const getUserYurts = async (accountid: number) => {
    const userYurts = await userYurtData.getUserYurts(accountid);
    return userYurts.map(uy => ({
        yurtId: uy.yurtid,
        yurtName: uy.yurt?.yurt_name,
        location: uy.yurt?.location,
        description: uy.yurt?.description,
        isActive: uy.yurt?.is_active,
        isPrimary: uy.is_primary,
        assignedAt: uy.assigned_at
    }));
};

export const getPrimaryYurt = async (accountid: number) => {
    const primaryYurt = await userYurtData.getPrimaryYurt(accountid);
    if (!primaryYurt || !primaryYurt.yurt) {
        return null;
    }

    return {
        yurtId: primaryYurt.yurtid,
        yurtName: primaryYurt.yurt.yurt_name,
        location: primaryYurt.yurt.location,
        description: primaryYurt.yurt.description,
        isActive: primaryYurt.yurt.is_active,
        isPrimary: primaryYurt.is_primary,
        assignedAt: primaryYurt.assigned_at
    };
};

export const assignUserToYurt = async (
    accountid: number,
    yurtid: number,
    isPrimary: boolean = false,
    assignedBy?: number
) => {
    return await userYurtData.assignUserToYurt(accountid, yurtid, isPrimary, assignedBy);
};

export const removeUserFromYurt = async (accountid: number, yurtid: number) => {
    return await userYurtData.removeUserFromYurt(accountid, yurtid);
};

export const setPrimaryYurt = async (accountid: number, yurtid: number) => {
    return await userYurtData.setPrimaryYurt(accountid, yurtid);
};

export const getYurtUsers = async (yurtid: number) => {
    const yurtUsers = await userYurtData.getYurtUsers(yurtid);
    return yurtUsers.map(yu => ({
        accountId: yu.accountid,
        username: yu.user?.username,
        role: yu.user?.role,
        isPrimary: yu.is_primary,
        assignedAt: yu.assigned_at,
        assignedBy: yu.assigned_by
    }));
};
