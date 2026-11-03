// src/components/exit/exitApi.ts
// All calls to the backend /exit/* endpoints in one place.
// authFetch adds the login token and the X-Yurt-Id header (selected yurt) for us.

import config from '../../config';
import { authFetch } from '../../utils/authFetch';
import {
    ExitLog,
    ExitRule,
    ExitSettings,
    FoulRow,
    RecordExitPayload,
    RulePayload,
    SkipReason,
    StudentLite,
    UpdateLogPayload,
} from './exitTypes';

const API = config.API_BASE_URL;

export class ApiError extends Error {
    status: number;
    data: any;
    constructor(message: string, status: number, data: any) {
        super(message);
        this.status = status;
        this.data = data;
    }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await authFetch(`${API}${path}`, {
        method,
        body: body === undefined ? undefined : JSON.stringify(body),
    });
    let data: any = null;
    try {
        data = await res.json();
    } catch (_) {
        /* empty body */
    }
    if (!res.ok) {
        throw new ApiError(data?.error || data?.message || `Hata (${res.status})`, res.status, data);
    }
    return data as T;
}

const query = (params: Record<string, string | number | undefined>): string => {
    const q = new URLSearchParams();
    Object.keys(params).forEach((key) => {
        const value = params[key];
        if (value !== undefined && value !== '') q.set(key, String(value));
    });
    const s = q.toString();
    return s ? `?${s}` : '';
};

/** Turkish texts for the reasons the backend gives when it skips a student. */
export const SKIP_REASON_TEXT: Record<SkipReason, string> = {
    not_in_yurt: 'bu yurtta kayıtlı değil',
    already_out: 'zaten dışarıda',
    overlaps_existing: 'başka bir kaydıyla çakışıyor',
    not_open: 'açık çıkış kaydı yok',
    before_exit: 'giriş zamanı çıkıştan önce',
};

export interface SkippedStudent { studentid: number; reason: SkipReason }
export interface SkippedLog { id: number; reason: SkipReason }

export const exitApi = {
    students: async (): Promise<StudentLite[]> => {
        const data = await request<unknown>('GET', '/student');
        return Array.isArray(data) ? (data as StudentLite[]) : [];
    },

    logs: (params: { status?: 'OUT' | 'RETURNED'; studentid?: number; from?: string; to?: string; limit?: number } = {}) =>
        request<ExitLog[]>('GET', `/exit/logs${query(params)}`),

    foulsSummary: (params: { from?: string; to?: string } = {}) =>
        request<FoulRow[]>('GET', `/exit/fouls-summary${query(params)}`),

    recordExit: (payload: RecordExitPayload) =>
        request<{ created: number[]; skipped: SkippedStudent[]; expected_return_time: string | null; is_late: boolean; late_minutes: number }>(
            'POST', '/exit/record-exit', payload),

    recordReturn: (logIds: number[], actualReturnTime?: string) =>
        request<{ returned: { id: number; is_late: boolean; late_minutes: number }[]; skipped: SkippedLog[] }>(
            'POST', '/exit/record-return', { logIds, actualReturnTime }),

    updateLog: (id: number, payload: UpdateLogPayload) =>
        request<{ log: ExitLog }>('PUT', `/exit/logs/${id}`, payload),

    deleteLog: (id: number) => request<{ success: boolean }>('DELETE', `/exit/logs/${id}`),

    rules: () => request<ExitRule[]>('GET', '/exit/rules'),
    createRule: (payload: Required<Pick<RulePayload, 'name' | 'deadlineWeekday' | 'deadlineTime'>> & { isActive?: boolean }) =>
        request<{ rule: ExitRule }>('POST', '/exit/rules', payload),
    updateRule: (id: number, payload: RulePayload) => request<{ rule: ExitRule }>('PUT', `/exit/rules/${id}`, payload),
    deleteRule: (id: number) => request<{ success: boolean }>('DELETE', `/exit/rules/${id}`),

    settings: () => request<ExitSettings>('GET', '/exit/settings'),
    updateSettings: (timezone: string) => request<{ timezone: string }>('PUT', '/exit/settings', { timezone }),
};
