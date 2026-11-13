// src/utils/attendanceLevels.ts
// The percentage limits that decide the color of an attendance value (Statistics page):
//   green  : value >= good
//   yellow : medium <= value < good
//   red    : value < medium
// One place for the defaults and for loading/saving the user's own limits (kept in this browser).

export interface LevelLimits {
    good: number;
    medium: number;
}

export const DEFAULT_LIMITS: LevelLimits = { good: 80, medium: 60 };

const STORAGE_KEY = 'statistics-level-limits';

/** 0 <= medium < good <= 100, whole numbers. */
export const isValidLimits = (l: LevelLimits): boolean =>
    Number.isInteger(l.good) && Number.isInteger(l.medium) && l.medium >= 0 && l.medium < l.good && l.good <= 100;

export function loadLimits(): LevelLimits {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            const limits = { good: Number(parsed?.good), medium: Number(parsed?.medium) };
            if (isValidLimits(limits)) return limits;
        }
    } catch {
        /* use the defaults */
    }
    return DEFAULT_LIMITS;
}

export function saveLimits(limits: LevelLimits): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(limits));
    } catch {
        /* not saved, still applies for this visit */
    }
}
