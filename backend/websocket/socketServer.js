"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeWebSocket = void 0;
// backend/websocket/socketServer.ts
const socket_io_1 = require("socket.io");
const socketAuth_1 = require("./middleware/socketAuth");
const attendanceSocket_1 = require("./attendanceSocket");
const presenceSocket_1 = require("./presenceSocket");
function initializeWebSocket(httpServer) {
    const io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:3000',
            methods: ['GET', 'POST'],
            credentials: true
        },
        transports: ['websocket', 'polling']
    });
    // Apply authentication middleware
    io.use(socketAuth_1.socketAuthMiddleware);
    // Connection handler
    io.on('connection', (socket) => {
        const user = socket.user;
        console.log(`✅ User connected: ${user.username} (${user.userid}) via Socket ${socket.id}`);
        // Join user to their personal room
        socket.join(`user:${user.userid}`);
        // Setup attendance event handlers
        (0, attendanceSocket_1.setupAttendanceSocket)(io, socket);
        // Setup presence tracking handlers
        (0, presenceSocket_1.setupPresenceSocket)(io, socket);
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
exports.initializeWebSocket = initializeWebSocket;
