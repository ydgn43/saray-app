import React, { useEffect, useState, useRef } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { authFetch } from '../utils/authFetch';
import config from '../config';

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

    // Get all unique normalized program names from attendanceRecords and statistics
    const allPrograms = PROGRAM_ORDER.filter(p =>
        statistics.length === 0 ||
        statistics.some(stat => {
            if (!attendanceRecords.length) return true;
            return attendanceRecords.some(rec => normalizeProgramName(rec.program_name) === p);
        })
    );

    // Compute program percentages for a statistic entry
    function computeProgramPercentages(
        stat: StatisticEntry,
        attendanceRecords: any[]
    ): Record<string, { var: number; izinli: number }> {
        // If attendanceRecords is empty, return empty object (no per-program stats)
        if (!attendanceRecords.length) {
            return {};
        }
        const studentRecords = attendanceRecords.filter(
            (rec) => rec.studentid === stat.studentid
        );
        const programMap: Record<string, { var: number; izinli: number; total: number }> = {};
        studentRecords.forEach((rec) => {
            const prog = normalizeProgramName(rec.program_name);
            if (!programMap[prog]) programMap[prog] = { var: 0, izinli: 0, total: 0 };
            if (rec.attendance_type_name === 'var') programMap[prog].var += 1;
            if (rec.attendance_type_name === 'izinli') programMap[prog].izinli += 1;
            programMap[prog].total += 1;
        });
        const result: Record<string, { var: number, izinli: number }> = {};
        Object.entries(programMap).forEach(([prog, { var: v, izinli: i, total }]) => {
            result[prog] = {
                var: total ? Math.round((v / total) * 100) : 0,
                izinli: total ? Math.round((i / total) * 100) : 0,
            };
        });
        return result;
    }

    const getProgramSums = (stat: StatisticEntry) => {
        const programPercentages = computeProgramPercentages(stat, attendanceRecords);
        const programSums = allPrograms.map((program) => {
            const prog = programPercentages[program] || { var: 0, izinli: 0 };
            return prog.var + prog.izinli;
        });
        // Genel: average of all programSums (ignore zeros if you want, but here we include all)
        const valid = programSums.filter(x => typeof x === 'number');
        const genel = valid.length ? Math.round(valid.reduce((a, b) => a + b, 0) / valid.length) : 0;
        return { programSums, genel };
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
            const prog = programPercentages[selectedProgram] || { var: 0, izinli: 0 };
            value = prog.var + prog.izinli;
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
                const idx = allPrograms.indexOf(sortConfig.key);
                aValue = getProgramSums(a).programSums[idx] ?? 0;
                bValue = getProgramSums(b).programSums[idx] ?? 0;
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
    }

    // Helper for header rendering
    const getSortIcon = (key: string) => {
        if (!sortConfig || sortConfig.key !== key) return <span style={{ opacity: 0.3 }}>↕</span>;
        return sortConfig.direction === 'asc' ? <span>▲</span> : <span>▼</span>;
    };

    // Export functions
    const handleExportToCSV = () => {
        const csvRows: string[] = [];
        const headers = ['#', 'İsim', 'Sınıf', ...allPrograms.map(p => p.replace(/_/g, ' ')), 'Genel'];
        csvRows.push(headers.join(';'));
        sortedStats.forEach((s, i) => {
            const { programSums, genel } = getProgramSums(s);
            const row = [
                i + 1,
                s.name,
                s.class_name,
                ...programSums,
                genel
            ];
            csvRows.push(row.join(';'));
        });
        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('href', url);
        a.setAttribute('download', 'istatistikler.csv');
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleExportToExcel = () => {
        const ws = XLSX.utils.json_to_sheet(
            sortedStats.map((s, i) => {
                const { programSums, genel } = getProgramSums(s);
                const row: any = {
                    '#': i + 1,
                    'İsim': s.name,
                    'Sınıf': s.class_name,
                };
                allPrograms.forEach((p, idx) => {
                    row[p.replace(/_/g, ' ')] = programSums[idx];
                });
                row['Genel'] = genel;
                return row;
            })
        );
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'İstatistikler');
        XLSX.writeFile(wb, 'istatistikler.xlsx');
    };

    const handleExportToPDF = () => {
        const doc = new jsPDF('l', 'mm', 'a4');
        doc.setFontSize(10);

        // Table
        const tableData = sortedStats.map((s, i) => {
            const { programSums, genel } = getProgramSums(s);
            const row = [
                String(i + 1),
                s.name,
                s.class_name,
                ...programSums.map(String),
                String(genel),
            ];
            return row;
        });

        autoTable(doc, {
            head: [
                ['#', 'İsim', 'Sınıf', ...allPrograms.map(p => p.replace(/_/g, ' ')), 'Genel']
            ],
            body: tableData,
            startY: 20,
            theme: 'grid',
            styles: {
                cellPadding: 2,
                fontSize: 10,
            },
            columnStyles: {
                0: { cellWidth: 10 },
                1: { cellWidth: 40 },
                2: { cellWidth: 30 },
            },
        });

        doc.save('istatistikler.pdf');
    };

    return (
        <>
            <ToastContainer />
            <div className="container py-4" style={{ maxWidth: 1200 }}>
                <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-4 gap-3">
                    <h1 className="mb-0" style={{ fontWeight: 700, color: '#0d6efd', letterSpacing: 1 }}>Yoklama İstatistikleri</h1>
                    <div className="d-flex flex-wrap gap-2 align-items-center">
                        <span className="badge bg-primary fs-6 px-3 py-2">
                            Toplam Öğrenci: {filteredStats.length}
                        </span>
                        <button
                            className="btn btn-outline-secondary btn-sm"
                            onClick={() => {
                                setSelectedColor('');
                                setSelectedClass('');
                                setSearchTerm('');
                                setSelectedProgram('genel');
                            }}
                        >
                            Temizle
                        </button>
                    </div>
                </div>

                <div className="row g-3 mb-3">
                    <div className="col-md-3">
                        <label className="form-label fw-semibold">Başlangıç Tarihi</label>
                        <input
                            type="date"
                            className="form-control"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>
                    <div className="col-md-3">
                        <label className="form-label fw-semibold">Bitiş Tarihi</label>
                        <input
                            type="date"
                            className="form-control"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>
                    <div className="col-md-3">
                        <label className="form-label fw-semibold">Program</label>
                        <select
                            className="form-select"
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
                    <div className="col-md-3 d-flex align-items-end">
                        <button
                            className="btn btn-primary w-100"
                            onClick={fetchStatistics}
                            style={{ transition: 'all 0.3s ease-in-out', fontWeight: 600 }}
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
                        { label: 'Kötü', color: 'red', value: 'red', textColor: 'white' },
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

                <div className="table-responsive shadow-sm rounded-3" style={{ background: '#fff' }}>
                    <table className="table table-bordered table-striped align-middle text-center mb-0">
                        <thead className="table-light">
                            <tr>
                                <th
                                    style={{ cursor: 'pointer' }}
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
                                    style={{ cursor: 'pointer' }}
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
                                    style={{ cursor: 'pointer' }}
                                    onClick={() =>
                                        setSortConfig((prev) =>
                                            prev?.key === 'class_name'
                                                ? { key: 'class_name', direction: prev.direction === 'asc' ? 'desc' : 'asc' }
                                                : { key: 'class_name', direction: 'asc' }
                                        )
                                    }
                                >
                                    Sınıf {getSortIcon('class_name')}
                                </th>
                                {selectedProgram === 'genel'
                                    ? allPrograms.map((p) => (
                                        <th key={p} style={{ cursor: 'pointer' }}
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
                                            style={{ cursor: 'pointer' }}
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
                                    style={{ cursor: 'pointer' }}
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
                                    <td colSpan={selectedProgram === 'genel' ? 4 + allPrograms.length : 5} className="text-center text-muted py-4">
                                        Sonuç bulunamadı.
                                    </td>
                                </tr>
                            ) : sortedStats.map((s, i) => {
                                const { programSums, genel } = getProgramSums(s);
                                if (selectedProgram === 'genel') {
                                    return (
                                        <tr key={s.studentid}>
                                            <td>{i + 1}</td>
                                            <td className="text-start">{s.name}</td>
                                            <td>{getTurkishClassName(s.class_name)}</td>
                                            {programSums.map((val, idx) => {
                                                let bg = '';
                                                if (val < 60) bg = 'bg-danger text-white';
                                                else if (val < 80) bg = 'bg-warning text-dark';
                                                else bg = 'bg-success text-white';
                                                return (
                                                    <td key={idx} className={bg}>{val}%</td>
                                                );
                                            })}
                                            <td className={
                                                genel < 60
                                                    ? 'bg-danger text-white'
                                                    : genel < 80
                                                        ? 'bg-warning text-dark'
                                                        : 'bg-success text-white'
                                            }>
                                                {genel}%
                                            </td>
                                        </tr>
                                    );
                                } else {
                                    const programIdx = allPrograms.indexOf(selectedProgram);
                                    const val = programSums[programIdx] ?? 0;
                                    let bg = '';
                                    if (val < 60) bg = 'bg-danger text-white';
                                    else if (val < 80) bg = 'bg-warning text-dark';
                                    else bg = 'bg-success text-white';
                                    return (
                                        <tr key={s.studentid}>
                                            <td>{i + 1}</td>
                                            <td className="text-start">{s.name}</td>
                                            <td>{getTurkishClassName(s.class_name)}</td>
                                            <td className={bg}>{val}%</td>
                                            <td className={
                                                genel < 60
                                                    ? 'bg-danger text-white'
                                                    : genel < 80
                                                        ? 'bg-warning text-dark'
                                                        : 'bg-success text-white'
                                            }>
                                                {genel}%
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
        </>
    );
};

export default Statistics;


