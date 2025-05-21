// src/types.ts
export interface Student {
    studentid: number;
    first_name: string;
    last_name: string;
    class_name: string;
}

export interface Attendance {
    studentid: number;
    date: string;
    program_name: string;
    attendance_type_name: string;
    sebep?: string;
}
