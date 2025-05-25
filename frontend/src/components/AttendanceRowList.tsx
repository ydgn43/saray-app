import React, { useEffect, useState } from 'react';
import { Student, Attendance } from '../types';
import { classGroupedColors } from '../constants';

type AttendanceType = 'var' | 'gec' | 'yok' | 'izinli';

interface Props {
  students: Student[];
  attendanceData: Attendance[];
  date: string;
  program: string;
  onUpdateAttendance: (studentId: number, type: AttendanceType, sebep: string) => void;
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
  onUpdateAttendance,
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

  return (
    <div className="d-flex flex-column gap-3">

      {students.map((student) => {
        const current = getAttendanceType(student.studentid);
        const sebep = sebepDrafts[student.studentid] ?? '';
        const recently = recentlyUpdated[student.studentid];

        return (
          <div
            key={student.studentid}
            className="border-left"
            style={{ borderLeft: `6px solid ${getClassColor(student.class_name)}` }}
          >
            <div className="d-flex align-items-center justify-content-between gap-2">
              <div className="fw-bold flex-grow-1 text-truncate d-flex align-items-center gap-2 ms-2">
                {student.first_name} {student.last_name}
              </div>
              <div className="d-flex gap-1 flex-shrink-0">
                {(['var', 'gec', 'yok', 'izinli'] as AttendanceType[]).map((type) => (
                  <button
                    key={type}
                    className={`btn btn-sm ${
                      current === type
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
  );
};

export default AttendanceRowList;
