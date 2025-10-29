// src/pages/StudentPortal.tsx
import React, { useEffect, useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { authFetch } from '../utils/authFetch';
import config from '../config';
import { useAuth } from '../auth/AuthContext';

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

function normalizeProgramName(name: string) {
    return name.trim().toLowerCase().replace(/ /g, '_');
}

const StudentPortal = () => {
    const { user } = useAuth();
    const [students, setStudents] = useState<{ studentid: number; name: string }[]>([]);
    const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
    const [selectedYear, setSelectedYear] = useState('');
    const [selectedMonth, setSelectedMonth] = useState('');
    const [statistics, setStatistics] = useState<StatisticEntry[]>([]);
    const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Check if current user is a talebe and has a studentid
    const isTalebe = user?.role === 'talebe';
    const userStudentId = user?.studentid;

    // Generate years array (current year and 5 years back)
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 6 }, (_, i) => currentYear - i);

    // Months array in Turkish
    const months = [
        { value: '01', label: 'Ocak' },
        { value: '02', label: 'Şubat' },
        { value: '03', label: 'Mart' },
        { value: '04', label: 'Nisan' },
        { value: '05', label: 'Mayıs' },
        { value: '06', label: 'Haziran' },
        { value: '07', label: 'Temmuz' },
        { value: '08', label: 'Ağustos' },
        { value: '09', label: 'Eylül' },
        { value: '10', label: 'Ekim' },
        { value: '11', label: 'Kasım' },
        { value: '12', label: 'Aralık' }
    ];

    // Calculate start and end dates from year and month
    const getDateRange = () => {
        if (!selectedYear || !selectedMonth) return { startDate: '', endDate: '' };

        const year = parseInt(selectedYear);
        const month = parseInt(selectedMonth);

        // First day of the month
        const startDate = `${year}-${selectedMonth}-01`;

        // Last day of the month
        const lastDay = new Date(year, month, 0).getDate();
        const endDate = `${year}-${selectedMonth}-${lastDay.toString().padStart(2, '0')}`;

        return { startDate, endDate };
    };

    // Load saved student selection and date from localStorage
    useEffect(() => {
        // If user is a talebe with a studentid, use that automatically
        if (isTalebe && userStudentId) {
            setSelectedStudentId(userStudentId);
        } else {
            // Otherwise, try to load from localStorage (for admin/hoca/yoklamaci)
            const savedStudentId = localStorage.getItem('student-portal-studentId');
            if (savedStudentId) setSelectedStudentId(parseInt(savedStudentId));
        }

        const savedYear = localStorage.getItem('student-portal-year');
        const savedMonth = localStorage.getItem('student-portal-month');

        if (savedYear) setSelectedYear(savedYear);
        if (savedMonth) setSelectedMonth(savedMonth);

        // Set default to current year and month if nothing saved
        if (!savedYear) setSelectedYear(currentYear.toString());
        if (!savedMonth) setSelectedMonth((new Date().getMonth() + 1).toString().padStart(2, '0'));
    }, [isTalebe, userStudentId]);

    // Save selections to localStorage (only for non-talebe users)
    useEffect(() => {
        if (selectedStudentId && !isTalebe) {
            localStorage.setItem('student-portal-studentId', selectedStudentId.toString());
        }
    }, [selectedStudentId, isTalebe]);

    useEffect(() => {
        if (selectedYear) localStorage.setItem('student-portal-year', selectedYear);
    }, [selectedYear]);

    useEffect(() => {
        if (selectedMonth) localStorage.setItem('student-portal-month', selectedMonth);
    }, [selectedMonth]);

    // Fetch all students on component mount (only if not talebe)
    useEffect(() => {
        if (!isTalebe) {
            fetchStudents();
        }
    }, [isTalebe]);

    const fetchStudents = async () => {
        try {
            const res = await authFetch(`${config.API_BASE_URL}/student/`);
            if (!res.ok) throw new Error();
            const data = await res.json();
            const formattedStudents = data.map((s: any) => ({
                studentid: s.studentid,
                name: `${s.first_name} ${s.last_name || ''}`.trim()
            }));
            setStudents(formattedStudents);
        } catch {
            toast.error('Talebe listesi alınamadı.');
        }
    };

    const fetchAttendanceRecords = async () => {
        const { startDate, endDate } = getDateRange();
        if (!startDate || !endDate) return;
        try {
            const res = await authFetch(
                `${config.API_BASE_URL}/attendance/all?startDate=${startDate}&endDate=${endDate}`
            );
            if (!res.ok) throw new Error();
            const data = await res.json();
            setAttendanceRecords(data);
        } catch {
            setAttendanceRecords([]);
        }
    };

    // Helper to get all programs that have at least one record in the date range
    const getProgramsWithRecords = (): Set<string> => {
        const programsSet = new Set<string>();
        attendanceRecords.forEach(rec => {
            programsSet.add(normalizeProgramName(rec.program_name));
        });
        return programsSet;
    };

    const fetchStatistics = async () => {
        const { startDate, endDate } = getDateRange();
        if (!startDate || !endDate) {
            toast.error('Lütfen yıl ve ay seçin.');
            return;
        }
        if (!selectedStudentId) {
            toast.error('Lütfen bir talebe seçin.');
            return;
        }
        setLoading(true);
        try {
            const res = await authFetch(
                `${config.API_BASE_URL}/attendance/statistics?startDate=${startDate}&endDate=${endDate}`
            );
            if (!res.ok) throw new Error();
            const data = await res.json();
            // Filter to show only the selected student's statistics
            const filtered = data.filter((s: StatisticEntry) => s.studentid === selectedStudentId);
            setStatistics(filtered);
            await fetchAttendanceRecords();
        } catch {
            toast.error('İstatistik verileri alınamadı.');
        } finally {
            setLoading(false);
        }
    };

    function computeProgramPercentages(
        stat: StatisticEntry,
        attendanceRecords: any[]
    ): Record<string, { var: number; izinli: number; hasRecords: boolean }> {
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
                result[prog] = {
                    var: total ? Math.round((v / total) * 100) : 0,
                    izinli: total ? Math.round((i / total) * 100) : 0,
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

        // Only calculate for programs that have records in the system
        const programSums = Array.from(programsWithAnyRecords).map((program) => {
            const prog = programPercentages[program];
            if (!prog) return 100; // Program exists but student has no records = 100%
            return prog.var + prog.izinli;
        });

        // Genel: average only of programs that actually have records in the date range
        const valid = programSums.filter(x => typeof x === 'number');
        const genel = valid.length ? Math.round(valid.reduce((a, b) => a + b, 0) / valid.length) : 0;

        return { programSums, genel, programPercentages };
    };

    const selectedStudent = statistics[0];
    const hasData = selectedStudent && statistics.length > 0;

    return (
        <>
            <ToastContainer />
            <div className="container py-4" style={{ maxWidth: 1000 }}>
                <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-4 gap-3">
                    <h1 className="mb-0" style={{ fontWeight: 700, color: '#0d6efd', letterSpacing: 1 }}>
                        Talebe Portalı
                    </h1>
                    {user && (
                        <span className="badge bg-secondary fs-6 px-3 py-2">
                            Hoş geldin, {user.username}
                        </span>
                    )}
                </div>

                {/* Student Selection - Only show for non-talebe users */}
                {!isTalebe && (
                    <div className="card shadow-sm mb-4">
                        <div className="card-body">
                            <h5 className="card-title mb-3">Talebe Seç</h5>
                            <div className="row g-3">
                                <div className="col-md-12">
                                    <label className="form-label fw-semibold">Adın</label>
                                    <select
                                        className="form-select form-select-lg"
                                        value={selectedStudentId || ''}
                                        onChange={(e) => setSelectedStudentId(parseInt(e.target.value))}
                                    >
                                        <option value="">-- Talebe Seç --</option>
                                        {students.map((s) => (
                                            <option key={s.studentid} value={s.studentid}>
                                                {s.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Date Range Selection */}
                <div className="card shadow-sm mb-4">
                    <div className="card-body">
                        <h5 className="card-title mb-3">Tarih Seçimi</h5>
                        <div className="row g-3">
                            <div className="col-md-5">
                                <label className="form-label fw-semibold">Yıl</label>
                                <select
                                    className="form-select"
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(e.target.value)}
                                >
                                    <option value="">Yıl seçin</option>
                                    {years.map(year => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-md-5">
                                <label className="form-label fw-semibold">Ay</label>
                                <select
                                    className="form-select"
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                >
                                    <option value="">Ay seçin</option>
                                    {months.map((month) => (
                                        <option key={month.value} value={month.value}>
                                            {month.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-md-2 d-flex align-items-end">
                                <button
                                    className="btn btn-primary w-100"
                                    onClick={fetchStatistics}
                                    disabled={!selectedStudentId || !selectedYear || !selectedMonth || loading}
                                >
                                    {loading ? 'Yükleniyor...' : 'Getir'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Statistics Display */}
                {hasData && (
                    <div className="card shadow-sm">
                        <div className="card-header bg-primary text-white">
                            <h5 className="mb-0">İstatistiklerim</h5>
                        </div>
                        <div className="card-body">
                            <div className="row mb-4">
                                <div className="col-md-6">
                                    <p className="mb-2"><strong>İsim:</strong> {selectedStudent.name}</p>
                                    <p className="mb-2"><strong>Dahili Seviye:</strong> {getTurkishClassName(selectedStudent.class_name)}</p>
                                </div>
                                <div className="col-md-6 text-md-end">
                                    {(() => {
                                        const { genel } = getProgramSums(selectedStudent);
                                        let badge = 'bg-success';
                                        let text = 'Çok İyi!';
                                        if (genel < 60) {
                                            badge = 'bg-danger';
                                            text = 'Geliştirilmeli';
                                        } else if (genel < 80) {
                                            badge = 'bg-warning text-dark';
                                            text = 'İyi';
                                        }
                                        return (
                                            <div>
                                                <h3 className="mb-2">Genel: {genel}%</h3>
                                                <span className={`badge ${badge} fs-6 px-3 py-2`}>{text}</span>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>

                            <div className="table-responsive">
                                <table className="table table-bordered table-hover align-middle text-center">
                                    <thead className="table-light">
                                        <tr>
                                            {(() => {
                                                const programsWithAnyRecords = getProgramsWithRecords();
                                                return Array.from(programsWithAnyRecords).map((p) => (
                                                    <th key={p}>{PROGRAM_TURKISH_MAP[p] || p.replace(/_/g, ' ')}</th>
                                                ));
                                            })()}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            {(() => {
                                                const { programSums, programPercentages } = getProgramSums(selectedStudent);
                                                const programsWithAnyRecords = getProgramsWithRecords();
                                                return Array.from(programsWithAnyRecords).map((program) => {
                                                    const programData = programPercentages[program];
                                                    if (!programData) return null;

                                                    const val = programData.var + programData.izinli;
                                                    let bg = '';
                                                    if (val < 60) bg = 'bg-danger text-white';
                                                    else if (val < 80) bg = 'bg-warning text-dark';
                                                    else bg = 'bg-success text-white';
                                                    return (
                                                        <td key={program} className={bg}>
                                                            <strong>{val}%</strong>
                                                        </td>
                                                    );
                                                });
                                            })()}
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Legend */}
                            <div className="mt-4">
                                <h6 className="mb-3">Renk Açıklaması:</h6>
                                <div className="d-flex gap-3 flex-wrap">
                                    <span className="badge bg-success px-3 py-2">%80 ve üzeri - Çok İyi</span>
                                    <span className="badge bg-warning text-dark px-3 py-2">%60-79 - İyi</span>
                                    <span className="badge bg-danger px-3 py-2">%60'ın altı - Geliştirilmeli</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {!hasData && !loading && (
                    <div className="alert alert-info text-center">
                        <h5>Hoş Geldin!</h5>
                        <p className="mb-0">İstatistiklerini görmek için yukarıdan adını ve tarih aralığını seç, ardından "Getir" butonuna tıkla.</p>
                    </div>
                )}
            </div>
        </>
    );
};

export default StudentPortal;
