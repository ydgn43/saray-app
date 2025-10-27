// backend/controllers/userController.ts
import { Request, Response } from 'express';
import User from '../data/models/User';
import bcrypt from 'bcrypt';
import { QueryTypes } from 'sequelize';

async function getMe(req: Request, res: Response) {
    try {
        const user = await User.findByPk(req.user!.accountid, {
            attributes: ['accountid', 'username', 'role_name']
        });
        if (!user) return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: 'Kullanıcı bilgileri alınamadı.' });
    }
}

async function updateMe(req: Request, res: Response) {
    try {
        const user = await User.findByPk(req.user!.accountid);
        if (!user) return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });

        const { username, password } = req.body;
        if (username) user.username = username;
        if (password && password.length > 0) user.password = await bcrypt.hash(password, 10);

        await user.save();
        res.json({ message: 'Bilgiler güncellendi.' });
    } catch (err) {
        res.status(500).json({ message: 'Bilgiler güncellenemedi.' });
    }
}

async function getAllUsers(req: Request, res: Response) {
    try {
        const yurtid = req.selectedYurtId!;
        const sequelize = User.sequelize!;
        const currentUserRole = req.user!.role;

        // Query users who are assigned to this yurt through UserYurt table
        // Exclude super-admin accounts for regular admins
        const users = await sequelize.query(`
            SELECT DISTINCT u.accountid, u.username, u.role_name, u.studentid
            FROM user u
            INNER JOIN useryurt uy ON u.accountid = uy.accountid
            WHERE uy.yurtid = :yurtid
            ${currentUserRole === 'admin' ? "AND u.role_name != 'super-admin'" : ''}
            ORDER BY u.username
        `, {
            replacements: { yurtid },
            type: QueryTypes.SELECT
        });

        res.json(users);
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ error: 'Failed to fetch users.' });
    }
}

async function getUserById(req: Request, res: Response) {
    if (req.user!.role !== 'admin') return res.status(403).json({ message: 'Yetkiniz yok.' });
    try {
        const user = await User.findByPk(req.params.id, { attributes: ['accountid', 'username', 'role_name'] });
        if (!user) return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch user.' });
    }
}

async function createUser(req: Request, res: Response) {
    if (req.user!.role !== 'admin') return res.status(403).json({ message: 'Yetkiniz yok.' });

    try {
        const { username, password, role_name } = req.body;
        const yurtid = req.selectedYurtId!;
        const adminAccountId = req.user!.accountid;

        if (!username || !password || !role_name)
            return res.status(400).json({ message: 'Eksik bilgi.' });

        const exists = await User.findOne({ where: { username } });
        if (exists) return res.status(409).json({ message: 'Kullanıcı adı kullanılıyor.' });

        const hashed = await bcrypt.hash(password, 10);
        const newUser = await User.create({
            username,
            password: hashed,
            role_name,
            yurtid // Set the yurtid for backwards compatibility
        });

        // Also create UserYurt entry to link user to yurt
        const sequelize = User.sequelize!;
        await sequelize.query(`
            INSERT INTO useryurt (accountid, yurtid, is_primary, assigned_by, assigned_at)
            VALUES (:accountid, :yurtid, true, :assignedBy, NOW())
        `, {
            replacements: {
                accountid: newUser.accountid,
                yurtid,
                assignedBy: adminAccountId
            }
        });

        res.status(201).json({
            message: 'Kullanıcı oluşturuldu.',
            user: {
                accountid: newUser.accountid,
                username: newUser.username,
                role_name: newUser.role_name
            }
        });
    } catch (err) {
        console.error('Error creating user:', err);
        res.status(500).json({ message: 'Kullanıcı oluşturulamadı.' });
    }
}

async function updateUserById(req: Request, res: Response) {
    if (req.user!.role !== 'admin') return res.status(403).json({ message: 'Yetkiniz yok.' });

    try {
        const yurtid = req.selectedYurtId!;
        const sequelize = User.sequelize!;

        // Check if user belongs to admin's yurt
        const [userCheck]: any = await sequelize.query(`
            SELECT u.accountid 
            FROM user u
            INNER JOIN useryurt uy ON u.accountid = uy.accountid
            WHERE u.accountid = :accountid AND uy.yurtid = :yurtid
        `, {
            replacements: { accountid: req.params.id, yurtid },
            type: QueryTypes.SELECT
        });

        if (!userCheck || userCheck.length === 0) {
            return res.status(403).json({ message: 'Bu kullanıcıyı düzenleme yetkiniz yok.' });
        }

        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });

        const { username, password, role_name } = req.body;
        if (username) user.username = username;
        if (role_name) user.role_name = role_name;
        if (password) user.password = await bcrypt.hash(password, 10);
        await user.save();
        res.json({ message: 'Kullanıcı güncellendi.' });
    } catch (err) {
        console.error('Error updating user:', err);
        res.status(500).json({ message: 'Kullanıcı güncellenemedi.' });
    }
}

async function deleteUserById(req: Request, res: Response) {
    if (req.user!.role !== 'admin') return res.status(403).json({ message: 'Yetkiniz yok.' });

    try {
        const yurtid = req.selectedYurtId!;
        const sequelize = User.sequelize!;

        // Check if user belongs to admin's yurt
        const [userCheck]: any = await sequelize.query(`
            SELECT u.accountid 
            FROM user u
            INNER JOIN useryurt uy ON u.accountid = uy.accountid
            WHERE u.accountid = :accountid AND uy.yurtid = :yurtid
        `, {
            replacements: { accountid: req.params.id, yurtid },
            type: QueryTypes.SELECT
        });

        if (!userCheck || userCheck.length === 0) {
            return res.status(403).json({ message: 'Bu kullanıcıyı silme yetkiniz yok.' });
        }

        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });

        // Delete UserYurt entries first
        await sequelize.query(`
            DELETE FROM useryurt WHERE accountid = :accountid
        `, {
            replacements: { accountid: req.params.id }
        });

        await user.destroy();
        res.json({ message: 'Kullanıcı silindi.' });
    } catch (err) {
        console.error('Error deleting user:', err);
        res.status(500).json({ message: 'Kullanıcı silinemedi.' });
    }
}

export const userController = {
    getMe,
    updateMe,
    getAllUsers,
    getUserById,
    createUser,
    updateUserById,
    deleteUserById,
};
