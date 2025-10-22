"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSystemStatistics = exports.getAllYurtsWithAdmins = exports.deleteAdminReferenceCode = exports.getAdminReferenceCodes = exports.createAdminReferenceCode = void 0;
const sequelize_1 = require("sequelize");
const crypto_1 = __importDefault(require("crypto"));
const sequelize_2 = require("../data/sequelize");
// Generate a unique reference code
const generateUniqueCode = () => {
    return crypto_1.default.randomBytes(4).toString('hex').toUpperCase();
};
/**
 * Create a reference code for admin role (Super-admin only)
 * This creates reference codes that allow new users to sign up as admins
 * When an admin signs up with this code, they will automatically get their own yurt
 */
const createAdminReferenceCode = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { expiresAt, maxUses, description } = req.body;
        const user = req.user;
        console.log('🔐 Super-admin creating admin reference code:');
        console.log('   - Created by:', user.username, '(', user.role, ')');
        console.log('   - Max uses:', maxUses);
        console.log('   - Expires:', expiresAt);
        const ReferenceCode = sequelize_2.sequelize.models.ReferenceCode;
        // Generate unique code
        let code = generateUniqueCode();
        let exists = yield ReferenceCode.findOne({ where: { code } });
        // Regenerate if code already exists
        while (exists) {
            code = generateUniqueCode();
            exists = yield ReferenceCode.findOne({ where: { code } });
        }
        // Parse expiration date
        const expirationDate = new Date(expiresAt);
        // Create reference code for admin role
        // Note: No yurtid is set for admin reference codes
        // Yurt will be auto-created when admin signs up
        const referenceCode = yield ReferenceCode.create({
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
    }
    catch (error) {
        console.error('❌ Error creating admin reference code:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
exports.createAdminReferenceCode = createAdminReferenceCode;
/**
 * Get all admin reference codes (Super-admin only)
 */
const getAdminReferenceCodes = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { status } = req.query;
        const ReferenceCode = sequelize_2.sequelize.models.ReferenceCode;
        const whereClause = {
            roleId: 'admin' // Only fetch admin reference codes
        };
        // Filter by status
        if (status === 'active') {
            whereClause.isUsed = false;
            whereClause.expiresAt = { [sequelize_1.Op.gt]: new Date() };
        }
        else if (status === 'expired') {
            whereClause.expiresAt = { [sequelize_1.Op.lt]: new Date() };
        }
        else if (status === 'used') {
            whereClause.isUsed = true;
        }
        const referenceCodes = yield ReferenceCode.findAll({
            where: whereClause,
            order: [['createdAt', 'DESC']],
        });
        console.log('📋 Fetched', referenceCodes.length, 'admin reference codes');
        res.json(referenceCodes);
    }
    catch (error) {
        console.error('❌ Error fetching admin reference codes:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
exports.getAdminReferenceCodes = getAdminReferenceCodes;
/**
 * Delete an admin reference code (Super-admin only)
 */
const deleteAdminReferenceCode = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const ReferenceCode = sequelize_2.sequelize.models.ReferenceCode;
        const referenceCode = yield ReferenceCode.findByPk(id);
        if (!referenceCode) {
            return res.status(404).json({ message: 'Reference code not found' });
        }
        // Verify it's an admin reference code
        if (referenceCode.roleId !== 'admin') {
            return res.status(400).json({ message: 'This is not an admin reference code' });
        }
        // Permanently delete the reference code
        yield referenceCode.destroy();
        console.log('🗑️  Admin reference code deleted:', referenceCode.get('code'));
        res.json({ message: 'Admin reference code deleted successfully' });
    }
    catch (error) {
        console.error('❌ Error deleting admin reference code:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
exports.deleteAdminReferenceCode = deleteAdminReferenceCode;
/**
 * Get all yurts with their admin information (Super-admin only)
 * This allows super-admin to see all yurts in the system
 */
const getAllYurtsWithAdmins = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Fetch yurts and their admins using raw queries to avoid association issues
        const [yurts] = yield sequelize_2.sequelize.query(`
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
            FROM Yurt y
            LEFT JOIN UserYurt uy ON y.yurtid = uy.yurtid
            LEFT JOIN User u ON uy.accountid = u.accountid AND u.role_name = 'admin'
            WHERE y.is_active = 1
            GROUP BY y.yurtid, y.yurt_name, y.location, y.description, y.is_active, y.created_at
            ORDER BY y.created_at DESC
        `);
        // Parse the admins JSON
        const yurtsWithAdmins = yurts.map((yurt) => {
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
    }
    catch (error) {
        console.error('❌ Error fetching yurts with admins:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
exports.getAllYurtsWithAdmins = getAllYurtsWithAdmins;
/**
 * Get system statistics (Super-admin only)
 * Returns overview of the entire system
 */
const getSystemStatistics = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const Yurt = sequelize_2.sequelize.models.YurtSequelize;
        const User = sequelize_2.sequelize.models.UserSequelize;
        const Student = sequelize_2.sequelize.models.StudentSequelize;
        const ReferenceCode = sequelize_2.sequelize.models.ReferenceCode;
        // Count all active yurts
        const totalYurts = yield Yurt.count({ where: { is_active: true } });
        // Count users by role
        const totalAdmins = yield User.count({ where: { role_name: 'admin' } });
        const totalHocas = yield User.count({ where: { role_name: 'hoca' } });
        const totalYoklamaci = yield User.count({ where: { role_name: 'yoklamaci' } });
        // Count total students
        const totalStudents = yield Student.count();
        // Count reference codes
        const totalReferenceCodes = yield ReferenceCode.count();
        const activeReferenceCodes = yield ReferenceCode.count({
            where: {
                isUsed: false,
                expiresAt: { [sequelize_1.Op.gt]: new Date() }
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
    }
    catch (error) {
        console.error('❌ Error fetching system statistics:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
exports.getSystemStatistics = getSystemStatistics;
