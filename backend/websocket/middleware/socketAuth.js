"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.socketAuthMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const socketAuthMiddleware = (socket, next) => {
    try {
        // Get token from handshake auth or query
        const token = socket.handshake.auth.token || socket.handshake.query.token;
        if (!token) {
            return next(new Error('Authentication error: No token provided'));
        }
        // Verify JWT token
        const secret = process.env.JWT_SECRET || 'saray-app';
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        // Attach user info to socket
        socket.user = decoded;
        console.log(`🔐 Socket authenticated: ${decoded.username} (${decoded.role})`);
        next();
    }
    catch (error) {
        console.error('Socket authentication failed:', error);
        next(new Error('Authentication error: Invalid token'));
    }
};
exports.socketAuthMiddleware = socketAuthMiddleware;
