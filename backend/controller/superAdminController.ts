import { Request, Response } from 'express';
import { Op } from 'sequelize';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { sequelize } from '../data/sequelize';

// Generate a unique reference code
const generateUniqueCode = (): string => {
    return crypto.randomBytes(4).toString('hex').toUpperCase();
};

/**
 * Create a reference code for admin role (Super-admin only)
 * This creates reference codes that allow new users to sign up as admins
 * When an admin signs up with this code, they will automatically get their own yurt
 */
export const createAdminReferenceCode = async (req: Request, res: Response) => {
    try {
        const { expiresAt, maxUses, description } = req.body;
        const user = (req as any).user;

        console.log('🔐 Super-admin creating admin reference code:');
        console.log('   - Created by:', user.username, '(', user.role, ')');
        console.log('   - Max uses:', maxUses);
        console.log('   - Expires:', expiresAt);

        const ReferenceCode = sequelize.models.ReferenceCode;

        // Generate unique code
        let code = generateUniqueCode();
        let exists = await ReferenceCode.findOne({ where: { code } });

        // Regenerate if code already exists
        while (exists) {
            code = generateUniqueCode();
            exists = await ReferenceCode.findOne({ where: { code } });
        }

        // Parse expiration date
        const expirationDate = new Date(expiresAt);

        // Create reference code for admin role
        // Note: No yurtid is set for admin reference codes
        // Yurt will be auto-created when admin signs up
        const referenceCode = await ReferenceCode.create({
            code,
            roleId: 'admin',
            createdBy: user.accountid,
            expiresAt: expirationDate,
            maxUses: maxUses || 1,
            currentUses: 0,
            description: description || 'Admin reference code',
            isUsed: false,
            yurtid: null, // No yurt for admin codes - yurt created on signup
        });

        console.log('✅ Admin reference code created successfully:');
        console.log('   - Code:', referenceCode.get('code'));
        console.log('   - Role: admin');
        console.log('   - Note: Yurt will be created automatically on signup');

        res.status(201).json(referenceCode);
    } catch (error: any) {
        console.error('❌ Error creating admin reference code:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Get all admin reference codes (Super-admin only)
 */
export const getAdminReferenceCodes = async (req: Request, res: Response) => {
    try {
        const { status } = req.query;
        const ReferenceCode = sequelize.models.ReferenceCode;

        const whereClause: any = {
            roleId: 'admin' // Only fetch admin reference codes
        };

        // Filter by status
        if (status === 'active') {
            whereClause.isUsed = false;
            whereClause.expiresAt = { [Op.gt]: new Date() };
        } else if (status === 'expired') {
            whereClause.expiresAt = { [Op.lt]: new Date() };
        } else if (status === 'used') {
            whereClause.isUsed = true;
        }

        const referenceCodes = await ReferenceCode.findAll({
            where: whereClause,
            order: [['createdAt', 'DESC']],
        });

        console.log('📋 Fetched', referenceCodes.length, 'admin reference codes');
        res.json(referenceCodes);
    } catch (error: any) {
        console.error('❌ Error fetching admin reference codes:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Delete an admin reference code (Super-admin only)
 */
export const deleteAdminReferenceCode = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const ReferenceCode = sequelize.models.ReferenceCode;

        const referenceCode: any = await ReferenceCode.findByPk(id);

        if (!referenceCode) {
            return res.status(404).json({ message: 'Reference code not found' });
        }

        // Verify it's an admin reference code
        if (referenceCode.roleId !== 'admin') {
            return res.status(400).json({ message: 'This is not an admin reference code' });
        }

        // Permanently delete the reference code
        await referenceCode.destroy();

        console.log('🗑️  Admin reference code deleted:', referenceCode.get('code'));
        res.json({ message: 'Admin reference code deleted successfully' });
    } catch (error: any) {
        console.error('❌ Error deleting admin reference code:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Get all yurts with their admin information (Super-admin only)
 * This allows super-admin to see all yurts in the system
 */
export const getAllYurtsWithAdmins = async (req: Request, res: Response) => {
    try {
        // Fetch yurts and their admins using raw queries to avoid association issues
        const [yurts]: any = await sequelize.query(`
            SELECT 
                y.yurtid,
                y.yurt_name,
                y.location,
                y.description,
                y.is_active,
                y.created_at,
                GROUP_CONCAT(
                    CONCAT(
                        '{"accountid":', u.accountid, 
                        ',"username":"', u.username, '"',
                        ',"role_name":"', u.role_name, '"}'
                    ) SEPARATOR ','
                ) as admins_json
            FROM yurt y
            LEFT JOIN useryurt uy ON y.yurtid = uy.yurtid
            LEFT JOIN user u ON uy.accountid = u.accountid AND u.role_name = 'admin'
            WHERE y.is_active = 1
            GROUP BY y.yurtid, y.yurt_name, y.location, y.description, y.is_active, y.created_at
            ORDER BY y.created_at DESC
        `);

        // Parse the admins JSON
        const yurtsWithAdmins = yurts.map((yurt: any) => {
            const admins = yurt.admins_json
                ? JSON.parse(`[${yurt.admins_json}]`)
                : [];

            return {
                yurtid: yurt.yurtid,
                yurt_name: yurt.yurt_name,
                location: yurt.location,
                description: yurt.description,
                is_active: yurt.is_active === 1,
                created_at: yurt.created_at,
                admins: admins
            };
        });

        console.log('🏢 Fetched', yurtsWithAdmins.length, 'yurts with admin info');
        res.json(yurtsWithAdmins);
    } catch (error: any) {
        console.error('❌ Error fetching yurts with admins:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Get system statistics (Super-admin only)
 * Returns overview of the entire system
 */
export const getSystemStatistics = async (req: Request, res: Response) => {
    try {
        const Yurt = sequelize.models.YurtSequelize;
        const User = sequelize.models.UserSequelize;
        const Student = sequelize.models.StudentSequelize;
        const ReferenceCode = sequelize.models.ReferenceCode;

        // Count all active yurts
        const totalYurts = await Yurt.count({ where: { is_active: true } });

        // Count users by role
        const totalAdmins = await User.count({ where: { role_name: 'admin' } });
        const totalHocas = await User.count({ where: { role_name: 'hoca' } });
        const totalYoklamaci = await User.count({ where: { role_name: 'yoklamaci' } });

        // Count total students
        const totalStudents = await Student.count();

        // Count reference codes
        const totalReferenceCodes = await ReferenceCode.count();
        const activeReferenceCodes = await ReferenceCode.count({
            where: {
                isUsed: false,
                expiresAt: { [Op.gt]: new Date() }
            }
        });

        const statistics = {
            yurts: {
                total: totalYurts
            },
            users: {
                admins: totalAdmins,
                hocas: totalHocas,
                yoklamaci: totalYoklamaci,
                total: totalAdmins + totalHocas + totalYoklamaci
            },
            students: {
                total: totalStudents
            },
            referenceCodes: {
                total: totalReferenceCodes,
                active: activeReferenceCodes
            }
        };

        console.log('📊 System statistics:', statistics);
        res.json(statistics);
    } catch (error: any) {
        console.error('❌ Error fetching system statistics:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Create an admin user directly (Super-admin only)
 * Allows super-admin to create admins and assign them to any yurt
 */
export const createAdminUser = async (req: Request, res: Response) => {
    try {
        const { username, password, yurtid } = req.body;
        const superAdmin = (req as any).user;

        console.log('👤 Super-admin creating admin user:');
        console.log('   - Username:', username);
        console.log('   - Yurt ID:', yurtid);
        console.log('   - Created by:', superAdmin.username);

        // Validate required fields
        if (!username || !password || !yurtid) {
            return res.status(400).json({ message: 'Username, password, and yurtid are required' });
        }

        const User = sequelize.models.UserSequelize;
        const UserYurt = sequelize.models.UserYurt;
        const Yurt = sequelize.models.YurtSequelize;

        // Check if username already exists
        const existingUser = await User.findOne({ where: { username } });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        // Verify yurt exists
        const yurt = await Yurt.findByPk(yurtid);
        if (!yurt) {
            return res.status(404).json({ message: 'Yurt not found' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create admin user
        const newUser: any = await User.create({
            username,
            password: hashedPassword,
            role_name: 'admin',
            studentid: null
        });

        // Assign user to yurt as primary
        await UserYurt.create({
            accountid: newUser.accountid,
            yurtid: yurtid,
            is_primary: true,
            assigned_by: superAdmin.accountid,
            assigned_at: new Date()
        });

        console.log('✅ Admin user created:', {
            accountid: newUser.accountid,
            username: newUser.username,
            yurtid: yurtid
        });

        res.status(201).json({
            message: 'Admin user created successfully',
            user: {
                accountid: newUser.accountid,
                username: newUser.username,
                role: 'admin',
                yurtid: yurtid
            }
        });
    } catch (error: any) {
        console.error('❌ Error creating admin user:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Assign an existing admin user to a yurt (Super-admin only)
 * Allows super-admin to assign existing admins to any yurt
 */
export const assignAdminToYurt = async (req: Request, res: Response) => {
    try {
        const { accountid, yurtid, isPrimary } = req.body;
        const superAdmin = (req as any).user;

        console.log('👤 Super-admin assigning admin to yurt:');
        console.log('   - Admin accountid:', accountid);
        console.log('   - Yurt ID:', yurtid);
        console.log('   - Set as primary:', isPrimary);
        console.log('   - Assigned by:', superAdmin.username);

        // Validate required fields
        if (!accountid || !yurtid) {
            return res.status(400).json({ message: 'Account ID and yurtid are required' });
        }

        const User = sequelize.models.UserSequelize;
        const UserYurt = sequelize.models.UserYurt;
        const Yurt = sequelize.models.YurtSequelize;

        // Verify user exists and is an admin
        const user = await User.findByPk(accountid);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const userData = user as any;
        if (userData.role_name !== 'admin') {
            return res.status(400).json({ message: 'User must be an admin to be assigned to a yurt' });
        }

        // Verify yurt exists
        const yurt = await Yurt.findByPk(yurtid);
        if (!yurt) {
            return res.status(404).json({ message: 'Yurt not found' });
        }

        // Check if assignment already exists
        const existingAssignment = await UserYurt.findOne({
            where: { accountid, yurtid }
        });

        if (existingAssignment) {
            return res.status(400).json({ message: 'Admin is already assigned to this yurt' });
        }

        // If setting as primary, remove primary status from other assignments for this user
        if (isPrimary) {
            await UserYurt.update(
                { is_primary: false },
                { where: { accountid } }
            );
        }

        // Create assignment
        await UserYurt.create({
            accountid,
            yurtid,
            is_primary: isPrimary || false,
            assigned_by: superAdmin.accountid,
            assigned_at: new Date()
        });

        console.log('✅ Admin assigned to yurt:', {
            accountid,
            yurtid,
            isPrimary: isPrimary || false
        });

        res.json({
            message: 'Admin assigned to yurt successfully',
            assignment: {
                accountid,
                yurtid,
                isPrimary: isPrimary || false
            }
        });
    } catch (error: any) {
        console.error('❌ Error assigning admin to yurt:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Get all admin users (Super-admin only)
 * Returns list of all users with admin role
 */
export const getAllAdmins = async (req: Request, res: Response) => {
    try {
        const User = sequelize.models.UserSequelize;

        const admins = await User.findAll({
            where: { role_name: 'admin' },
            attributes: ['accountid', 'username', 'role_name'],
            order: [['username', 'ASC']]
        });

        console.log('📋 Fetched', admins.length, 'admin users');
        res.json(admins);
    } catch (error: any) {
        console.error('❌ Error fetching admins:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Get all users (Super-admin only)
 * Returns list of all users with their yurt information
 */
export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const { role } = req.query;

        console.log('👥 Fetching all users, filter role:', role || 'all');

        // Build query
        const whereClause: any = {};
        if (role && role !== 'all') {
            whereClause.role_name = role;
        }

        const [users]: any = await sequelize.query(`
            SELECT 
                u.accountid,
                u.username,
                u.role_name,
                u.studentid,
                GROUP_CONCAT(
                    CONCAT(
                        '{"yurtid":', y.yurtid,
                        ',"yurt_name":"', y.yurt_name, '"',
                        ',"is_primary":', uy.is_primary, '}'
                    ) SEPARATOR ','
                ) as yurts_json
            FROM user u
            LEFT JOIN useryurt uy ON u.accountid = uy.accountid
            LEFT JOIN yurt y ON uy.yurtid = y.yurtid
            ${role && role !== 'all' ? `WHERE u.role_name = '${role}'` : ''}
            GROUP BY u.accountid, u.username, u.role_name, u.studentid
            ORDER BY u.role_name, u.username
        `);

        // Parse yurts JSON
        const usersWithYurts = users.map((user: any) => {
            const yurts = user.yurts_json
                ? JSON.parse(`[${user.yurts_json}]`)
                : [];

            return {
                accountid: user.accountid,
                username: user.username,
                role_name: user.role_name,
                studentid: user.studentid,
                yurts: yurts
            };
        });

        console.log('👥 Fetched', usersWithYurts.length, 'users');
        res.json(usersWithYurts);
    } catch (error: any) {
        console.error('❌ Error fetching users:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Update user (Super-admin only)
 * Allows updating username, role, and password
 */
export const updateUser = async (req: Request, res: Response) => {
    try {
        const { accountid } = req.params;
        const { username, role_name, password } = req.body;
        const superAdmin = (req as any).user;

        console.log('✏️ Super-admin updating user:', accountid);
        console.log('   - New username:', username);
        console.log('   - New role:', role_name);
        console.log('   - Password change:', password ? 'Yes' : 'No');

        const User = sequelize.models.UserSequelize;

        // Find user
        const user = await User.findByPk(accountid);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Prevent super-admin from changing their own role
        if (Number(accountid) === superAdmin.accountid && role_name && role_name !== 'super-admin') {
            return res.status(400).json({ message: 'You cannot change your own role' });
        }

        // Check if new username already exists (if changing username)
        if (username && username !== (user as any).username) {
            const existingUser = await User.findOne({ where: { username } });
            if (existingUser) {
                return res.status(400).json({ message: 'Username already exists' });
            }
        }

        // Update fields
        const updateData: any = {};
        if (username) updateData.username = username;
        if (role_name) updateData.role_name = role_name;

        // Hash password if provided
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            updateData.password = hashedPassword;
        }

        await User.update(updateData, { where: { accountid } });

        console.log('✅ User updated:', accountid);
        res.json({ message: 'User updated successfully' });
    } catch (error: any) {
        console.error('❌ Error updating user:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Delete user (Super-admin only)
 * Deletes user and all related records
 */
export const deleteUser = async (req: Request, res: Response) => {
    try {
        const { accountid } = req.params;
        const superAdmin = (req as any).user;

        console.log('🗑️ Super-admin deleting user:', accountid);

        // Prevent super-admin from deleting themselves
        if (Number(accountid) === superAdmin.accountid) {
            return res.status(400).json({ message: 'You cannot delete your own account' });
        }

        const User = sequelize.models.UserSequelize;
        const UserYurt = sequelize.models.UserYurt;

        // Find user
        const user = await User.findByPk(accountid);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Delete user's yurt assignments first
        await UserYurt.destroy({ where: { accountid } });

        // Delete user
        await User.destroy({ where: { accountid } });

        console.log('✅ User deleted:', accountid);
        res.json({ message: 'User deleted successfully' });
    } catch (error: any) {
        console.error('❌ Error deleting user:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
