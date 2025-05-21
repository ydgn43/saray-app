// src/components/AttendanceCardList.tsx
import React from 'react';
import { Student, Attendance } from '../types';
import AttendanceCard from './AttendanceCard';

interface Props {
    students: Student[];
    attendanceData: Attendance[];
    date: string;
    program: string;
    onChange: () => Promise<void>; // async
}

const AttendanceCardList: React.FC<Props> = ({
    students,
    attendanceData,
    date,
    program,
    onChange
}) => {
    const handlePreserveScrollOnChange = async () => {
        const scrollY = window.scrollY;
        await onChange();
        requestAnimationFrame(() => {
            window.scrollTo({ top: scrollY, behavior: 'instant' as ScrollBehavior });
        });
    };

    return (
        <div className="d-flex flex-column gap-3 px-2">
            {students.map((student) => {
                const record = attendanceData.find(a => a.studentid === student.studentid);
                return (
                    <AttendanceCard
                        key={student.studentid}
                        student={student}
                        record={record}
                        date={date}
                        program={program}
                        onChange={handlePreserveScrollOnChange}
                    />
                );
            })}
        </div>
    );
};

export default AttendanceCardList;
