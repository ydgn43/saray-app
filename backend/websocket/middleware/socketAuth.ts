// backend/websocket/middleware/socketAuth.ts
import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

interface JWTPayload {
    userid: number;
    username: string;
    role: string;
    studentid?: number;
}

export const socketAuthMiddleware = (socket: Socket, next: (err?: Error) => void) => {
    try {
        // Get token from handshake auth or query
        const token = socket.handshake.auth.token || socket.handshake.query.token;

        if (!token) {
            return next(new Error('Authentication error: No token provided'));
        }

        // Verify JWT token
        const secret = process.env.JWT_SECRET || 'saray-app';
        const decoded = jwt.verify(token as string, secret) as JWTPayload;

        // Attach user info to socket
        (socket as any).user = decoded;

        console.log(`🔐 Socket authenticated: ${decoded.username} (${decoded.role})`);
        next();
    } catch (error) {
        console.error('Socket authentication failed:', error);
        next(new Error('Authentication error: Invalid token'));
    }
};
