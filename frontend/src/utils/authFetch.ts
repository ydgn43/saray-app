export async function authFetch(url: string, options: any = {}) {
    const token = localStorage.getItem('token');
    options.headers = {
        ...options.headers,
        Authorization: token ? `Bearer ${token}` : undefined,
    };
    console.log('authFetch', { url, token, headers: options.headers });
    return fetch(url, options);
}
