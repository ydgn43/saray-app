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
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

    // Listen for token changes (after login)
    useEffect(() => {
        const handleStorageChange = () => {
            const newToken = localStorage.getItem('token');
            setToken(newToken);
        };

        // Listen for custom storage events
        window.addEventListener('storage', handleStorageChange);

        // Also check periodically (in case of same-tab changes)
        const interval = setInterval(() => {
            const currentToken = localStorage.getItem('token');
            if (currentToken !== token) {
                setToken(currentToken);
            }
        }, 1000);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            clearInterval(interval);
        };
    }, [token]);

    useEffect(() => {
        // Get JWT token from state
        if (!token) {
            console.warn('⚠️ No JWT token found, WebSocket will not connect');
            // Disconnect existing socket if token is removed
            if (socket) {
                socket.disconnect();
                setSocket(null);
                setIsConnected(false);
            }
            return;
        }

        // Disconnect existing socket before creating new one
        if (socket) {
            console.log('🔌 Disconnecting old WebSocket connection');
            socket.disconnect();
        }

        // Connect to WebSocket server
        const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

        console.log('🔄 Connecting to WebSocket with token...');
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

        // Cleanup on unmount or token change
        return () => {
            console.log('🔌 Disconnecting WebSocket');
            socketInstance.disconnect();
        };
    }, [token]); // Re-run when token changes

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
