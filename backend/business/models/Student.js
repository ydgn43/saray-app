"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Student = void 0;
class Student {
    constructor(studentId, firstName, lastName, birthDate, seasonYear, className, yurtId) {
        this.studentId = studentId;
        this.firstName = firstName;
        this.lastName = lastName;
        this.birthDate = birthDate;
        this.seasonYear = seasonYear;
        this.className = className;
        this.yurtId = yurtId;
    }
    get studentId() {
        return this._studentId;
    }
    set studentId(studentId) {
        this._studentId = studentId;
    }
    get firstName() {
        return this._firstName;
    }
    set firstName(firstname) {
        const MAXCHAR = 45;
        if (firstname.length > MAXCHAR) {
            throw new Error('Too many characters.');
        }
        this._firstName = firstname;
    }
    get lastName() {
        return this._lastName;
    }
    set lastName(lastName) {
        const MAXCHAR = 45;
        if (lastName.length > MAXCHAR) {
            throw new Error('Too many characters.');
        }
        this._lastName = lastName;
    }
    get birthDate() {
        return this._birthDate;
    }
    set birthDate(birthDate) {
        this._birthDate = birthDate;
    }
    get seasonYear() {
        return this._seasonYear;
    }
    set seasonYear(seasonYear) {
        const SEASONREGEX = /^\d{4}\/\d{4}$/;
        if (!SEASONREGEX.test(seasonYear)) {
            throw new Error('Incorrect season format. Needs to be: YYYY/YYYY.');
        }
        this._seasonYear = seasonYear;
    }
    get className() {
        return this._className;
    }
    set className(className) {
        const MAXCHAR = 45;
        if (className.length > MAXCHAR) {
            throw new Error('Too many characters.');
        }
        this._className = className;
    }
    get yurtId() {
        return this._yurtId;
    }
    set yurtId(yurtId) {
        this._yurtId = yurtId;
    }
}
exports.Student = Student;
