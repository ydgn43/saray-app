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
exports.userController = void 0;
const User_1 = __importDefault(require("../data/models/User"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const sequelize_1 = require("sequelize");
function getMe(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const user = yield User_1.default.findByPk(req.user.accountid, {
                attributes: ['accountid', 'username', 'role_name']
            });
            if (!user)
                return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
            res.json(user);
        }
        catch (err) {
            res.status(500).json({ message: 'Kullanıcı bilgileri alınamadı.' });
        }
    });
}
function updateMe(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const user = yield User_1.default.findByPk(req.user.accountid);
            if (!user)
                return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
            const { username, password } = req.body;
            if (username)
                user.username = username;
            if (password && password.length > 0)
                user.password = yield bcrypt_1.default.hash(password, 10);
            yield user.save();
            res.json({ message: 'Bilgiler güncellendi.' });
        }
        catch (err) {
            res.status(500).json({ message: 'Bilgiler güncellenemedi.' });
        }
    });
}
function getAllUsers(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const yurtid = req.selectedYurtId;
            const sequelize = User_1.default.sequelize;
            const currentUserRole = req.user.role;
            // Query users who are assigned to this yurt through UserYurt table
            // Exclude super-admin accounts for regular admins
            const users = yield sequelize.query(`
            SELECT DISTINCT u.accountid, u.username, u.role_name, u.studentid
            FROM user u
            INNER JOIN useryurt uy ON u.accountid = uy.accountid
            WHERE uy.yurtid = :yurtid
            ${currentUserRole === 'admin' ? "AND u.role_name != 'super-admin'" : ''}
            ORDER BY u.username
        `, {
                replacements: { yurtid },
                type: sequelize_1.QueryTypes.SELECT
            });
            res.json(users);
        }
        catch (err) {
            console.error('Error fetching users:', err);
            res.status(500).json({ error: 'Failed to fetch users.' });
        }
    });
}
function getUserById(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (req.user.role !== 'admin')
            return res.status(403).json({ message: 'Yetkiniz yok.' });
        try {
            const user = yield User_1.default.findByPk(req.params.id, { attributes: ['accountid', 'username', 'role_name'] });
            if (!user)
                return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
            res.json(user);
        }
        catch (err) {
            res.status(500).json({ error: 'Failed to fetch user.' });
        }
    });
}
function createUser(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (req.user.role !== 'admin')
            return res.status(403).json({ message: 'Yetkiniz yok.' });
        try {
            const { username, password, role_name } = req.body;
            const yurtid = req.selectedYurtId;
            const adminAccountId = req.user.accountid;
            if (!username || !password || !role_name)
                return res.status(400).json({ message: 'Eksik bilgi.' });
            const exists = yield User_1.default.findOne({ where: { username } });
            if (exists)
                return res.status(409).json({ message: 'Kullanıcı adı kullanılıyor.' });
            const hashed = yield bcrypt_1.default.hash(password, 10);
            const newUser = yield User_1.default.create({
                username,
                password: hashed,
                role_name,
                yurtid // Set the yurtid for backwards compatibility
            });
            // Also create UserYurt entry to link user to yurt
            const sequelize = User_1.default.sequelize;
            yield sequelize.query(`
            INSERT INTO useryurt (accountid, yurtid, is_primary, assigned_by, assigned_at)
            VALUES (:accountid, :yurtid, true, :assignedBy, NOW())
        `, {
                replacements: {
                    accountid: newUser.accountid,
                    yurtid,
                    assignedBy: adminAccountId
                }
            });
            res.status(201).json({
                message: 'Kullanıcı oluşturuldu.',
                user: {
                    accountid: newUser.accountid,
                    username: newUser.username,
                    role_name: newUser.role_name
                }
            });
        }
        catch (err) {
            console.error('Error creating user:', err);
            res.status(500).json({ message: 'Kullanıcı oluşturulamadı.' });
        }
    });
}
function updateUserById(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (req.user.role !== 'admin')
            return res.status(403).json({ message: 'Yetkiniz yok.' });
        try {
            const yurtid = req.selectedYurtId;
            const sequelize = User_1.default.sequelize;
            // Check if user belongs to admin's yurt
            const [userCheck] = yield sequelize.query(`
            SELECT u.accountid 
            FROM user u
            INNER JOIN useryurt uy ON u.accountid = uy.accountid
            WHERE u.accountid = :accountid AND uy.yurtid = :yurtid
        `, {
                replacements: { accountid: req.params.id, yurtid },
                type: sequelize_1.QueryTypes.SELECT
            });
            if (!userCheck || userCheck.length === 0) {
                return res.status(403).json({ message: 'Bu kullanıcıyı düzenleme yetkiniz yok.' });
            }
            const user = yield User_1.default.findByPk(req.params.id);
            if (!user)
                return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
            const { username, password, role_name } = req.body;
            if (username)
                user.username = username;
            if (role_name)
                user.role_name = role_name;
            if (password)
                user.password = yield bcrypt_1.default.hash(password, 10);
            yield user.save();
            res.json({ message: 'Kullanıcı güncellendi.' });
        }
        catch (err) {
            console.error('Error updating user:', err);
            res.status(500).json({ message: 'Kullanıcı güncellenemedi.' });
        }
    });
}
function deleteUserById(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (req.user.role !== 'admin')
            return res.status(403).json({ message: 'Yetkiniz yok.' });
        try {
            const yurtid = req.selectedYurtId;
            const sequelize = User_1.default.sequelize;
            // Check if user belongs to admin's yurt
            const [userCheck] = yield sequelize.query(`
            SELECT u.accountid 
            FROM user u
            INNER JOIN useryurt uy ON u.accountid = uy.accountid
            WHERE u.accountid = :accountid AND uy.yurtid = :yurtid
        `, {
                replacements: { accountid: req.params.id, yurtid },
                type: sequelize_1.QueryTypes.SELECT
            });
            if (!userCheck || userCheck.length === 0) {
                return res.status(403).json({ message: 'Bu kullanıcıyı silme yetkiniz yok.' });
            }
            const user = yield User_1.default.findByPk(req.params.id);
            if (!user)
                return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
            // Delete UserYurt entries first
            yield sequelize.query(`
            DELETE FROM useryurt WHERE accountid = :accountid
        `, {
                replacements: { accountid: req.params.id }
            });
            yield user.destroy();
            res.json({ message: 'Kullanıcı silindi.' });
        }
        catch (err) {
            console.error('Error deleting user:', err);
            res.status(500).json({ message: 'Kullanıcı silinemedi.' });
        }
    });
}
exports.userController = {
    getMe,
    updateMe,
    getAllUsers,
    getUserById,
    createUser,
    updateUserById,
    deleteUserById,
};
