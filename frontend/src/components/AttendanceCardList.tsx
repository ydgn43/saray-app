// src/components/AttendanceCardList.tsx
import React from 'react';
import { Student, Attendance } from '../types';
import AttendanceCard from './AttendanceCard';

interface Props {
    students: Student[];
    attendanceData: Attendance[];
    date: string;
    program: string;
    onChange: () => void;
}

const AttendanceCardList: React.FC<Props> = ({ students, attendanceData, date, program, onChange }) => {
    return (
        <div className="d-flex flex-column gap-3 px-2">
            {students.map((student) => {
                const record = attendanceData.find((a) => a.studentid === student.studentid);
                return (
                    <AttendanceCard
                        key={student.studentid}
                        student={student}
                        record={record}
                        date={date}
                        program={program}
                        onChange={onChange}
                    />
                );
            })}
        </div>
    );
};

export default AttendanceCardList;
