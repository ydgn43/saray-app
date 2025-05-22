import React, { useState, useEffect } from 'react';
import { Student, Attendance } from '../types';
import { classGroupedColors, groupHeaderTitles } from '../constants';
import { motion } from 'framer-motion';

type AttendanceType = 'var' | 'gec' | 'yok' | 'izinli';

interface Props {
    student: Student;
    record?: Attendance;
    date: string;
    program: string;
    onUpdateAttendance: (studentId: number, type: AttendanceType, sebep: string) => void;
}

const typeLabels: Record<AttendanceType, string> = {
    var: 'VAR',
    yok: 'YOK',
    gec: 'GEÇ',
    izinli: 'İZİNLİ',
};
const typeOptions: AttendanceType[] = ['var', 'gec', 'yok', 'izinli'];
const sebepOptions = ['Banyo', 'Hasta', 'Rahatsiz', 'Okul'];

const activeClass = (type: AttendanceType) => {
    switch (type) {
        case 'var': return 'btn-success text-white fw-bold';
        case 'gec': return 'btn-warning text-dark fw-bold';
        case 'yok': return 'btn-danger text-white fw-bold';
        case 'izinli': return 'btn-info text-white fw-bold';
    }
};
const fadedClass = (type: AttendanceType) => {
    switch (type) {
        case 'var': return 'btn-outline-success';
        case 'gec': return 'btn-outline-warning';
        case 'yok': return 'btn-outline-danger';
        case 'izinli': return 'btn-outline-info';
    }
};

const normalizeClassName = (str: string) => {
    let out = str.trim().toLowerCase().replace(/ /g, '_');
    if (out === 'mezun_tekamulalti') out = 'mezun_tekamul_alti';
    return out;
};

