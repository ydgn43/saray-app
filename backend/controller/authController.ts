import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../data/models/User'; // Adjust path if needed

export const login = async (req: Request, res: Response) => {
    const { username, password } = req.body;
    try {
        // 1. Find user by username
        const user = await User.findOne({ where: { username } });
        if (!user) {
            return res.status(401).json({ message: 'Invalid username or password.' });
        }
        // 2. Compare password with hashed password
        const valid = await bcrypt.compare(password, user.password);

        if (!valid) {
            return res.status(401).json({ message: 'Invalid username or password.' });
        }
        // 3. Create JWT
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error('JWT_SECRET environment variable is not defined.');
        }
        const token = jwt.sign(
            { accountid: user.accountid, username: user.username, role: user.role_name },
            jwtSecret,
            { expiresIn: '7d' }
        );
        // 4. Send token and user info
        res.json({
            token,
            user: { accountid: user.accountid, username: user.username, role: user.role_name }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error.' });
    }
};
