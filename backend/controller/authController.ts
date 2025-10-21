import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { markCodeAsUsed } from './referenceCodeController';
import { sequelize } from '../data/sequelize';

export const login = async (req: Request, res: Response) => {
    const { username, password } = req.body;
    try {
        const User = sequelize.models.UserSequelize;
        // 1. Find user by username
        const user: any = await User.findOne({ where: { username } });
        if (!user) {
            return res.status(401).json({ message: 'Geçersiz kullanıcı adı veya şifre.' });
        }
        // 2. Compare password with hashed password
        const valid = await bcrypt.compare(password, user.password);

        if (!valid) {
            return res.status(401).json({ message: 'Geçersiz kullanıcı adı veya şifre.' });
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
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error', error: error instanceof Error ? error.message : error });
    }
};

export const signup = async (req: Request, res: Response) => {
    const { username, password, referenceCode } = req.body;

    console.log('🔵 Signup request received:', { username, referenceCode });

    try {
        const User = sequelize.models.UserSequelize;
        const ReferenceCode = sequelize.models.ReferenceCode;
        const Role = sequelize.models.RoleSequelize;

        // 1. Validate required fields
        if (!username || !password || !referenceCode) {
            console.log('Missing required fields');
            return res.status(400).json({ message: 'All fields are required' });
        }

        // 2. Check if username already exists
        const existingUser = await User.findOne({ where: { username } });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        // 3. Validate reference code
        const refCode: any = await ReferenceCode.findOne({
            where: { code: referenceCode.toUpperCase() },
        });

        console.log('Reference code found:', refCode ? { code: refCode.code, roleId: refCode.roleId } : 'NOT FOUND');

        if (!refCode) {
            console.log('Invalid reference code');
            return res.status(400).json({ message: 'Invalid reference code' });
        }

        // Check if expired
        if (new Date() > refCode.expiresAt) {
            console.log('Reference code expired');
            return res.status(400).json({ message: 'Reference code has expired' });
        }

        // Check if fully used
        if (refCode.currentUses >= refCode.maxUses) {
            console.log('Reference code reached max uses');
            return res.status(400).json({ message: 'Reference code has reached maximum uses' });
        }

        // 4. Validate role exists
        console.log('Looking for role:', refCode.roleId);
        const role = await Role.findOne({ where: { role_name: refCode.roleId } });
        console.log('Role found:', role ? 'YES' : 'NO');

        if (!role) {
            console.log('Invalid role associated with reference code');
            return res.status(400).json({ message: 'Invalid role associated with reference code' });
        }

        // 5. Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 6. Create new user
        const newUser: any = await User.create({
            username,
            password: hashedPassword,
            role_name: refCode.roleId,
        });

        // 7. Mark reference code as used
        await markCodeAsUsed(referenceCode.toUpperCase(), newUser.accountid);

        // 8. Create JWT token
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error('JWT_SECRET environment variable is not defined.');
        }

        const token = jwt.sign(
            { accountid: newUser.accountid, username: newUser.username, role: newUser.role_name },
            jwtSecret,
            { expiresIn: '7d' }
        );

        // 9. Send response
        console.log('Signup successful! Sending response...');
        res.status(201).json({
            message: 'User created successfully',
            token,
            user: {
                accountid: newUser.accountid,
                username: newUser.username,
                role: newUser.role_name,
            },
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ message: 'Server error', error: error instanceof Error ? error.message : error });
    }
};
