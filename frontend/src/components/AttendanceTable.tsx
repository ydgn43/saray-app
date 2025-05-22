import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { classOrder, groupHeaderTitles } from '../constants';

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
  onUpdateAttendance: (studentId: number, type: string, sebep: string) => void;
};

const groupColors: Record<string, string> = {
  kuranikerim: '#B3E5FC',         // bright sky blue
  hazirlik: '#FFCDD2',            // soft red
  ibtidai: '#D1C4E9',             // violet
  ihzari: '#C8E6C9',              // green
  mezun_tekamul_alti: '#FFE082',  // amber yellow
  tekamul_alti: '#90CAF9'         // soft blue
};

const normalizeClassName = (str: string) => {
  let out = str.trim().toLowerCase().replace(/ /g, '_');
  if (out === 'mezun_tekamulalti') out = 'mezun_tekamul_alti';
  return out;
};

const AttendanceTable: React.FC<Props> = ({
  students,
  attendanceData,
  date,
  program,
  onUpdateAttendance
}) => {
  const [savedIndicators, setSavedIndicators] = useState<{ [studentId: number]: boolean }>({});
  const [sebepDrafts, setSebepDrafts] = useState<{ [studentId: number]: string }>({});

  React.useEffect(() => {
    const initial: { [key: number]: string } = {};
    attendanceData.forEach((a) => {
      if (a.sebep !== undefined && a.sebep !== null) {
        initial[a.studentid] = a.sebep;
      }
    });
    setSebepDrafts(initial);
  }, [attendanceData]);

  const handleCheckboxChange = (studentId: number, selectedType: string) => {
    const sebep = sebepDrafts[studentId] ?? '';
    onUpdateAttendance(studentId, selectedType, ['gec', 'izinli'].includes(selectedType) ? sebep : '');
    setSavedIndicators(prev => ({ ...prev, [studentId]: true }));
    setTimeout(() => {
      setSavedIndicators(prev => ({ ...prev, [studentId]: false }));
    }, 1200);
  };

  const handleSebepChange = (studentId: number, newSebep: string, current: string) => {
    setSebepDrafts(prev => ({ ...prev, [studentId]: newSebep }));
    onUpdateAttendance(studentId, current, newSebep);
    setSavedIndicators(prev => ({ ...prev, [studentId]: true }));
    setTimeout(() => {
      setSavedIndicators(prev => ({ ...prev, [studentId]: false }));
    }, 1200);
  };

  // Group students by normalized class name
  const grouped = students.reduce((acc, student) => {
    const key = normalizeClassName(student.class_name);
    if (!acc[key]) acc[key] = [];
    acc[key].push(student);
    return acc;
  }, {} as Record<string, Student[]>);

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
          {classOrder.map((groupName) => {
            const groupStudents = grouped[groupName];
            if (!groupStudents) return null;
            const color = groupColors[groupName] || '#f8f9fa';
            return (
              <React.Fragment key={groupName}>
                <tr className="table-group-header">
                  <td colSpan={7} style={{ backgroundColor: color, borderLeft: '4px solid #007bff' }}>
                    <strong className="text-primary">{groupHeaderTitles[groupName] ?? groupName}</strong>
                  </td>
                </tr>
                {groupStudents.map((student, index) => {
                  const record = attendanceData.find((a) => a.studentid === student.studentid);
                  const current = record?.attendance_type_name?.toLowerCase() || 'yok';

                  return (
                    <tr key={student.studentid}>
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
                              onChange={(e) => handleSebepChange(student.studentid, e.target.value, current)}
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
