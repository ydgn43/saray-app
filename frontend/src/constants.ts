// src/constants.ts

// Helper function to convert display name to database name
// Converts a display name such as "Sabah Namazı" to a database-safe name such as "sabah_namazi"
export const convertToDbName = (displayName: string): string => {
    return displayName
        .toLowerCase()
        .replace(/ı/g, 'i')
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '');
};

