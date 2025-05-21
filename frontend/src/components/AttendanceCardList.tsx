// src/components/AttendanceCardList.tsx
import React from 'react';
import { Student, Attendance } from '../types';
import AttendanceCard from './AttendanceCard';

const classOrder = [
    "kuranikerim",
    "hazirlik",
    "ibtidai",
    "ihzari",
    "mezun_tekamul_alti",
    "tekamul_alti"
];

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

    const sortedStudents = [...students].sort((a, b) => {
        const aIndex = classOrder.indexOf(a.class_name);
        const bIndex = classOrder.indexOf(b.class_name);
        return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
    });

    return (
        <div className="d-flex flex-column gap-3 px-2">
            {sortedStudents.map((student) => {
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
