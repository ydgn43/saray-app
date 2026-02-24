let logoutCallback: (() => void) | null = null;

export function registerLogoutCallback(cb: () => void) {
    logoutCallback = cb;
}

export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const token = localStorage.getItem('token');
    const selectedYurtStr = localStorage.getItem('selectedYurt');
    const selectedYurt = selectedYurtStr ? JSON.parse(selectedYurtStr) : null;

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        // Add X-Yurt-Id header if a yurt is selected
        ...(selectedYurt && { 'X-Yurt-Id': selectedYurt.yurtId.toString() }),
    };

    const response = await fetch(url, { ...options, headers });

    // If token is expired or invalid, auto logout
    if (response.status === 401) {
        console.warn('🔒 Token expired or invalid - logging out');
        if (logoutCallback) {
            logoutCallback();
        } else {
            // Fallback: clear storage and redirect
            localStorage.clear();
            window.location.href = '/login';
        }
    }

    return response;
}
