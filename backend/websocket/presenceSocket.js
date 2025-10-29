"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupPresenceSocket = void 0;
// Track users in each room by socketId (not userid, to allow same user multiple times)
const roomUsers = new Map();
function setupPresenceSocket(io, socket) {
    const user = socket.user;
    // User joins a presence room (e.g., viewing specific attendance page)
    socket.on('presence:join-room', ({ roomName }) => {
        socket.join(roomName);
        // Add user to room tracking - key by socketId to allow same user multiple times
        if (!roomUsers.has(roomName)) {
            roomUsers.set(roomName, new Map());
        }
        const usersInRoom = roomUsers.get(roomName);
        usersInRoom.set(socket.id, {
            userid: user.userid,
            username: user.username,
            role: user.role,
            socketId: socket.id
        });
        // Get current user list
        const userList = Array.from(usersInRoom.values()).map(u => ({
            userid: u.userid,
            username: u.username,
            role: u.role
        }));
        // Notify all users in the room about updated user list
        io.in(roomName).emit('presence:user-list', {
            roomName,
            users: userList,
            userCount: userList.length
        });
        console.log(`👤 ${user.username} joined room ${roomName}. Total users: ${userList.length}`);
    });
    // User leaves a presence room
    socket.on('presence:leave-room', ({ roomName }) => {
        socket.leave(roomName);
        // Remove user from room tracking by socketId
        const usersInRoom = roomUsers.get(roomName);
        if (usersInRoom) {
            usersInRoom.delete(socket.id);
            // Get updated user list
            const userList = Array.from(usersInRoom.values()).map(u => ({
                userid: u.userid,
                username: u.username,
                role: u.role
            }));
            // Clean up empty rooms
            if (usersInRoom.size === 0) {
                roomUsers.delete(roomName);
            }
            // Notify remaining users
            io.in(roomName).emit('presence:user-list', {
                roomName,
                users: userList,
                userCount: userList.length
            });
            console.log(`👤 ${user.username} left room ${roomName}. Remaining users: ${userList.length}`);
        }
    });
    // Handle disconnect - remove user from all rooms
    socket.on('disconnect', () => {
        // Remove user from all rooms they were in (by socketId)
        roomUsers.forEach((usersInRoom, roomName) => {
            if (usersInRoom.has(socket.id)) {
                usersInRoom.delete(socket.id);
                // Get updated user list
                const userList = Array.from(usersInRoom.values()).map(u => ({
                    userid: u.userid,
                    username: u.username,
                    role: u.role
                }));
                // Clean up empty rooms
                if (usersInRoom.size === 0) {
                    roomUsers.delete(roomName);
                }
                else {
                    // Notify remaining users
                    io.in(roomName).emit('presence:user-list', {
                        roomName,
                        users: userList,
                        userCount: userList.length
                    });
                }
                console.log(`👤 ${user.username} disconnected from room ${roomName}. Remaining users: ${userList.length}`);
            }
        });
    });
}
exports.setupPresenceSocket = setupPresenceSocket;
