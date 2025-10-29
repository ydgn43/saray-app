import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
    emit: (event: string, data: any) => void;
    on: (event: string, handler: (...args: any[]) => void) => void;
    off: (event: string, handler: (...args: any[]) => void) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};

interface SocketProviderProps {
    children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        // Get JWT token from localStorage
        const token = localStorage.getItem('token');
        if (!token) {
            console.warn('⚠️ No JWT token found, WebSocket will not connect');
            return;
        }

        // Connect to WebSocket server
        const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

        const socketInstance = io(backendUrl, {
            auth: {
                token: token
            },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        socketInstance.on('connect', () => {
            console.log('✅ WebSocket connected:', socketInstance.id);
            setIsConnected(true);
        });

        socketInstance.on('disconnect', (reason) => {
            console.log('❌ WebSocket disconnected:', reason);
            setIsConnected(false);
        });

        socketInstance.on('connect_error', (error) => {
            console.error('❌ WebSocket connection error:', error.message);
            setIsConnected(false);
        });

        socketInstance.on('error', (error) => {
            console.error('❌ WebSocket error:', error);
        });

        setSocket(socketInstance);

        // Cleanup on unmount
        return () => {
            console.log('🔌 Disconnecting WebSocket');
            socketInstance.disconnect();
        };
    }, []);

    const emit = useCallback((event: string, data: any) => {
        if (socket && isConnected) {
            socket.emit(event, data);
        } else {
            console.warn('⚠️ Cannot emit, socket not connected');
        }
    }, [socket, isConnected]);

    const on = useCallback((event: string, handler: (...args: any[]) => void) => {
        if (socket) {
            socket.on(event, handler);
        }
    }, [socket]);

    const off = useCallback((event: string, handler: (...args: any[]) => void) => {
        if (socket) {
            socket.off(event, handler);
        }
    }, [socket]);

    const value: SocketContextType = {
        socket,
        isConnected,
        emit,
        on,
        off,
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};
