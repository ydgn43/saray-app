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
    sortMode: 'group' | 'alphabet' | 'attendance';
    onSortChange: (mode: 'group' | 'alphabet' | 'attendance') => void;
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
    sortMode,
    onSortChange,
    availableClasses = [],
    recentlyUpdatedStudents = new Set(),
}) => {
    // Keep order from parent (Attendance.tsx handles sorting mode).
    const sortedStudents = students;

    const normalizeClassName = (name: string) => {
        let out = name.trim().toLowerCase().replace(/ /g, '_');
        if (out === 'mezun_tekamulalti') out = 'mezun_tekamul_alti';
        return out;
    };

    const getClassDisplayName = (className: string) => {
        const matched = availableClasses.find(
            cls => normalizeClassName(cls.class_name) === normalizeClassName(className)
        );
        return matched?.display_name || className;
    };

    return (
        <div className="px-2">
            <div className="d-flex justify-content-end mb-2">
                <div className="btn-group btn-group-sm" role="group" aria-label="Yoklama siralama modu">
                    <button
                        type="button"
                        className={`btn ${sortMode === 'group' ? 'btn-primary' : 'btn-outline-primary'}`}
                        onClick={() => onSortChange('group')}
                    >
                        Grup
                    </button>
                    <button
                        type="button"
                        className={`btn ${sortMode === 'alphabet' ? 'btn-primary' : 'btn-outline-primary'}`}
                        onClick={() => onSortChange('alphabet')}
                    >
                        A-Z
                    </button>
                    <button
                        type="button"
                        className={`btn ${sortMode === 'attendance' ? 'btn-primary' : 'btn-outline-primary'}`}
                        onClick={() => onSortChange('attendance')}
                    >
                        Durum
                    </button>
                </div>
            </div>

            <motion.div
                className="d-flex flex-column gap-3"
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
                                classDisplayName={getClassDisplayName(student.class_name)}
                                onUpdateAttendance={onUpdateAttendance}
                            />
                        </motion.div>
                    );
                })}
            </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default AttendanceCardList;
