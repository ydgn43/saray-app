// src/components/AttendanceCard.tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Student, Attendance } from '../types';

type AttendanceType = 'var' | 'gec' | 'yok' | 'izinli';

interface Props {
    student: Student;
    record?: Attendance;
    date: string;
    program: string;
    onChange: () => void;
}

const typeColors: Record<AttendanceType, string> = {
    var: '#d4edda',
    yok: '#f8d7da',
    gec: '#fff3cd',
    izinli: '#d1ecf1',
};

const buttonColors: Record<AttendanceType, string> = {
    var: 'success',
    yok: 'danger',
    gec: 'warning',
    izinli: 'info',
};

const AttendanceCard: React.FC<Props> = ({ student, record, date, program, onChange }) => {
    const [attendanceType, setAttendanceType] = useState<AttendanceType>(
        (record?.attendance_type_name?.toLowerCase() as AttendanceType) || 'yok'
    );
    const [sebep, setSebep] = useState(record?.sebep || '');
    const [saving, setSaving] = useState(false);
    const [highlight, setHighlight] = useState(false);

    const updateAttendance = async (type: AttendanceType, sebepValue?: string) => {
        setAttendanceType(type);
        setHighlight(true);
        setSaving(true);

        const payload = {
            studentid: student.studentid,
            date,
            program_name: program,
            attendance_type_name: type,
            sebep: ['gec', 'izinli'].includes(type) ? sebepValue : null,
        };

        const checkUrl = `http://localhost:3001/attendance?studentid=${student.studentid}&date=${date}&program_name=${program}`;
        const checkRes = await fetch(checkUrl);
        const exists = checkRes.ok && (await checkRes.json());

        const method = exists ? 'PUT' : 'POST';
        const saveUrl = exists ? 'http://localhost:3001/attendance/put' : 'http://localhost:3001/attendance/create';

        await fetch(saveUrl, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        setSaving(false);
        onChange();
        setTimeout(() => setHighlight(false), 300); // clear animation state
    };

    const handleSebepChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newSebep = e.target.value;
        setSebep(newSebep);
        updateAttendance(attendanceType, newSebep);
    };

    return (
        <motion.div
            className="card shadow-sm"
            initial={{ scale: 0.98 }}
            animate={{ scale: highlight ? 1.02 : 1, backgroundColor: typeColors[attendanceType] }}
            transition={{ duration: 0.3 }}
            style={{
                borderLeft: `5px solid ${typeColors[attendanceType]}`,
                overflow: 'hidden',
            }}
        >
            <div className="card-body py-3 px-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                    <div>
                        <h5 className="mb-1">{student.first_name} {student.last_name}</h5>
                        <p className="mb-0 text-muted small">{student.class_name}</p>
                    </div>
                </div>

                <div className="d-flex gap-2 mb-2">
                    {(['var', 'gec', 'yok', 'izinli'] as AttendanceType[]).map((type) => (
                        <button
                            key={type}
                            className={`btn btn-sm btn-outline-${buttonColors[type]} ${attendanceType === type ? 'active' : 'opacity-50'}`}
                            onClick={() => updateAttendance(type, sebep)}
                            style={{
                                minWidth: 70,
                                fontWeight: attendanceType === type ? 'bold' : 'normal',
                            }}
                        >
                            {type.toUpperCase()}
                        </button>
                    ))}
                </div>

                {['gec', 'izinli'].includes(attendanceType) && (
                    <select
                        className="form-select form-select-sm mb-2"
                        value={sebep}
                        onChange={handleSebepChange}
                    >
                        <option value="">Sebep Seçin</option>
                        <option value="Banyo">Banyo</option>
                        <option value="Hasta">Hasta</option>
                        <option value="Rahatsiz">Rahatsız</option>
                        <option value="Okul">Okul</option>
                    </select>
                )}

                {saving && <small className="text-success">✓ Kaydediliyor...</small>}
            </div>
        </motion.div>
    );
};

export default AttendanceCard;
