import React, { useEffect, useState, useRef } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import PageHeader from '../components/PageHeader';
import { authFetch } from '../utils/authFetch';
import config from '../config';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

interface StatisticEntry {
    studentid: number;
    name: string;
    class_name: string;
    total: number;
    percentages: {
        var?: number;
        gec?: number;
        yok?: number;
        izinli?: number;
    };
}

// 1. Use normalized program names everywhere for logic
const PROGRAM_ORDER = [
    'sabah_namazi',
    'oglen_namazi',
    'ikindi_namazi',
    'aksam_namazi',
    'yatsi_namazi',
    'hatim'
];

const PROGRAM_TURKISH_MAP: Record<string, string> = {
    "sabah_namazi": "Sabah Namazı",
    "oglen_namazi": "Öğle Namazı",
    "ikindi_namazi": "İkindi Namazı",
    "aksam_namazi": "Akşam Namazı",
    "yatsi_namazi": "Yatsı Namazı",
    "hatim": "Hatim"
};

const CLASS_NAME_TURKISH_MAP: Record<string, string> = {
    "kuranikerim": "Kur'an-ı Kerim",
    "hazirlik": "Hazırlık",
    "ibtidai": "İbtidai",
    "ihzari": "İhzari",
    "mezun_tekamul_alti": "Mezun Tekamul Altı",
    "tekamul_alti": "Tekamul Altı"
};
function getTurkishClassName(className: string) {
    return CLASS_NAME_TURKISH_MAP[className] || className;
}

// Helper to normalize program names
function normalizeProgramName(name: string) {
    return name.trim().toLowerCase().replace(/ /g, '_');
}

