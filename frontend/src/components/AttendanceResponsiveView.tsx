import React from 'react';
import { useIsMobile } from './useIsMobile';
import AttendanceCardList from './AttendanceCardList';
import AttendanceTable from './AttendanceTable';
import { Student, Attendance } from '../types';

type Props = {
    students: Student[];
    attendanceData: Attendance[];
    date: string;
    program: string;
    onChange: () => void;
};

const AttendanceResponsiveView: React.FC<Props> = (props) => {
    const isMobile = useIsMobile();
    return isMobile ? (
        <div className="px-2">
            <AttendanceCardList {...props} />
        </div>
    ) : (
        <AttendanceTable {...props} />
    );
};

export default AttendanceResponsiveView;
