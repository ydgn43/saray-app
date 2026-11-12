// src/utils/classNames.ts
// Helpers for group ("Grup") names. Nothing here knows any group by name: the groups of a yurt are
// defined in Settings > Gruplar, and this file only works with that list.

/** Same group, however it was typed: trimmed, lower case, spaces -> underscores. */
export const normalizeClassName = (name: string): string =>
    name.trim().toLowerCase().replace(/ /g, '_');

/** Readable name for a stored group name that has no display name: "grup_1" -> "Grup 1". */
export const prettifyClassName = (name: string): string =>
    name
        .trim()
        .replace(/[_\s]+/g, ' ')
        .split(' ')
        .map((w) => (w ? w.charAt(0).toLocaleUpperCase('tr-TR') + w.slice(1) : w))
        .join(' ');

// Soft colors for group rows, cards and filter chips. Groups take them in Settings order and the
// list wraps around, so every group always has a color, including groups added later.
export const GROUP_PALETTE = [
    '#dcedc8', '#ffe0b2', '#e1bee7', '#b2dfdb', '#f0f4c3', '#cfd8dc',
    '#bbdefb', '#ffcdd2', '#d7ccc8', '#c8e6c9', '#fff9c4', '#f8bbd0',
];

/**
 * Color of a group. `classes` is the yurt's group list in Settings order (as /class returns it).
 * A name that is not in the list (deleted group, list still loading) gets `fallback`.
 */
export function classColor(
    className: string,
    classes: ReadonlyArray<{ class_name: string }>,
    fallback = '#e9ecef'
): string {
    const key = normalizeClassName(className);
    const index = classes.findIndex((c) => normalizeClassName(c.class_name) === key);
    return index === -1 ? fallback : GROUP_PALETTE[index % GROUP_PALETTE.length];
}
