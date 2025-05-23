// backend/controllers/userController.ts
import { Request, Response } from 'express';
import User from '../data/models/User';
import bcrypt from 'bcrypt';

// GET /user/me
export const getMe = async (req: Request, res: Response) => {
    try {
        const user = await User.findByPk(req.user.accountid, {
            attributes: ['accountid', 'username', 'role_name']
        });
        if (!user) return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: 'Kullanıcı bilgileri alınamadı.' });
    }
};

// PUT /user/me
export const updateMe = async (req: Request, res: Response) => {
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
};
