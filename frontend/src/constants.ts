// src/constants.ts

// Color mapping for student classes (can be extended dynamically)
export const classGroupedColors: Record<string, string> = {
    kuranikerim: '#dcedc8',
    hazirlik: '#ffe0b2',
    ibtidai: '#e1bee7',
    ihzari: '#b2dfdb',
    'mezun tekamulalti': '#f0f4c3',
    tekamul_alti: '#cfd8dc',
    // Add more if you have other class names
};

// Helper function to convert display name to database name
// Converts "Kur'an-ı Kerim" to "kuranikerim" or "Sabah Namazı" to "sabah_namazi"
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

