// backend/websocket/socketServer.ts
import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { socketAuthMiddleware } from './middleware/socketAuth';
import { setupAttendanceSocket } from './attendanceSocket';
import { setupPresenceSocket } from './presenceSocket';

export function initializeWebSocket(httpServer: HttpServer) {
    const io = new SocketIOServer(httpServer, {
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:3000',
            methods: ['GET', 'POST'],
            credentials: true
        },
        transports: ['websocket', 'polling']
    });

    // Apply authentication middleware
    io.use(socketAuthMiddleware);

    // Connection handler
    io.on('connection', (socket) => {
        const user = (socket as any).user;
        console.log(`✅ User connected: ${user.username} (${user.userid}) via Socket ${socket.id}`);

        // Join user to their personal room
        socket.join(`user:${user.userid}`);

        // Setup attendance event handlers
        setupAttendanceSocket(io, socket);

        // Setup presence tracking handlers
        setupPresenceSocket(io, socket);

        // Handle disconnection
        socket.on('disconnect', () => {
            console.log(`❌ User disconnected: ${user.username} (Socket ${socket.id})`);
        });

        // Handle errors
        socket.on('error', (error) => {
            console.error(`Socket error for user ${user.username}:`, error);
        });
    });

    console.log('🔌 WebSocket server initialized');
    return io;
}
