import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Student, Attendance } from '../types';

type AttendanceType = 'var' | 'gec' | 'yok' | 'izinli';

interface Props {
    student: Student;
    record?: Attendance;
    date: string;
    program: string;
    onChange: () => void;
}

const typeLabels: Record<AttendanceType, string> = {
    var: 'Var',
    yok: 'Yok',
    gec: 'Geç',
    izinli: 'İzinli'
};

const buttonClasses: Record<AttendanceType, { solid: string; outline: string }> = {
    var: { solid: 'btn-success', outline: 'btn-outline-success' },
    gec: { solid: 'btn-warning', outline: 'btn-outline-warning' },
    yok: { solid: 'btn-danger', outline: 'btn-outline-danger' },
    izinli: { solid: 'btn-info', outline: 'btn-outline-info' }
};

const classColors: Record<string, string> = {
    kuranikerim: '#B3E5FC',
    hazirlik: '#FFCDD2',
    ibtidai: '#D1C4E9',
    ihzari: '#C8E6C9',
    'mezun tekamulalti': '#FFE082',
    'tekamul alti': '#90CAF9',
};

const AttendanceCard: React.FC<Props> = ({ student, record, date, program, onChange }) => {
    const [attendanceType, setAttendanceType] = useState<AttendanceType>(
        (record?.attendance_type_name?.toLowerCase() as AttendanceType) || 'yok'
    );

    const [sebep, setSebep] = useState(record?.sebep ?? '');
    const [saving, setSaving] = useState(false);

    const updateAttendance = async (type: AttendanceType, sebepValue: string) => {
        setAttendanceType(type);
        setSaving(true);

        const body = {
            studentid: student.studentid,
            date,
            program_name: program,
            attendance_type_name: type,
            sebep: ['gec', 'izinli'].includes(type) ? sebepValue : null
        };

        const checkUrl = `http://localhost:3001/attendance?studentid=${student.studentid}&date=${date}&program_name=${program}`;
        const checkRes = await fetch(checkUrl);
        const exists = checkRes.ok && await checkRes.json();

        const method = exists ? 'PUT' : 'POST';
        const saveUrl = exists ? 'http://localhost:3001/attendance/put' : 'http://localhost:3001/attendance/create';

        await fetch(saveUrl, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        onChange();
        setSaving(false);
    };

    const handleTypeSelect = (type: AttendanceType) => {
        updateAttendance(type, sebep);
    };

    const handleSebepChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newSebep = e.target.value;
        setSebep(newSebep);
        updateAttendance(attendanceType, newSebep);
    };

    const normalizedClass = student.class_name.trim().toLowerCase();
    const cardColor = classColors[normalizedClass] || '#f8f9fa';

    return (
        <motion.div
            className="card shadow-sm"
            style={{
                backgroundColor: cardColor,
                borderLeft: `5px solid ${cardColor}`,
                transition: 'background-color 0.3s ease'
            }}
        >
            <div className="card-body py-3 px-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                    <div>
                        <h5 className="mb-1">{student.first_name} {student.last_name}</h5>
                        <p className="mb-0 text-muted small">{student.class_name}</p>
                    </div>
                </div>

                <div className="d-flex justify-content-between gap-2 flex-wrap mt-2">
                    {(Object.keys(typeLabels) as AttendanceType[]).map((type) => (
                        <button
                            key={type}
                            className={`btn btn-sm flex-grow-1 ${type === attendanceType ? buttonClasses[type].solid : buttonClasses[type].outline}`}
                            onClick={() => handleTypeSelect(type)}
                        >
                            {typeLabels[type]}
                        </button>
                    ))}
                </div>

                {['gec', 'izinli'].includes(attendanceType) && (
                    <div className="mt-3">
                        <select
                            className="form-select form-select-sm"
                            value={sebep}
                            onChange={handleSebepChange}
                        >
                            <option value="">Seçin</option>
                            <option value="Banyo">Banyo</option>
                            <option value="Hasta">Hasta</option>
                            <option value="Rahatsiz">Rahatsız</option>
                            <option value="Okul">Okul</option>
                        </select>
                    </div>
                )}

                <AnimatePresence>
                    {saving && (
                        <motion.div
                            className="text-success text-end mt-2"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <small>✓ Kaydedildi</small>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

export default AttendanceCard;
