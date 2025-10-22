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
exports.signup = exports.login = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const referenceCodeController_1 = require("./referenceCodeController");
const sequelize_1 = require("../data/sequelize");
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password } = req.body;
    console.log('🔐 Login attempt:', { username, timestamp: new Date().toISOString() });
    try {
        const User = sequelize_1.sequelize.models.UserSequelize;
        // 1. Find user by username
        const user = yield User.findOne({ where: { username } });
        console.log('🔍 User lookup result:', user ? 'FOUND' : 'NOT FOUND');
        if (!user) {
            console.log('❌ Login failed: User not found');
            return res.status(401).json({ message: 'Geçersiz kullanıcı adı veya şifre.' });
        }
        console.log('🔍 User found in database:', {
            accountid: user.accountid,
            username: user.username,
            role_name: user.role_name,
            studentid: user.studentid
        });
        // 2. Compare password with hashed password
        const valid = yield bcrypt_1.default.compare(password, user.password);
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
        const token = jsonwebtoken_1.default.sign({ accountid: user.accountid, username: user.username, role: user.role_name }, jwtSecret, { expiresIn: '7d' });
        const responseData = {
            token,
            user: {
                accountid: user.accountid,
                username: user.username,
                role: user.role_name,
                studentid: user.studentid || null
            }
        };
        console.log('✅ Login response:', responseData);
        // 4. Send token and user info
        res.json(responseData);
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error', error: error instanceof Error ? error.message : error });
    }
});
exports.login = login;
const signup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password, referenceCode } = req.body;
    console.log('🔵 Signup request received:', { username, referenceCode });
    try {
        const User = sequelize_1.sequelize.models.UserSequelize;
        const ReferenceCode = sequelize_1.sequelize.models.ReferenceCode;
        const Role = sequelize_1.sequelize.models.RoleSequelize;
        const Student = sequelize_1.sequelize.models.StudentSequelize;
        // 1. Validate required fields
        if (!username || !password || !referenceCode) {
            console.log('Missing required fields');
            return res.status(400).json({ message: 'All fields are required' });
        }
        // 2. Check if username already exists
        const existingUser = yield User.findOne({ where: { username } });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists' });
        }
        // 3. Check if this is a student-specific reference code
        const student = yield Student.findOne({
            where: { reference_code: referenceCode.toUpperCase() }
        });
        console.log('🔍 Looking for student with reference code:', referenceCode.toUpperCase());
        console.log('Student found:', student ? {
            studentid: student.studentid,
            name: `${student.first_name} ${student.last_name}`,
            reference_code: student.reference_code
        } : 'NOT FOUND');
        let roleToAssign = 'talebe'; // Default for student codes
        let linkedStudentId = null;
        if (student) {
            // This is a student-specific code
            console.log('✅ Student reference code detected:', { studentId: student.studentid, code: referenceCode });
            linkedStudentId = student.studentid;
        }
        else {
            // 3b. Check if it's a regular reference code (for other roles)
            const refCode = yield ReferenceCode.findOne({
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
            const role = yield Role.findOne({ where: { role_name: refCode.roleId } });
            console.log('Role found:', role ? 'YES' : 'NO');
            if (!role) {
                console.log('Invalid role associated with reference code');
                return res.status(400).json({ message: 'Invalid role associated with reference code' });
            }
            roleToAssign = refCode.roleId;
        }
        // 5. Hash password
        const hashedPassword = yield bcrypt_1.default.hash(password, 10);
        // 6. Create new user with auto-linked studentid if applicable
        const newUser = yield User.create({
            username,
            password: hashedPassword,
            role_name: roleToAssign,
            studentid: linkedStudentId
        });
        console.log('✅ User created:', { accountid: newUser.accountid, role: roleToAssign, linkedStudent: linkedStudentId });
        // 7. Mark reference code as used (only for non-student codes)
        if (!student) {
            yield (0, referenceCodeController_1.markCodeAsUsed)(referenceCode.toUpperCase(), newUser.accountid);
        }
        // 8. Create JWT token
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error('JWT_SECRET environment variable is not defined.');
        }
        const token = jsonwebtoken_1.default.sign({ accountid: newUser.accountid, username: newUser.username, role: newUser.role_name }, jwtSecret, { expiresIn: '7d' });
        // 9. Send response
        console.log('Signup successful! Sending response...');
        res.status(201).json({
            message: 'User created successfully',
            token,
            user: {
                accountid: newUser.accountid,
                username: newUser.username,
                role: newUser.role_name,
                studentid: newUser.studentid || null
            },
        });
    }
    catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ message: 'Server error', error: error instanceof Error ? error.message : error });
    }
});
exports.signup = signup;
