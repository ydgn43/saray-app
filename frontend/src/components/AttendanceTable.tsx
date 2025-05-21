import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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

type Props = {
  students: Student[];
  attendanceData: Attendance[];
  date: string;
  program: string;
  onChange: () => void;
};

const AttendanceTable: React.FC<Props> = ({ students, attendanceData, date, program, onChange }) => {
  const debounceTimeout = useRef<{ [key: number]: NodeJS.Timeout }>({});
  const [savedIndicators, setSavedIndicators] = useState<{ [studentId: number]: boolean }>({});
  const [sebepDrafts, setSebepDrafts] = useState<{ [studentId: number]: string }>({});
  const [highlightedRows, setHighlightedRows] = useState<{ [studentId: number]: boolean }>({});

  const classOrder = [
    'Kuranikerim',
    'Hazirlik',
    'Ibtidai',
    'Ihzari',
    'Mezun Tekamulalti',
    'tekamul alti'
  ];

  const groupColors: Record<string, string> = {
    kuranikerim: '#B3E5FC',         // bright sky blue
    hazirlik: '#FFCDD2',           // soft red
    ibtidai: '#D1C4E9',            // violet
    ihzari: '#C8E6C9',             // green
    'mezun tekamulalti': '#FFE082',// amber yellow
    'tekamul alti': '#90CAF9'      // soft blue
  };

  useEffect(() => {
    const initial: { [key: number]: string } = {};
    attendanceData.forEach((a) => {
      if (a.sebep !== undefined && a.sebep !== null) {
        initial[a.studentid] = a.sebep;
      }
    });
    setSebepDrafts(initial);
  }, [attendanceData]);

  const handleCheckboxChange = async (studentId: number, selectedType: string) => {
    if (!date || !program) return;

    const checkUrl = `http://192.168.50.120:3001/attendance?studentid=${studentId}&date=${date}&program_name=${program}`;

    try {
      const checkRes = await fetch(checkUrl);
      const record = await checkRes.json();

      const method = checkRes.ok && record ? 'PUT' : 'POST';
      const url = method === 'PUT'
        ? 'http://192.168.50.120:3001/attendance/put'
        : 'http://192.168.50.120:3001/attendance/create';

      const body = {
        studentid: studentId,
        date,
        program_name: program,
        attendance_type_name: selectedType,
        sebep: null,
      };

      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      setHighlightedRows((prev) => ({ ...prev, [studentId]: true }));
      setTimeout(() => {
        setHighlightedRows((prev) => ({ ...prev, [studentId]: false }));
      }, 3000);

      onChange();
    } catch (err) {
      console.error('Error handling attendance change:', err);
    }
  };

  const handleSebepChange = (studentId: number, newSebep: string, current: string) => {
    if (debounceTimeout.current[studentId]) {
      clearTimeout(debounceTimeout.current[studentId]);
    }

    debounceTimeout.current[studentId] = setTimeout(async () => {
      await fetch('http://192.168.50.120:3001/attendance/put', {
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

  const sortedStudents = [...students].sort((a, b) => {
    const groupA = classOrder.indexOf(a.class_name);
    const groupB = classOrder.indexOf(b.class_name);
    if (groupA !== groupB) return groupA - groupB;
    return a.first_name.localeCompare(b.first_name);
  });

  return (
    <div className="mt-4">
      <table className="table table-striped">
        <thead>
          <tr>
            <th>#</th>
            <th>İsim</th>
            <th>Var</th>
            <th>Geç</th>
            <th>Yok</th>
            <th>İzinli</th>
            <th>Sebep</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(
            sortedStudents.reduce((acc, student) => {
              if (!acc[student.class_name]) acc[student.class_name] = [];
              acc[student.class_name].push(student);
              return acc;
            }, {} as Record<string, Student[]>))
            .map(([groupName, groupStudents]) => {
              const normalizedName = groupName.trim().toLowerCase();
              const color = groupColors[normalizedName] || '#f8f9fa';

              return (
                <React.Fragment key={groupName}>
                  <tr className="table-group-header">
                    <td colSpan={7} style={{ backgroundColor: color, borderLeft: '4px solid #007bff' }}>
                      <strong className="text-primary">{groupName}</strong>
                    </td>
                  </tr>

                  {groupStudents.map((student, index) => {
                    const record = attendanceData.find((a) => a.studentid === student.studentid);
                    const current = record?.attendance_type_name?.toLowerCase() || 'yok';

                    return (
                      <tr
                        key={student.studentid}
                        style={{
                          backgroundColor: highlightedRows[student.studentid] ? '#fff3cd' : color,
                          transition: 'background-color 0.5s ease'
                        }}
                      >
                        <td>{index + 1}</td>
                        <td>{`${student.first_name} ${student.last_name}`}</td>

                        {['var', 'gec', 'yok', 'izinli'].map((type) => (
                          <td key={type}>
                            <input
                              type="checkbox"
                              checked={current === type}
                              onChange={() => handleCheckboxChange(student.studentid, type)}
                            />
                          </td>
                        ))}

                        <td>
                          {(current === 'gec' || current === 'izinli') ? (
                            <div className="d-flex align-items-center" style={{ gap: '0.5rem', minWidth: '160px' }}>
                              <select
                                className="form-select form-select-sm"
                                value={sebepDrafts[student.studentid] ?? ''}
                                onChange={(e) => {
                                  const newSebep = e.target.value;
                                  setSebepDrafts(prev => ({ ...prev, [student.studentid]: newSebep }));
                                  handleSebepChange(student.studentid, newSebep, current);
                                }}
                              >
                                <option value="">Seçin</option>
                                <option value="Banyo">Banyo</option>
                                <option value="Hasta">Hasta</option>
                                <option value="Rahatsiz">Rahatsız</option>
                                <option value="Okul">Okul</option>
                              </select>
                              <AnimatePresence>
                                {savedIndicators[student.studentid] && (
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
                                      flexShrink: 0
                                    }}
                                  >
                                    ✓
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          ) : (
                            record?.sebep ? record.sebep : '-'
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              );
            })}
        </tbody>
      </table>
    </div>
  );
};

export default AttendanceTable;
