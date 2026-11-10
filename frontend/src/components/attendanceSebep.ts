// src/components/attendanceSebep.ts
// Shared rules for the "sebep" (reason) field of the yoklama page.

/** Used only until the list of the yurt is loaded, or when it cannot be loaded. The real list is edited in Settings. */
export const DEFAULT_SEBEP_OPTIONS = ['Banyo', 'Hasta', 'Rahatsiz', 'Okul'];

/** A sebep can be given when the student is GEÇ, İZİNLİ or YOK (not when VAR). */
export const allowsSebep = (type: string): boolean => type === 'gec' || type === 'izinli' || type === 'yok';
