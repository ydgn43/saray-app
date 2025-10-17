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
exports.login = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../data/models/User")); // Adjust path if needed
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password } = req.body;
    try {
        // 1. Find user by username
        const user = yield User_1.default.findOne({ where: { username } });
        if (!user) {
            return res.status(401).json({ message: 'Invalid username or password.' });
        }
        // 2. Compare password with hashed password
        const valid = yield bcrypt_1.default.compare(password, user.password);
        if (!valid) {
            return res.status(401).json({ message: 'Invalid username or password.' });
        }
        // 3. Create JWT
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error('JWT_SECRET environment variable is not defined.');
        }
        const token = jsonwebtoken_1.default.sign({ accountid: user.accountid, username: user.username, role: user.role_name }, jwtSecret, { expiresIn: '7d' });
        // 4. Send token and user info
        res.json({
            token,
            user: { accountid: user.accountid, username: user.username, role: user.role_name }
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error', error: error instanceof Error ? error.message : error });
    }
});
exports.login = login;
