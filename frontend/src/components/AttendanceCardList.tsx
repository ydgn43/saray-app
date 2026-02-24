import React from 'react';
import { Student, Attendance } from '../types';
import AttendanceCard from './AttendanceCard';
import { motion, AnimatePresence } from 'framer-motion';

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
    onUpdateAttendance: (studentId: number, type: string, sebep: string) => void;
    availableClasses?: Class[];
    recentlyUpdatedStudents?: Set<number>;
}

const listVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08 } },
};
const cardVariants = {
    hidden: { opacity: 0, y: 24, scale: 0.98 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 120, damping: 18 } },
    exit: { opacity: 0, y: 24, scale: 0.98, transition: { duration: 0.2 } },
};

const AttendanceCardList: React.FC<Props> = ({
    students,
    attendanceData,
    date,
    program,
    onUpdateAttendance,
    availableClasses = [],
    recentlyUpdatedStudents = new Set(),
}) => {
    // Sort students by class display_order from availableClasses
    const normalizeClassName = (name: string) => name.replace(/\s+/g, '').toLowerCase();

    const sortedStudents = (() => {
        // Create a map of normalized class names to display_order
        const orderMap: Record<string, number> = {};
        availableClasses.forEach(cls => {
            const normalized = normalizeClassName(cls.class_name);
            orderMap[normalized] = cls.display_order ?? 999;
        });

        return [...students].sort((a, b) => {
            const aClass = normalizeClassName(a.class_name);
            const bClass = normalizeClassName(b.class_name);
            const aOrder = orderMap[aClass] ?? 999;
            const bOrder = orderMap[bClass] ?? 999;

            if (aOrder !== bOrder) {
                return aOrder - bOrder;
            }
            // If same class, sort by first name then last name
            if (a.first_name !== b.first_name) return a.first_name.localeCompare(b.first_name);
            return a.last_name.localeCompare(b.last_name);
        });
    })();

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
                    const isRecentlyUpdated = recentlyUpdatedStudents.has(student.studentid);

                    return (
                        <motion.div
                            key={student.studentid}
                            variants={cardVariants}
                            initial="hidden"
                            animate={isRecentlyUpdated ? {
                                ...cardVariants.show,
                                boxShadow: "0 0 20px rgba(13, 110, 253, 0.5)",
                                scale: 1.02
                            } : "show"}
                            exit="exit"
                            layout
                            style={{
                                transition: isRecentlyUpdated ? "box-shadow 0.3s, scale 0.3s" : undefined
                            }}
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
