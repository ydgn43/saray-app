import React, { useState, useEffect } from 'react';
import AttendanceCardList from './AttendanceCardList';
import AttendanceTable from './AttendanceTable';
import AttendanceRowList from './AttendanceRowList';
import { useIsMobile } from '../hooks/useIsMobile';
import { Attendance, Student } from '../types';

interface Class {
  class_name: string;
  display_name?: string | null;
  display_order?: number | null;
}

interface Props {
  students: Student[];
  attendanceData: Attendance[];
  date: string;
  program: string;
  onUpdateAttendance: (studentId: number, type: string, sebep?: string) => void;
  onUpdateSebep?: (studentId: number, type: string, sebep: string) => void;
  showCreateButton: boolean;
  onCreate: () => void;
  fetchAttendanceData: () => void;
  classNames?: string[];
  availableClasses?: Class[];
}

const AttendanceResponsiveView: React.FC<Props> = ({
  students,
  attendanceData,
  date,
  program,
  onUpdateAttendance,
  onUpdateSebep,
  showCreateButton,
  onCreate,
  fetchAttendanceData,
  classNames,
  availableClasses = [],
}) => {
  const isMobile = useIsMobile();
  const [useRowView, setUseRowView] = useState(false);
  const showTable = attendanceData.length > 0;

  useEffect(() => {
    const stored = localStorage.getItem('attendanceView');
    if (stored === 'row') setUseRowView(true);
  }, []);

  const toggleView = () => {
    const next = !useRowView;
    setUseRowView(next);
    localStorage.setItem('attendanceView', next ? 'row' : 'card');
  };

  return (
    <div className="px-2">
      {showCreateButton && !showTable && (
        <div className="mb-3 text-center">
          <button className="btn btn-success" onClick={onCreate}>
            Yeni Yoklama Oluştur
          </button>
        </div>
      )}

      {showTable && isMobile && (
        <div className="d-flex justify-content-end mb-2">
          <button
            className="btn btn-outline-primary btn-sm"
            onClick={toggleView}
          >
            Görünüm: {useRowView ? 'Kart' : 'Satır'}
          </button>
        </div>
      )}

      {showTable ? (
        isMobile ? (
          useRowView ? (
            <AttendanceRowList
              students={students}
              attendanceData={attendanceData}
              date={date}
              program={program}
              onUpdateAttendance={onUpdateAttendance}
              availableClasses={availableClasses}
            />
          ) : (
            <AttendanceCardList
              students={students}
              attendanceData={attendanceData}
              date={date}
              program={program}
              onUpdateAttendance={onUpdateAttendance}
              availableClasses={availableClasses}
            />
          )
        ) : (
          <AttendanceTable
            students={students}
            attendanceData={attendanceData}
            date={date}
            program={program}
            onUpdateAttendance={onUpdateAttendance}
            availableClasses={availableClasses}
          />
        )
      ) : (
        !showCreateButton && (
          <div className="alert alert-info text-center mt-3">Veri bulunamadı.</div>
        )
      )}
    </div>
  );
};

export default AttendanceResponsiveView;
