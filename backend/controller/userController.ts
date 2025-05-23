// backend/controllers/userController.ts
import { Request, Response } from 'express';
import User from '../data/models/User';
import bcrypt from 'bcrypt';

async function getMe(req: Request, res: Response) {
    try {
        const user = await User.findByPk(req.user.accountid, {
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
        const user = await User.findByPk(req.user.accountid);
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
        const users = await User.findAll({
            attributes: ['accountid', 'username', 'role_name']
        });
        res.json(users); // This sends a JSON array!
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch users.' });
    }
}

async function getUserById(req: Request, res: Response) {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Yetkiniz yok.' });
    try {
        const user = await User.findByPk(req.params.id, { attributes: ['accountid', 'username', 'role_name'] });
        if (!user) return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch user.' });
    }
}

async function createUser(req: Request, res: Response) {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Yetkiniz yok.' });
    const { username, password, role_name } = req.body;
    if (!username || !password || !role_name)
        return res.status(400).json({ message: 'Eksik bilgi.' });
    const exists = await User.findOne({ where: { username } });
    if (exists) return res.status(409).json({ message: 'Kullanıcı adı kullanılıyor.' });
    const hashed = await bcrypt.hash(password, 10);
    const newUser = await User.create({ username, password: hashed, role_name });
    res.status(201).json({ message: 'Kullanıcı oluşturuldu.', user: { accountid: newUser.accountid, username: newUser.username, role_name: newUser.role_name } });
}

async function updateUserById(req: Request, res: Response) {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Yetkiniz yok.' });
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
    const { username, password, role_name } = req.body;
    if (username) user.username = username;
    if (role_name) user.role_name = role_name;
    if (password) user.password = await bcrypt.hash(password, 10);
    await user.save();
    res.json({ message: 'Kullanıcı güncellendi.' });
}

async function deleteUserById(req: Request, res: Response) {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Yetkiniz yok.' });
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
    await user.destroy();
    res.json({ message: 'Kullanıcı silindi.' });
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