// Helper: darken hex color
function darkenColor(hex: string, amount: number = 35): string {
    hex = hex.replace(/^#/, "");
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);

    r = Math.max(0, r - amount);
    g = Math.max(0, g - amount);
    b = Math.max(0, b - amount);

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// Helper: convert hex color to rgba with alpha
function hexToRgba(hex: string, alpha: number): string {
    hex = hex.replace(/^#/, "");
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
}

const AttendanceCard: React.FC<Props> = ({ student, record, date, program, onUpdateAttendance }) => {
    const [attendanceType, setAttendanceType] = useState<AttendanceType>(
        (record?.attendance_type_name?.toLowerCase() as AttendanceType) || 'yok'
    );
    // Track "Diğer" (other) as a separate value if needed
    const initialSebep = (() => {
        if (!record?.sebep) return '';
        return sebepOptions.includes(record.sebep) ? record.sebep : record.sebep || '';
    })();
    const [sebep, setSebep] = useState(initialSebep);
    const [isOtherSebep, setIsOtherSebep] = useState(
        record?.sebep && !sebepOptions.includes(record.sebep)
    );
    const [customSebep, setCustomSebep] = useState(
        record?.sebep && !sebepOptions.includes(record.sebep) ? record.sebep : ''
    );
    const [recentlyUpdated, setRecentlyUpdated] = useState(false);

    const baseColor = classGroupedColors[normalizeClassName(student.class_name)] || '#f5f5f5';
    const edgeColor = darkenColor(baseColor, 35);
    const highlightColor = hexToRgba(edgeColor, 0.21); // semi-transparent for highlight

    // Handler for type buttons
    const handleTypeChange = (type: AttendanceType) => {
        setAttendanceType(type);
        let newSebep = sebep;
        let otherFlag = isOtherSebep;
        let custom = customSebep;
        if (!(type === 'gec' || type === 'izinli')) {
            // Reset sebep and custom if not gec/izinli
            newSebep = '';
            custom = '';
            otherFlag = false;
        }
        setSebep(newSebep);
        setCustomSebep(custom);
        setIsOtherSebep(otherFlag);
        onUpdateAttendance(student.studentid, type, otherFlag ? custom : newSebep);
        setRecentlyUpdated(true);
    };

    // Handler for dropdown change
    const handleSebepChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        if (value === 'diger') {
            setIsOtherSebep(true);
            setSebep('');
            onUpdateAttendance(student.studentid, attendanceType, customSebep);
        } else {
            setIsOtherSebep(false);
            setSebep(value);
            onUpdateAttendance(student.studentid, attendanceType, value);
        }
        setRecentlyUpdated(true);
    };

    // Handler for input change
    const handleCustomSebepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setCustomSebep(value);
        setSebep('');
        setIsOtherSebep(true);
        onUpdateAttendance(student.studentid, attendanceType, value);
        setRecentlyUpdated(true);
    };

    useEffect(() => {
        if (recentlyUpdated) {
            const t = setTimeout(() => setRecentlyUpdated(false), 900);
            return () => clearTimeout(t);
        }
        // eslint-disable-next-line
    }, [recentlyUpdated]);

    // Always show Sebep select and input, but only enable if "gec"/"izinli"
    const sebepEnabled = attendanceType === 'gec' || attendanceType === 'izinli';
    const showCustomInput = sebepEnabled && isOtherSebep;

    return (
        <motion.div
            className="card shadow-sm"
            style={{
                backgroundColor: recentlyUpdated ? highlightColor : baseColor,
                transition: 'background-color 0.6s cubic-bezier(.4,0,.2,1)',
                borderLeft: `4px solid ${edgeColor}`,
            }}
            layout
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 32, scale: 0.98 }}
            whileHover={{ scale: 1.01, boxShadow: '0 4px 16px rgba(0,0,0,0.10)' }}
        >
            <div className="card-body py-3 px-4">
                <h5 className="mb-1">{student.first_name} {student.last_name}</h5>
                <p className="mb-2 text-muted small">
                    {groupHeaderTitles[normalizeClassName(student.class_name)] ?? student.class_name}
                </p>
                <div className="d-flex flex-wrap gap-2 mt-2">
                    {typeOptions.map((type) => (
                        <button
                            key={type}
                            className={`btn btn-sm ${attendanceType === type ? activeClass(type) : fadedClass(type)}`}
                            style={{ flex: '1 1 0', minWidth: 0 }}
                            onClick={() => handleTypeChange(type)}
                            type="button"
                        >
                            {typeLabels[type]}
                        </button>
                    ))}
                </div>
                {/* Sebep Section */}
                <div className="mt-3 d-flex align-items-center gap-2" style={{ minWidth: 150 }}>
                    <select
                        className="form-select form-select-sm"
                        value={
                            isOtherSebep
                                ? 'diger'
                                : sebepOptions.includes(sebep)
                                    ? sebep
                                    : ''
                        }
                        disabled={!sebepEnabled}
                        onChange={handleSebepChange}
                        style={{
                            backgroundColor: !sebepEnabled ? '#f5f5f5' : undefined,
                            cursor: !sebepEnabled ? 'not-allowed' : undefined,
                            opacity: !sebepEnabled ? 0.7 : 1,
                            maxWidth: 100
                        }}
                    >
                        <option value="">Seçin</option>
                        <option value="Banyo">Banyo</option>
                        <option value="Hasta">Hasta</option>
                        <option value="Rahatsiz">Rahatsız</option>
                        <option value="Okul">Okul</option>
                        <option value="diger">Diğer</option>
                    </select>
                    <input
                        className="form-control form-control-sm"
                        style={{ minWidth: 80, maxWidth: 120 }}
                        placeholder="Sebep girin"
                        value={showCustomInput ? customSebep : ''}
                        onChange={handleCustomSebepChange}
                        disabled={!sebepEnabled || !isOtherSebep}
                    />
                    <span
                        style={{
                            minWidth: 24,
                            minHeight: 24,
                            display: 'inline-flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginLeft: 4,
                            opacity: recentlyUpdated ? 1 : 0,
                            transition: 'opacity 0.25s'
                        }}
                    >
                        ✓
                    </span>
                </div>
            </div>
        </motion.div>
    );
};

export default AttendanceCard;
