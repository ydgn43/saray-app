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
exports.markCodeAsUsed = exports.deactivateReferenceCode = exports.validateReferenceCode = exports.getAllReferenceCodes = exports.createReferenceCode = void 0;
const sequelize_1 = require("sequelize");
const crypto_1 = __importDefault(require("crypto"));
const sequelize_2 = require("../data/sequelize");
// Generate a unique reference code
const generateUniqueCode = () => {
    return crypto_1.default.randomBytes(4).toString('hex').toUpperCase();
};
// Create a new reference code (Admin only)
const createReferenceCode = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { roleId, expiresAt, maxUses, description } = req.body;
        const yurtid = req.selectedYurtId; // Get from middleware instead of header
        console.log('📝 Creating reference code:');
        console.log('   - selectedYurtId:', yurtid);
        console.log('   - roleId from body:', roleId);
        const ReferenceCode = sequelize_2.sequelize.models.ReferenceCode;
        const Role = sequelize_2.sequelize.models.RoleSequelize;
        // Map frontend role names to database role names
        const roleMapping = {
            'Teacher': 'hoca',
            'Tracker': 'yoklamaci',
            'Student': 'talebe',
            'Admin': 'admin'
        };
        const dbRoleName = roleMapping[roleId] || roleId.toLowerCase();
        console.log('   - Mapped role:', roleId, '→', dbRoleName);
        // Validate role exists
        const role = yield Role.findOne({ where: { role_name: dbRoleName } });
        if (!role) {
            console.error('Role not found in database:', dbRoleName);
            return res.status(404).json({ message: `Role not found: ${dbRoleName}. Please ensure the role exists in the database.` });
        }
        console.log('Role found:', role.get('role_name'));
        // Generate unique code
        let code = generateUniqueCode();
        let exists = yield ReferenceCode.findOne({ where: { code } });
        // Regenerate if code already exists
        while (exists) {
            code = generateUniqueCode();
            exists = yield ReferenceCode.findOne({ where: { code } });
        }
        // Parse expiration date from frontend
        const expirationDate = new Date(expiresAt);
        // Create reference code
        const referenceCode = yield ReferenceCode.create({
            code,
            roleId: dbRoleName,
            createdBy: req.user.accountid,
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
    }
    catch (error) {
        console.error('Error creating reference code:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
exports.createReferenceCode = createReferenceCode;
// Get all reference codes (Admin only)
const getAllReferenceCodes = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { status, roleName } = req.query;
        const ReferenceCode = sequelize_2.sequelize.models.ReferenceCode;
        const whereClause = {};
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
        // Filter by role
        if (roleName) {
            whereClause.roleId = roleName;
        }
        const referenceCodes = yield ReferenceCode.findAll({
            where: whereClause,
            order: [['createdAt', 'DESC']],
        });
        res.json(referenceCodes);
    }
    catch (error) {
        console.error('Error fetching reference codes:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
exports.getAllReferenceCodes = getAllReferenceCodes;
// Validate a reference code (Public endpoint for signup)
const validateReferenceCode = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { code } = req.params;
        const ReferenceCode = sequelize_2.sequelize.models.ReferenceCode;
        const referenceCode = yield ReferenceCode.findOne({
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
    }
    catch (error) {
        console.error('Error validating reference code:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
exports.validateReferenceCode = validateReferenceCode;
// Deactivate a reference code (Admin only)
const deactivateReferenceCode = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const ReferenceCode = sequelize_2.sequelize.models.ReferenceCode;
        const referenceCode = yield ReferenceCode.findByPk(id);
        if (!referenceCode) {
            return res.status(404).json({ message: 'Reference code not found' });
        }
        // Permanently delete the reference code
        yield referenceCode.destroy();
        res.json({ message: 'Reference code deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting reference code:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
exports.deactivateReferenceCode = deactivateReferenceCode;
// Mark reference code as used (internal use)
const markCodeAsUsed = (code, userId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const ReferenceCode = sequelize_2.sequelize.models.ReferenceCode;
        const referenceCode = yield ReferenceCode.findOne({ where: { code: code.toUpperCase() } });
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
        yield referenceCode.save();
        return true;
    }
    catch (error) {
        console.error('Error marking code as used:', error);
        return false;
    }
});
exports.markCodeAsUsed = markCodeAsUsed;
