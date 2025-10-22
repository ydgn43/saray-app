export class Student {
    private _studentId: number | undefined;
    private _firstName!: string;
    private _lastName!: string;
    private _birthDate!: Date;
    private _seasonYear!: string;
    private _className!: string;
    private _yurtId!: number;

    constructor(
        studentId: number | undefined,
        firstName: string,
        lastName: string,
        birthDate: Date,
        seasonYear: string,
        className: string,
        yurtId: number
    ) {
        this.studentId = studentId;
        this.firstName = firstName;
        this.lastName = lastName;
        this.birthDate = birthDate;
        this.seasonYear = seasonYear;
        this.className = className;
        this.yurtId = yurtId;
    }

    public get studentId(): number | undefined {
        return this._studentId;
    }

    public set studentId(studentId: number | undefined) {
        this._studentId = studentId;
    }

    public get firstName(): string {
        return this._firstName;
    }

    public set firstName(firstname: string) {
        const MAXCHAR: number = 45;
        if (firstname.length > MAXCHAR) {
            throw new Error('Too many characters.')
        }

        this._firstName = firstname;
    }

    public get lastName(): string {
        return this._lastName;
    }

    public set lastName(lastName: string) {
        const MAXCHAR: number = 45;
        if (lastName.length > MAXCHAR) {
            throw new Error('Too many characters.')
        }

        this._lastName = lastName;
    }

    public get birthDate(): Date {
        return this._birthDate;
    }

    public set birthDate(birthDate: Date) {
        this._birthDate = birthDate;
    }

    public get seasonYear(): string {
        return this._seasonYear;
    }

    public set seasonYear(seasonYear: string) {
        const SEASONREGEX: RegExp = /^\d{4}\/\d{4}$/;
        if (!SEASONREGEX.test(seasonYear)) {
            throw new Error('Incorrect season format. Needs to be: YYYY/YYYY.')
        }

        this._seasonYear = seasonYear;
    }

    public get className(): string {
        return this._className;
    }

    public set className(className: string) {
        const MAXCHAR: number = 45;
        if (className.length > MAXCHAR) {
            throw new Error('Too many characters.')
        }

        this._className = className;
    }

    public get yurtId(): number {
        return this._yurtId;
    }

    public set yurtId(yurtId: number) {
        this._yurtId = yurtId;
    }
}