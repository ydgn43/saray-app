import { useEffect, useState, useCallback } from 'react';
import { useSocket } from './SocketProvider';

export interface ActiveUser {
    userid: number;
    username: string;
    role: string;
}

interface PresenceUserListPayload {
    roomName: string;
    users: ActiveUser[];
    userCount: number;
}

interface UsePresenceProps {
    roomName?: string; // e.g., "attendance:2025-10-29:sabah_namazi"
}

export function usePresence({ roomName }: UsePresenceProps) {
    const { socket, isConnected, emit, on, off } = useSocket();
    const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
    const [userCount, setUserCount] = useState(0);

    // Join presence room
    const joinRoom = useCallback((room: string) => {
        if (isConnected && room) {
            emit('presence:join-room', { roomName: room });
            console.log(`👥 Joined presence room: ${room}`);
        }
    }, [isConnected, emit]);

    // Leave presence room
    const leaveRoom = useCallback((room: string) => {
        if (isConnected && room) {
            emit('presence:leave-room', { roomName: room });
            console.log(`👥 Left presence room: ${room}`);
        }
    }, [isConnected, emit]);

    // Listen for user list updates
    useEffect(() => {
        if (!socket) return;

        const handleUserList = (data: PresenceUserListPayload) => {
            console.log('👥 Presence user list updated:', data);
            setActiveUsers(data.users);
            setUserCount(data.userCount);
        };

        on('presence:user-list', handleUserList);

        return () => {
            off('presence:user-list', handleUserList);
        };
    }, [socket, on, off]);

    // Auto join/leave room when roomName changes
    useEffect(() => {
        if (!isConnected || !roomName) return;

        joinRoom(roomName);

        // Leave room on cleanup
        return () => {
            leaveRoom(roomName);
        };
    }, [isConnected, roomName, joinRoom, leaveRoom]);

    return {
        activeUsers,
        userCount,
        joinRoom,
        leaveRoom,
        isConnected
    };
}
