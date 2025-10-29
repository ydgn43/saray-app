"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupAttendanceSocket = void 0;
function setupAttendanceSocket(io, socket) {
    const user = socket.user;
    // Join attendance session rooms
    socket.on('attendance:join-session', ({ date, program_name }) => {
        const roomName = `attendance:${date}:${program_name}`;
        socket.join(roomName);
        console.log(`👥 ${user.username} joined attendance session: ${roomName}`);
        // Notify others in the room with updated user count
        io.in(roomName).allSockets().then(sockets => {
            socket.to(roomName).emit('attendance:user-joined', {
                userid: user.userid,
                username: user.username,
                role: user.role,
                userCount: sockets.size
            });
            // Send current users in the room back to the joiner
            socket.emit('attendance:session-users', {
                count: sockets.size,
                room: roomName,
                userCount: sockets.size
            });
        });
    });
    // Leave attendance session
    socket.on('attendance:leave-session', ({ date, program_name }) => {
        const roomName = `attendance:${date}:${program_name}`;
        socket.leave(roomName);
        console.log(`👋 ${user.username} left attendance session: ${roomName}`);
        // Notify others in the room
        io.in(roomName).allSockets().then(sockets => {
            socket.to(roomName).emit('attendance:user-left', {
                userid: user.userid,
                username: user.username,
                userCount: sockets.size
            });
        });
    });
    // Broadcast attendance update
    socket.on('attendance:update', (payload) => {
        const roomName = `attendance:${payload.date}:${payload.program_name}`;
        // Broadcast to all users in the same attendance session EXCEPT the sender
        socket.to(roomName).emit('attendance:updated', Object.assign(Object.assign({}, payload), { updatedBy: user.username, updatedByUserId: user.userid, timestamp: new Date().toISOString() }));
        console.log(`📡 Attendance update broadcast by ${user.username}: Student ${payload.studentid} → Type ${payload.attendancetypeid}`);
    });
    // Broadcast attendance creation
    socket.on('attendance:create', (payload) => {
        const roomName = `attendance:${payload.date}:${payload.program_name}`;
        socket.to(roomName).emit('attendance:created', {
            attendance: payload,
            createdBy: user.username,
            createdByUserId: user.userid,
            timestamp: new Date().toISOString()
        });
        console.log(`📡 Attendance created broadcast by ${user.username}: Student ${payload.studentid}`);
    });
    // Broadcast bulk save
    socket.on('attendance:bulk-save', (payload) => {
        const roomName = `attendance:${payload.date}:${payload.program_name}`;
        socket.to(roomName).emit('attendance:bulk-saved', Object.assign(Object.assign({}, payload), { savedBy: user.username, savedByUserId: user.userid, timestamp: new Date().toISOString() }));
        console.log(`📡 Bulk save broadcast by ${user.username}: ${payload.count} records`);
    });
}
exports.setupAttendanceSocket = setupAttendanceSocket;
