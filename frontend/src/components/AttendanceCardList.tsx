import React from 'react';
import { Student, Attendance } from '../types';
import AttendanceCard from './AttendanceCard';
import { classOrder } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
    students: Student[];
    attendanceData: Attendance[];
    date: string;
    program: string;
    onUpdateAttendance: (studentId: number, type: string, sebep: string) => void;
}

const listVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08 } },
};
const cardVariants = {
    hidden: { opacity: 0, y: 24, scale: 0.98 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 120, damping: 18 } },
    exit: { opacity: 0, y: 24, scale: 0.98, transition: { duration: 0.2 } },
};

const AttendanceCardList: React.FC<Props> = ({
    students,
    attendanceData,
    date,
    program,
    onUpdateAttendance
}) => {
    const sortedStudents = [...students].sort((a, b) => {
        const aIndex = classOrder.indexOf(a.class_name);
        const bIndex = classOrder.indexOf(b.class_name);
        return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
    });

    return (
        <motion.div
            className="d-flex flex-column gap-3 px-2"
            variants={listVariants}
            initial="hidden"
            animate="show"
        >
            <AnimatePresence>
                {sortedStudents.map((student) => {
                    const record = attendanceData.find(a => a.studentid === student.studentid);
                    return (
                        <motion.div
                            key={student.studentid}
                            variants={cardVariants}
                            initial="hidden"
                            animate="show"
                            exit="exit"
                            layout
                        >
                            <AttendanceCard
                                student={student}
                                record={record}
                                date={date}
                                program={program}
                                onUpdateAttendance={onUpdateAttendance}
                            />
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </motion.div>
    );
};

export default AttendanceCardList;
