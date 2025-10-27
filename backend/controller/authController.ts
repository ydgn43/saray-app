import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { markCodeAsUsed } from './referenceCodeController';
import { sequelize } from '../data/sequelize';

export const login = async (req: Request, res: Response) => {
    const { username, password } = req.body;

    console.log('🔐 Login attempt:', { username, timestamp: new Date().toISOString() });

    try {
        const User = sequelize.models.UserSequelize;
        // 1. Find user by username
        const user: any = await User.findOne({ where: { username } });

        console.log('🔍 User lookup result:', user ? 'FOUND' : 'NOT FOUND');

        if (!user) {
            console.log('❌ Login failed: User not found');
            return res.status(401).json({ message: 'Geçersiz kullanıcı adı veya şifre.' });
        }

        console.log('🔍 User found in database:', {
            accountid: user.accountid,
            username: user.username,
            role_name: user.role_name,
            studentid: user.studentid,
            yurtid: user.yurtid
        });

        // 2. Compare password with hashed password
        const valid = await bcrypt.compare(password, user.password);

        console.log('🔑 Password validation:', valid ? 'VALID' : 'INVALID');

        if (!valid) {
            console.log('❌ Login failed: Invalid password');
            return res.status(401).json({ message: 'Geçersiz kullanıcı adı veya şifre.' });
        }
        // 3. Create JWT
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error('JWT_SECRET environment variable is not defined.');
        }
        const token = jwt.sign(
            {
                accountid: user.accountid,
                username: user.username,
                role: user.role_name,
                yurtid: user.yurtid
            },
            jwtSecret,
            { expiresIn: '7d' }
        );

        // Get user's yurt information using raw query to avoid association issues
        const [userYurtsRaw]: any = await sequelize.query(`
            SELECT 
                uy.yurtid,
                uy.is_primary,
                uy.assigned_at,
                y.yurt_name,
                y.location,
                y.description,
                y.is_active
            FROM useryurt uy
            JOIN yurt y ON uy.yurtid = y.yurtid
            WHERE uy.accountid = ?
            ORDER BY uy.is_primary DESC, uy.assigned_at ASC
        `, {
            replacements: [user.accountid]
        });

        const availableYurts = userYurtsRaw.map((uy: any) => ({
            yurtId: uy.yurtid,
            yurtName: uy.yurt_name,
            location: uy.location,
            description: uy.description,
            isActive: uy.is_active === 1,
            isPrimary: uy.is_primary === 1,
            assignedAt: uy.assigned_at
        }));

        const primaryYurt = availableYurts.find((y: any) => y.isPrimary) || availableYurts[0] || null;

        const responseData = {
            token,
            user: {
                accountid: user.accountid,
                username: user.username,
                role: user.role_name,
                studentid: user.studentid || null,
                yurtid: primaryYurt?.yurtId || user.yurtid
            },
            yurtName: primaryYurt?.yurtName || null,
            availableYurts: availableYurts,
            selectedYurt: primaryYurt
        };

        console.log('✅ Login response:', responseData);

        // 4. Send token and user info
        res.json(responseData);
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
        const Student = sequelize.models.StudentSequelize;

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

        // 3. Check if this is a student-specific reference code
        const student: any = await Student.findOne({
            where: { reference_code: referenceCode.toUpperCase() }
        });

        console.log('🔍 Looking for student with reference code:', referenceCode.toUpperCase());
        console.log('Student found:', student ? {
            studentid: student.studentid,
            name: `${student.first_name} ${student.last_name}`,
            reference_code: student.reference_code,
            yurtid: student.yurtid
        } : 'NOT FOUND');

        let roleToAssign = 'talebe'; // Default for student codes
        let linkedStudentId = null;
        let assignedYurtId = null;

        if (student) {
            // This is a student-specific code
            console.log('✅ Student reference code detected:', { studentId: student.studentid, code: referenceCode, yurtid: student.yurtid });
            linkedStudentId = student.studentid;
            assignedYurtId = student.yurtid;
        } else {
            // 3b. Check if it's a regular reference code (for other roles)
            const refCode: any = await ReferenceCode.findOne({
                where: { code: referenceCode.toUpperCase() },
            });

            console.log('Reference code found:', refCode ? { code: refCode.code, roleId: refCode.roleId, yurtid: refCode.yurtid } : 'NOT FOUND');

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

            roleToAssign = refCode.roleId;
            assignedYurtId = refCode.yurtid;
        }

        // 5. Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 6. Create new user with auto-linked studentid if applicable
        const newUser: any = await User.create({
            username,
            password: hashedPassword,
            role_name: roleToAssign,
            studentid: linkedStudentId
        });

        console.log('✅ User created:', { accountid: newUser.accountid, role: roleToAssign, linkedStudent: linkedStudentId, yurtid: assignedYurtId });

        // 7. Special handling for admin users
        if (roleToAssign === 'admin') {
            console.log('🏢 Admin user detected');

            // Only create a new yurt if no yurt is assigned yet (e.g., for super-admin created codes without yurt)
            if (!assignedYurtId) {
                console.log('🏢 No yurt assigned, creating new yurt for admin:', newUser.username);

                const Yurt = sequelize.models.YurtSequelize;
                const newYurt: any = await Yurt.create({
                    yurt_name: `${newUser.username}_yurt`,
                    location: null,
                    description: `Yurt for admin ${newUser.username}`,
                    is_active: true
                });

                assignedYurtId = newYurt.yurtid;
                console.log('✅ Yurt created for admin:', { yurtid: newYurt.yurtid, yurt_name: newYurt.yurt_name });
            } else {
                console.log('✅ Admin will be assigned to existing yurt:', assignedYurtId);
            }
        }

        // 8. Assign user to yurt
        const UserYurt = sequelize.models.UserYurt;
        if (assignedYurtId) {
            await UserYurt.create({
                accountid: newUser.accountid,
                yurtid: assignedYurtId,
                is_primary: true,
                assigned_at: new Date()
            });
            console.log('✅ User assigned to yurt:', assignedYurtId);
        } else {
            // Fallback: assign to default yurt (ID 1) if no yurt specified
            await UserYurt.create({
                accountid: newUser.accountid,
                yurtid: 1, // Default yurt
                is_primary: true,
                assigned_at: new Date()
            });
            console.log('⚠️ No yurt specified, assigned to default yurt (ID 1)');
        }

        // 9. Mark reference code as used (only for non-student codes)
        if (!student) {
            await markCodeAsUsed(referenceCode.toUpperCase(), newUser.accountid);
        }

        // 10. Get user's yurt information using raw query to avoid association issues
        const [userYurtsRaw]: any = await sequelize.query(`
            SELECT 
                uy.yurtid,
                uy.is_primary,
                uy.assigned_at,
                y.yurt_name,
                y.location,
                y.description,
                y.is_active
            FROM useryurt uy
            JOIN yurt y ON uy.yurtid = y.yurtid
            WHERE uy.accountid = ?
            ORDER BY uy.is_primary DESC, uy.assigned_at ASC
        `, {
            replacements: [newUser.accountid]
        });

        const availableYurts = userYurtsRaw.map((uy: any) => ({
            yurtId: uy.yurtid,
            yurtName: uy.yurt_name,
            location: uy.location,
            description: uy.description,
            isActive: uy.is_active === 1,
            isPrimary: uy.is_primary === 1,
            assignedAt: uy.assigned_at
        }));

        const primaryYurt = availableYurts.find((y: any) => y.isPrimary) || availableYurts[0];

        // 10. Create JWT token
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error('JWT_SECRET environment variable is not defined.');
        }

        const token = jwt.sign(
            { accountid: newUser.accountid, username: newUser.username, role: newUser.role_name, yurtid: primaryYurt?.yurtId },
            jwtSecret,
            { expiresIn: '7d' }
        );

        // 11. Send response
        console.log('✅ Signup successful! Response data:', {
            username: newUser.username,
            role: newUser.role_name,
            yurtName: primaryYurt?.yurtName,
            availableYurtsCount: availableYurts.length,
            availableYurts: availableYurts,
            primaryYurt: primaryYurt
        });
        res.status(201).json({
            message: 'User created successfully',
            token,
            user: {
                accountid: newUser.accountid,
                username: newUser.username,
                role: newUser.role_name,
                studentid: newUser.studentid || null,
                yurtid: primaryYurt?.yurtId
            },
            yurtName: primaryYurt?.yurtName,
            availableYurts: availableYurts,
            selectedYurt: primaryYurt
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ message: 'Server error', error: error instanceof Error ? error.message : error });
    }
};
