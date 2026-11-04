import assert from 'assert';
import { nextDeadline, computeLateness, isValidTimeZone, durationMinutes } from './exitTime';

const iso = (d: Date) => d.toISOString();
let n = 0;
const t = (name: string, fn: () => void) => { fn(); n++; console.log('ok -', name); };

// Rule: Sunday (0) 18:30 local time.
// Berlin winter = UTC+1, Berlin summer = UTC+2, Istanbul = UTC+3 all year.

t('Friday exit -> that Sunday 18:30 (Berlin, winter)', () => {
    // Fri 2026-11-06 15:00 UTC  -> Sun 2026-11-08 18:30 CET = 17:30Z
    assert.equal(iso(nextDeadline(new Date('2026-11-06T15:00:00Z'), 0, '18:30:00', 'Europe/Berlin')), '2026-11-08T17:30:00.000Z');
});

t('Sunday BEFORE the time -> same day', () => {
    // Sun 2026-11-08 10:00 UTC = 11:00 Berlin
    assert.equal(iso(nextDeadline(new Date('2026-11-08T10:00:00Z'), 0, '18:30', 'Europe/Berlin')), '2026-11-08T17:30:00.000Z');
});

t('Sunday AFTER the time -> next Sunday (exceptional case)', () => {
    // Sun 2026-11-08 19:00 Berlin = 18:00Z
    assert.equal(iso(nextDeadline(new Date('2026-11-08T18:00:00Z'), 0, '18:30', 'Europe/Berlin')), '2026-11-15T17:30:00.000Z');
});

t('Exit exactly at the deadline -> next week', () => {
    assert.equal(iso(nextDeadline(new Date('2026-11-08T17:30:00Z'), 0, '18:30', 'Europe/Berlin')), '2026-11-15T17:30:00.000Z');
});

t('Local date differs from UTC date (Sat 23:30 Berlin = Sat 22:30Z; Sun 00:30 Istanbul)', () => {
    // Sat 2026-11-07 22:30Z is already Sunday 01:30 in Istanbul (+3) -> same Sunday 18:30 Istanbul = 15:30Z
    assert.equal(iso(nextDeadline(new Date('2026-11-07T22:30:00Z'), 0, '18:30', 'Europe/Istanbul')), '2026-11-08T15:30:00.000Z');
    // The same instant in Berlin is still Saturday 23:30 -> Sunday 18:30 Berlin = 17:30Z
    assert.equal(iso(nextDeadline(new Date('2026-11-07T22:30:00Z'), 0, '18:30', 'Europe/Berlin')), '2026-11-08T17:30:00.000Z');
});

t('Summer time (CEST, UTC+2)', () => {
    // Fri 2026-07-10 12:00Z -> Sun 2026-07-12 18:30 CEST = 16:30Z
    assert.equal(iso(nextDeadline(new Date('2026-07-10T12:00:00Z'), 0, '18:30', 'Europe/Berlin')), '2026-07-12T16:30:00.000Z');
});

t('Daylight-saving switch day (Sun 2026-03-29, clocks go forward at 02:00)', () => {
    // Sat 2026-03-28 12:00Z -> Sun 2026-03-29 18:30 CEST = 16:30Z (not 17:30Z)
    assert.equal(iso(nextDeadline(new Date('2026-03-28T12:00:00Z'), 0, '18:30', 'Europe/Berlin')), '2026-03-29T16:30:00.000Z');
});

t('Daylight-saving switch back (Sun 2026-10-25) and a week across it', () => {
    // Fri 2026-10-23 12:00Z -> Sun 2026-10-25 18:30 CET = 17:30Z
    assert.equal(iso(nextDeadline(new Date('2026-10-23T12:00:00Z'), 0, '18:30', 'Europe/Berlin')), '2026-10-25T17:30:00.000Z');
    // Sun 2026-10-25 20:00Z (after deadline) -> next Sunday 2026-11-01 18:30 CET = 17:30Z
    assert.equal(iso(nextDeadline(new Date('2026-10-25T20:00:00Z'), 0, '18:30', 'Europe/Berlin')), '2026-11-01T17:30:00.000Z');
});

t('Other weekday (Wednesday = 3, 21:00)', () => {
    // Mon 2026-11-02 12:00Z -> Wed 2026-11-04 21:00 Berlin = 20:00Z
    assert.equal(iso(nextDeadline(new Date('2026-11-02T12:00:00Z'), 3, '21:00', 'Europe/Berlin')), '2026-11-04T20:00:00.000Z');
});

t('Invalid input throws', () => {
    assert.throws(() => nextDeadline(new Date(), 7, '18:30', 'Europe/Berlin'));
    assert.throws(() => nextDeadline(new Date(), 0, '25:00', 'Europe/Berlin'));
    assert.throws(() => nextDeadline(new Date(), 0, '18:30', 'Mars/Olympus'));
    assert.equal(isValidTimeZone('Europe/Berlin'), true);
    assert.equal(isValidTimeZone('Nope/Nope'), false);
});

t('Lateness: no deadline -> never late', () => {
    assert.deepEqual(computeLateness(null, new Date('2030-01-01T00:00:00Z')), { isLate: false, lateMinutes: 0 });
});

t('Lateness: on time, exactly on time, 1 second late, 90 min late', () => {
    const exp = new Date('2026-11-08T17:30:00Z');
    assert.deepEqual(computeLateness(exp, new Date('2026-11-08T17:00:00Z')), { isLate: false, lateMinutes: 0 });
    assert.deepEqual(computeLateness(exp, new Date('2026-11-08T17:30:00Z')), { isLate: false, lateMinutes: 0 });
    assert.deepEqual(computeLateness(exp, new Date('2026-11-08T17:30:01Z')), { isLate: true, lateMinutes: 1 });
    assert.deepEqual(computeLateness(exp, new Date('2026-11-08T19:00:00Z')), { isLate: true, lateMinutes: 90 });
});

t('Duration: rounded down, never negative, works without deadline', () => {
    const exit = new Date('2026-11-02T10:00:00Z');
    assert.equal(durationMinutes(exit, new Date('2026-11-02T10:00:59Z')), 0);
    assert.equal(durationMinutes(exit, new Date('2026-11-02T10:01:00Z')), 1);
    assert.equal(durationMinutes(exit, new Date('2026-11-02T12:15:30Z')), 135);
    assert.equal(durationMinutes(exit, new Date('2026-11-02T09:00:00Z')), 0);
});

console.log(`\n${n} test groups passed`);
