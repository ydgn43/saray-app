import React from 'react';
import { useIsMobile } from './useIsMobile';
import AttendanceCardList from './AttendanceCardList';
import AttendanceTable from './AttendanceTable';

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

const AttendanceResponsiveView: React.FC<Props> = (props) => {
    const isMobile = useIsMobile();
    return isMobile ? <AttendanceCardList {...props} /> : <AttendanceTable {...props} />;
};

export default AttendanceResponsiveView;
