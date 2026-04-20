import React, { useEffect, useState } from 'react';
import { Student, Attendance } from '../types';
import { classGroupedColors } from '../constants';

interface Class {
  class_name: string;
  display_name?: string | null;
  display_order?: number | null;
}

type AttendanceType = 'var' | 'gec' | 'yok' | 'izinli';

interface Props {
  students: Student[];
  attendanceData: Attendance[];
  date: string;
  program: string;
  onUpdateAttendance: (studentId: number, type: AttendanceType, sebep: string) => void;
  sortMode: 'group' | 'alphabet' | 'attendance';
  onSortChange: (mode: 'group' | 'alphabet' | 'attendance') => void;
  availableClasses?: Class[];
  recentlyUpdatedStudents?: Set<number>;
}

const attendanceLabels: Record<AttendanceType, string> = {
  var: 'V',
  gec: 'G',
  yok: 'Y',
  izinli: 'İ',
};

const sebepOptions = ['Banyo', 'Hasta', 'Rahatsiz', 'Okul'];

const AttendanceRowList: React.FC<Props> = ({
  students,
  attendanceData,
  date,
  program,
  onUpdateAttendance,
  sortMode,
  onSortChange,
  availableClasses = [],
  recentlyUpdatedStudents = new Set(),
}) => {
  const [sebepDrafts, setSebepDrafts] = useState<Record<number, string>>({});
  const [recentlyUpdated, setRecentlyUpdated] = useState<Record<number, boolean>>({});

  const getAttendanceType = (studentId: number): AttendanceType =>
    (attendanceData.find((a) => a.studentid === studentId)?.attendance_type_name || 'yok') as AttendanceType;

  useEffect(() => {
    const initial: Record<number, string> = {};
    attendanceData.forEach((a) => {
      if (a.sebep) initial[a.studentid] = a.sebep;
    });
    setSebepDrafts(initial);
  }, [attendanceData]);

  const handleTypeChange = (studentId: number, type: AttendanceType) => {
    const sebep = sebepDrafts[studentId] ?? '';
    onUpdateAttendance(studentId, type, ['gec', 'izinli'].includes(type) ? sebep : '');
    setRecentlyUpdated((prev) => ({ ...prev, [studentId]: true }));
    setTimeout(() => {
      setRecentlyUpdated((prev) => ({ ...prev, [studentId]: false }));
    }, 1000);
  };

  const handleSebepChange = (studentId: number, val: string, current: AttendanceType) => {
    setSebepDrafts((prev) => ({ ...prev, [studentId]: val }));
    onUpdateAttendance(studentId, current, val);
  };

  const getClassColor = (className: string) => {
    const key = className.trim().toLowerCase().replace(/ /g, '_');
    return classGroupedColors[key] || '#dee2e6';
  };

  const normalizeClassName = (name: string) => {
    let out = name.trim().toLowerCase().replace(/ /g, '_');
    if (out === 'mezun_tekamulalti') out = 'mezun_tekamul_alti';
    return out;
  };

  const getClassDisplayName = (className: string) => {
    const matched = availableClasses.find(
      cls => normalizeClassName(cls.class_name) === normalizeClassName(className)
    );
    return matched?.display_name || className;
  };

  // Keep order from parent (Attendance.tsx handles sorting mode).
  const sortedStudents = students;

  // After creating new attendance date:
  const handleCreateAttendance = async () => {
    // ...your logic to create the attendance date...

    // Now, for each student, send a "yok" record
    await Promise.all(
      students.map(student =>
        fetch('/api/attendance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentid: student.studentid,
            date,
            program,
            attendance_type_name: 'yok',
            sebep: ''
          })
        })
      )
    );

  };

  return (
    <div>
      <div className="d-flex justify-content-end mb-2">
        <div className="btn-group btn-group-sm" role="group" aria-label="Yoklama siralama modu">
          <button
            type="button"
            className={`btn ${sortMode === 'group' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => onSortChange('group')}
          >
            Grup
          </button>
          <button
            type="button"
            className={`btn ${sortMode === 'alphabet' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => onSortChange('alphabet')}
          >
            A-Z
          </button>
          <button
            type="button"
            className={`btn ${sortMode === 'attendance' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => onSortChange('attendance')}
          >
            Durum
          </button>
        </div>
      </div>

      <div className="d-flex flex-column gap-3">
      {sortedStudents.map((student) => {
        const current = getAttendanceType(student.studentid);
        const sebep = sebepDrafts[student.studentid] ?? '';
        const recently = recentlyUpdated[student.studentid];
        const isRecentlyUpdated = recentlyUpdatedStudents.has(student.studentid);

        return (
          <div
            key={student.studentid}
            className="border-left"
            style={{
              borderLeft: `6px solid ${getClassColor(student.class_name)}`,
              boxShadow: isRecentlyUpdated ? "0 0 15px rgba(13, 110, 253, 0.5)" : undefined,
              transition: "box-shadow 0.3s",
              padding: "8px",
              borderRadius: "8px",
              backgroundColor: isRecentlyUpdated ? "rgba(13, 110, 253, 0.05)" : undefined
            }}
          >
            <div className="d-flex align-items-center justify-content-between gap-2">
              <div className="fw-bold flex-grow-1 text-truncate d-flex align-items-center gap-2 ms-2">
                <div className="d-flex flex-column">
                  <span>{student.first_name} {student.last_name}</span>
                  <small className="text-muted" style={{ fontWeight: 500 }}>
                    {getClassDisplayName(student.class_name)}
                  </small>
                </div>
              </div>
              <div className="d-flex gap-1 flex-shrink-0">
                {(['var', 'gec', 'yok', 'izinli'] as AttendanceType[]).map((type) => (
                  <button
                    key={type}
                    className={`btn btn-sm ${current === type
                      ? `btn-${type === 'var' ? 'success' : type === 'gec' ? 'warning' : type === 'yok' ? 'danger' : 'info'} text-white fw-bold`
                      : `btn-outline-${type === 'var' ? 'success' : type === 'gec' ? 'warning' : type === 'yok' ? 'danger' : 'info'} fw-bold`
                      }`}
                    onClick={() => handleTypeChange(student.studentid, type)}
                    style={{ width: 26, height: 26, padding: 0 }}
                    title={type}
                  >
                    {attendanceLabels[type]}
                  </button>
                ))}
              </div>
            </div>

            {(current === 'gec' || current === 'izinli') && (
              <div className="mt-2">
                <select
                  className="form-select form-select-sm mb-1"
                  value={
                    sebepOptions.includes(sebep)
                      ? sebep
                      : sebep === '__custom__'
                        ? '__custom__'
                        : sebep !== ''
                          ? sebep
                          : ''
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '__custom__') {
                      setSebepDrafts((prev) => ({
                        ...prev,
                        [student.studentid]: '__custom__',
                      }));
                    } else {
                      handleSebepChange(student.studentid, val, current);
                    }
                  }}
                >
                  <option value="">Sebep Seçin</option>
                  {sebepOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                  <option value="__custom__">Diğer</option>
                </select>

                {sebep === '__custom__' && (
                  <input
                    className="form-control form-control-sm"
                    placeholder="Sebep girin"
                    value=""
                    onChange={(e) =>
                      handleSebepChange(student.studentid, e.target.value, current)
                    }
                  />
                )}
                {!sebepOptions.includes(sebep) && sebep !== '' && sebep !== '__custom__' && (
                  <input
                    className="form-control form-control-sm"
                    placeholder="Sebep girin"
                    value={sebep}
                    onChange={(e) =>
                      handleSebepChange(student.studentid, e.target.value, current)
                    }
                  />
                )}
              </div>
            )}

            {recently && <div className="text-success small mt-1">✓ Kaydedildi</div>}
          </div>
        );
      })}
      </div>
    </div>
  );
};

export default AttendanceRowList;
