export type Student = {
    studentid: number;
    first_name: string;
    last_name: string;
    class_name: string;
};

export type Attendance = {
    studentid: number;
    attendance_type_name: string;
    sebep?: string;
    date?: string;
    program_name?: string;
};
