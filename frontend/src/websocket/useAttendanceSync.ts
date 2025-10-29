import { useEffect, useCallback } from 'react';
import { useSocket } from './SocketProvider';

interface AttendanceUpdatePayload {
    studentid: number;
    attendancetypeid: number;
    date: string;
    program_name: string;
    sebep?: string;
    updatedBy: string;
    timestamp: string;
}

interface AttendanceCreatePayload {
    attendance: {
        studentid: number;
        attendancetypeid: number;
        date: string;
        program_name: string;
    };
    createdBy: string;
    timestamp: string;
}

interface AttendanceBulkSavePayload {
    date: string;
    program_name: string;
    count: number;
    savedBy: string;
    timestamp: string;
}

interface UseAttendanceSyncOptions {
    currentDate?: string;
    currentProgram?: string;
    onAttendanceUpdate?: (data: AttendanceUpdatePayload) => void;
    onAttendanceCreate?: (data: AttendanceCreatePayload) => void;
    onBulkSave?: (data: AttendanceBulkSavePayload) => void;
    onUserJoined?: (data: { username: string; userCount: number }) => void;
    onUserLeft?: (data: { username: string; userCount: number }) => void;
}

export const useAttendanceSync = (options: UseAttendanceSyncOptions = {}) => {
    const { socket, isConnected, emit, on, off } = useSocket();
    const {
        currentDate,
        currentProgram,
        onAttendanceUpdate,
        onAttendanceCreate,
        onBulkSave,
        onUserJoined,
        onUserLeft,
    } = options;

    // Join attendance session
    const joinSession = useCallback((date: string, program_name: string) => {
        if (isConnected) {
            emit('attendance:join-session', { date, program_name });
            console.log(`🔌 Joined attendance session: ${date} - Program ${program_name}`);
        }
    }, [isConnected, emit]);

    // Leave attendance session
    const leaveSession = useCallback((date: string, program_name: string) => {
        if (isConnected) {
            emit('attendance:leave-session', { date, program_name });
            console.log(`🔌 Left attendance session: ${date} - Program ${program_name}`);
        }
    }, [isConnected, emit]);

    // Broadcast attendance update
    const broadcastUpdate = useCallback((
        studentid: number,
        attendancetypeid: number,
        date: string,
        program_name: string,
        sebep?: string
    ) => {
        if (isConnected) {
            emit('attendance:update', {
                studentid,
                attendancetypeid,
                date,
                program_name,
                sebep,
            });
            console.log(`📡 Broadcast attendance update:`, { studentid, attendancetypeid, date, program_name, sebep });
        } else {
            console.warn('⚠️ Cannot broadcast update - not connected');
        }
    }, [isConnected, emit]);

    // Broadcast attendance creation
    const broadcastCreate = useCallback((attendance: {
        studentid: number;
        attendancetypeid: number;
        date: string;
        program_name: string;
    }) => {
        if (isConnected) {
            emit('attendance:create', attendance);
            console.log(`📡 Broadcast attendance create:`, attendance);
        } else {
            console.warn('⚠️ Cannot broadcast create - not connected');
        }
    }, [isConnected, emit]);

    // Broadcast bulk save
    const broadcastBulkSave = useCallback((date: string, program_name: string, count: number) => {
        if (isConnected) {
            emit('attendance:bulk-save', { date, program_name, count });
            console.log(`📡 Broadcast bulk save: ${count} records for ${date} - Program ${program_name}`);
        }
    }, [isConnected, emit]);

    // Listen for attendance updates
    useEffect(() => {
        if (!socket || !onAttendanceUpdate) return;

        const handleUpdate = (data: AttendanceUpdatePayload) => {
            console.log('📥 Received attendance update:', data);
            onAttendanceUpdate(data);
        };

        on('attendance:updated', handleUpdate);

        return () => {
            off('attendance:updated', handleUpdate);
        };
    }, [socket, on, off, onAttendanceUpdate]);

    // Listen for attendance creation
    useEffect(() => {
        if (!socket || !onAttendanceCreate) return;

        const handleCreate = (data: AttendanceCreatePayload) => {
            console.log('📥 Received attendance create:', data);
            onAttendanceCreate(data);
        };

        on('attendance:created', handleCreate);

        return () => {
            off('attendance:created', handleCreate);
        };
    }, [socket, on, off, onAttendanceCreate]);

    // Listen for bulk save
    useEffect(() => {
        if (!socket || !onBulkSave) return;

        const handleBulkSave = (data: AttendanceBulkSavePayload) => {
            console.log('📥 Received bulk save notification:', data);
            onBulkSave(data);
        };

        on('attendance:bulk-saved', handleBulkSave);

        return () => {
            off('attendance:bulk-saved', handleBulkSave);
        };
    }, [socket, on, off, onBulkSave]);

    // Listen for user joined
    useEffect(() => {
        if (!socket || !onUserJoined) return;

        const handleUserJoined = (data: { username: string; userCount: number }) => {
            console.log('👤 User joined session:', data);
            onUserJoined(data);
        };

        on('attendance:user-joined', handleUserJoined);

        return () => {
            off('attendance:user-joined', handleUserJoined);
        };
    }, [socket, on, off, onUserJoined]);

    // Listen for user left
    useEffect(() => {
        if (!socket || !onUserLeft) return;

        const handleUserLeft = (data: { username: string; userCount: number }) => {
            console.log('👤 User left session:', data);
            onUserLeft(data);
        };

        on('attendance:user-left', handleUserLeft);

        return () => {
            off('attendance:user-left', handleUserLeft);
        };
    }, [socket, on, off, onUserLeft]);

    // Auto join/leave session when date or program changes
    useEffect(() => {
        console.log('🔍 Auto join/leave check:', {
            currentDate,
            currentProgram,
            isConnected,
            shouldJoin: !!(currentDate && currentProgram && isConnected)
        });

        if (!currentDate || !currentProgram || !isConnected) return;

        joinSession(currentDate, currentProgram);

        return () => {
            leaveSession(currentDate, currentProgram);
        };
    }, [currentDate, currentProgram, isConnected, joinSession, leaveSession]);

    return {
        isConnected,
        joinSession,
        leaveSession,
        broadcastUpdate,
        broadcastCreate,
        broadcastBulkSave,
    };
};
