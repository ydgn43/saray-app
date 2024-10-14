export class Attendance {
    private _studentId!: number;
    private _date!: Date;
    private _attendanceTypeName: string | undefined;
    private _programName!: string;

    constructor(studentId: number, date: Date, attendanceTypeName: string | undefined, programName: string) {
        this.studentId = studentId; // Use setter
        this.date = date; // Use setter
        this.attendanceTypeName = attendanceTypeName; // Use setter
        this.programName = programName; // Use setter
    }

    public get studentId(): number {
        return this._studentId;
    }

    public set studentId(value: number) {
        this._studentId = value;
    }

    public get date(): Date {
        return this._date;
    }

    public set date(value: Date) {
        this._date = value;
    }

    public get attendanceTypeName(): string | undefined {
        return this._attendanceTypeName;
    }

    public set attendanceTypeName(value: string | undefined) {
        const MAXCHAR: number = 45;
        if (value && value.length > MAXCHAR) {
            throw new Error('Too many characters.');
        }
        this._attendanceTypeName = value;
    }

    public get programName(): string {
        return this._programName;
    }

    public set programName(value: string) {
        const MAXCHAR: number = 45;
        if (value.length > MAXCHAR) {
            throw new Error('Too many characters.');
        }
        this._programName = value;
    }
}
