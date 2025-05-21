import { useAuth } from '../auth/AuthContext';

export async function authFetch(url: string, options: any = {}) {
    const token = localStorage.getItem('token');
    const response = await fetch(url, {
        ...options,
        headers: {
            ...(options.headers || {}),
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });

    // If not ok and unauthorized, auto-logout (optional)
    if ((response.status === 401 || response.status === 403)) {
        // Option 1: Just clear localStorage and redirect
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        // Option 2: (if inside React) Use context's logout
        // const { logout } = useAuth();
        // logout();
    }

    return response;
}
