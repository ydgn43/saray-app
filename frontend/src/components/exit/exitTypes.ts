// src/components/exit/exitTypes.ts
// Shapes of the data the backend (/exit/*) sends. Times are ISO strings (UTC, "...Z").

export type ExitStatus = 'OUT' | 'RETURNED';

export interface ExitLog {
    id: number;
    studentid: number;
    first_name: string;
    last_name: string;
    class_name: string | null;
    reason: string;
    rule_id: number | null;
    rule_name: string | null;
    notes: string | null;
    exit_time: string;
    expected_return_time: string | null; // null = no deadline (never late)
    actual_return_time: string | null;
    status: ExitStatus;
    created_by: number | null;
    created_at: string;
    // computed by the backend (never stored)
    is_late: boolean; // returned late = a foul
    late_minutes: number;
    is_overdue: boolean; // still out and past the deadline
    overdue_minutes: number;
}

export interface ExitRule {
    id: number;
    name: string;
    deadline_weekday: number; // 0 = Sunday ... 6 = Saturday
    deadline_time: string; // 'HH:MM'
    is_active: boolean;
}

export interface FoulRow {
    studentid: number;
    first_name: string;
    last_name: string;
    class_name: string | null;
    total_exits: number;
    total_late: number;
    total_late_minutes: number;
    last_late_at: string | null;
    last_exit_at: string | null;
    is_currently_out: boolean;
    is_currently_overdue: boolean;
}

export interface ExitSettings {
    timezone: string;
    timezones: string[];
}

export interface StudentLite {
    studentid: number;
    first_name: string;
    last_name: string;
    class_name?: string | null;
}

export type SkipReason = 'not_in_yurt' | 'already_out' | 'overlaps_existing' | 'not_open' | 'before_exit';

export interface RecordExitPayload {
    studentids: number[];
    reason?: string;
    ruleId?: number | null;
    notes?: string | null;
    exitTime?: string; // ISO with zone; default = now
    actualReturnTime?: string; // ISO with zone; set = retroactive "exit and return"
}

export interface UpdateLogPayload {
    reason?: string;
    notes?: string | null;
    exitTime?: string;
    ruleId?: number | null;
    expectedReturnTime?: string | null;
    actualReturnTime?: string | null;
}

export interface RulePayload {
    name?: string;
    deadlineWeekday?: number;
    deadlineTime?: string;
    isActive?: boolean;
}
