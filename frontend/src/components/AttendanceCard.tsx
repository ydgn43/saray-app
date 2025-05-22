import React, { useState } from 'react';
import { Student, Attendance } from '../types';
import { classGroupedColors } from '../constants';


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


const AttendanceCard: React.FC<Props> = ({ student, record, date, program, onUpdateAttendance }) => {
    const [attendanceType, setAttendanceType] = useState<AttendanceType>(
        (record?.attendance_type_name?.toLowerCase() as AttendanceType) || 'yok'
    );
    const [sebep, setSebep] = useState(record?.sebep ?? '');

    const backgroundColor = classGroupedColors[student.class_name.toLowerCase()] || '#f5f5f5';

    function darkenColor(hex: string, amount: number = 20): string {
        return '#' + hex.replace(/^#/, '').replace(/../g, color =>
            ('0' + Math.max(0, parseInt(color, 16) - amount).toString(16)).slice(-2)
        );
    }

    const handleTypeChange = (type: AttendanceType) => {
        setAttendanceType(type);
        // When changing away from gec/izinli, reset sebep
        const newSebep = ['gec', 'izinli'].includes(type) ? sebep : '';
        setSebep(newSebep);
        onUpdateAttendance(student.studentid, type, newSebep);
    };

    const handleSebepChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newSebep = e.target.value;
        setSebep(newSebep);
        onUpdateAttendance(student.studentid, attendanceType, newSebep);
    };

    return (
        <div
            className="card shadow-sm"
            style={{
                backgroundColor,
                transition: 'background-color 0.3s ease',
                borderLeft: `4px solid ${darkenColor(backgroundColor, 20)}`,
            }}
        >
            <div className="card-body py-3 px-4">
                <h5 className="mb-1">{student.first_name} {student.last_name}</h5>
                <p className="mb-2 text-muted small">{student.class_name}</p>

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
            </div>
        </div>
    );
};

export default AttendanceCard;
