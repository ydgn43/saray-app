import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { classGroupedColors } from '../constants';

type AttendanceType = 'var' | 'gec' | 'yok' | 'izinli';
const typeLabels: Record<AttendanceType, string> = {
  var: 'VAR',
  yok: 'YOK',
  gec: 'GEÇ',
  izinli: 'İZİNLİ',
};
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
    case 'var': return 'btn-outline-success fw-bold';
    case 'gec': return 'btn-outline-warning fw-bold';
    case 'yok': return 'btn-outline-danger fw-bold';
    case 'izinli': return 'btn-outline-info fw-bold';
  }
};

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

interface Class {
  class_name: string;
  display_name?: string | null;
  display_order?: number | null;
}

type Props = {
  students: Student[];
  attendanceData: Attendance[];
  date: string;
  program: string;
  onUpdateAttendance: (studentId: number, type: string, sebep: string) => void;
  availableClasses?: Class[];
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

const sebepOptions = ['Banyo', 'Hasta', 'Rahatsiz', 'Okul'];

const AttendanceTable: React.FC<Props> = ({
  students,
  attendanceData,
  date,
  program,
  onUpdateAttendance,
  availableClasses = [],
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

  const handleButtonChange = (studentId: number, selectedType: AttendanceType) => {
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

  // Sort class names by display_order from availableClasses
  const classNames = (() => {
    const uniqueClassNames = Array.from(new Set(students.map(s => normalizeClassName(s.class_name))));

    if (availableClasses.length === 0) {
      // Fallback to original order if no classes provided
      return uniqueClassNames;
    }

    // Create a map of normalized class names to display_order
    const orderMap: Record<string, number> = {};
    availableClasses.forEach(cls => {
      const normalized = normalizeClassName(cls.class_name);
      orderMap[normalized] = cls.display_order ?? 999;
    });

    // Sort by display_order
    return uniqueClassNames.sort((a, b) => {
      const orderA = orderMap[a] ?? 999;
      const orderB = orderMap[b] ?? 999;
      return orderA - orderB;
    });
  })();

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
          {classNames.map((groupName) => {
            const groupStudents = grouped[groupName];
            if (!groupStudents) return null;
            const color = classGroupedColors[groupName] || '#f8f9fa';
            const borderColor = darkenColor(color, 35);
            // Find the original class name for display
            const originalClassName = students.find(s => normalizeClassName(s.class_name) === groupName)?.class_name || groupName;
            return (
              <React.Fragment key={groupName}>
                <tr className="table-group-header">
                  <td colSpan={7} style={{ backgroundColor: color, borderLeft: `4px solid ${borderColor}` }}>
                    <strong className="text-primary">{originalClassName}</strong>
                  </td>
                </tr>
                <AnimatePresence>
                  {groupStudents.map((student, index) => {
                    const record = attendanceData.find((a) => a.studentid === student.studentid);
                    const current = (record?.attendance_type_name?.toLowerCase() || 'yok') as AttendanceType;
                    const rowHighlight = recentlyUpdated[student.studentid]
                      ? hexToRgba(borderColor, 0.20)
                      : color;

                    const sebepVal = sebepDrafts[student.studentid] ?? '';
                    const sebepIsOther =
                      (current === 'gec' || current === 'izinli') &&
                      !(sebepOptions.includes(sebepVal) || sebepVal === '');

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
                        {(['var', 'gec', 'yok', 'izinli'] as AttendanceType[]).map((type) => (
                          <td key={type}>
                            <button
                              className={`btn btn-sm ${current === type ? activeClass(type) : fadedClass(type)}`}
                              style={{ minWidth: 38 }}
                              onClick={() => handleButtonChange(student.studentid, type)}
                              type="button"
                            >
                              {typeLabels[type]}
                            </button>
                          </td>
                        ))}
                        <td>
                          <div className="d-flex align-items-center" style={{ gap: '0.5rem', minWidth: '180px' }}>
                            <select
                              className="form-select form-select-sm"
                              value={
                                (current === 'gec' || current === 'izinli')
                                  ? (sebepOptions.includes(sebepVal) ? sebepVal : (sebepVal === '__diger__' ? 'diger' : sebepVal ? 'diger' : ''))
                                  : ''
                              }
                              disabled={!(current === 'gec' || current === 'izinli')}
                              onChange={e => {
                                const val = e.target.value;
                                if (val === 'diger') {
                                  // Use special marker for "Diğer" selection
                                  handleSebepChange(student.studentid, '__diger__', current);
                                } else {
                                  handleSebepChange(student.studentid, val, current);
                                }
                              }}
                              style={{
                                backgroundColor: !(current === 'gec' || current === 'izinli') ? '#f5f5f5' : undefined,
                                cursor: !(current === 'gec' || current === 'izinli') ? 'not-allowed' : undefined,
                                opacity: !(current === 'gec' || current === 'izinli') ? 0.7 : 1,
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
                              value={
                                (current === 'gec' || current === 'izinli')
                                  ? (sebepVal === '__diger__' ? '' : (!sebepOptions.includes(sebepVal) && sebepVal !== '' ? sebepVal : ''))
                                  : ''
                              }
                              onChange={e => handleSebepChange(student.studentid, e.target.value, current)}
                              disabled={
                                !(current === 'gec' || current === 'izinli') ||
                                (sebepOptions.includes(sebepVal) || sebepVal === '' || sebepVal !== '__diger__' && sebepVal.length === 0)
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
