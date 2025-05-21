// src/components/AttendanceCard.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useSwipeable } from 'react-swipeable';
import { Student, Attendance } from '../types';

interface AttendanceCardProps {
    student: Student;
    record?: Attendance;
    date: string;
    program: string;
    onChange: () => void;
}

const STATUS_COLORS: Record<string, string> = {
    var: '#C8E6C9',
    gec: '#FFF9C4',
    yok: '#FFCDD2',
    izinli: '#B3E5FC',
};

const AttendanceCard: React.FC<AttendanceCardProps> = ({ student, record, date, program, onChange }) => {
    const current = record?.attendance_type_name?.toLowerCase() || 'yok';
    const color = STATUS_COLORS[current] || '#f8f9fa';
    const [swipeAction, setSwipeAction] = useState<'left' | 'right' | null>(null);
    const [isHovered, setIsHovered] = useState(false);

    const swipeHandlers = useSwipeable({
        onSwipedLeft: () => {
            setSwipeAction('left');
            updateAttendance('izinli');
        },
        onSwipedRight: () => {
            setSwipeAction('right');
            updateAttendance('var');
        },
        onSwiping: (e) => {
            setSwipeAction(e.dir === 'Left' ? 'left' : e.dir === 'Right' ? 'right' : null);
        },
        onTouchEndOrOnMouseUp: () => {
            setTimeout(() => setSwipeAction(null), 300);
        },
    });

    function updateAttendance(type: string) {
        fetch('http://localhost:3001/attendance/put', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                studentid: student.studentid,
                date,
                program_name: program,
                attendance_type_name: type,
            }),
        }).then(onChange);
    }

    function updateSebep(sebep: string) {
        fetch('http://localhost:3001/attendance/put', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                studentid: student.studentid,
                date,
                program_name: program,
                attendance_type_name: current,
                sebep,
            }),
        }).then(onChange);
    }

    return (
        <motion.div
            layout
            className="card position-relative px-3 py-3"
            style={{
                backgroundColor: color,
                borderRadius: '1rem',
                touchAction: 'pan-y',
                boxShadow: isHovered ? '0 4px 12px rgba(0, 0, 0, 0.15)' : '0 2px 6px rgba(0, 0, 0, 0.1)',
                transition: 'box-shadow 0.3s ease',
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            {...swipeHandlers}
        >
            {swipeAction === 'right' && (
                <motion.div
                    className="position-absolute top-50 start-0 translate-middle-y ps-3 text-success"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <strong style={{ fontSize: '1rem' }}>✓ Var</strong>
                </motion.div>
            )}
            {swipeAction === 'left' && (
                <motion.div
                    className="position-absolute top-50 end-0 translate-middle-y pe-3 text-primary"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <strong style={{ fontSize: '1rem' }}>→ İzinli</strong>
                </motion.div>
            )}

            <div
                className="d-flex justify-content-between align-items-center mb-3 px-2"
                style={{
                    position: 'sticky',
                    top: 0,
                    backgroundColor: color,
                    zIndex: 10,
                    paddingTop: '0.5rem',
                    paddingBottom: '0.5rem',
                }}
            >
                <h5 className="mb-0 text-dark" style={{ fontSize: '1.2rem' }}>
                    {student.first_name} {student.last_name}
                </h5>
                <small className="text-muted">{student.class_name}</small>
            </div>

            <div className="card-body p-0">
                <div className="d-flex flex-wrap align-items-center gap-3 mb-3 px-2">
                    {['var', 'gec', 'yok', 'izinli'].map((type) => (
                        <label key={type} className="form-check form-check-inline" style={{ fontSize: '1.1rem' }}>
                            <input
                                className="form-check-input me-1"
                                type="radio"
                                name={`status-${student.studentid}`}
                                checked={current === type}
                                onChange={() => updateAttendance(type)}
                                style={{ width: '1.2rem', height: '1.2rem' }}
                            />
                            <span className="text-capitalize">{type}</span>
                        </label>
                    ))}
                </div>

                {(current === 'gec' || current === 'izinli') && (
                    <div className="mt-3 px-2">
                        <label className="form-label" style={{ fontSize: '1rem' }}>Sebep</label>
                        <select
                            className="form-select"
                            defaultValue={record?.sebep ?? ''}
                            onChange={(e) => updateSebep(e.target.value)}
                            style={{ fontSize: '1.1rem', padding: '0.6rem' }}
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

            {/* Floating Toolbar */}
            <div
                className="position-fixed bottom-0 start-0 end-0 d-flex justify-content-around py-2 bg-white border-top shadow-sm"
                style={{ zIndex: 1050 }}
            >
                <button className="btn btn-outline-primary btn-sm px-4">Filtrele</button>
                <button className="btn btn-outline-dark btn-sm px-4">Bugüne Git</button>
            </div>
        </motion.div>
    );
};

export default AttendanceCard;
