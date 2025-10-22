export async function authFetch(url: string, options: any = {}) {
    const token = localStorage.getItem('token');
    const selectedYurtStr = localStorage.getItem('selectedYurt');
    const selectedYurt = selectedYurtStr ? JSON.parse(selectedYurtStr) : null;

    options.headers = {
        ...options.headers,
        Authorization: token ? `Bearer ${token}` : undefined,
        // Add X-Yurt-Id header if a yurt is selected
        ...(selectedYurt && { 'X-Yurt-Id': selectedYurt.yurtId.toString() }),
    };

    console.log('authFetch', { url, token, yurtId: selectedYurt?.yurtId, headers: options.headers });
    return fetch(url, options);
}
