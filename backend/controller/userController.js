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
            const users = yield User_1.default.findAll({
                attributes: ['accountid', 'username', 'role_name', 'studentid']
            });
            res.json(users); // This sends a JSON array!
        }
        catch (err) {
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
        const { username, password, role_name } = req.body;
        if (!username || !password || !role_name)
            return res.status(400).json({ message: 'Eksik bilgi.' });
        const exists = yield User_1.default.findOne({ where: { username } });
        if (exists)
            return res.status(409).json({ message: 'Kullanıcı adı kullanılıyor.' });
        const hashed = yield bcrypt_1.default.hash(password, 10);
        const newUser = yield User_1.default.create({ username, password: hashed, role_name });
        res.status(201).json({ message: 'Kullanıcı oluşturuldu.', user: { accountid: newUser.accountid, username: newUser.username, role_name: newUser.role_name } });
    });
}
function updateUserById(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (req.user.role !== 'admin')
            return res.status(403).json({ message: 'Yetkiniz yok.' });
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
    });
}
function deleteUserById(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (req.user.role !== 'admin')
            return res.status(403).json({ message: 'Yetkiniz yok.' });
        const user = yield User_1.default.findByPk(req.params.id);
        if (!user)
            return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
        yield user.destroy();
        res.json({ message: 'Kullanıcı silindi.' });
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
