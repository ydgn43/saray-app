"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Attendance = void 0;
class Attendance {
    constructor(studentId, date, attendanceTypeName, programName, yurtId) {
        this._sebep = null;
        this.studentId = studentId; // Use setter
        this.date = date; // Use setter
        this.attendanceTypeName = attendanceTypeName; // Use setter
        this.programName = programName; // Use setter
        this.yurtId = yurtId; // Use setter
    }
    get studentId() {
        return this._studentId;
    }
    set studentId(value) {
        this._studentId = value;
    }
    get date() {
        return this._date;
    }
    set date(value) {
        this._date = value;
    }
    get attendanceTypeName() {
        return this._attendanceTypeName;
    }
    set attendanceTypeName(value) {
        const MAXCHAR = 45;
        if (value && value.length > MAXCHAR) {
            throw new Error('Too many characters.');
        }
        this._attendanceTypeName = value;
    }
    get programName() {
        return this._programName;
    }
    set programName(value) {
        const MAXCHAR = 45;
        if (!value) {
            throw new Error('Program adı boş olamaz.');
        }
        if (value.length > MAXCHAR) {
            throw new Error('Program adı çok uzun.');
        }
        this._programName = value;
    }
    get sebep() {
        return this._sebep;
    }
    set sebep(value) {
        this._sebep = value;
    }
    get yurtId() {
        return this._yurtId;
    }
    set yurtId(value) {
        this._yurtId = value;
    }
}
exports.Attendance = Attendance;
