"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = exports.requireRoles = exports.authenticateJWT = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: 'No token provided' });
    }
    const token = authHeader.split(' ')[1]; // Format: "Bearer <token>"
    if (!token) {
        return res.status(401).json({ message: 'Malformed token' });
    }
    jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'supersecretkey', (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid or expired token' });
        }
        // Attach user info to the request
        req.user = decoded;
        next();
    });
};
exports.authenticateJWT = authenticateJWT;
const requireRoles = (roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Forbidden: Insufficient role' });
        }
        next();
    };
};
exports.requireRoles = requireRoles;
// Helper middleware for admin-only routes
const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden: Admin access required' });
    }
    next();
};
exports.requireAdmin = requireAdmin;
