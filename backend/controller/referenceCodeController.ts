import { Request, Response } from 'express';
import { Op } from 'sequelize';
import crypto from 'crypto';
import { sequelize } from '../data/sequelize';

// Generate a unique reference code
const generateUniqueCode = (): string => {
    return crypto.randomBytes(4).toString('hex').toUpperCase();
};

// Create a new reference code (Admin only)
export const createReferenceCode = async (req: Request, res: Response) => {
    try {
        const { roleId, expiresAt, maxUses, description } = req.body;
        const yurtid = req.headers['x-yurt-id'] ? Number(req.headers['x-yurt-id']) : null;

        console.log('📝 Creating reference code:');
        console.log('   - x-yurt-id header:', req.headers['x-yurt-id']);
        console.log('   - Parsed yurtid:', yurtid);
        console.log('   - roleId from body:', roleId);

        const ReferenceCode = sequelize.models.ReferenceCode;
        const Role = sequelize.models.RoleSequelize;

        // Map frontend role names to database role names
        const roleMapping: { [key: string]: string } = {
            'Teacher': 'hoca',
            'Tracker': 'yoklamaci',
            'Student': 'talebe',
            'Admin': 'admin'
        };

        const dbRoleName = roleMapping[roleId] || roleId.toLowerCase();

        console.log('   - Mapped role:', roleId, '→', dbRoleName);

        // Validate role exists
        const role = await Role.findOne({ where: { role_name: dbRoleName } });
        if (!role) {
            console.error('Role not found in database:', dbRoleName);
            return res.status(404).json({ message: `Role not found: ${dbRoleName}. Please ensure the role exists in the database.` });
        }

        console.log('Role found:', role.get('role_name'));

        // Generate unique code
        let code = generateUniqueCode();
        let exists = await ReferenceCode.findOne({ where: { code } });

        // Regenerate if code already exists
        while (exists) {
            code = generateUniqueCode();
            exists = await ReferenceCode.findOne({ where: { code } });
        }

        // Parse expiration date from frontend
        const expirationDate = new Date(expiresAt);

        // Create reference code
        const referenceCode = await ReferenceCode.create({
            code,
            roleId: dbRoleName,
            createdBy: (req as any).user.accountid,
            expiresAt: expirationDate,
            maxUses: maxUses || 1,
            currentUses: 0,
            description: description || '',
            isUsed: false,
            yurtid: yurtid,
        });

        console.log('✅ Reference code created successfully:');
        console.log('   - Code:', referenceCode.get('code'));
        console.log('   - Role:', referenceCode.get('roleId'));
        console.log('   - Yurt ID:', referenceCode.get('yurtid'));

        res.status(201).json(referenceCode);
    } catch (error: any) {
        console.error('Error creating reference code:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get all reference codes (Admin only)
export const getAllReferenceCodes = async (req: Request, res: Response) => {
    try {
        const { status, roleName } = req.query;
        const ReferenceCode = sequelize.models.ReferenceCode;

        const whereClause: any = {};

        // Filter by status
        if (status === 'active') {
            whereClause.isUsed = false;
            whereClause.expiresAt = { [Op.gt]: new Date() };
        } else if (status === 'expired') {
            whereClause.expiresAt = { [Op.lt]: new Date() };
        } else if (status === 'used') {
            whereClause.isUsed = true;
        }

        // Filter by role
        if (roleName) {
            whereClause.roleId = roleName;
        }

        const referenceCodes = await ReferenceCode.findAll({
            where: whereClause,
            order: [['createdAt', 'DESC']],
        });

        res.json(referenceCodes);
    } catch (error: any) {
        console.error('Error fetching reference codes:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Validate a reference code (Public endpoint for signup)
export const validateReferenceCode = async (req: Request, res: Response) => {
    try {
        const { code } = req.params;
        const ReferenceCode = sequelize.models.ReferenceCode;

        const referenceCode: any = await ReferenceCode.findOne({
            where: { code: code.toUpperCase() },
        });

        if (!referenceCode) {
            return res.status(404).json({ message: 'Invalid reference code', valid: false });
        }

        // Check if expired
        if (new Date() > referenceCode.expiresAt) {
            return res.status(400).json({ message: 'Reference code has expired', valid: false });
        }

        // Check if fully used
        if (referenceCode.currentUses >= referenceCode.maxUses) {
            return res.status(400).json({ message: 'Reference code has reached maximum uses', valid: false });
        }

        res.json({
            valid: true,
            message: 'Reference code is valid',
            roleName: referenceCode.roleId,
        });
    } catch (error: any) {
        console.error('Error validating reference code:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Deactivate a reference code (Admin only)
export const deactivateReferenceCode = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const ReferenceCode = sequelize.models.ReferenceCode;

        const referenceCode: any = await ReferenceCode.findByPk(id);

        if (!referenceCode) {
            return res.status(404).json({ message: 'Reference code not found' });
        }

        // Permanently delete the reference code
        await referenceCode.destroy();

        res.json({ message: 'Reference code deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting reference code:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Mark reference code as used (internal use)
export const markCodeAsUsed = async (code: string, userId: number): Promise<boolean> => {
    try {
        const ReferenceCode = sequelize.models.ReferenceCode;
        const referenceCode: any = await ReferenceCode.findOne({ where: { code: code.toUpperCase() } });

        if (!referenceCode) {
            return false;
        }

        referenceCode.currentUses += 1;
        referenceCode.usedAt = new Date();

        // If single-use or reached max uses, mark as fully used
        if (referenceCode.currentUses >= referenceCode.maxUses) {
            referenceCode.isUsed = true;
            referenceCode.usedBy = userId;
        }

        await referenceCode.save();
        return true;
    } catch (error) {
        console.error('Error marking code as used:', error);
        return false;
    }
};
