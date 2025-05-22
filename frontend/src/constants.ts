// src/constants.ts

// Color mapping for student classes
export const classGroupedColors: Record<string, string> = {
    kuranikerim: '#dcedc8',
    hazirlik: '#ffe0b2',
    ibtidai: '#e1bee7',
    ihzari: '#b2dfdb',
    'mezun tekamulalti': '#f0f4c3',
    tekamul_alti: '#cfd8dc',
    // Add more if you have other class names
};

// If you want to also share other constants (like classOrder), add here:
export const classOrder = [
    'kuranikerim',
    'hazirlik',
    'ibtidai',
    'ihzari',
    'mezun_tekamul_alti',
    'tekamul_alti'
];

export const groupHeaderTitles: Record<string, string> = {
    kuranikerim: "Kur'an-ı Kerim",
    hazirlik: "Hazırlık",
    ibtidai: "İbtidai",
    ihzari: "İhzari",
    mezun_tekamul_alti: "Mezun Tekamül Altı",
    tekamul_alti: "Tekamül Altı",
};
