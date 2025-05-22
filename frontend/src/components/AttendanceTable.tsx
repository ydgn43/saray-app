import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { classOrder, groupHeaderTitles, classGroupedColors } from '../constants';

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

// Helpers for color animation
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
function hexToRgba(hex: string, alpha: number): string {
  hex = hex.replace(/^#/, "");
  let r = parseInt(hex.substring(0, 2), 16);
  let g = parseInt(hex.substring(2, 4), 16);
  let b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
const normalizeClassName = (str: string) => {
  let out = str.trim().toLowerCase().replace(/ /g, '_');
  if (out === 'mezun_tekamulalti') out = 'mezun_tekamul_alti';
  return out;
};

const rowVariants = {
  hidden: { opacity: 0, y: 18, scale: 0.99 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 100, damping: 16 } },
  exit: { opacity: 0, y: 18, scale: 0.97, transition: { duration: 0.15 } }
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
  const [recentlyUpdated, setRecentlyUpdated] = useState<{ [studentId: number]: boolean }>({});

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
    setRecentlyUpdated(prev => ({ ...prev, [studentId]: true }));
    setTimeout(() => {
      setSavedIndicators(prev => ({ ...prev, [studentId]: false }));
      setRecentlyUpdated(prev => ({ ...prev, [studentId]: false }));
    }, 1000);
  };

  const handleSebepChange = (studentId: number, newSebep: string, current: string) => {
    setSebepDrafts(prev => ({ ...prev, [studentId]: newSebep }));
    onUpdateAttendance(studentId, current, newSebep);
    setSavedIndicators(prev => ({ ...prev, [studentId]: true }));
    setRecentlyUpdated(prev => ({ ...prev, [studentId]: true }));
    setTimeout(() => {
      setSavedIndicators(prev => ({ ...prev, [studentId]: false }));
      setRecentlyUpdated(prev => ({ ...prev, [studentId]: false }));
    }, 1000);
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
      <table className="table table-striped align-middle">
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
            const color = classGroupedColors[groupName] || '#f8f9fa';
            const borderColor = darkenColor(color, 35);
            return (
              <React.Fragment key={groupName}>
                <tr className="table-group-header">
                  <td colSpan={7} style={{ backgroundColor: color, borderLeft: `4px solid ${borderColor}` }}>
                    <strong className="text-primary">{groupHeaderTitles[groupName] ?? groupName}</strong>
                  </td>
                </tr>
                <AnimatePresence>
                  {groupStudents.map((student, index) => {
                    const record = attendanceData.find((a) => a.studentid === student.studentid);
                    const current = record?.attendance_type_name?.toLowerCase() || 'yok';
                    const rowHighlight = recentlyUpdated[student.studentid]
                      ? hexToRgba(borderColor, 0.20)
                      : color;

                    return (
                      <motion.tr
                        key={student.studentid}
                        variants={rowVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        layout
                        style={{
                          backgroundColor: rowHighlight,
                          transition: 'background-color 0.7s cubic-bezier(.4,0,.2,1)'
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
                          <td>
                            <div className="d-flex align-items-center" style={{ gap: '0.5rem', minWidth: '180px' }}>
                              <select
                                className="form-select form-select-sm"
                                value={
                                  ['Banyo', 'Hasta', 'Rahatsiz', 'Okul', ''].includes(sebepDrafts[student.studentid] ?? '')
                                    ? sebepDrafts[student.studentid] ?? ''
                                    : 'diger'
                                }
                                disabled={!(current === 'gec' || current === 'izinli')}
                                onChange={e => {
                                  const val = e.target.value;
                                  if (val === 'diger') {
                                    // If switching to Diğer, clear field to allow typing
                                    handleSebepChange(student.studentid, '', current);
                                  } else {
                                    handleSebepChange(student.studentid, val, current);
                                  }
                                }}
                                style={{
                                  backgroundColor: !(current === 'gec' || current === 'izinli') ? '#f5f5f5' : undefined,
                                  cursor: !(current === 'gec' || current === 'izinli') ? 'not-allowed' : undefined,
                                  opacity: !(current === 'gec' || current === 'izinli') ? 0.7 : 1
                                }}
                              >
                                <option value="">Seçin</option>
                                <option value="Banyo">Banyo</option>
                                <option value="Hasta">Hasta</option>
                                <option value="Rahatsiz">Rahatsız</option>
                                <option value="Okul">Okul</option>
                                <option value="diger">Diğer</option>
                              </select>
                              {/* Always render input, but only enabled when Diğer + gec/izinli */}
                              <input
                                className="form-control form-control-sm"
                                style={{ minWidth: 80, maxWidth: 130 }}
                                placeholder="Sebep girin"
                                value={
                                  // If Diğer is selected, allow custom text
                                  (
                                    (current === 'gec' || current === 'izinli') &&
                                    (
                                      !['Banyo', 'Hasta', 'Rahatsiz', 'Okul', ''].includes(sebepDrafts[student.studentid] ?? '')
                                      || sebepDrafts[student.studentid] === ''
                                    )
                                  )
                                    ? sebepDrafts[student.studentid] || ''
                                    : ''
                                }
                                onChange={e => handleSebepChange(student.studentid, e.target.value, current)}
                                disabled={
                                  !(
                                    (current === 'gec' || current === 'izinli') &&
                                    (
                                      !['Banyo', 'Hasta', 'Rahatsiz', 'Okul', ''].includes(sebepDrafts[student.studentid] ?? '')
                                      || sebepDrafts[student.studentid] === ''
                                    )
                                  )
                                }
                              />
                              <motion.span
                                animate={{ opacity: savedIndicators[student.studentid] ? 1 : 0 }}
                                transition={{ duration: 0.22 }}
                                style={{
                                  minWidth: 24,
                                  minHeight: 24,
                                  display: 'inline-flex',
                                  justifyContent: 'center',
                                  alignItems: 'center',
                                  marginLeft: 4,
                                }}
                              >
                                ✓
                              </motion.span>

                            </div>
                          </td>



                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default AttendanceTable;
