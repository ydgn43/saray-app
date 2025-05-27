import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { authFetch } from '../utils/authFetch';

// Type Definitions
type Student = {
  studentid: number;
  first_name: string;
  last_name: string;
  class_name: string;
};

type Attendance = {
  studentid: number;
  attendance_type_name: string;
  sebep?: string;
};

type AttendanceCardProps = {
  student: Student;
  attendanceType: string;
  sebep?: string;
  onTypeChange: (studentId: number, type: string) => void;
  onSebepChange: (studentId: number, sebep: string, currentType: string) => void;
  saved?: boolean;
};

const AttendanceCard: React.FC<AttendanceCardProps> = ({
  student,
  attendanceType,
  sebep,
  onTypeChange,
  onSebepChange,
  saved,
}) => {
  return (
    <div className="card mb-3" style={{ backgroundColor: '#fff', borderLeft: '4px solid #007bff' }}>
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h5 className="card-title mb-0">
            {student.first_name} {student.last_name}
          </h5>
          <small className="text-muted">{student.class_name}</small>
        </div>
        <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
          {['var', 'gec', 'yok', 'izinli'].map((type) => (
            <label key={type} className="form-check-label d-flex align-items-center gap-1">
              <input
                type="radio"
                className="form-check-input"
                name={`attendance-${student.studentid}`}
                checked={attendanceType === type}
                onChange={() => onTypeChange(student.studentid, type)}
              />
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </label>
          ))}
        </div>
        {(attendanceType === 'gec' || attendanceType === 'izinli') && (
          <div className="d-flex align-items-center gap-2">
            <select
              className="form-select form-select-sm"
              value={sebep || ''}
              onChange={(e) => onSebepChange(student.studentid, e.target.value, attendanceType)}
            >
              <option value="">Seçin</option>
              <option value="Banyo">Banyo</option>
              <option value="Hasta">Hasta</option>
              <option value="Rahatsiz">Rahatsız</option>
              <option value="Okul">Okul</option>
            </select>
            <AnimatePresence>
              {saved && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    minWidth: '24px',
                    minHeight: '24px',
                    backgroundColor: '#198754',
                    color: 'white',
                    borderRadius: '50%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    boxShadow: '0 0 6px rgba(0,0,0,0.2)',
                    flexShrink: 0,
                  }}
                >
                  ✓
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

type AttendanceTableProps = {
  students: Student[];
  attendanceData: Attendance[];
  date: string;
  program: string;
  onChange: () => void;
};

const AttendanceTable: React.FC<AttendanceTableProps> = ({
  students,
  attendanceData,
  date,
  program,
  onChange,
}) => {
  const debounceTimeout = useRef<Record<number, NodeJS.Timeout>>({});
  const [savedIndicators, setSavedIndicators] = useState<Record<number, boolean>>({});
  const [sebepDrafts, setSebepDrafts] = useState<Record<number, string>>({});
  const [highlightedRows, setHighlightedRows] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const initial: Record<number, string> = {};
    attendanceData.forEach((a) => {
      if (a.sebep) {
        initial[a.studentid] = a.sebep;
      }
    });
    setSebepDrafts(initial);
  }, [attendanceData]);

  const handleCheckboxChange = async (studentId: number, selectedType: string) => {
    const checkUrl = `http://192.168.50.76:3001/attendance?studentid=${studentId}&date=${date}&program_name=${program}`;
    const checkRes = await fetch(checkUrl);
    const record = await checkRes.json();

    const method = checkRes.ok && record ? 'PUT' : 'POST';
    const url =
      method === 'PUT'
        ? 'http://192.168.50.76:3001/attendance/put'
        : 'http://192.168.50.76:3001/attendance/create';

    await authFetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentid: studentId,
        date,
        program_name: program,
        attendance_type_name: selectedType,
        sebep: null,
      }),
    });

    setHighlightedRows((prev) => ({ ...prev, [studentId]: true }));
    setTimeout(() => setHighlightedRows((prev) => ({ ...prev, [studentId]: false })), 3000);
    onChange();
  };

  const handleSebepChange = (
    studentId: number,
    newSebep: string,
    current: string
  ) => {
    if (debounceTimeout.current[studentId]) clearTimeout(debounceTimeout.current[studentId]);

    debounceTimeout.current[studentId] = setTimeout(async () => {
      await authFetch('http://192.168.50.76:3001/attendance/put', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentid: studentId,
          date,
          program_name: program,
          attendance_type_name: current,
          sebep: newSebep,
        }),
      });

      setSavedIndicators((prev) => ({ ...prev, [studentId]: true }));
      setHighlightedRows((prev) => ({ ...prev, [studentId]: true }));
      setTimeout(() => {
        setSavedIndicators((prev) => ({ ...prev, [studentId]: false }));
        setHighlightedRows((prev) => ({ ...prev, [studentId]: false }));
        onChange();
      }, 3000);
    }, 800);
  };

  const sorted = [...students].sort(
    (a, b) =>
      a.class_name.localeCompare(b.class_name) || a.first_name.localeCompare(b.first_name)
  );

  return (
    <div className="mt-3">
      {sorted.map((student) => {
        const record = attendanceData.find((a) => a.studentid === student.studentid);
        const current = record?.attendance_type_name?.toLowerCase() || 'yok';
        return (
          <AttendanceCard
            key={student.studentid}
            student={student}
            attendanceType={current}
            sebep={sebepDrafts[student.studentid]}
            onTypeChange={handleCheckboxChange}
            onSebepChange={handleSebepChange}
            saved={savedIndicators[student.studentid]}
          />
        );
      })}
    </div>
  );
};

export default AttendanceTable;
