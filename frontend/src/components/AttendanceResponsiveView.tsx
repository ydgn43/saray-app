import React from 'react';
import AttendanceCardList from './AttendanceCardList';
import AttendanceTable from './AttendanceTable';
import { useIsMobile } from '../hooks/useIsMobile';
import { Attendance, Student } from '../types';

interface Props {
    students: Student[];
    attendanceData: Attendance[];
    date: string;
    program: string;
    onUpdateAttendance: (studentId: number, type: string, sebep: string) => void;
    onUpdateSebep?: (studentId: number, type: string, sebep: string) => void;
    showCreateButton: boolean;
    onCreate: () => void;
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
}) => {
    const isMobile = useIsMobile();
    const showTable = attendanceData.length > 0;

    return (
        <div className="px-2">
            {showCreateButton && !showTable && (
                <div className="mb-3 text-center">
                    <button className="btn btn-success" onClick={onCreate}>
                        Yeni Yoklama Oluştur
                    </button>
                </div>
            )}

            {showTable ? (
                isMobile ? (
                    <AttendanceCardList
                        students={students}
                        attendanceData={attendanceData}
                        date={date}
                        program={program}
                        onUpdateAttendance={onUpdateAttendance}
                    />
                ) : (
                    <AttendanceTable
                        students={students}
                        attendanceData={attendanceData}
                        date={date}
                        program={program}
                        onUpdateAttendance={onUpdateAttendance}
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
