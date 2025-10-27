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
exports.generatePasswordResetToken = exports.resetPassword = exports.requestPasswordReset = exports.signup = exports.login = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const referenceCodeController_1 = require("./referenceCodeController");
const sequelize_1 = require("../data/sequelize");
const sequelize_2 = require("sequelize");
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
            studentid: user.studentid,
            yurtid: user.yurtid
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
        const token = jsonwebtoken_1.default.sign({
            accountid: user.accountid,
            username: user.username,
            role: user.role_name,
            yurtid: user.yurtid
        }, jwtSecret, { expiresIn: '7d' });
        // Get user's yurt information using raw query to avoid association issues
        const [userYurtsRaw] = yield sequelize_1.sequelize.query(`
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
        const availableYurts = userYurtsRaw.map((uy) => ({
            yurtId: uy.yurtid,
            yurtName: uy.yurt_name,
            location: uy.location,
            description: uy.description,
            isActive: uy.is_active === 1,
            isPrimary: uy.is_primary === 1,
            assignedAt: uy.assigned_at
        }));
        const primaryYurt = availableYurts.find((y) => y.isPrimary) || availableYurts[0] || null;
        const responseData = {
            token,
            user: {
                accountid: user.accountid,
                username: user.username,
                role: user.role_name,
                studentid: user.studentid || null,
                yurtid: (primaryYurt === null || primaryYurt === void 0 ? void 0 : primaryYurt.yurtId) || user.yurtid
            },
            yurtName: (primaryYurt === null || primaryYurt === void 0 ? void 0 : primaryYurt.yurtName) || null,
            availableYurts: availableYurts,
            selectedYurt: primaryYurt
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
        }
        else {
            // 3b. Check if it's a regular reference code (for other roles)
            const refCode = yield ReferenceCode.findOne({
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
            const role = yield Role.findOne({ where: { role_name: refCode.roleId } });
            console.log('Role found:', role ? 'YES' : 'NO');
            if (!role) {
                console.log('Invalid role associated with reference code');
                return res.status(400).json({ message: 'Invalid role associated with reference code' });
            }
            roleToAssign = refCode.roleId;
            assignedYurtId = refCode.yurtid;
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
        console.log('✅ User created:', { accountid: newUser.accountid, role: roleToAssign, linkedStudent: linkedStudentId, yurtid: assignedYurtId });
        // 7. Special handling for admin users
        if (roleToAssign === 'admin') {
            console.log('🏢 Admin user detected');
            // Only create a new yurt if no yurt is assigned yet (e.g., for super-admin created codes without yurt)
            if (!assignedYurtId) {
                console.log('🏢 No yurt assigned, creating new yurt for admin:', newUser.username);
                const Yurt = sequelize_1.sequelize.models.YurtSequelize;
                const newYurt = yield Yurt.create({
                    yurt_name: `${newUser.username}_yurt`,
                    location: null,
                    description: `Yurt for admin ${newUser.username}`,
                    is_active: true
                });
                assignedYurtId = newYurt.yurtid;
                console.log('✅ Yurt created for admin:', { yurtid: newYurt.yurtid, yurt_name: newYurt.yurt_name });
            }
            else {
                console.log('✅ Admin will be assigned to existing yurt:', assignedYurtId);
            }
        }
        // 8. Assign user to yurt
        const UserYurt = sequelize_1.sequelize.models.UserYurt;
        if (assignedYurtId) {
            yield UserYurt.create({
                accountid: newUser.accountid,
                yurtid: assignedYurtId,
                is_primary: true,
                assigned_at: new Date()
            });
            console.log('✅ User assigned to yurt:', assignedYurtId);
        }
        else {
            // Fallback: assign to default yurt (ID 1) if no yurt specified
            yield UserYurt.create({
                accountid: newUser.accountid,
                yurtid: 1,
                is_primary: true,
                assigned_at: new Date()
            });
            console.log('⚠️ No yurt specified, assigned to default yurt (ID 1)');
        }
        // 9. Mark reference code as used (only for non-student codes)
        if (!student) {
            yield (0, referenceCodeController_1.markCodeAsUsed)(referenceCode.toUpperCase(), newUser.accountid);
        }
        // 10. Get user's yurt information using raw query to avoid association issues
        const [userYurtsRaw] = yield sequelize_1.sequelize.query(`
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
        const availableYurts = userYurtsRaw.map((uy) => ({
            yurtId: uy.yurtid,
            yurtName: uy.yurt_name,
            location: uy.location,
            description: uy.description,
            isActive: uy.is_active === 1,
            isPrimary: uy.is_primary === 1,
            assignedAt: uy.assigned_at
        }));
        const primaryYurt = availableYurts.find((y) => y.isPrimary) || availableYurts[0];
        // 10. Create JWT token
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error('JWT_SECRET environment variable is not defined.');
        }
        const token = jsonwebtoken_1.default.sign({ accountid: newUser.accountid, username: newUser.username, role: newUser.role_name, yurtid: primaryYurt === null || primaryYurt === void 0 ? void 0 : primaryYurt.yurtId }, jwtSecret, { expiresIn: '7d' });
        // 11. Send response
        console.log('✅ Signup successful! Response data:', {
            username: newUser.username,
            role: newUser.role_name,
            yurtName: primaryYurt === null || primaryYurt === void 0 ? void 0 : primaryYurt.yurtName,
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
                yurtid: primaryYurt === null || primaryYurt === void 0 ? void 0 : primaryYurt.yurtId
            },
            yurtName: primaryYurt === null || primaryYurt === void 0 ? void 0 : primaryYurt.yurtName,
            availableYurts: availableYurts,
            selectedYurt: primaryYurt
        });
    }
    catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ message: 'Server error', error: error instanceof Error ? error.message : error });
    }
});
exports.signup = signup;
// Request password reset - creates a pending request (admin approval required)
const requestPasswordReset = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username } = req.body;
    console.log('🔐 Password reset request:', { username, timestamp: new Date().toISOString() });
    try {
        const User = sequelize_1.sequelize.models.UserSequelize;
        // Find user by username
        const user = yield User.findOne({ where: { username } });
        if (!user) {
            // Don't reveal whether user exists or not for security
            return res.status(200).json({
                message: 'Şifre sıfırlama talebiniz alındı. Lütfen yöneticinizle iletişime geçin.',
                requestSubmitted: true
            });
        }
        // Check if there's already a pending reset request (within last 24 hours)
        if (user.resetTokenExpiry && new Date() < new Date(user.resetTokenExpiry)) {
            return res.status(200).json({
                message: 'Zaten aktif bir şifre sıfırlama talebiniz var. Lütfen yöneticinizle iletişime geçin.',
                requestSubmitted: true
            });
        }
        // Mark that user has requested a reset (but don't generate token yet)
        // Set a flag that admin can see
        yield User.update({
            resetToken: 'PENDING_ADMIN_APPROVAL',
            resetTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }, { where: { accountid: user.accountid } });
        console.log('✅ Password reset request submitted for admin approval:', {
            username: user.username,
            accountid: user.accountid
        });
        res.status(200).json({
            message: 'Şifre sıfırlama talebiniz alındı. Yöneticiniz en kısa sürede size yardımcı olacaktır.',
            requestSubmitted: true,
            note: 'Lütfen yöneticinizle iletişime geçin.'
        });
    }
    catch (error) {
        console.error('Password reset request error:', error);
        res.status(500).json({ message: 'Sunucu hatası', error: error instanceof Error ? error.message : error });
    }
}); // Reset password using token
exports.requestPasswordReset = requestPasswordReset;
const resetPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, resetToken, newPassword } = req.body;
    console.log('🔐 Password reset attempt:', { username, timestamp: new Date().toISOString() });
    try {
        if (!username || !resetToken || !newPassword) {
            return res.status(400).json({ message: 'Kullanıcı adı, sıfırlama kodu ve yeni şifre gereklidir' });
        }
        if (newPassword.length < 4) {
            return res.status(400).json({ message: 'Şifre en az 4 karakter olmalıdır' });
        }
        const User = sequelize_1.sequelize.models.UserSequelize;
        // Find user by username
        const user = yield User.findOne({ where: { username } });
        if (!user) {
            return res.status(401).json({ message: 'Geçersiz kullanıcı adı veya sıfırlama kodu' });
        }
        // Check if reset token exists
        if (!user.resetToken || !user.resetTokenExpiry) {
            return res.status(401).json({ message: 'Geçersiz veya süresi dolmuş sıfırlama kodu' });
        }
        // Check if token is expired
        if (new Date() > new Date(user.resetTokenExpiry)) {
            // Clear expired token
            yield User.update({ resetToken: null, resetTokenExpiry: null }, { where: { accountid: user.accountid } });
            return res.status(401).json({ message: 'Sıfırlama kodunun süresi dolmuş. Lütfen yeni bir kod talep edin' });
        }
        // Verify the reset token
        const tokenValid = yield bcrypt_1.default.compare(resetToken, user.resetToken);
        if (!tokenValid) {
            return res.status(401).json({ message: 'Geçersiz sıfırlama kodu' });
        }
        // Hash the new password
        const hashedPassword = yield bcrypt_1.default.hash(newPassword, 10);
        // Update password and clear reset token
        yield User.update({
            password: hashedPassword,
            resetToken: null,
            resetTokenExpiry: null
        }, { where: { accountid: user.accountid } });
        console.log('✅ Password successfully reset for user:', {
            username: user.username,
            accountid: user.accountid
        });
        res.status(200).json({
            message: 'Şifreniz başarıyla sıfırlandı. Şimdi giriş yapabilirsiniz',
            success: true
        });
    }
    catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({ message: 'Sunucu hatası', error: error instanceof Error ? error.message : error });
    }
});
exports.resetPassword = resetPassword;
// Admin-only: Generate password reset token for a user
const generatePasswordResetToken = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username } = req.body;
    const adminUser = req.user; // From JWT middleware (using proper typing)
    console.log('🔐 Admin generating password reset token:', {
        username,
        adminUser: adminUser,
        adminUsername: adminUser === null || adminUser === void 0 ? void 0 : adminUser.username,
        adminRole: adminUser === null || adminUser === void 0 ? void 0 : adminUser.role,
        hasUser: !!req.user,
        timestamp: new Date().toISOString()
    });
    try {
        // Verify admin role
        if (!adminUser) {
            console.log('❌ No admin user found in request');
            return res.status(403).json({ message: 'Bu işlem için yetkiniz yok - Kullanıcı bilgisi bulunamadı' });
        }
        console.log('✅ User authenticated, role:', adminUser.role);
        // Check if user is admin or super-admin (allow both)
        const allowedRoles = ['admin', 'super-admin'];
        if (!allowedRoles.includes(adminUser.role)) {
            console.log('❌ Invalid role:', adminUser.role, 'Expected one of:', allowedRoles);
            return res.status(403).json({
                message: `Bu işlem için yetkiniz yok - Rol: ${adminUser.role}`,
                requiredRoles: allowedRoles
            });
        }
        console.log('✅ Role check passed');
        const User = sequelize_1.sequelize.models.UserSequelize;
        // Find user by username
        const user = yield User.findOne({ where: { username } });
        if (!user) {
            return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
        }
        // If admin (not super-admin), verify user is in same yurt
        if (adminUser.role === 'admin') {
            const userYurts = yield sequelize_1.sequelize.query(`
                SELECT yurtid FROM useryurt WHERE accountid = :accountid
            `, {
                replacements: { accountid: user.accountid },
                type: sequelize_2.QueryTypes.SELECT
            });
            const adminYurtId = req.selectedYurtId;
            console.log('🔍 Yurt boundary check - Admin yurt:', adminYurtId, 'User yurts:', userYurts);
            // Check if user has access to the admin's yurt
            const userHasAccessToYurt = userYurts.some((uy) => uy.yurtid === adminYurtId);
            if (!userHasAccessToYurt) {
                return res.status(403).json({ message: 'Bu kullanıcı için şifre sıfırlama yetkınız yok' });
            }
        }
        // Generate a random 8-character reset token
        const resetToken = Math.random().toString(36).substring(2, 10).toUpperCase();
        // Hash the token before storing
        const hashedToken = yield bcrypt_1.default.hash(resetToken, 10);
        // Set token expiry to 24 hours from now
        const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
        // Store the hashed token and expiry in the user record
        yield User.update({
            resetToken: hashedToken,
            resetTokenExpiry: tokenExpiry
        }, { where: { accountid: user.accountid } });
        console.log('✅ Admin generated password reset token:', {
            username: user.username,
            accountid: user.accountid,
            generatedBy: adminUser.username,
            token: resetToken,
            expiry: tokenExpiry
        });
        res.status(200).json({
            message: 'Şifre sıfırlama kodu oluşturuldu',
            success: true,
            resetToken: resetToken,
            username: user.username,
            expiresAt: tokenExpiry,
            note: 'Bu kodu kullanıcıyla paylaşın. 24 saat geçerlidir.'
        });
    }
    catch (error) {
        console.error('Admin password reset token generation error:', error);
        res.status(500).json({ message: 'Sunucu hatası', error: error instanceof Error ? error.message : error });
    }
});
exports.generatePasswordResetToken = generatePasswordResetToken;