const Statistics = () => {
    const [selectedColor, setSelectedColor] = useState('');
    const [selectedClass, setSelectedClass] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [statistics, setStatistics] = useState<StatisticEntry[]>([]);
    const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedProgram, setSelectedProgram] = useState('genel');
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

    // State for programs included in "genel" calculation
    const [programsForGenel, setProgramsForGenel] = useState<Set<string>>(
        new Set(PROGRAM_ORDER) // By default, include all programs
    );

    // Pastel color styles for badges
    const pastelStyles = {
        success: {
            backgroundColor: 'rgba(134, 239, 172, 0.5)',
            color: '#166534'
        },
        warning: {
            backgroundColor: 'rgba(253, 224, 71, 0.5)',
            color: '#713f12'
        },
        danger: {
            backgroundColor: 'rgba(252, 165, 165, 0.5)',
            color: '#991b1b'
        }
    };

    // Modern badge styles
    const modernBadgeStyles = {
        success: {
            backgroundColor: 'rgba(134, 239, 172, 0.3)',
            color: '#166534',
            padding: '6px 14px',
            borderRadius: '20px',
            fontWeight: '600',
            fontSize: '0.875rem',
            display: 'inline-block',
            border: '1px solid rgba(134, 239, 172, 0.5)'
        },
        warning: {
            backgroundColor: 'rgba(253, 224, 71, 0.3)',
            color: '#713f12',
            padding: '6px 14px',
            borderRadius: '20px',
            fontWeight: '600',
            fontSize: '0.875rem',
            display: 'inline-block',
            border: '1px solid rgba(253, 224, 71, 0.5)'
        },
        danger: {
            backgroundColor: 'rgba(252, 165, 165, 0.3)',
            color: '#991b1b',
            padding: '6px 14px',
            borderRadius: '20px',
            fontWeight: '600',
            fontSize: '0.875rem',
            display: 'inline-block',
            border: '1px solid rgba(252, 165, 165, 0.5)'
        }
    };

    // Get all unique normalized program names from attendanceRecords and statistics
    const allProgramsBase = PROGRAM_ORDER.filter(p =>
        statistics.length === 0 ||
        statistics.some(stat => {
            if (!attendanceRecords.length) return true;
            return attendanceRecords.some(rec => normalizeProgramName(rec.program_name) === p);
        })
    );

    // Filter programs based on selection when in 'genel' view
    const allPrograms = selectedProgram === 'genel'
        ? allProgramsBase.filter(p => programsForGenel.has(p))
        : allProgramsBase;

    // Helper to get all programs that have at least one record in the date range
    const getProgramsWithRecords = (): Set<string> => {
        const programsSet = new Set<string>();
        attendanceRecords.forEach(rec => {
            programsSet.add(normalizeProgramName(rec.program_name));
        });
        return programsSet;
    };

    // Compute program percentages for a statistic entry
    function computeProgramPercentages(
        stat: StatisticEntry,
        attendanceRecords: any[]
    ): Record<string, { var: number; izinli: number; hasRecords: boolean }> {
        // If attendanceRecords is empty, return empty object (no per-program stats)
        if (!attendanceRecords.length) {
            return {};
        }

        const studentRecords = attendanceRecords.filter(
            (rec) => rec.studentid === stat.studentid
        );

        const programsWithRecords = getProgramsWithRecords();
        const programMap: Record<string, { var: number; izinli: number; total: number }> = {};

        studentRecords.forEach((rec) => {
            const prog = normalizeProgramName(rec.program_name);
            if (!programMap[prog]) programMap[prog] = { var: 0, izinli: 0, total: 0 };
            if (rec.attendance_type_name === 'var') programMap[prog].var += 1;
            if (rec.attendance_type_name === 'izinli') programMap[prog].izinli += 1;
            programMap[prog].total += 1;
        });

        const result: Record<string, { var: number; izinli: number; hasRecords: boolean }> = {};

        // For programs that have records in the system but student has no records = 100% attendance
        programsWithRecords.forEach(prog => {
            if (programMap[prog]) {
                const { var: v, izinli: i, total } = programMap[prog];
                // Calculate attendance rate: (var + izinli) / total * 100
                const attendanceRate = total ? Math.round(((v + i) / total) * 100) : 0;
                result[prog] = {
                    var: attendanceRate,
                    izinli: 0, // Not used separately anymore
                    hasRecords: true
                };
            } else {
                // Program has records in system but not for this student = 100% attendance
                result[prog] = {
                    var: 100,
                    izinli: 0,
                    hasRecords: false
                };
            }
        });

        return result;
    }

    const getProgramSums = (stat: StatisticEntry) => {
        const programPercentages = computeProgramPercentages(stat, attendanceRecords);
        const programsWithAnyRecords = getProgramsWithRecords();

        // Filter to only include programs selected for "genel" calculation
        const programsToInclude = Array.from(programsWithAnyRecords).filter(prog =>
            programsForGenel.has(prog)
        );

        // Only calculate for programs that are selected and have records in the system
        const programSums = programsToInclude.map((program) => {
            const prog = programPercentages[program];
            if (!prog) return 100; // Program exists but student has no records = 100%
            // Now prog.var already contains the correct attendance rate
            return prog.var;
        });

        // Genel: average only of selected programs that actually have records in the date range
        const valid = programSums.filter(x => typeof x === 'number');
        const genel = valid.length ? Math.round(valid.reduce((a, b) => a + b, 0) / valid.length) : 0;

        return { programSums, genel };
    };

    // Helper function to get percentage for a specific program or general
    const getPercentageForProgram = (stat: StatisticEntry, program: string): number => {
        if (program === 'genel') {
            return getProgramSums(stat).genel;
        }
        const programPercentages = computeProgramPercentages(stat, attendanceRecords);
        const prog = programPercentages[program];

        // If program doesn't exist in the results, it means no records for any student
        if (!prog) return 0;

        return prog.var + prog.izinli;
    };

    useEffect(() => {
        const savedStartDate = localStorage.getItem('statistics-startDate');
        const savedEndDate = localStorage.getItem('statistics-endDate');
        if (savedStartDate) setStartDate(savedStartDate);
        if (savedEndDate) setEndDate(savedEndDate);
    }, []);

    useEffect(() => {
        if (startDate) localStorage.setItem('statistics-startDate', startDate);
    }, [startDate]);

    useEffect(() => {
        if (endDate) localStorage.setItem('statistics-endDate', endDate);
    }, [endDate]);

    const fetchAttendanceRecords = async () => {
        if (!startDate || !endDate) return;
        try {
            const res = await authFetch(
                `${config.API_BASE_URL}
/attendance/all?startDate=${startDate}&endDate=${endDate}`
            );
            if (!res.ok) throw new Error();
            const data = await res.json();
            setAttendanceRecords(data);
        } catch {
            setAttendanceRecords([]);
        }
    };

    const fetchStatistics = async () => {
        if (!startDate || !endDate) {
            toast.error('Lütfen tarih aralığı seçin.');
            return;
        }
        setLoading(true);
        try {
            const res = await authFetch(
                `${config.API_BASE_URL}
/attendance/statistics?startDate=${startDate}&endDate=${endDate}`
            );
            if (!res.ok) throw new Error();
            const data = await res.json();
            setStatistics(data);
            await fetchAttendanceRecords();
        } catch {
            toast.error('İstatistik verileri alınamadı.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (localStorage.getItem('statistics-autofetch') === '1') {
            localStorage.removeItem('statistics-autofetch');
            fetchStatistics();
        }
        // eslint-disable-next-line
    }, []);

    // Filtering logic for color buttons (now uses "genel" or selected program)
    const filteredStats = statistics.filter((entry) => {
        let value = 0;
        if (selectedProgram === 'genel') {
            value = getProgramSums(entry).genel;
        } else {
            const programPercentages = computeProgramPercentages(entry, attendanceRecords);
            const prog = programPercentages[selectedProgram];
            // If prog doesn't exist, program has no records = 100%
            value = prog ? (prog.var + prog.izinli) : 100;
        }
        const matchesColor =
            selectedColor === '' ||
            (selectedColor === 'green' && value >= 80) ||
            (selectedColor === 'yellow' && value >= 60 && value < 80) ||
            (selectedColor === 'red' && value < 60);

        const matchesClass = selectedClass === '' || entry.class_name === selectedClass;
        const matchesSearch = entry.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesColor && matchesClass && matchesSearch;
    });

    // Sorting logic
    const sortedStats = [...filteredStats];
    if (sortConfig) {
        sortedStats.sort((a, b) => {
            let aValue: any, bValue: any;
            if (sortConfig.key === 'name') {
                aValue = a.name.toLowerCase();
                bValue = b.name.toLowerCase();
            } else if (sortConfig.key === 'class_name') {
                aValue = a.class_name.toLowerCase();
                bValue = b.class_name.toLowerCase();
            } else if (sortConfig.key === 'genel') {
                aValue = getProgramSums(a).genel;
                bValue = getProgramSums(b).genel;
            } else if (allPrograms.includes(sortConfig.key)) {
                // Get percentage for specific program
                const aProg = computeProgramPercentages(a, attendanceRecords)[sortConfig.key];
                const bProg = computeProgramPercentages(b, attendanceRecords)[sortConfig.key];
                aValue = aProg ? (aProg.var + aProg.izinli) : 100;
                bValue = bProg ? (bProg.var + bProg.izinli) : 100;
            } else {
                aValue = '';
                bValue = '';
            }
            if (typeof aValue === 'number' && typeof bValue === 'number') {
                return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
            }
            return sortConfig.direction === 'asc'
                ? String(aValue).localeCompare(String(bValue), 'tr')
                : String(bValue).localeCompare(String(aValue), 'tr');
        });
    } else {
        // Default sorting: alphabetically by name
        sortedStats.sort((a, b) => {
            return a.name.toLowerCase().localeCompare(b.name.toLowerCase(), 'tr');
        });
    }

    // Helper for header rendering
    const getSortIcon = (key: string) => {
        if (!sortConfig || sortConfig.key !== key) return <span style={{ opacity: 0.3 }}>↕</span>;
        return sortConfig.direction === 'asc' ? <span>▲</span> : <span>▼</span>;
    };

    // Export functions
    const handleExportToCSV = () => {
        const csvRows: string[] = [];

        // Headers
        const headers = ['#', 'İsim', 'Dahili Seviye'];
        if (selectedProgram === 'genel') {
            allPrograms.forEach(p => headers.push(PROGRAM_TURKISH_MAP[p] || p));
        } else {
            headers.push(PROGRAM_TURKISH_MAP[selectedProgram] || selectedProgram);
        }
        headers.push('Genel');
        csvRows.push(headers.join(';'));

        // Data rows
        sortedStats.forEach((s, i) => {
            const { genel } = getProgramSums(s);
            const programPercentages = computeProgramPercentages(s, attendanceRecords);
            const programsWithRecordsSet = getProgramsWithRecords();

            const row = [
                String(i + 1),
                s.name,
                getTurkishClassName(s.class_name),
            ];

            if (selectedProgram === 'genel') {
                allPrograms.forEach((p) => {
                    const progData = programPercentages[p];
                    const val = progData ? (progData.var + progData.izinli) :
                        (programsWithRecordsSet.has(p) ? 100 : 0);
                    row.push(val + '%');
                });
            } else {
                const progData = programPercentages[selectedProgram];
                const val = progData ? (progData.var + progData.izinli) :
                    (programsWithRecordsSet.has(selectedProgram) ? 100 : 0);
                row.push(val + '%');
            }

            row.push(genel + '%');
            csvRows.push(row.join(';'));
        });

        const blob = new Blob(['\uFEFF' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('href', url);
        a.setAttribute('download', `istatistikler_${new Date().toLocaleDateString('tr-TR')}.csv`);
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleExportToExcel = () => {
        const data = sortedStats.map((s, i) => {
            const { genel } = getProgramSums(s);
            const programPercentages = computeProgramPercentages(s, attendanceRecords);
            const programsWithRecordsSet = getProgramsWithRecords();

            const row: any = {
                '#': i + 1,
                'İsim': s.name,
                'Dahili Seviye': getTurkishClassName(s.class_name),
            };

            if (selectedProgram === 'genel') {
                allPrograms.forEach((p) => {
                    const progData = programPercentages[p];
                    const val = progData ? (progData.var + progData.izinli) :
                        (programsWithRecordsSet.has(p) ? 100 : 0);
                    row[PROGRAM_TURKISH_MAP[p] || p] = val + '%';
                });
            } else {
                const progData = programPercentages[selectedProgram];
                const val = progData ? (progData.var + progData.izinli) :
                    (programsWithRecordsSet.has(selectedProgram) ? 100 : 0);
                row[PROGRAM_TURKISH_MAP[selectedProgram] || selectedProgram] = val + '%';
            }

            row['Genel'] = genel + '%';
            return row;
        });

        const ws = XLSX.utils.json_to_sheet(data);

        // Set column widths
        const cols = [
            { wch: 5 },  // #
            { wch: 25 }, // İsim
            { wch: 20 }, // Dahili Seviye
        ];

        // Add column widths for programs
        if (selectedProgram === 'genel') {
            allPrograms.forEach(() => cols.push({ wch: 15 }));
        } else {
            cols.push({ wch: 15 });
        }
        cols.push({ wch: 12 }); // Genel

        ws['!cols'] = cols;

        // Style header row
        const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
        for (let C = range.s.c; C <= range.e.c; ++C) {
            const address = XLSX.utils.encode_col(C) + "1";
            if (!ws[address]) continue;
            ws[address].s = {
                font: { bold: true, sz: 12 },
                fill: { fgColor: { rgb: "F1F5F9" } },
                alignment: { horizontal: "center", vertical: "center" }
            };
        }

        // Apply conditional formatting colors to data cells
        for (let R = range.s.r + 1; R <= range.e.r; ++R) {
            for (let C = range.s.c + 3; C <= range.e.c; ++C) { // Start from program columns
                const address = XLSX.utils.encode_col(C) + (R + 1);
                if (!ws[address]) continue;

                const val = parseInt(ws[address].v);
                let bgColor = "86EFAC"; // Green
                let fontColor = "166534";

                if (val < 60) {
                    bgColor = "FCA5A5"; // Red
                    fontColor = "991B1B";
                } else if (val < 80) {
                    bgColor = "FDE047"; // Yellow
                    fontColor = "713F12";
                }

                ws[address].s = {
                    fill: { fgColor: { rgb: bgColor } },
                    font: { color: { rgb: fontColor }, bold: true },
                    alignment: { horizontal: "center", vertical: "center" }
                };
            }
        }

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'İstatistikler');
        XLSX.writeFile(wb, `istatistikler_${new Date().toLocaleDateString('tr-TR')}.xlsx`);
    };

    const handleExportToPDF = () => {
        const doc = new jsPDF('l', 'mm', 'a4');

        // Add title
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('İstatistikler Raporu', 14, 15);

        // Add date range if filters are applied
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        let subtitle = '';
        if (startDate || endDate) {
            subtitle += `Tarih: ${startDate || '...'} - ${endDate || '...'}`;
        }
        if (selectedClass !== '') {
            if (subtitle) subtitle += ' | ';
            subtitle += `Seviye: ${getTurkishClassName(selectedClass)}`;
        }
        if (subtitle) {
            doc.text(subtitle, 14, 22);
        }

        // Prepare table headers
        const headers: string[] = ['#', 'İsim', 'Dahili Seviye'];
        if (selectedProgram === 'genel') {
            allPrograms.forEach(p => headers.push(PROGRAM_TURKISH_MAP[p] || p));
        } else {
            headers.push(PROGRAM_TURKISH_MAP[selectedProgram] || selectedProgram);
        }
        headers.push('Genel');

        // Prepare table data with styling information
        const tableData = sortedStats.map((s, i) => {
            const { genel } = getProgramSums(s);
            const programPercentages = computeProgramPercentages(s, attendanceRecords);
            const programsWithRecordsSet = getProgramsWithRecords();

            const row = [
                String(i + 1),
                s.name,
                getTurkishClassName(s.class_name),
            ];

            if (selectedProgram === 'genel') {
                allPrograms.forEach((p) => {
                    const progData = programPercentages[p];
                    const val = progData ? (progData.var + progData.izinli) :
                        (programsWithRecordsSet.has(p) ? 100 : 0);
                    row.push(val + '%');
                });
            } else {
                const progData = programPercentages[selectedProgram];
                const val = progData ? (progData.var + progData.izinli) :
                    (programsWithRecordsSet.has(selectedProgram) ? 100 : 0);
                row.push(val + '%');
            }

            row.push(genel + '%');
            return row;
        });

        autoTable(doc, {
            head: [headers],
            body: tableData,
            startY: subtitle ? 26 : 20,
            theme: 'grid',
            styles: {
                cellPadding: 3,
                fontSize: 9,
                halign: 'center',
                valign: 'middle',
            },
            headStyles: {
                fillColor: [241, 245, 249],
                textColor: [71, 85, 105],
                fontStyle: 'bold',
                fontSize: 9,
                halign: 'center',
            },
            columnStyles: {
                0: { cellWidth: 10, halign: 'center' },
                1: { cellWidth: 45, halign: 'left' },
                2: { cellWidth: 30, halign: 'center' },
            },
            didParseCell: function (data) {
                // Apply color coding to percentage cells (program columns and genel)
                if (data.section === 'body' && data.column.index >= 3) {
                    const cellValue = data.cell.text[0];
                    const val = parseInt(cellValue);

                    if (!isNaN(val)) {
                        if (val < 60) {
                            data.cell.styles.fillColor = [252, 165, 165]; // Red
                            data.cell.styles.textColor = [153, 27, 27];
                            data.cell.styles.fontStyle = 'bold';
                        } else if (val < 80) {
                            data.cell.styles.fillColor = [253, 224, 71]; // Yellow
                            data.cell.styles.textColor = [113, 63, 18];
                            data.cell.styles.fontStyle = 'bold';
                        } else {
                            data.cell.styles.fillColor = [134, 239, 172]; // Green
                            data.cell.styles.textColor = [22, 101, 52];
                            data.cell.styles.fontStyle = 'bold';
                        }
                    }
                }

                // Style row number column
                if (data.section === 'body' && data.column.index === 0) {
                    data.cell.styles.textColor = [100, 116, 139];
                    data.cell.styles.fontStyle = 'bold';
                }

                // Style name column
                if (data.section === 'body' && data.column.index === 1) {
                    data.cell.styles.textColor = [30, 41, 59];
                    data.cell.styles.fontStyle = 'bold';
                }

                // Style class column
                if (data.section === 'body' && data.column.index === 2) {
                    data.cell.styles.textColor = [71, 85, 105];
                }
            },
        });

        // Add footer with generation date
        const pageCount = (doc as any).internal.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.text(
                `Oluşturulma: ${new Date().toLocaleString('tr-TR')} | Sayfa ${i} / ${pageCount}`,
                doc.internal.pageSize.width / 2,
                doc.internal.pageSize.height - 10,
                { align: 'center' }
            );
        }

        doc.save(`istatistikler_${new Date().toLocaleDateString('tr-TR')}.pdf`);
    };

    return (
        <>
            <ToastContainer />
            <div className="container" style={{ padding: '0 12px', maxWidth: 1200 }}>
                <PageHeader
                    icon=""
                    title="İstatistikler"
                    subtitle="Talebe yoklama istatistiklerini görüntüleyin ve analiz edin"
                    color="#1e40af"
                />

                <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                    <span
                        className="badge bg-success"
                        style={{
                            padding: '8px 16px',
                            borderRadius: '20px',
                            fontSize: '0.9rem',
                            fontWeight: '700'
                        }}
                    >
                        Toplam: {filteredStats.length}
                    </span>
                    <button
                        className="btn btn-light btn-sm"
                        onClick={() => {
                            setSelectedColor('');
                            setSelectedClass('');
                            setSearchTerm('');
                            setSelectedProgram('genel');
                        }}
                        style={{
                            borderRadius: '8px',
                            padding: '6px 16px',
                            fontWeight: '600',
                            fontSize: '0.85rem'
                        }}
                    >
                        Temizle
                    </button>
                </div>

                <div className="card shadow border-0 mb-3"
                    style={{
                        borderRadius: '12px'
                    }}
                >
                    <div className="card-body p-2 p-md-3">
                        <div className="row g-2 mb-2">
                            <div className="col-6 col-md-3">
                                <label className="form-label fw-bold mb-1 d-none d-md-block" style={{ fontSize: '0.85rem' }}>Başlangıç</label>
                                <input
                                    type="date"
                                    className="form-control form-control-sm"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </div>
                            <div className="col-6 col-md-3">
                                <label className="form-label fw-bold mb-1 d-none d-md-block" style={{ fontSize: '0.85rem' }}>Bitiş</label>
                                <input
                                    type="date"
                                    className="form-control form-control-sm"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>
                            <div className="col-md-2">
                                <label className="form-label fw-bold mb-1 d-none d-md-block" style={{ fontSize: '0.85rem' }}>Program</label>
                                <select
                                    className="form-select form-select-sm"
                                    value={selectedProgram}
                                    onChange={e => setSelectedProgram(e.target.value)}
                                >
                                    <option value="genel">Genel</option>
                                    {allPrograms.map(p => (
                                        <option key={p} value={p}>
                                            {PROGRAM_TURKISH_MAP[p] || p.replace(/_/g, ' ')}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-md-2">
                                <label className="form-label text-white fw-bold mb-1 d-none d-md-block" style={{ fontSize: '0.85rem' }}>Dahili Seviye</label>
                                <select
                                    className="form-select form-select-sm"
                                    value={selectedClass}
                                    onChange={e => setSelectedClass(e.target.value)}
                                >
                                    <option value="">Tümü</option>
                                    {Object.entries(CLASS_NAME_TURKISH_MAP).map(([key, label]) => (
                                        <option key={key} value={key}>
                                            {label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-md-2 d-flex align-items-end">
                                <button
                                    className="btn btn-primary btn-sm w-100"
                                    onClick={fetchStatistics}
                                    style={{
                                        transition: 'all 0.3s ease-in-out',
                                        fontWeight: 600,
                                        borderRadius: '8px',
                                        padding: '8px 16px',
                                        fontSize: '0.85rem'
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.03)')}
                                    onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                                >
                                    Verileri Getir
                                </button>
                            </div>
                        </div>

                        <div className="mb-3 d-flex flex-wrap gap-2 align-items-center">
                            {[
                                { label: 'İyi', color: 'green', value: 'green', textColor: 'white' },
                                { label: 'Orta', color: 'yellow', value: 'yellow', textColor: 'black' },
                                { label: 'Zayıf', color: 'red', value: 'red', textColor: 'white' },
                            ].map(({ label, color, value, textColor }) => (
                                <span
                                    key={value}
                                    className="badge"
                                    style={{
                                        backgroundColor: color,
                                        color: textColor,
                                        opacity: selectedColor === value ? 1 : 0.5,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease-in-out',
                                        transform: selectedColor === value ? 'scale(1.05)' : 'scale(1)',
                                        fontSize: 16,
                                        padding: '0.7em 1.2em',
                                        border: selectedColor === value ? '2px solid #333' : undefined,
                                        boxShadow: selectedColor === value ? '0 2px 8px rgba(0,0,0,0.08)' : undefined,
                                    }}
                                    onClick={() => setSelectedColor(selectedColor === value ? '' : value)}
                                >
                                    {label}
                                </span>
                            ))}

                            <input
                                className="form-control form-control-sm w-auto ms-2"
                                type="text"
                                placeholder="İsim ara..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ minWidth: 180 }}
                            />
                            <div className="btn-group ms-2">
                                <button
                                    className="btn btn-outline-success btn-sm dropdown-toggle"
                                    data-bs-toggle="dropdown"
                                    aria-expanded="false"
                                    type="button"
                                >
                                    Farklı Kaydet
                                </button>
                                <ul className="dropdown-menu">
                                    <li>
                                        <button className="dropdown-item" onClick={handleExportToCSV}>CSV olarak indir</button>
                                    </li>
                                    <li>
                                        <button className="dropdown-item" onClick={handleExportToExcel}>Excel olarak indir</button>
                                    </li>
                                    <li>
                                        <button className="dropdown-item" onClick={handleExportToPDF}>PDF olarak indir</button>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Program selector for "genel" calculation */}
                        {selectedProgram === 'genel' && (
                            <div className="mb-3 p-3 border rounded" style={{ backgroundColor: '#f8f9fa' }}>
                                <div className="d-flex align-items-center mb-2">
                                    <label className="form-label fw-bold mb-0 me-3" style={{ fontSize: '0.9rem' }}>
                                        📊 Genel Hesaplamaya Dahil Programlar:
                                    </label>
                                    <button
                                        className="btn btn-sm btn-outline-primary me-2"
                                        onClick={() => setProgramsForGenel(new Set(PROGRAM_ORDER))}
                                        style={{ fontSize: '0.75rem', padding: '4px 12px' }}
                                    >
                                        Tümünü Seç
                                    </button>
                                    <button
                                        className="btn btn-sm btn-outline-secondary"
                                        onClick={() => setProgramsForGenel(new Set())}
                                        style={{ fontSize: '0.75rem', padding: '4px 12px' }}
                                    >
                                        Tümünü Kaldır
                                    </button>
                                </div>
                                <div className="d-flex flex-wrap gap-2">
                                    {PROGRAM_ORDER.map(program => (
                                        <div
                                            key={program}
                                            style={{
                                                padding: '10px 16px',
                                                borderRadius: '8px',
                                                border: programsForGenel.has(program) ? '2px solid #0d6efd' : '2px solid #dee2e6',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                boxShadow: programsForGenel.has(program) ? '0 2px 8px rgba(13, 110, 253, 0.25)' : 'none',
                                                backgroundColor: programsForGenel.has(program) ? '#e7f3ff' : 'white',
                                                fontSize: '0.85rem',
                                                fontWeight: programsForGenel.has(program) ? '600' : '500',
                                                color: programsForGenel.has(program) ? '#0d6efd' : '#495057',
                                                userSelect: 'none'
                                            }}
                                            onClick={() => {
                                                const newSet = new Set(programsForGenel);
                                                if (newSet.has(program)) {
                                                    newSet.delete(program);
                                                } else {
                                                    newSet.add(program);
                                                }
                                                setProgramsForGenel(newSet);
                                            }}
                                        >
                                            {PROGRAM_TURKISH_MAP[program] || program}
                                        </div>
                                    ))}
                                </div>
                                <small className="text-muted mt-2 d-block" style={{ fontSize: '0.75rem' }}>
                                    ℹ️ Seçilen programlar tabloda gösterilir ve "Genel" sütunu bu programların ortalaması olarak hesaplanır. ({programsForGenel.size} program seçili)
                                </small>
                            </div>
                        )}

                        {/* Charts Section */}
                        {filteredStats.length > 0 && (
                            <div className="row g-3 mb-4">
                                {/* Attendance Distribution Bar Chart */}
                                <div className="col-md-6">
                                    <div className="card shadow-sm border-0" style={{ borderRadius: '12px' }}>
                                        <div className="card-body">
                                            <h6 className="card-title mb-3 fw-bold" style={{ color: '#1e40af' }}>
                                                Yoklama Dağılımı
                                            </h6>
                                            <Bar
                                                data={{
                                                    labels: ['İyi (>80%)', 'Orta (60-80%)', 'Zayıf (<60%)'],
                                                    datasets: [{
                                                        label: 'Talebe Sayısı',
                                                        data: [
                                                            filteredStats.filter(s => getPercentageForProgram(s, selectedProgram) > 80).length,
                                                            filteredStats.filter(s => {
                                                                const p = getPercentageForProgram(s, selectedProgram);
                                                                return p >= 60 && p <= 80;
                                                            }).length,
                                                            filteredStats.filter(s => getPercentageForProgram(s, selectedProgram) < 60).length
                                                        ],
                                                        backgroundColor: [
                                                            'rgba(134, 239, 172, 0.8)',
                                                            'rgba(253, 224, 71, 0.8)',
                                                            'rgba(252, 165, 165, 0.8)'
                                                        ],
                                                        borderColor: [
                                                            'rgb(134, 239, 172)',
                                                            'rgb(253, 224, 71)',
                                                            'rgb(252, 165, 165)'
                                                        ],
                                                        borderWidth: 2,
                                                        borderRadius: 8
                                                    }]
                                                }}
                                                options={{
                                                    responsive: true,
                                                    maintainAspectRatio: true,
                                                    aspectRatio: 1.5,
                                                    plugins: {
                                                        legend: { display: false },
                                                        tooltip: {
                                                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                                            padding: 12,
                                                            titleFont: { size: 14 },
                                                            bodyFont: { size: 13 }
                                                        }
                                                    },
                                                    scales: {
                                                        y: {
                                                            beginAtZero: true,
                                                            ticks: { stepSize: 1 },
                                                            grid: { color: 'rgba(0, 0, 0, 0.05)' }
                                                        },
                                                        x: {
                                                            grid: { display: false }
                                                        }
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Performance Percentage Doughnut Chart */}
                                <div className="col-md-6">
                                    <div className="card shadow-sm border-0" style={{ borderRadius: '12px' }}>
                                        <div className="card-body">
                                            <h6 className="card-title mb-3 fw-bold" style={{ color: '#1e40af' }}>
                                                Performans Dağılımı (%)
                                            </h6>
                                            <Doughnut
                                                data={{
                                                    labels: ['İyi', 'Orta', 'Zayıf'],
                                                    datasets: [{
                                                        data: [
                                                            filteredStats.filter(s => getPercentageForProgram(s, selectedProgram) > 80).length,
                                                            filteredStats.filter(s => {
                                                                const p = getPercentageForProgram(s, selectedProgram);
                                                                return p >= 60 && p <= 80;
                                                            }).length,
                                                            filteredStats.filter(s => getPercentageForProgram(s, selectedProgram) < 60).length
                                                        ],
                                                        backgroundColor: [
                                                            'rgba(134, 239, 172, 0.85)',
                                                            'rgba(253, 224, 71, 0.85)',
                                                            'rgba(252, 165, 165, 0.85)'
                                                        ],
                                                        borderColor: ['#fff', '#fff', '#fff'],
                                                        borderWidth: 3,
                                                        hoverOffset: 10
                                                    }]
                                                }}
                                                options={{
                                                    responsive: true,
                                                    maintainAspectRatio: true,
                                                    aspectRatio: 1.5,
                                                    plugins: {
                                                        legend: {
                                                            position: 'bottom',
                                                            labels: {
                                                                padding: 15,
                                                                font: { size: 12, weight: 'bold' as const },
                                                                usePointStyle: true,
                                                                pointStyle: 'circle'
                                                            }
                                                        },
                                                        tooltip: {
                                                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                                            padding: 12,
                                                            callbacks: {
                                                                label: function (context) {
                                                                    const label = context.label || '';
                                                                    const value = context.parsed || 0;
                                                                    const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                                                                    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                                                    return `${label}: ${value} talebe (${percentage}%)`;
                                                                }
                                                            }
                                                        }
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Program-wise Performance Bar Chart */}
                                {selectedProgram === 'genel' && allPrograms.length > 0 && (
                                    <div className="col-12">
                                        <div className="card shadow-sm border-0" style={{ borderRadius: '12px' }}>
                                            <div className="card-body">
                                                <h6 className="card-title mb-3 fw-bold" style={{ color: '#1e40af' }}>
                                                    Program Bazında Ortalama Katılım
                                                </h6>
                                                <Bar
                                                    data={{
                                                        labels: allPrograms.map(p => PROGRAM_TURKISH_MAP[p] || p),
                                                        datasets: [{
                                                            label: 'Ortalama Katılım (%)',
                                                            data: allPrograms.map(prog => {
                                                                const programStats = filteredStats.map(stat => {
                                                                    const programPercentages = computeProgramPercentages(stat, attendanceRecords);
                                                                    const progData = programPercentages[prog];
                                                                    // If no data for this program, return 100 (perfect attendance)
                                                                    return progData ? (progData.var + progData.izinli) : 100;
                                                                });
                                                                const avg = programStats.length > 0
                                                                    ? programStats.reduce((a, b) => a + b, 0) / programStats.length
                                                                    : 0;
                                                                return avg;
                                                            }),
                                                            backgroundColor: 'rgba(30, 64, 175, 0.7)',
                                                            borderColor: 'rgb(30, 64, 175)',
                                                            borderWidth: 2,
                                                            borderRadius: 8
                                                        }]
                                                    }}
                                                    options={{
                                                        responsive: true,
                                                        maintainAspectRatio: true,
                                                        aspectRatio: 2.5,
                                                        plugins: {
                                                            legend: { display: false },
                                                            tooltip: {
                                                                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                                                padding: 12,
                                                                callbacks: {
                                                                    label: function (context) {
                                                                        const yValue = context.parsed?.y ?? 0;
                                                                        return `Ortalama: ${yValue.toFixed(1)}%`;
                                                                    }
                                                                }
                                                            }
                                                        },
                                                        scales: {
                                                            y: {
                                                                beginAtZero: true,
                                                                max: 100,
                                                                ticks: {
                                                                    callback: function (value) {
                                                                        return value + '%';
                                                                    }
                                                                },
                                                                grid: { color: 'rgba(0, 0, 0, 0.05)' }
                                                            },
                                                            x: {
                                                                grid: { display: false }
                                                            }
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Attendance Trend Line Chart */}
                                {attendanceRecords.length > 0 && (
                                    <div className="col-12">
                                        <div className="card shadow-sm border-0" style={{ borderRadius: '12px' }}>
                                            <div className="card-body">
                                                <h6 className="card-title mb-3 fw-bold" style={{ color: '#1e40af' }}>
                                                    Zaman İçinde Katılım Trendi
                                                </h6>
                                                <Line
                                                    data={{
                                                        labels: (() => {
                                                            // Get unique dates from attendance records
                                                            const dates = [...new Set(attendanceRecords.map(r => r.date))].sort();
                                                            // Format dates
                                                            return dates.map(date => {
                                                                const d = new Date(date);
                                                                return d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' });
                                                            });
                                                        })(),
                                                        datasets: (() => {
                                                            const dates = [...new Set(attendanceRecords.map(r => r.date))].sort();

                                                            // Calculate attendance percentages for each date
                                                            const varData = dates.map(date => {
                                                                const dayRecords = attendanceRecords.filter(r => r.date === date);
                                                                const varCount = dayRecords.filter(r => r.attendance_type_name === 'var').length;
                                                                return dayRecords.length > 0 ? (varCount / dayRecords.length) * 100 : 0;
                                                            });

                                                            const izinliData = dates.map(date => {
                                                                const dayRecords = attendanceRecords.filter(r => r.date === date);
                                                                const izinliCount = dayRecords.filter(r => r.attendance_type_name === 'izinli').length;
                                                                return dayRecords.length > 0 ? (izinliCount / dayRecords.length) * 100 : 0;
                                                            });

                                                            const yokData = dates.map(date => {
                                                                const dayRecords = attendanceRecords.filter(r => r.date === date);
                                                                const yokCount = dayRecords.filter(r => r.attendance_type_name === 'yok').length;
                                                                return dayRecords.length > 0 ? (yokCount / dayRecords.length) * 100 : 0;
                                                            });

                                                            return [
                                                                {
                                                                    label: 'Var',
                                                                    data: varData,
                                                                    borderColor: 'rgb(134, 239, 172)',
                                                                    backgroundColor: 'rgba(134, 239, 172, 0.2)',
                                                                    borderWidth: 3,
                                                                    tension: 0.4,
                                                                    fill: true,
                                                                    pointRadius: 4,
                                                                    pointHoverRadius: 6,
                                                                    pointBackgroundColor: 'rgb(134, 239, 172)',
                                                                    pointBorderColor: '#fff',
                                                                    pointBorderWidth: 2
                                                                },
                                                                {
                                                                    label: 'İzinli',
                                                                    data: izinliData,
                                                                    borderColor: 'rgb(253, 224, 71)',
                                                                    backgroundColor: 'rgba(253, 224, 71, 0.2)',
                                                                    borderWidth: 3,
                                                                    tension: 0.4,
                                                                    fill: true,
                                                                    pointRadius: 4,
                                                                    pointHoverRadius: 6,
                                                                    pointBackgroundColor: 'rgb(253, 224, 71)',
                                                                    pointBorderColor: '#fff',
                                                                    pointBorderWidth: 2
                                                                },
                                                                {
                                                                    label: 'Yok',
                                                                    data: yokData,
                                                                    borderColor: 'rgb(252, 165, 165)',
                                                                    backgroundColor: 'rgba(252, 165, 165, 0.2)',
                                                                    borderWidth: 3,
                                                                    tension: 0.4,
                                                                    fill: true,
                                                                    pointRadius: 4,
                                                                    pointHoverRadius: 6,
                                                                    pointBackgroundColor: 'rgb(252, 165, 165)',
                                                                    pointBorderColor: '#fff',
                                                                    pointBorderWidth: 2
                                                                }
                                                            ];
                                                        })()
                                                    }}
                                                    options={{
                                                        responsive: true,
                                                        maintainAspectRatio: true,
                                                        aspectRatio: 2.5,
                                                        interaction: {
                                                            mode: 'index',
                                                            intersect: false
                                                        },
                                                        plugins: {
                                                            legend: {
                                                                position: 'top',
                                                                align: 'end',
                                                                labels: {
                                                                    padding: 15,
                                                                    font: { size: 12, weight: 'bold' as const },
                                                                    usePointStyle: true,
                                                                    pointStyle: 'circle',
                                                                    boxWidth: 8,
                                                                    boxHeight: 8
                                                                }
                                                            },
                                                            tooltip: {
                                                                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                                                padding: 12,
                                                                titleFont: { size: 14 },
                                                                bodyFont: { size: 13 },
                                                                callbacks: {
                                                                    label: function (context) {
                                                                        const label = context.dataset.label || '';
                                                                        const value = context.parsed?.y ?? 0;
                                                                        return `${label}: ${value.toFixed(1)}%`;
                                                                    }
                                                                }
                                                            }
                                                        },
                                                        scales: {
                                                            y: {
                                                                beginAtZero: true,
                                                                max: 100,
                                                                ticks: {
                                                                    callback: function (value) {
                                                                        return value + '%';
                                                                    }
                                                                },
                                                                grid: {
                                                                    color: 'rgba(0, 0, 0, 0.05)'
                                                                },
                                                                title: {
                                                                    display: true,
                                                                    text: 'Katılım Yüzdesi',
                                                                    font: { size: 12, weight: 'bold' as const }
                                                                }
                                                            },
                                                            x: {
                                                                grid: {
                                                                    display: false
                                                                },
                                                                title: {
                                                                    display: true,
                                                                    text: 'Tarih',
                                                                    font: { size: 12, weight: 'bold' as const }
                                                                }
                                                            }
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="card shadow-sm border-0" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                            <div style={{ overflowX: 'auto' }}>
                                <table className="table align-middle mb-0" style={{ minWidth: '800px' }}>
                                    <thead style={{
                                        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                                        borderBottom: '2px solid #e2e8f0'
                                    }}>
                                        <tr>
                                            <th
                                                style={{
                                                    cursor: 'pointer',
                                                    padding: '16px',
                                                    fontWeight: '600',
                                                    color: '#475569',
                                                    fontSize: '0.875rem',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.05em',
                                                    textAlign: 'center'
                                                }}
                                                onClick={() =>
                                                    setSortConfig((prev) =>
                                                        prev?.key === 'rownum'
                                                            ? { key: 'rownum', direction: prev.direction === 'asc' ? 'desc' : 'asc' }
                                                            : { key: 'rownum', direction: 'asc' }
                                                    )
                                                }
                                            >
                                                #
                                            </th>
                                            <th
                                                style={{
                                                    cursor: 'pointer',
                                                    padding: '16px',
                                                    fontWeight: '600',
                                                    color: '#475569',
                                                    fontSize: '0.875rem',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.05em',
                                                    textAlign: 'left'
                                                }}
                                                onClick={() =>
                                                    setSortConfig((prev) =>
                                                        prev?.key === 'name'
                                                            ? { key: 'name', direction: prev.direction === 'asc' ? 'desc' : 'asc' }
                                                            : { key: 'name', direction: 'asc' }
                                                    )
                                                }
                                            >
                                                İsim {getSortIcon('name')}
                                            </th>
                                            <th
                                                style={{
                                                    cursor: 'pointer',
                                                    padding: '16px',
                                                    fontWeight: '600',
                                                    color: '#475569',
                                                    fontSize: '0.875rem',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.05em',
                                                    textAlign: 'center'
                                                }}
                                                onClick={() =>
                                                    setSortConfig((prev) =>
                                                        prev?.key === 'class_name'
                                                            ? { key: 'class_name', direction: prev.direction === 'asc' ? 'desc' : 'asc' }
                                                            : { key: 'class_name', direction: 'asc' }
                                                    )
                                                }
                                            >
                                                Dahili Seviye {getSortIcon('class_name')}
                                            </th>
                                            {selectedProgram === 'genel'
                                                ? allPrograms.map((p) => (
                                                    <th key={p} style={{
                                                        cursor: 'pointer',
                                                        padding: '16px',
                                                        fontWeight: '600',
                                                        color: '#475569',
                                                        fontSize: '0.875rem',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.05em',
                                                        textAlign: 'center'
                                                    }}
                                                        onClick={() =>
                                                            setSortConfig((prev) =>
                                                                prev?.key === p
                                                                    ? { key: p, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
                                                                    : { key: p, direction: 'desc' }
                                                            )
                                                        }
                                                    >
                                                        {PROGRAM_TURKISH_MAP[p] || p.replace(/_/g, ' ')} {getSortIcon(p)}
                                                    </th>
                                                ))
                                                : (
                                                    <th
                                                        style={{
                                                            cursor: 'pointer',
                                                            padding: '16px',
                                                            fontWeight: '600',
                                                            color: '#475569',
                                                            fontSize: '0.875rem',
                                                            textTransform: 'uppercase',
                                                            letterSpacing: '0.05em',
                                                            textAlign: 'center'
                                                        }}
                                                        onClick={() =>
                                                            setSortConfig((prev) =>
                                                                prev?.key === selectedProgram
                                                                    ? { key: selectedProgram, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
                                                                    : { key: selectedProgram, direction: 'desc' }
                                                            )
                                                        }
                                                    >
                                                        {PROGRAM_TURKISH_MAP[selectedProgram] || selectedProgram.replace(/_/g, ' ')} {getSortIcon(selectedProgram)}
                                                    </th>
                                                )
                                            }
                                            <th
                                                style={{
                                                    cursor: 'pointer',
                                                    padding: '16px',
                                                    fontWeight: '600',
                                                    color: '#475569',
                                                    fontSize: '0.875rem',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.05em',
                                                    textAlign: 'center'
                                                }}
                                                onClick={() =>
                                                    setSortConfig((prev) =>
                                                        prev?.key === 'genel'
                                                            ? { key: 'genel', direction: prev.direction === 'asc' ? 'desc' : 'asc' }
                                                            : { key: 'genel', direction: 'desc' }
                                                    )
                                                }
                                            >
                                                Genel {getSortIcon('genel')}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sortedStats.length === 0 ? (
                                            <tr>
                                                <td colSpan={selectedProgram === 'genel' ? 4 + allPrograms.length : 5}
                                                    className="text-center text-muted"
                                                    style={{ padding: '40px', fontSize: '0.95rem' }}>
                                                    Sonuç bulunamadı.
                                                </td>
                                            </tr>
                                        ) : sortedStats.map((s, i) => {
                                            const { genel } = getProgramSums(s);
                                            if (selectedProgram === 'genel') {
                                                const programsWithRecordsSet = getProgramsWithRecords();
                                                const programPercentages = computeProgramPercentages(s, attendanceRecords);

                                                return (
                                                    <tr key={s.studentid} style={{
                                                        borderBottom: '1px solid #f1f5f9',
                                                        transition: 'background-color 0.2s ease'
                                                    }}
                                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                    >
                                                        <td style={{ padding: '16px', textAlign: 'center', color: '#64748b', fontWeight: '500' }}>
                                                            {i + 1}
                                                        </td>
                                                        <td style={{ padding: '16px', textAlign: 'left', color: '#1e293b', fontWeight: '500' }}>
                                                            {s.name}
                                                        </td>
                                                        <td style={{ padding: '16px', textAlign: 'center', color: '#475569' }}>
                                                            {getTurkishClassName(s.class_name)}
                                                        </td>
                                                        {allPrograms.map((prog, idx) => {
                                                            const progData = programPercentages[prog];
                                                            const val = progData ? (progData.var + progData.izinli) :
                                                                (programsWithRecordsSet.has(prog) ? 100 : 0);
                                                            let badgeStyle = modernBadgeStyles.success;
                                                            if (val < 60) badgeStyle = modernBadgeStyles.danger;
                                                            else if (val < 80) badgeStyle = modernBadgeStyles.warning;
                                                            return (
                                                                <td key={idx} style={{ padding: '16px', textAlign: 'center' }}>
                                                                    <span style={badgeStyle}>{val}%</span>
                                                                </td>
                                                            );
                                                        })}
                                                        <td style={{ padding: '16px', textAlign: 'center' }}>
                                                            <span style={
                                                                genel < 60
                                                                    ? modernBadgeStyles.danger
                                                                    : genel < 80
                                                                        ? modernBadgeStyles.warning
                                                                        : modernBadgeStyles.success
                                                            }>
                                                                {genel}%
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            } else {
                                                const programPercentages = computeProgramPercentages(s, attendanceRecords);
                                                const programsWithRecordsSet = getProgramsWithRecords();
                                                const progData = programPercentages[selectedProgram];
                                                const val = progData ? (progData.var + progData.izinli) :
                                                    (programsWithRecordsSet.has(selectedProgram) ? 100 : 0);
                                                let badgeStyle = modernBadgeStyles.success;
                                                if (val < 60) badgeStyle = modernBadgeStyles.danger;
                                                else if (val < 75) badgeStyle = modernBadgeStyles.warning;
                                                return (
                                                    <tr key={s.studentid} style={{
                                                        borderBottom: '1px solid #f1f5f9',
                                                        transition: 'background-color 0.2s ease'
                                                    }}
                                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                    >
                                                        <td style={{ padding: '16px', textAlign: 'center', color: '#64748b', fontWeight: '500' }}>
                                                            {i + 1}
                                                        </td>
                                                        <td style={{ padding: '16px', textAlign: 'left', color: '#1e293b', fontWeight: '500' }}>
                                                            {s.name}
                                                        </td>
                                                        <td style={{ padding: '16px', textAlign: 'center', color: '#475569' }}>
                                                            {getTurkishClassName(s.class_name)}
                                                        </td>
                                                        <td style={{ padding: '16px', textAlign: 'center' }}>
                                                            <span style={badgeStyle}>{val}%</span>
                                                        </td>
                                                        <td style={{ padding: '16px', textAlign: 'center' }}>
                                                            <span style={
                                                                genel < 60
                                                                    ? modernBadgeStyles.danger
                                                                    : genel < 75
                                                                        ? modernBadgeStyles.warning
                                                                        : modernBadgeStyles.success
                                                            }>
                                                                {genel}%
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            }
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            {loading && (
                                <div className="text-center my-4">
                                    <div className="spinner-border text-primary" role="status">
                                        <span className="visually-hidden">Yükleniyor...</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Statistics;




