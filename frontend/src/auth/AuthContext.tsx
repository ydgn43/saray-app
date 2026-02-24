import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import config from '../config';
import { registerLogoutCallback } from '../utils/authFetch';

export type YurtInfo = {
    yurtId: number;
    yurtName: string;
    location?: string;
    description?: string;
    isActive: boolean;
    isPrimary: boolean;
    assignedAt?: string;
};

type UserType = {
    accountid: number;
    username: string;
    role: string;
    studentid?: number | null;
    yurtid: number;
};

type AuthContextType = {
    user: UserType | null;
    token: string | null;
    login: (user: UserType, token: string) => void;
    logout: () => void;
    loading: boolean;
    setUser: (user: UserType | null) => void;
    yurtName: string | null;
    setYurtName: (name: string | null) => void;
    // New yurt management
    availableYurts: YurtInfo[];
    selectedYurt: YurtInfo | null;
    loadUserYurts: () => Promise<void>;
    switchYurt: (yurt: YurtInfo) => void;
    setYurtsData: (yurts: YurtInfo[], selectedYurt: YurtInfo | null) => void;
    canSwitchYurts: boolean;
};

const AuthContext = createContext<AuthContextType>({
    user: null,
    token: null,
    login: () => { },
    logout: () => { },
    loading: true,
    setUser: () => { },
    yurtName: null,
    setYurtName: () => { },
    availableYurts: [],
    selectedYurt: null,
    loadUserYurts: async () => { },
    switchYurt: () => { },
    setYurtsData: () => { },
    canSwitchYurts: false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<UserType | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [yurtName, setYurtName] = useState<string | null>(null);
    const [availableYurts, setAvailableYurts] = useState<YurtInfo[]>([]);
    const [selectedYurt, setSelectedYurt] = useState<YurtInfo | null>(null);

    // Check if user can switch yurts (admins and super-admins)
    const canSwitchYurts = user?.role === 'admin' || user?.role === 'super-admin';

    useEffect(() => {
        const initializeAuth = async () => {
            const storedUser = localStorage.getItem('user');
            const storedToken = localStorage.getItem('token');
            const storedYurtName = localStorage.getItem('yurtName');
            const storedSelectedYurt = localStorage.getItem('selectedYurt');
            const storedAvailableYurts = localStorage.getItem('availableYurts');

            if (storedUser && storedToken) {
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);
                setToken(storedToken);
                if (storedYurtName) {
                    setYurtName(storedYurtName);
                }
                if (storedSelectedYurt) {
                    setSelectedYurt(JSON.parse(storedSelectedYurt));
                }
                if (storedAvailableYurts) {
                    setAvailableYurts(JSON.parse(storedAvailableYurts));
                }

                // Reload yurts from API for all users to get latest data
                console.log('🔄 AuthContext: Fetching yurts for user...');
                console.log('   User role:', parsedUser.role);
                console.log('   Stored yurts from localStorage:', storedAvailableYurts);

                try {
                    const response = await fetch(`${config.API_BASE_URL}/yurt-management/my-yurts`, {
                        headers: {
                            'Authorization': `Bearer ${storedToken}`,
                            'Content-Type': 'application/json',
                        }
                    });

                    console.log('   API Response status:', response.status);

                    if (response.ok) {
                        const data = await response.json();
                        const yurts: YurtInfo[] = data.data || [];
                        console.log('✅ AuthContext: Reloaded available yurts:', yurts.length);
                        console.log('   Yurts data:', yurts);

                        setAvailableYurts(yurts);
                        localStorage.setItem('availableYurts', JSON.stringify(yurts));

                        // Make sure we have a selected yurt
                        if (yurts.length > 0 && !storedSelectedYurt) {
                            const primaryYurt = yurts.find(y => y.isPrimary) || yurts[0];
                            console.log('   Setting primary yurt:', primaryYurt.yurtName);
                            setSelectedYurt(primaryYurt);
                            localStorage.setItem('selectedYurt', JSON.stringify(primaryYurt));
                            setYurtName(primaryYurt.yurtName);
                            localStorage.setItem('yurtName', primaryYurt.yurtName);
                        } else if (yurts.length === 0) {
                            console.log('   No yurts found - clearing selected yurt');
                            setSelectedYurt(null);
                            setYurtName(null);
                        }
                    } else {
                        console.error('   API request failed with status:', response.status);
                    }
                } catch (error) {
                    console.error('❌ AuthContext: Failed to reload yurts:', error);
                }
            }

            setLoading(false);
        };

        initializeAuth();
    }, []);

    const login = (user: UserType, token: string) => {
        setUser(user);
        setToken(token);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('token', token);

        // Load yurts from localStorage if they were set by signup/login
        const storedAvailableYurts = localStorage.getItem('availableYurts');
        const storedSelectedYurt = localStorage.getItem('selectedYurt');
        const storedYurtName = localStorage.getItem('yurtName');

        if (storedAvailableYurts) {
            const yurts = JSON.parse(storedAvailableYurts);
            setAvailableYurts(yurts);
        }
        if (storedSelectedYurt) {
            setSelectedYurt(JSON.parse(storedSelectedYurt));
        }
        if (storedYurtName) {
            setYurtName(storedYurtName);
        }
    };

    const loadUserYurts = async () => {
        if (!token) return;

        try {
            const response = await fetch(`${config.API_BASE_URL}/yurt-management/my-yurts`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });

            if (response.ok) {
                const data = await response.json();
                const yurts: YurtInfo[] = data.data || [];
                setAvailableYurts(yurts);
                localStorage.setItem('availableYurts', JSON.stringify(yurts));

                // If no yurt is selected, select the primary one or first available
                if (!selectedYurt && yurts.length > 0) {
                    const primaryYurt = yurts.find(y => y.isPrimary) || yurts[0];
                    setSelectedYurt(primaryYurt);
                    localStorage.setItem('selectedYurt', JSON.stringify(primaryYurt));
                    setYurtName(primaryYurt.yurtName);
                    localStorage.setItem('yurtName', primaryYurt.yurtName);
                }
            }
        } catch (error) {
            console.error('Error loading user yurts:', error);
        }
    };

    const setYurtsData = (yurts: YurtInfo[], selectedYurt: YurtInfo | null) => {
        console.log('📦 AuthContext.setYurtsData called:', yurts.length, 'yurts');
        setAvailableYurts(yurts);
        setSelectedYurt(selectedYurt);
        if (selectedYurt) {
            setYurtName(selectedYurt.yurtName);
        }
    };

    const switchYurt = (yurt: YurtInfo) => {
        setSelectedYurt(yurt);
        setYurtName(yurt.yurtName);
        localStorage.setItem('selectedYurt', JSON.stringify(yurt));
        localStorage.setItem('yurtName', yurt.yurtName);
        // Navigate to home screen and reload to fetch fresh data for the new yurt
        window.location.href = '/';
    };

    // Add this helper function to check if token is expired
    function isTokenExpired(token: string): boolean {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const expiry = payload.exp * 1000; // convert to ms
            const now = Date.now();
            const fiveMinutes = 5 * 60 * 1000;
            // Return true if expired or will expire in next 5 minutes
            return now >= expiry - fiveMinutes;
        } catch {
            return true;
        }
    }

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('yurtName');
        localStorage.removeItem('selectedYurt');
        localStorage.removeItem('availableYurts');
        setUser(null);
        setToken(null);
        setYurtName(null);
        setYurtsData([], null);
        window.location.href = '/login';
    }, []);

    // Register logout callback for authFetch
    useEffect(() => {
        registerLogoutCallback(logout);
    }, [logout]);

    // Check token expiry on app load and periodically
    useEffect(() => {
        const checkToken = () => {
            const storedToken = localStorage.getItem('token');
            if (storedToken && isTokenExpired(storedToken)) {
                console.warn('🔒 Token expired - auto logging out');
                logout();
            }
        };

        // Check immediately on load
        checkToken();

        // Check every minute
        const interval = setInterval(checkToken, 60 * 1000);
        return () => clearInterval(interval);
    }, [logout]);

    return (
        <AuthContext.Provider value={{
            user,
            token,
            login,
            logout,
            loading,
            setUser,
            yurtName,
            setYurtName,
            availableYurts,
            selectedYurt,
            loadUserYurts,
            switchYurt,
            setYurtsData,
            canSwitchYurts
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export function useAuth() {
    return useContext(AuthContext);
}
