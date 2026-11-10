// Small helper for the Settings sections: JSON in, JSON out, errors as readable Turkish messages.
import config from '../../config';
import { authFetch } from '../../utils/authFetch';

export async function settingsApi<T = unknown>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await authFetch(`${config.API_BASE_URL}${path}`, {
        method,
        body: body === undefined ? undefined : JSON.stringify(body),
    });
    let data: any = null;
    try {
        data = await res.json();
    } catch {
        /* empty body */
    }
    if (!res.ok) throw new Error(data?.message || data?.error || `Hata (${res.status})`);
    return data as T;
}
